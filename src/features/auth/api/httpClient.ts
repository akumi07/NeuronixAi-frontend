/**
 * Minimal fetch wrapper for the NeuronixAI Spring Boot API.
 * - Same-origin by default (`/api/...`); set VITE_API_BASE_URL (non-secret) for a separate origin.
 * - Never sends cookies, never caches, never logs request/response bodies.
 */
const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')
const TIMEOUT_MS = 15_000

export type ApiErrorKind = 'network' | 'timeout' | 'http'

export class ApiError extends Error {
  readonly kind: ApiErrorKind
  readonly status: number
  constructor(kind: ApiErrorKind, status = 0) {
    super(kind === 'http' ? `HTTP ${status}` : kind) // deliberately excludes server-supplied text
    this.kind = kind
    this.status = status
  }
}

interface RequestOptions {
  body?: unknown
  bearer?: string
}

export async function apiRequest<T>(method: 'GET' | 'POST', path: string, { body, bearer }: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (bearer) headers.Authorization = `Bearer ${bearer}`

  let res: Response
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: 'omit',
      cache: 'no-store',
      referrerPolicy: 'no-referrer',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch (e) {
    throw new ApiError(e instanceof DOMException && e.name === 'TimeoutError' ? 'timeout' : 'network')
  }

  if (!res.ok) throw new ApiError('http', res.status)

  const text = await res.text()
  if (!text) return undefined as T
  try {
    return JSON.parse(text) as T
  } catch {
    return text as T // e.g. /logout returns a plain string
  }
}
