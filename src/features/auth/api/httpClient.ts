/**
 * Minimal fetch wrapper for the NeuronixAI Spring Boot API.
 * - Same-origin by default (`/api/...`); set VITE_API_BASE_URL (non-secret) for a separate origin.
 * - Never sends cookies, never caches, never logs request/response bodies.
 */
const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')
const TIMEOUT_MS = 15_000

export type ApiErrorKind = 'network' | 'timeout' | 'aborted' | 'http'

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
  /** Defaults to 15s; long-running calls (LLM chat) pass a larger value. */
  timeoutMs?: number
  /** Lets callers cancel (e.g. on unmount or sign-out). */
  signal?: AbortSignal
}

export type HttpMethod = 'GET' | 'POST' | 'DELETE'

export async function apiRequest<T>(method: HttpMethod, path: string, { body, bearer, timeoutMs = TIMEOUT_MS, signal }: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData
  // For FormData the browser sets the multipart Content-Type (with boundary) itself.
  if (body !== undefined && !isForm) headers['Content-Type'] = 'application/json'
  if (bearer) headers.Authorization = `Bearer ${bearer}`

  let res: Response
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(body),
      credentials: 'omit',
      cache: 'no-store',
      referrerPolicy: 'no-referrer',
      signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(timeoutMs)]) : AbortSignal.timeout(timeoutMs),
    })
  } catch (e) {
    const name = e instanceof DOMException ? e.name : ''
    throw new ApiError(name === 'TimeoutError' ? 'timeout' : name === 'AbortError' ? 'aborted' : 'network')
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
