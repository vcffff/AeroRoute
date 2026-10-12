import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { DeliveryService } from '@/lib/service';
import { getStore } from '@/lib/store';
import { getPayments } from '@/lib/payments';
import { getMode } from '@/lib/config';
import { RoleChoice } from '@/components/role-choice';
export default async function ChooseRolePage() {
  const user = await currentUser();
  if (!user) redirect('/login');
  const profile = await new DeliveryService(getStore(), getPayments()).profile(user.id);
  if (profile.role) redirect('/' + profile.role);
  return <RoleChoice username={user.username} mode={getMode()} />;
}
