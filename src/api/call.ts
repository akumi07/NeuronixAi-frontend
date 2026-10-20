import { useCallback } from 'react'
import type { ZodType } from 'zod'
import { apiRequest } from '../features/auth/api/httpClient'
import { useAuth, type AuthedRequest } from '../features/auth/context/AuthContext'
import { markUnavailable } from './availability'
import type { Endpoint } from './endpoints'
import { ApiError } from './errors'
import { categorize } from './normalize'

export interface CallOptions<P, R> {
  params?: P
  body?: unknown
  query?: Record<string, string | number | undefined>
  signal?: AbortSignal
  /** Validates the response shape. A mismatch becomes ApiError('malformed') instead of crashing the UI. */
  schema?: ZodType<R>
}

type Requester = <T>(method: Endpoint['method'], path: string, o?: { body?: unknown; timeoutMs?: number; signal?: AbortSignal; query?: Record<string, string | number | undefined> }) => Promise<T>

/**
 * Calls a registered endpoint:
 *  - picks the public or authenticated requester from the endpoint descriptor,
 *  - validates the response with the supplied zod schema,
 *  - for *proposed* endpoints, records confirmed "route not implemented" results so the UI stops re-sending the request.
 */
export async function callEndpoint<P, R>(requester: Requester, endpoint: Endpoint<P>, options: CallOptions<P, R> = {}): Promise<R> {
  let raw: unknown
  try {
    raw = await requester<unknown>(endpoint.method, endpoint.path(options.params as P), {
      body: options.body,
      query: options.query,
      signal: options.signal,
      timeoutMs: endpoint.timeoutMs,
    })
  } catch (e) {
    if (endpoint.status === 'proposed' && endpoint.feature && categorize(e, { planned: true, publicEndpoint: endpoint.auth === 'public' }) === 'unavailable') {
      markUnavailable(endpoint.feature)
    }
    throw e
  }
  if (!options.schema) return raw as R
  const parsed = options.schema.safeParse(raw)
  if (!parsed.success) throw new ApiError('malformed')
  return parsed.data
}

/** React access to the contract-aware client. Public endpoints never receive the bearer token. */
export function useApi() {
  const { authedRequest } = useAuth()
  return useCallback(<P, R>(endpoint: Endpoint<P>, options?: CallOptions<P, R>) => {
    const requester: Requester = endpoint.auth === 'bearer'
      ? (authedRequest as AuthedRequest as unknown as Requester)
      : (((method, path, o) => apiRequest(method, path, o)) as Requester)
    return callEndpoint(requester, endpoint, options)
  }, [authedRequest])
}

/** Validates data that did not come through callEndpoint (e.g. uploads). A mismatch is a handled 'malformed' error. */
export function parseResponse<R>(schema: ZodType<R>, raw: unknown): R {
  const parsed = schema.safeParse(raw)
  if (!parsed.success) throw new ApiError('malformed')
  return parsed.data
}
