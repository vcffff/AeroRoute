import { handleAuth } from '@/lib/auth';
import { handle } from '@/lib/http';
export async function POST(request: Request) {
  return handle(() => handleAuth(request));
}
