import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { DeliveryService } from '@/lib/service';
import { getStore } from '@/lib/store';
import { getPayments } from '@/lib/payments';
export default async function DashboardPage() {
  const user = await currentUser();
  if (!user) redirect('/login');
  const profile = await new DeliveryService(getStore(), getPayments()).profile(user.id);
  redirect(profile.role ? '/' + profile.role : '/choose-role');
}
