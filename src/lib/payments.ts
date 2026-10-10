import { getMode } from "./config";
import { DomainError, type Order } from "./domain";
export interface PaymentAdapter {
  mode: "demo" | "unconfigured";
  hold(order: Order): Promise<"demo_held">;
  release(order: Order): Promise<"demo_released">;
}

export class DemoPayments implements PaymentAdapter {
  mode = "demo" as const;
  async hold(_order: Order): Promise<"demo_held"> { return "demo_held"; }
  async release(_order: Order): Promise<"demo_released"> { return "demo_released"; }
}
export class UnconfiguredPayments implements PaymentAdapter {
  mode = "unconfigured" as const;
  async hold(_order: Order): Promise<"demo_held"> { throw new DomainError(503, "Escrow-контракт не подключён. Реальная оплата недоступна."); }
  async release(_order: Order): Promise<"demo_released"> { throw new DomainError(503, "Escrow-контракт не подключён. Выплата недоступна."); }
}
export function getPayments(): PaymentAdapter { return getMode() === "demo" ? new DemoPayments() : new UnconfiguredPayments(); }
