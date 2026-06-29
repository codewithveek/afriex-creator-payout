const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export class ApiClientError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message)
    this.name = 'ApiClientError'
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { cookie?: string | null } = {},
): Promise<T> {
  const { cookie, ...fetchOptions } = options

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...Object.fromEntries(new Headers(fetchOptions.headers).entries()),
  }

  if (cookie) {
    headers['Cookie'] = cookie
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...fetchOptions,
    headers,
    credentials: cookie ? undefined : 'include',
  })

  const text = await res.text()

  if (!res.ok) {
    let code = 'UNKNOWN_ERROR'
    let message = 'An unexpected error occurred'
    try {
      const body = JSON.parse(text)
      code = body.error?.code || code
      message = body.error?.message || message
    } catch {
      message = text || message
    }
    throw new ApiClientError(res.status, code, message)
  }

  if (!text) return undefined as T
  return JSON.parse(text)
}

/** Client-side API helpers (browser handles cookies via credentials: 'include') */
export const api = {
  get: <T>(path: string) => apiFetch<T>(path),
  post: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => apiFetch<T>(path, { method: 'DELETE' }),
}
