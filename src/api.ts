let tokenProvider: (() => Promise<string | null>) | null = null;
export function setTokenProvider(provider: () => Promise<string | null>) {
  tokenProvider = provider;
}
export async function api<T>(
  path: string,
  body?: unknown,
  headers: Record<string, string> = {},
): Promise<T> {
  let response: Response;
  const token = tokenProvider ? await tokenProvider() : null;
  try {
    response = await fetch(`/api${path}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Pafupi-Client': 'web',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      signal: AbortSignal.timeout(15000),
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  } catch {
    throw new Error(
      'Connection unavailable. Please reconnect and try again. Any locally saved task draft is unchanged.',
    );
  }
  const data = await response.json().catch(() => {
    throw new Error('The service is temporarily unavailable. Please try again shortly.');
  });
  if (!response.ok)
    throw Object.assign(new Error(data.error || 'Please try again.'), { status: response.status });
  return data;
}
