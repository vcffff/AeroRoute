import { requireUser } from '@/lib/auth';
import { body, checkOrigin, handle } from '@/lib/http';
import { DeliveryService } from '@/lib/service';
import { getStore } from '@/lib/store';
import { getPayments } from '@/lib/payments';
import { DomainError, type OrderStatus } from '@/lib/domain';
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) { return handle(async () => {
 checkOrigin(request); const user = await requireUser(); const { id } = await context.params; const data = await body(request); const service = new DeliveryService(getStore(), getPayments());
 switch (data.action) {
 case 'pay': return service.pay(user.id, id);
 case 'accept': return service.accept(user.id, id, data.droneId as string);
 case 'advance': return service.advance(user.id, id, data.status as OrderStatus);
 case 'confirm': return service.confirmReceipt(user.id, id);
 case 'cancel': return service.cancelOrder(user.id, id);
 default: throw new DomainError(400, 'Unknown delivery action');
 }
}); }
