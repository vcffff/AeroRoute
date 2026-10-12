import AeroRoutePage from '../shared/reference';
import { currentUser } from '@/lib/auth';

export default async function Home() {
  const user = await currentUser();
  return <AeroRoutePage username={user?.username} />;
}
