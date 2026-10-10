export type Role = "customer" | "operator";
export type DeliveryStatus = "awaiting_payment" | "searching" | "accepted" | "picked_up" | "in_transit" | "delivered" | "received";
export type PaymentStatus = "unpaid" | "demo_held" | "demo_released";
export type Profile = { id: string; username: string; role: Role | null; createdAt: string };
export type Drone = { id: string; operatorId: string; name: string; maxPayloadKg: number; active: boolean; createdAt: string };
export type DeliveryEvent = { status: DeliveryStatus; at: string; actorId: string };
export type Order = {
  id: string; customerId: string; operatorId: string | null; droneId: string | null;
  origin: string; destination: string; description: string; weightKg: number; priceKzt: number;
  deliveryStatus: DeliveryStatus; paymentStatus: PaymentStatus;
  createdAt: string; updatedAt: string; events: DeliveryEvent[];
};
export type Offer = { id: string; weightKg: number; priceKzt: number; createdAt: string; originArea: string; destinationArea: string };
export type OrderInput = { origin: string; destination: string; description: string; weightKg: number };
export type DroneInput = { name: string; maxPayloadKg: number; active?: boolean };
export class DomainError extends Error {
  constructor(public readonly status: number, message: string) { super(message); this.name = "DomainError"; }
}

export const deliveryLabels: Record<DeliveryStatus, string> = {
  awaiting_payment: "Ожидает оплаты", searching: "Поиск оператора", accepted: "Оператор назначен",
  picked_up: "Посылка получена оператором", in_transit: "В пути", delivered: "Ожидает подтверждения получателя", received: "Получение подтверждено",
};
export const paymentLabels: Record<PaymentStatus, string> = { unpaid: "Не оплачено", demo_held: "Демо: средства удержаны", demo_released: "Демо: выплата оператору" };
