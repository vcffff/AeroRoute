import { randomUUID } from "node:crypto";
import { getMode } from "./config";
import { DomainError, type Order, type PaymentDoc } from "./domain";
import type { Transaction } from "./repository";

// Demo escrow everywhere (demo and firestore mode): "hold" and "release" are
// recorded as payments documents, no real contract is invoked. A real escrow
// adapter must verify chain confirmations outside the transaction and persist
// idempotent receipts before replacing this implementation.
export const PLATFORM_FEE_RATE = 0.1;

export interface PaymentAdapter {
  mode: "demo" | "firestore";
  hold(tx: Transaction, order: Order): Promise<string>;
  release(tx: Transaction, order: Order, paymentId: string): Promise<void>;
  refund(tx: Transaction, order: Order, paymentId: string): Promise<void>;
}

function payment(order: Order): PaymentDoc {
  return {
    id: randomUUID(), orderId: order.id, payerId: order.customerId, payeeId: null,
    amount: order.priceAmount, currency: order.priceCurrency,
    paymentType: "order_payment", paymentStatus: "locked",
    smartContractAddress: null, lockTransactionSignature: null, releaseTransactionSignature: null,
    platformFeeAmount: Math.round(order.priceAmount * PLATFORM_FEE_RATE * 10000) / 10000, operatorPayoutAmount: Math.round((order.priceAmount - Math.round(order.priceAmount * PLATFORM_FEE_RATE * 10000) / 10000) * 10000) / 10000,
    createdAt: new Date().toISOString(), completedAt: null,
  };
}
async function lockedPayment(tx: Transaction, order: Order, paymentId: string): Promise<PaymentDoc> {
  const record = await tx.get<PaymentDoc>("payments", paymentId);
  if (!record || record.orderId !== order.id || record.paymentStatus !== "locked") throw new DomainError(409, "Payment already processed.");
  return record;
}

export class DemoEscrowPayments implements PaymentAdapter {
  mode = getMode() === "demo" ? "demo" as const : "firestore" as const;
  async hold(tx: Transaction, order: Order): Promise<string> {
    const record = payment(order);
    await tx.set("payments", record.id, record);
    return record.id;
  }
  async release(tx: Transaction, order: Order, paymentId: string): Promise<void> {
    const record = await lockedPayment(tx, order, paymentId);
    await tx.set("payments", paymentId, { ...record, payeeId: order.operatorId, paymentStatus: "completed", completedAt: new Date().toISOString() });
  }
  async refund(tx: Transaction, order: Order, paymentId: string): Promise<void> {
    const record = await lockedPayment(tx, order, paymentId);
    await tx.set("payments", paymentId, { ...record, paymentStatus: "refunded" });
  }
}

export function getPayments(): PaymentAdapter { return new DemoEscrowPayments(); }
