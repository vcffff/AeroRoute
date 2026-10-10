import { randomUUID } from "node:crypto";
import { DomainError, type DeliveryStatus, type Drone, type DroneInput, type Offer, type Order, type OrderInput, type Profile, type Role } from "./domain";
import type { Repository, Transaction } from "./repository";
import type { PaymentAdapter } from "./payments";

const timestamp = () => new Date().toISOString();
function text(value: unknown, label: string, max = 240): string {
  if (typeof value !== "string" || value.trim().length < 3 || value.trim().length > max) throw new DomainError(400, `${label}: от 3 до ${max} символов.`);
  return value.trim();
}
function payload(value: unknown, maximum = 5): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0 || value > maximum) throw new DomainError(400, `Вес должен быть больше 0 и не превышать ${maximum} кг.`);
  return value;
}
function area(address: string): string {
  // Do not expose addresses, recipient data or precise coordinates in open offers.
  if (/астана/i.test(address)) return "Астана";
  if (/алматы/i.test(address)) return "Алматы";
  return "Городская зона";
}
export class DeliveryService {
  constructor(private readonly repository: Repository, private readonly payments: PaymentAdapter) {}
  async profile(id: string): Promise<Profile> {
    const profile = await this.repository.get<Profile>("profiles", id);
    if (!profile) throw new DomainError(401, "Войдите в аккаунт.");
    return profile;
  }
  private async role(id: string, expected: Role, tx?: Transaction): Promise<Profile> {
    const profile = tx ? await tx.get<Profile>("profiles", id) : await this.profile(id);
    if (!profile || profile.role !== expected) throw new DomainError(403, "Эта операция недоступна для вашей роли.");
    return profile;
  }
  async chooseRole(id: string, role: Role): Promise<Profile> {
    if (role !== "customer" && role !== "operator") throw new DomainError(400, "Выберите заказчика или оператора.");
    return this.repository.transaction(async tx => {
      const profile = await tx.get<Profile>("profiles", id);
      if (!profile) throw new DomainError(401, "Войдите в аккаунт.");
      if (profile.role && profile.role !== role) throw new DomainError(409, "Роль уже выбрана и не может быть изменена.");
      const updated = { ...profile, role };
      await tx.set("profiles", id, updated); return updated;
    });
  }
  async orders(id: string): Promise<Order[]> {
    const profile = await this.profile(id);
    if (!profile.role) throw new DomainError(403, "Сначала выберите роль.");
    return (await this.repository.list<Order>("orders")).filter(order => profile.role === "customer" ? order.customerId === id : order.operatorId === id).sort((a,b) => b.createdAt.localeCompare(a.createdAt));
  }
  async order(id: string, orderId: string): Promise<Order> {
    const profile = await this.profile(id);
    const order = await this.repository.get<Order>("orders", orderId);
    if (!order) throw new DomainError(404, "Доставка не найдена.");
    if ((profile.role === "customer" && order.customerId === id) || (profile.role === "operator" && order.operatorId === id)) return order;
    throw new DomainError(403, "Нет доступа к этой доставке.");
  }
  async offers(id: string): Promise<Offer[]> {
    await this.role(id, "operator");
    return (await this.repository.list<Offer & { available: boolean }>("offers")).filter(offer => offer.available).map(({ id, weightKg, priceKzt, createdAt, originArea, destinationArea }) => ({ id, weightKg, priceKzt, createdAt, originArea, destinationArea }));
  }
  async createOrder(id: string, input: OrderInput): Promise<Order> {
    await this.role(id, "customer");
    if (!input || typeof input !== "object") throw new DomainError(400, "Заполните данные посылки.");
    const origin = text(input.origin, "Точка отправления");
    const destination = text(input.destination, "Точка получения");
    if (origin.toLocaleLowerCase() === destination.toLocaleLowerCase()) throw new DomainError(400, "Точки отправления и получения должны различаться.");
    const description = text(input.description, "Описание", 1000);
    const weightKg = payload(input.weightKg);
    const at = timestamp();
    const order: Order = { id: randomUUID(), customerId: id, operatorId: null, droneId: null, origin, destination, description, weightKg, priceKzt: 2900 + Math.max(0, Math.ceil(weightKg - 0.5)) * 900, deliveryStatus: "awaiting_payment", paymentStatus: "unpaid", createdAt: at, updatedAt: at, events: [{ status: "awaiting_payment", at, actorId: id }] };
    await this.repository.transaction(async tx => { await this.role(id, "customer", tx); await tx.set("orders", order.id, order); });
    return order;
  }
  private event(order: Order, actorId: string, status: DeliveryStatus): Order {
    const at = timestamp();
    return { ...order, deliveryStatus: status, updatedAt: at, events: [...order.events, { status, at, actorId }] };
  }
  private async existing(tx: Transaction, orderId: string): Promise<Order> {
    const order = await tx.get<Order>("orders", orderId);
    if (!order) throw new DomainError(404, "Доставка не найдена.");
    return order;
  }
  async pay(id: string, orderId: string): Promise<Order> {
    return this.repository.transaction(async tx => {
      await this.role(id, "customer", tx);
      const order = await this.existing(tx, orderId);
      if (order.customerId !== id) throw new DomainError(403, "Нет доступа к этой оплате.");
      if (order.deliveryStatus !== "awaiting_payment" || order.paymentStatus !== "unpaid") throw new DomainError(409, "Оплата уже обработана.");
      // Real escrow must verify chain confirmation outside the transaction and
      // persist idempotent receipts; this adapter has no external side effects.
      const updated = { ...this.event(order, id, "searching"), paymentStatus: await this.payments.hold(order) };
      const offer = { id: order.id, weightKg: order.weightKg, priceKzt: order.priceKzt, createdAt: order.createdAt, originArea: area(order.origin), destinationArea: area(order.destination), available: true };
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
      if (!drone || drone.operatorId !== id) throw new DomainError(403, "Выберите свой дрон.");
      if (!drone.active || drone.maxPayloadKg < order.weightKg) throw new DomainError(409, "Дрон не подходит по грузоподъёмности.");
      if (order.deliveryStatus !== "searching" || order.paymentStatus !== "demo_held" || order.operatorId) throw new DomainError(409, "Этот заказ уже принят или ещё не оплачен.");
      if (ownOrders.some(current => current.droneId === droneId && current.id !== orderId && !["received", "delivered"].includes(current.deliveryStatus))) throw new DomainError(409, "Этот дрон уже выполняет доставку.");
      const updated = { ...this.event(order, id, "accepted"), operatorId: id, droneId };
      await tx.set("orders", orderId, updated);
      await tx.set("offers", orderId, { id: orderId, available: false });
      return updated;
    });
  }
  async advance(id: string, orderId: string, status: DeliveryStatus): Promise<Order> {
    const next: Partial<Record<DeliveryStatus, DeliveryStatus>> = { accepted: "picked_up", picked_up: "in_transit", in_transit: "delivered" };
    return this.repository.transaction(async tx => {
      await this.role(id, "operator", tx);
      const order = await this.existing(tx, orderId);
      if (order.operatorId !== id) throw new DomainError(403, "Можно обновлять только свою доставку.");
      if (!next[order.deliveryStatus] || next[order.deliveryStatus] !== status) throw new DomainError(409, "Недопустимый этап доставки.");
      const updated = this.event(order, id, status);
      await tx.set("orders", orderId, updated); return updated;
    });
  }
  async confirmReceipt(id: string, orderId: string): Promise<Order> {
    return this.repository.transaction(async tx => {
      await this.role(id, "customer", tx);
      const order = await this.existing(tx, orderId);
      if (order.customerId !== id) throw new DomainError(403, "Только заказчик может подтвердить получение.");
      if (order.deliveryStatus !== "delivered" || order.paymentStatus !== "demo_held") throw new DomainError(409, "Получение можно подтвердить после доставки.");
      const updated = { ...this.event(order, id, "received"), paymentStatus: await this.payments.release(order) };
      await tx.set("orders", orderId, updated); return updated;
    });
  }
  async drones(id: string): Promise<Drone[]> {
    await this.role(id, "operator");
    return (await this.repository.list<Drone>("drones")).filter(drone => drone.operatorId === id);
  }
  async addDrone(id: string, input: DroneInput): Promise<Drone> {
    await this.role(id, "operator");
    if (!input || typeof input !== "object") throw new DomainError(400, "Заполните данные дрона.");
    if (input.active !== undefined && typeof input.active !== "boolean") throw new DomainError(400, "Укажите доступность дрона.");
    const drone: Drone = { id: randomUUID(), operatorId: id, name: text(input.name, "Название", 100), maxPayloadKg: payload(input.maxPayloadKg, 25), active: input.active ?? true, createdAt: timestamp() };
    await this.repository.transaction(async tx => { await this.role(id, "operator", tx); await tx.set("drones", drone.id, drone); });
    return drone;
  }
}
