import { NextResponse } from 'next/server';
import { DomainError } from './domain';

export function json(value: unknown, status = 200) {
  return NextResponse.json(value, { status, headers: { 'Cache-Control': 'no-store', Vary: 'Cookie' } });
}
export function checkOrigin(request: Request) {
  const origin = request.headers.get('origin');
  const url = new URL(request.url);
  // Next's internal request URL can use localhost while the browser uses 127.0.0.1.
  // Host is the browser's same-origin target; pin the canonical public origin for
  // deployments behind a proxy that terminates HTTPS.
  const target = process.env.AEROROUTE_APP_ORIGIN || new URL(`${url.protocol}//${request.headers.get('host') || url.host}`).origin;
  if (!origin || origin !== target) throw new DomainError(403, 'Invalid request origin');
}
export async function body(request: Request): Promise<Record<string, unknown>> {
  try {
    const value: unknown = await request.json();
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error();
    return value as Record<string, unknown>;
  } catch { throw new DomainError(400, 'Invalid JSON body'); }
}
export async function handle(work: () => Promise<unknown>) {
  try { return json(await work()); }
  catch (error) {
    if (error instanceof DomainError) return json({ error: error.message }, error.status);
    console.error('AeroRoute API error', error instanceof Error ? error.message : 'Unknown error');
    return json({ error: 'Service unavailable' }, 503);
  }
}
