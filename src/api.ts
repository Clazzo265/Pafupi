export async function api<T>(
  path: string,
  body?: unknown,
  headers: Record<string, string> = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Pafupi-Client': 'web', ...headers },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  } catch {
    throw new Error(
      'Connection unavailable. Please reconnect and try again. Any locally saved task draft is unchanged.',
    );
  }
  const data = await response.json();
  if (!response.ok)
    throw Object.assign(new Error(data.error || 'Please try again.'), { status: response.status });
  return data;
}
