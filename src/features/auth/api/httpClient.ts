import { API_BASE_URL, REQUEST_TIMEOUT_MS } from '../../../api/config'
import { devLog } from '../../../api/devLog'
import { ApiError } from '../../../api/errors'

export { ApiError }
export type { ApiErrorKind } from '../../../api/errors'

/**
 * Shared fetch wrapper for the NeuronixAI Spring Boot API (the only backend the browser talks to).
 * - Base URL comes from src/api/config.ts. Same-origin by default.
 * - Never sends cookies, never caches, never logs bodies (dev diagnostics carry method/path/status/code only).
 * - Error bodies are reduced to a stable `code`; server prose is discarded.
 * - Idempotent GETs are retried a couple of times on network errors and 502/503/504; writes are never retried.
 */
interface RequestOptions {
  body?: unknown
  bearer?: string
  /** Defaults to 15s; long-running calls (LLM chat, uploads) pass a larger value. */
  timeoutMs?: number
  /** Lets callers cancel (e.g. on unmount or sign-out). */
  signal?: AbortSignal
  /** Appended as a query string. Never used for secrets. */
  query?: Record<string, string | number | undefined>
}

export type HttpMethod = 'GET' | 'POST' | 'DELETE'

const CODE_PATTERN = /^[A-Z][A-Z0-9_]{2,63}$/
const RETRYABLE = new Set([502, 503, 504])
const MAX_GET_ATTEMPTS = 3

const buildUrl = (path: string, query?: RequestOptions['query']) => {
  const qs = query ? new URLSearchParams(Object.entries(query).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])).toString() : ''
  return `${API_BASE_URL}${path}${qs ? `?${qs}` : ''}`
}

async function readErrorCode(res: Response): Promise<string | undefined> {
  try {
    const text = await res.text()
    if (!text.startsWith('{')) return undefined
    const code = (JSON.parse(text) as { code?: unknown }).code
    return typeof code === 'string' && CODE_PATTERN.test(code) ? code : undefined
  } catch {
    return undefined
  }
}

const parseRetryAfter = (res: Response): number | undefined => {
  const n = Number(res.headers.get('Retry-After'))
  return Number.isFinite(n) && n > 0 && n < 3600 ? Math.ceil(n) : undefined
}

const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve) => {
    const t = setTimeout(resolve, ms)
    signal?.addEventListener('abort', () => { clearTimeout(t); resolve() }, { once: true })
  })

async function once<T>(method: HttpMethod, path: string, { body, bearer, timeoutMs = REQUEST_TIMEOUT_MS, signal, query }: RequestOptions): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData
  // For FormData the browser sets the multipart Content-Type (with boundary) itself.
  if (body !== undefined && !isForm) headers['Content-Type'] = 'application/json'
  if (bearer) headers.Authorization = `Bearer ${bearer}`

  let res: Response
  try {
    res = await fetch(buildUrl(path, query), {
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
    const kind = name === 'TimeoutError' ? 'timeout' : name === 'AbortError' ? 'aborted' : 'network'
    devLog('request failed', { method, path, kind })
    throw new ApiError(kind)
  }

  if (!res.ok) {
    const code = await readErrorCode(res)
    devLog('http error', { method, path, status: res.status, code })
    throw new ApiError('http', res.status, { code, retryAfterSeconds: parseRetryAfter(res) })
  }

  const text = await res.text()
  if (!text) return undefined as T
  try {
    return JSON.parse(text) as T
  } catch {
    return text as T // e.g. /logout returns a plain string
  }
}

export async function apiRequest<T>(method: HttpMethod, path: string, options: RequestOptions = {}): Promise<T> {
  const attempts = method === 'GET' ? MAX_GET_ATTEMPTS : 1
  for (let attempt = 1; ; attempt++) {
    try {
      return await once<T>(method, path, options)
    } catch (e) {
      const transient = e instanceof ApiError && (e.kind === 'network' || (e.kind === 'http' && RETRYABLE.has(e.status)))
      if (!transient || attempt >= attempts || options.signal?.aborted) throw e
      await sleep(300 * attempt, options.signal)
    }
  }
}

interface UploadOptions {
  bearer?: string
  timeoutMs?: number
  signal?: AbortSignal
  onProgress?: (fraction: number) => void
}

/** Multipart upload with byte-level progress (fetch cannot report upload progress). Same auth and error handling as apiRequest. */
export function apiUpload<T>(path: string, form: FormData, { bearer, timeoutMs = 60_000, signal, onProgress }: UploadOptions = {}): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', buildUrl(path))
    xhr.timeout = timeoutMs
    xhr.setRequestHeader('Accept', 'application/json')
    if (bearer) xhr.setRequestHeader('Authorization', `Bearer ${bearer}`)
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress?.(e.loaded / e.total) }
    xhr.onerror = () => reject(new ApiError('network'))
    xhr.ontimeout = () => reject(new ApiError('timeout'))
    xhr.onabort = () => reject(new ApiError('aborted'))
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try { resolve((xhr.responseText ? JSON.parse(xhr.responseText) : undefined) as T) } catch { resolve(xhr.responseText as T) }
        return
      }
      let code: string | undefined
      try {
        const c = (JSON.parse(xhr.responseText) as { code?: unknown }).code
        if (typeof c === 'string' && CODE_PATTERN.test(c)) code = c
      } catch { /* non-JSON error body */ }
      const ra = Number(xhr.getResponseHeader('Retry-After'))
      devLog('upload http error', { method: 'POST', path, status: xhr.status, code })
      reject(new ApiError('http', xhr.status, { code, retryAfterSeconds: Number.isFinite(ra) && ra > 0 ? Math.ceil(ra) : undefined }))
    }
    if (signal) {
      if (signal.aborted) { reject(new ApiError('aborted')); return }
      signal.addEventListener('abort', () => xhr.abort(), { once: true })
    }
    xhr.send(form)
  })
}
