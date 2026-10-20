export type ApiErrorKind = 'network' | 'timeout' | 'aborted' | 'malformed' | 'http'

export interface ApiErrorExtra {
  /** Stable machine-readable code from the backend error body (e.g. DOCUMENT_NOT_FOUND). Server prose is never kept. */
  code?: string
  /** A 401 that the session probe proved was NOT a session problem (Spring's secured /error dispatch masks server errors as 401). */
  sessionValid?: boolean
  retryAfterSeconds?: number
}

export class ApiError extends Error {
  readonly kind: ApiErrorKind
  readonly status: number
  readonly code?: string
  readonly sessionValid: boolean
  readonly retryAfterSeconds?: number
  constructor(kind: ApiErrorKind, status = 0, extra: ApiErrorExtra = {}) {
    super(kind === 'http' ? `HTTP ${status}` : kind) // deliberately excludes server-supplied text
    this.kind = kind
    this.status = status
    this.code = extra.code
    this.sessionValid = extra.sessionValid === true
    this.retryAfterSeconds = extra.retryAfterSeconds
  }
}

/** The status to reason about: a masked 401 behaves like a server error. */
export const effectiveStatus = (e: ApiError): number => (e.sessionValid && e.status === 401 ? 500 : e.status)

/** Codes a backend may return to say a ROUTE (not a resource) is missing. */
export const ENDPOINT_MISSING_CODES: ReadonlySet<string> = new Set(['ENDPOINT_NOT_IMPLEMENTED', 'ENDPOINT_NOT_FOUND'])

export const isApiError = (e: unknown): e is ApiError => e instanceof ApiError
