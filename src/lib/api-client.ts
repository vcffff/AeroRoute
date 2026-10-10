export class ApiError extends Error { constructor(message:string,public readonly status:number){super(message);this.name='ApiError';} }
export async function api<T>(path: string, body?: unknown, method = body === undefined ? 'GET' : 'POST'): Promise<T> {
  const response = await fetch(path, { method, credentials: 'same-origin', cache: 'no-store', headers: body === undefined ? undefined : { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
  const data = await response.json();
  if (!response.ok) throw new ApiError(data.error || 'Не удалось выполнить запрос',response.status);
  return data as T;
}
