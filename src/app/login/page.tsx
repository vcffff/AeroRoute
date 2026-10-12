import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { getMode } from '@/lib/config';
import { LoginForm } from '@/components/login-form';
export default async function LoginPage() {
  if (await currentUser()) redirect('/dashboard');
  return <LoginForm mode={getMode()} />;
}
