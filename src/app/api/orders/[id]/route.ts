import { requireUser } from '@/lib/auth';
import { handle } from '@/lib/http';
import { DeliveryService } from '@/lib/service';
import { getStore } from '@/lib/store';
import { getPayments } from '@/lib/payments';
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) { return handle(async () => new DeliveryService(getStore(), getPayments()).order((await requireUser()).id, (await context.params).id)); }
