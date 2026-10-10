import { requireUser } from '@/lib/auth';
import { body, checkOrigin, handle } from '@/lib/http';
import { DeliveryService } from '@/lib/service';
import { getStore } from '@/lib/store';
import { getPayments } from '@/lib/payments';
const service = () => new DeliveryService(getStore(), getPayments());
export async function GET() { return handle(async () => service().drones((await requireUser()).id)); }
export async function POST(request: Request) { return handle(async () => { checkOrigin(request); const user = await requireUser(); const data = await body(request); return service().addDrone(user.id, data as unknown as Parameters<DeliveryService['addDrone']>[1]); }); }
