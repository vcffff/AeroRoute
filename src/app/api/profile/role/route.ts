import { requireUser } from '@/lib/auth';
import { body, checkOrigin, handle } from '@/lib/http';
import { DeliveryService } from '@/lib/service';
import { getStore } from '@/lib/store';
import { getPayments } from '@/lib/payments';
import type { Role } from '@/lib/domain';
export async function POST(request: Request) { return handle(async () => { checkOrigin(request); const user = await requireUser(); const data = await body(request); return new DeliveryService(getStore(), getPayments()).chooseRole(user.id, data.role as Role); }); }
