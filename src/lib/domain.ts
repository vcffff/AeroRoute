// Domain model projected from docs/db-schema.json (SQL ERD) into Firestore
// documents. Field names are camelCase per project decision; the ERD's *_id
// primary keys become document IDs. App-level deviations from the ERD are
// marked with a "deviation:" comment.
export type Role = "customer" | "operator";
export type OrderStatus = "pending" | "payment_locked" | "assigned" | "in_transit" | "delivered" | "cancelled" | "failed";
export type PaymentRecordStatus = "pending" | "locked" | "completed" | "refunded" | "failed";
export type PaymentType = "order_payment" | "refund" | "bonus" | "penalty";
export type DroneStatus = "available" | "in_flight" | "charging" | "maintenance" | "offline";
export type CertificationStatus = "pending" | "certified" | "expired" | "revoked";
export type PriorityLevel = "standard" | "express" | "urgent";
export type IncidentType = "delivery_failed" | "drone_malfunction" | "accident" | "weather_issue" | "security_issue";
export type Severity = "low" | "medium" | "high" | "critical";
export type ResolutionStatus = "open" | "investigating" | "resolved" | "closed";
export type ReviewType = "customer_to_operator" | "operator_to_customer";

export type Profile = { id: string; username: string; role: Role | null; createdAt: string };
export type Address = { id: string; ownerId: string; label: string; addressText: string; latitude: number | null; longitude: number | null; createdAt: string };
export type Drone = {
  id: string; operatorId: string;
  droneModel: string; manufacturer: string | null;
  serialNumber: string; registrationNumber: string;
  maxPayloadKg: number; maxRangeKm: number | null;
  batteryCapacityMah: number | null; currentBatteryPercent: number | null;
  status: DroneStatus; certificationStatus: CertificationStatus;
  insurancePolicyNumber: string | null; insuranceExpiryDate: string | null;
  currentLatitude: number | null; currentLongitude: number | null; currentAltitudeM: number | null;
  lastMaintenanceDate: string | null; nextMaintenanceDue: string | null;
  totalFlights: number; totalDistanceKm: number;
  createdAt: string; updatedAt: string;
};
export type DroneAvailabilityZone = { id: string; droneId: string; zoneName: string; centerLatitude: number; centerLongitude: number; radiusKm: number; isActive: boolean; createdAt: string };
export type DeliveryEvent = { status: OrderStatus; at: string; actorId: string };
// deviation: `origin`/`destination` denormalize the address docs for display;
// `events`, `paymentId`, `paymentStatus`, `receiptConfirmedAt` are app-level
// fields backing the UI timeline and escrow handshake; PAYMENTS lives in its
// own collection (`PaymentDoc`).
export type Order = {
  id: string; orderNumber: string; customerId: string; operatorId: string | null; droneId: string | null;
  pickupAddressId: string; deliveryAddressId: string;
  origin: string; destination: string;
  packageDescription: string; specialInstructions: string | null;
  packageWeightKg: number; packageDimensionsCm: { length?: number; width?: number; height?: number } | null;
  priorityLevel: PriorityLevel;
  estimatedDistanceKm: number; estimatedDurationMinutes: number;
  status: OrderStatus; paymentStatus: PaymentRecordStatus;
  priceAmount: number; priceCurrency: string;
  smartContractAddress: string | null; escrowTransactionSignature: string | null;
  paymentId: string | null; receiptConfirmedAt: string | null;
  pickupTimeRequested: string | null; pickupTimeActual: string | null;
  deliveryTimeEstimated: string | null; deliveryTimeActual: string | null;
  createdAt: string; updatedAt: string; events: DeliveryEvent[];
};
export type PaymentDoc = {
  id: string; orderId: string; payerId: string; payeeId: string | null;
  amount: number; currency: string;
  paymentType: PaymentType; paymentStatus: PaymentRecordStatus;
  smartContractAddress: string | null;
  lockTransactionSignature: string | null; releaseTransactionSignature: string | null;
  platformFeeAmount: number; operatorPayoutAmount: number;
  createdAt: string; completedAt: string | null;
};
export type Review = { id: string; orderId: string; reviewerId: string; revieweeId: string; droneId: string; rating: number; reviewText: string | null; reviewType: ReviewType; isPublic: boolean; createdAt: string };
export type Incident = {
  id: string; orderId: string | null; droneId: string; reportedByUserId: string;
  incidentType: IncidentType; severity: Severity; description: string;
  latitude: number; longitude: number;
  resolutionStatus: ResolutionStatus; resolutionNotes: string | null;
  createdAt: string; resolvedAt: string | null;
};
export type OrderTrackingDoc = { id: string; orderId: string; latitude: number; longitude: number; altitudeM: number | null; speedKmh: number | null; batteryPercent: number | null; headingDegrees: number | null; statusUpdate: string | null; timestamp: string };
// deviation: `offers` is a redacted projection of paid, unassigned orders for
// the operator marketplace (coarse areas only — never private order fields).
export type Offer = { id: string; packageWeightKg: number; priceAmount: number; createdAt: string; originArea: string; destinationArea: string };
export type OrderInput = {
  origin: string; destination: string; packageDescription: string; packageWeightKg: number;
  originLat?: number; originLng?: number; destinationLat?: number; destinationLng?: number;
  specialInstructions?: string; priorityLevel?: PriorityLevel;
  packageDimensionsCm?: { length?: number; width?: number; height?: number };
};
export type DroneInput = {
  droneModel: string; serialNumber: string; registrationNumber: string; maxPayloadKg: number;
  manufacturer?: string; maxRangeKm?: number; batteryCapacityMah?: number; currentBatteryPercent?: number;
};
export class DomainError extends Error {
  constructor(public readonly status: number, message: string) { super(message); this.name = "DomainError"; }
}

export const orderLabels: Record<OrderStatus, string> = {
  pending: "Awaiting payment", payment_locked: "Payment held, seeking operator", assigned: "Operator assigned",
  in_transit: "In flight", delivered: "Delivered, awaiting confirmation", cancelled: "Cancelled", failed: "Delivery failed",
};
export const paymentLabels: Record<PaymentRecordStatus, string> = {
  pending: "Unpaid", locked: "Demo: funds held", completed: "Demo: paid out to operator",
  refunded: "Demo: refunded", failed: "Payment failed",
};
export const formatPrice = (amount: number) => `${amount.toFixed(3)} SOL`;
