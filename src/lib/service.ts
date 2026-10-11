import { randomUUID } from "node:crypto";
import { DomainError, type Address, type CertificationStatus, type Drone, type DroneInput, type DroneStatus, type Offer, type Order, type OrderInput, type OrderStatus, type OrderTrackingDoc, type PriorityLevel, type Profile, type Role } from "./domain";
import type { Repository, Transaction } from "./repository";
import type { PaymentAdapter } from "./payments";

const timestamp = () => new Date().toISOString();
function text(value: unknown, label: string, max = 240): string {
  if (typeof value !== "string" || value.trim().length < 3 || value.trim().length > max) throw new DomainError(400, `${label} must be 3–${max} characters.`);
  return value.trim();
}
function payload(value: unknown, maximum = 5): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0 || value > maximum) throw new DomainError(400, `Weight must be greater than 0 and at most ${maximum} kg.`);
  return value;
}
function optionalText(value: unknown, label: string, max = 500): string | null {
  if (value === undefined || value === null || value === "") return null;
  return text(value, label, max);
}
function coordinate(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "number" || !Number.isFinite(value)) throw new DomainError(400, "Coordinates must be numbers.");
  return value;
}
function dimension(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) throw new DomainError(400, "Dimensions must be positive numbers.");
  return value;
}
function priority(value: unknown): PriorityLevel {
  if (value === undefined || value === null || value === "") return "standard";
  if (value !== "standard" && value !== "express" && value !== "urgent") throw new DomainError(400, "Priority must be standard, express or urgent.");
  return value;
}
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number) => deg * Math.PI / 180;
  const dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return Math.round(6371 * 2 * Math.asin(Math.sqrt(a)) * 100) / 100;
}
function orderNumber(orders: Order[]): string {
  const taken = new Set(orders.map(order => order.orderNumber));
  const day = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = `AR-${day}-${randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase()}`;
    if (!taken.has(candidate)) return candidate;
  }
  throw new DomainError(503, "Could not generate an order number, please retry.");
}
function area(address: string): string {
  // Do not expose addresses, recipient data or precise coordinates in open offers.
  if (/астана|astana/i.test(address)) return "Astana";
  if (/алматы|almaty/i.test(address)) return "Almaty";
  return "Urban zone";
}
const ACTIVE_DELIVERY: OrderStatus[] = ["assigned", "in_transit", "delivered"];
export class DeliveryService {
  constructor(private readonly repository: Repository, private readonly payments: PaymentAdapter) {}
  async profile(id: string): Promise<Profile> {
    const profile = await this.repository.get<Profile>("profiles", id);
    if (!profile) throw new DomainError(401, "Sign in to your account.");
    return profile;
  }
  private async role(id: string, expected: Role, tx?: Transaction): Promise<Profile> {
    const profile = tx ? await tx.get<Profile>("profiles", id) : await this.profile(id);
    if (!profile || profile.role !== expected) throw new DomainError(403, "This operation is not available for your role.");
    return profile;
  }
  async chooseRole(id: string, role: Role): Promise<Profile> {
    if (role !== "customer" && role !== "operator") throw new DomainError(400, "Choose customer or operator.");
    return this.repository.transaction(async tx => {
      const profile = await tx.get<Profile>("profiles", id);
      if (!profile) throw new DomainError(401, "Sign in to your account.");
      if (profile.role && profile.role !== role) throw new DomainError(409, "Role is already chosen and cannot be changed.");
      const updated = { ...profile, role };
      await tx.set("profiles", id, updated); return updated;
    });
  }
  async orders(id: string): Promise<Order[]> {
    const profile = await this.profile(id);
    if (!profile.role) throw new DomainError(403, "Choose a role first.");
    return (await this.repository.list<Order>("orders")).filter(order => profile.role === "customer" ? order.customerId === id : order.operatorId === id).sort((a,b) => b.createdAt.localeCompare(a.createdAt));
  }
  async order(id: string, orderId: string): Promise<Order> {
    const profile = await this.profile(id);
    const order = await this.repository.get<Order>("orders", orderId);
    if (!order) throw new DomainError(404, "Delivery not found.");
    if ((profile.role === "customer" && order.customerId === id) || (profile.role === "operator" && order.operatorId === id)) return order;
    throw new DomainError(403, "No access to this delivery.");
  }
  async offers(id: string): Promise<Offer[]> {
    await this.role(id, "operator");
    return (await this.repository.list<Offer & { available: boolean }>("offers")).filter(offer => offer.available).map(({ id, packageWeightKg, priceAmount, createdAt, originArea, destinationArea }) => ({ id, packageWeightKg, priceAmount, createdAt, originArea, destinationArea }));
  }
  async createOrder(id: string, input: OrderInput): Promise<Order> {
    await this.role(id, "customer");
    if (!input || typeof input !== "object") throw new DomainError(400, "Fill in the parcel details.");
    const origin = text(input.origin, "Origin");
    const destination = text(input.destination, "Destination");
    if (origin.toLocaleLowerCase() === destination.toLocaleLowerCase()) throw new DomainError(400, "Origin and destination must differ.");
    const packageDescription = text(input.packageDescription, "Description", 1000);
    const packageWeightKg = payload(input.packageWeightKg);
    const pickupLatitude = coordinate(input.originLat), pickupLongitude = coordinate(input.originLng);
    const deliveryLatitude = coordinate(input.destinationLat), deliveryLongitude = coordinate(input.destinationLng);
    const estimatedDistanceKm = pickupLatitude !== null && pickupLongitude !== null && deliveryLatitude !== null && deliveryLongitude !== null
      ? Math.max(0.5, haversineKm(pickupLatitude, pickupLongitude, deliveryLatitude, deliveryLongitude))
      : 5;
    const estimatedDurationMinutes = Math.max(5, Math.ceil(estimatedDistanceKm / 40 * 60));
    const at = timestamp();
    const order: Order = {
      id: randomUUID(), orderNumber: "", customerId: id, operatorId: null, droneId: null,
      pickupAddressId: "", deliveryAddressId: "", origin, destination,
      packageDescription, specialInstructions: optionalText(input.specialInstructions, "Special instructions"),
      packageWeightKg, packageDimensionsCm: input.packageDimensionsCm ? { length: dimension(input.packageDimensionsCm.length) ?? undefined, width: dimension(input.packageDimensionsCm.width) ?? undefined, height: dimension(input.packageDimensionsCm.height) ?? undefined } : null,
      priorityLevel: priority(input.priorityLevel), estimatedDistanceKm, estimatedDurationMinutes,
      status: "pending", paymentStatus: "pending",
      priceAmount: Math.round((0.065 + Math.max(0, Math.ceil(packageWeightKg - 0.5)) * 0.02) * 10000) / 10000, priceCurrency: "SOL",
      smartContractAddress: null, escrowTransactionSignature: null,
      paymentId: null, receiptConfirmedAt: null,
      pickupTimeRequested: null, pickupTimeActual: null,
      deliveryTimeEstimated: new Date(new Date(at).getTime() + estimatedDurationMinutes * 60000).toISOString(), deliveryTimeActual: null,
      createdAt: at, updatedAt: at, events: [{ status: "pending", at, actorId: id }],
    };
    return this.repository.transaction(async tx => {
      await this.role(id, "customer", tx);
      const pickup: Address = { id: randomUUID(), ownerId: id, label: "pickup", addressText: origin, latitude: pickupLatitude, longitude: pickupLongitude, createdAt: at };
      const delivery: Address = { id: randomUUID(), ownerId: id, label: "delivery", addressText: destination, latitude: deliveryLatitude, longitude: deliveryLongitude, createdAt: at };
      const placed = { ...order, orderNumber: orderNumber(await tx.list<Order>("orders")), pickupAddressId: pickup.id, deliveryAddressId: delivery.id };
      await tx.set("addresses", pickup.id, pickup); await tx.set("addresses", delivery.id, delivery);
      await tx.set("orders", placed.id, placed);
      return placed;
    });
  }
  private event(order: Order, actorId: string, status: OrderStatus): Order {
    const at = timestamp();
    return { ...order, status, updatedAt: at, events: [...order.events, { status, at, actorId }] };
  }
  private async existing(tx: Transaction, orderId: string): Promise<Order> {
    const order = await tx.get<Order>("orders", orderId);
    if (!order) throw new DomainError(404, "Delivery not found.");
    return order;
  }
  async pay(id: string, orderId: string): Promise<Order> {
    return this.repository.transaction(async tx => {
      await this.role(id, "customer", tx);
      const order = await this.existing(tx, orderId);
      if (order.customerId !== id) throw new DomainError(403, "No access to this payment.");
      if (order.status !== "pending" || order.paymentStatus !== "pending") throw new DomainError(409, "Payment already processed.");
      // Demo escrow: records a locked payments document. A real escrow adapter
      // must verify chain confirmation outside the transaction first.
      const paymentId = await this.payments.hold(tx, order);
      const updated = { ...this.event(order, id, "payment_locked"), paymentId, paymentStatus: "locked" as const };
      const offer = { id: order.id, packageWeightKg: order.packageWeightKg, priceAmount: order.priceAmount, createdAt: order.createdAt, originArea: area(order.origin), destinationArea: area(order.destination), available: true };
      await tx.set("orders", orderId, updated); await tx.set("offers", orderId, offer);
      return updated;
    });
  }
  async accept(id: string, orderId: string, droneId: string): Promise<Order> {
    return this.repository.transaction(async tx => {
      await this.role(id, "operator", tx);
      const order = await this.existing(tx, orderId);
      const drone = typeof droneId === "string" ? await tx.get<Drone>("drones", droneId) : null;
      const ownOrders = await tx.list<Order>("orders");
      if (!drone || drone.operatorId !== id) throw new DomainError(403, "Choose your own drone.");
      if (order.status !== "payment_locked" || order.paymentStatus !== "locked" || order.operatorId) throw new DomainError(409, "This order is already accepted or not paid yet.");
      if (drone.status !== "available") throw new DomainError(409, "Drone is not available right now.");
      if (drone.certificationStatus !== "certified") throw new DomainError(409, "Drone certification is not confirmed.");
      if (drone.maxPayloadKg < order.packageWeightKg) throw new DomainError(409, "Drone payload capacity is insufficient.");
      if (ownOrders.some(current => current.droneId === droneId && current.id !== orderId && ACTIVE_DELIVERY.includes(current.status))) throw new DomainError(409, "This drone is already performing a delivery.");
      const updated = { ...this.event(order, id, "assigned"), operatorId: id, droneId };
      await tx.set("orders", orderId, updated);
      await tx.set("drones", droneId, { ...drone, status: "in_flight" as DroneStatus, updatedAt: timestamp() });
      await tx.set("offers", orderId, { id: orderId, available: false });
      return updated;
    });
  }
  async advance(id: string, orderId: string, status: OrderStatus): Promise<Order> {
    const next: Partial<Record<OrderStatus, OrderStatus>> = { assigned: "in_transit", in_transit: "delivered" };
    return this.repository.transaction(async tx => {
      await this.role(id, "operator", tx);
      const order = await this.existing(tx, orderId);
      if (order.operatorId !== id) throw new DomainError(403, "You can only update your own delivery.");
      if (!next[order.status] || next[order.status] !== status) throw new DomainError(409, "Invalid delivery stage.");
      let updated = this.event(order, id, status);
      const at = timestamp();
      const drone = order.droneId ? await tx.get<Drone>("drones", order.droneId) : null;
      if (status === "in_transit") {
        updated = { ...updated, pickupTimeActual: at };
        if (drone && drone.currentLatitude !== null && drone.currentLongitude !== null) {
          const tracking: OrderTrackingDoc = { id: randomUUID(), orderId, latitude: drone.currentLatitude, longitude: drone.currentLongitude, altitudeM: drone.currentAltitudeM, speedKmh: null, batteryPercent: drone.currentBatteryPercent, headingDegrees: null, statusUpdate: "Parcel in flight", timestamp: at };
          await tx.set("orderTracking", tracking.id, tracking);
        }
      }
      if (status === "delivered") {
        updated = { ...updated, deliveryTimeActual: at };
        if (drone) await tx.set("drones", drone.id, { ...drone, status: "available" as DroneStatus, totalFlights: drone.totalFlights + 1, totalDistanceKm: Math.round((drone.totalDistanceKm + order.estimatedDistanceKm) * 100) / 100, updatedAt: at });
      }
      await tx.set("orders", orderId, updated); return updated;
    });
  }
  async confirmReceipt(id: string, orderId: string): Promise<Order> {
    return this.repository.transaction(async tx => {
      await this.role(id, "customer", tx);
      const order = await this.existing(tx, orderId);
      if (order.customerId !== id) throw new DomainError(403, "Only the customer can confirm receipt.");
      if (order.status !== "delivered" || order.paymentStatus !== "locked" || !order.paymentId) throw new DomainError(409, "Receipt can be confirmed after delivery.");
      await this.payments.release(tx, order, order.paymentId);
      const at = timestamp();
      const updated = { ...this.event(order, id, "delivered"), paymentStatus: "completed" as const, receiptConfirmedAt: at, updatedAt: at };
      await tx.set("orders", orderId, updated); return updated;
    });
  }
  async cancelOrder(id: string, orderId: string): Promise<Order> {
    return this.repository.transaction(async tx => {
      await this.role(id, "customer", tx);
      const order = await this.existing(tx, orderId);
      if (order.customerId !== id) throw new DomainError(403, "No access to this delivery.");
      if (order.status !== "pending" && order.status !== "payment_locked") throw new DomainError(409, "Cancellation is only possible before an operator is assigned.");
      let cancelled = this.event(order, id, "cancelled");
      if (order.status === "payment_locked") {
        if (!order.paymentId) throw new DomainError(409, "Order payment not found.");
        await this.payments.refund(tx, order, order.paymentId);
        cancelled = { ...cancelled, paymentStatus: "refunded" as const };
      }
      await tx.set("orders", orderId, cancelled);
      if (order.status === "payment_locked") await tx.set("offers", orderId, { id: orderId, available: false });
      return cancelled;
    });
  }
  async drones(id: string): Promise<Drone[]> {
    await this.role(id, "operator");
    return (await this.repository.list<Drone>("drones")).filter(drone => drone.operatorId === id);
  }
  async addDrone(id: string, input: DroneInput): Promise<Drone> {
    await this.role(id, "operator");
    if (!input || typeof input !== "object") throw new DomainError(400, "Fill in the drone details.");
    const droneModel = text(input.droneModel, "Drone model", 100);
    const serialNumber = text(input.serialNumber, "Serial number", 100);
    const registrationNumber = text(input.registrationNumber, "Registration number", 100);
    const maxPayloadKg = payload(input.maxPayloadKg, 25);
    const maxRangeKm = input.maxRangeKm === undefined || input.maxRangeKm === null ? null : payload(input.maxRangeKm, 500);
    const batteryCapacityMah = input.batteryCapacityMah === undefined || input.batteryCapacityMah === null ? null : payload(input.batteryCapacityMah, 1000000);
    const at = timestamp();
    const drone: Drone = {
      id: randomUUID(), operatorId: id,
      droneModel, manufacturer: optionalText(input.manufacturer, "Manufacturer", 100),
      serialNumber, registrationNumber, maxPayloadKg, maxRangeKm,
      batteryCapacityMah, currentBatteryPercent: null,
      status: "available", certificationStatus: "certified" as CertificationStatus,
      insurancePolicyNumber: null, insuranceExpiryDate: null,
      currentLatitude: null, currentLongitude: null, currentAltitudeM: null,
      lastMaintenanceDate: null, nextMaintenanceDue: null,
      totalFlights: 0, totalDistanceKm: 0,
      createdAt: at, updatedAt: at,
    };
    await this.repository.transaction(async tx => {
      await this.role(id, "operator", tx);
      const drones = await tx.list<Drone>("drones");
      if (drones.some(current => current.serialNumber === serialNumber)) throw new DomainError(409, "A drone with this serial number is already registered.");
      if (drones.some(current => current.registrationNumber === registrationNumber)) throw new DomainError(409, "A drone with this registration number is already registered.");
      await tx.set("drones", drone.id, drone);
    });
    return drone;
  }
}
