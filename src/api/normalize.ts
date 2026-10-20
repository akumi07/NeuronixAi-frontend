import { ENDPOINT_MISSING_CODES, effectiveStatus, isApiError } from './errors'

export type ErrorCategory =
  | 'network' | 'timeout' | 'aborted' | 'malformed'
  | 'unavailable' | 'auth' | 'validation' | 'forbidden' | 'not_found' | 'method_not_allowed'
  | 'conflict' | 'rate_limited' | 'server' | 'bad_gateway' | 'service_unavailable'

export interface CategorizeOptions {
  /** The endpoint is a proposed contract that may not exist on the backend yet (see src/api/endpoints.ts). */
  planned?: boolean
  /** The endpoint is called without a bearer token. */
  publicEndpoint?: boolean
}

/**
 * Maps an error to a category. A 404 is NOT automatically "feature missing":
 *  - an explicit ENDPOINT_NOT_IMPLEMENTED / ENDPOINT_NOT_FOUND code, or HTTP 501, always means the feature is unavailable;
 *  - for endpoints documented as *planned*, a code-less 404, a 405, or a 401 that cannot be a session problem is treated as
 *    "route not implemented yet" (Spring answers missing routes with 404/405, or 401 through its secured error dispatch);
 *  - everything else, including 404 with a resource code such as DOCUMENT_NOT_FOUND, is a normal missing resource.
 */
export function categorize(error: unknown, opts: CategorizeOptions = {}): ErrorCategory {
  if (!isApiError(error)) return 'server'
  if (error.kind !== 'http') return error.kind
  if (error.code && ENDPOINT_MISSING_CODES.has(error.code)) return 'unavailable'
  if (error.status === 501) return 'unavailable'

  if (opts.planned) {
    const resourceCode = error.code !== undefined && !ENDPOINT_MISSING_CODES.has(error.code)
    if ((error.status === 404 && !resourceCode) || error.status === 405) return 'unavailable'
    if (error.status === 401 && !resourceCode && (error.sessionValid || opts.publicEndpoint)) return 'unavailable'
  }

  const status = effectiveStatus(error)
  if (status === 401) return 'auth'
  if (status === 400 || status === 422) return 'validation'
  if (status === 403) return 'forbidden'
  if (status === 404) return 'not_found'
  if (status === 405) return 'method_not_allowed'
  if (status === 409) return 'conflict'
  if (status === 429) return 'rate_limited'
  if (status === 502 || status === 504) return 'bad_gateway'
  if (status === 503) return 'service_unavailable'
  return 'server'
}

export interface NormalizedError {
  category: ErrorCategory
  code?: string
  title: string
  message: string
  retryAfterSeconds?: number
}

export const IN_DEVELOPMENT_MESSAGE = 'This feature is still in development. It will become available when the backend integration is ready.'

const COPY: Record<ErrorCategory, { title: string; message: string }> = {
  network: { title: 'Can’t reach NeuronixAI', message: 'Check your connection and try again.' },
  timeout: { title: 'That took too long', message: 'The server didn’t respond in time.' },
  aborted: { title: 'Request cancelled', message: 'The request was cancelled.' },
  malformed: { title: 'Unexpected response', message: 'The server sent a response this app couldn’t understand.' },
  unavailable: { title: 'In development', message: IN_DEVELOPMENT_MESSAGE },
  auth: { title: 'Please sign in again', message: 'Your session is no longer valid.' },
  validation: { title: 'Check your input', message: 'The server couldn’t accept that request.' },
  forbidden: { title: 'No permission', message: 'Your account isn’t allowed to do that.' },
  not_found: { title: 'Not found', message: 'That item is no longer available.' },
  method_not_allowed: { title: 'Not supported', message: 'The server doesn’t support that action.' },
  conflict: { title: 'Conflict', message: 'That conflicts with the current state. Refresh and try again.' },
  rate_limited: { title: 'Too many requests', message: 'Please wait a moment and try again.' },
  server: { title: 'Something went wrong on our side', message: 'Please try again in a moment.' },
  bad_gateway: { title: 'Service unavailable', message: 'An upstream service didn’t respond. Please try again shortly.' },
  service_unavailable: { title: 'Temporarily unavailable', message: 'The service is busy or restarting. Please try again shortly.' },
}

/** Safe, user-facing description. Server prose, stack traces, SQL or provider details are never included. */
export function normalizeError(error: unknown, opts: CategorizeOptions = {}): NormalizedError {
  const category = categorize(error, opts)
  const base = COPY[category]
  const api = isApiError(error) ? error : null
  let message = base.message
  if (category === 'rate_limited' && api?.retryAfterSeconds) message = `Please wait ${api.retryAfterSeconds} seconds and try again.`
  return { category, code: api?.code, title: base.title, message, retryAfterSeconds: api?.retryAfterSeconds }
}

/** Categories where retrying later can succeed without the user changing anything. */
export const isTransient = (c: ErrorCategory) => c === 'network' || c === 'timeout' || c === 'bad_gateway' || c === 'service_unavailable' || c === 'rate_limited'
