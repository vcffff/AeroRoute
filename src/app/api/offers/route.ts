import { requireUser } from '@/lib/auth';
import { handle } from '@/lib/http';
import { DeliveryService } from '@/lib/service';
import { getStore } from '@/lib/store';
import { getPayments } from '@/lib/payments';
export async function GET() { return handle(async () => new DeliveryService(getStore(), getPayments()).offers((await requireUser()).id)); }
