import { describe, expect, it } from 'vitest'
import { ApiError } from './errors'
import { categorize, normalizeError, IN_DEVELOPMENT_MESSAGE } from './normalize'

const http = (status: number, extra = {}) => new ApiError('http', status, extra)

describe('categorize: status matrix on an implemented endpoint', () => {
  const cases: Array<[number, string]> = [
    [400, 'validation'], [401, 'auth'], [403, 'forbidden'], [404, 'not_found'], [405, 'method_not_allowed'], [409, 'conflict'],
    [429, 'rate_limited'], [500, 'server'], [501, 'unavailable'], [502, 'bad_gateway'], [503, 'service_unavailable'],
  ]
  it.each(cases)('HTTP %i → %s', (status, expected) => expect(categorize(http(status))).toBe(expected))
})

describe('404 handling: missing resource vs missing endpoint', () => {
  it('a code-less 404 on an implemented endpoint is a missing resource, never "in development"', () => {
    expect(categorize(http(404))).toBe('not_found')
    expect(normalizeError(http(404)).message).not.toBe(IN_DEVELOPMENT_MESSAGE)
  })
  it('a code-less 404 on a PLANNED endpoint means the route is not implemented yet', () => expect(categorize(http(404), { planned: true })).toBe('unavailable'))
  it('a resource-coded 404 on a planned endpoint is still a missing resource', () => expect(categorize(http(404, { code: 'DOCUMENT_NOT_FOUND' }), { planned: true })).toBe('not_found'))
  it('an explicit endpoint code always means unavailable', () => {
    expect(categorize(http(404, { code: 'ENDPOINT_NOT_IMPLEMENTED' }))).toBe('unavailable')
    expect(categorize(http(404, { code: 'ENDPOINT_NOT_FOUND' }))).toBe('unavailable')
  })
  it('405 on a planned endpoint is unavailable, on an implemented one it is just unsupported', () => {
    expect(categorize(http(405), { planned: true })).toBe('unavailable')
    expect(categorize(http(405))).toBe('method_not_allowed')
  })
  it('501 is always unavailable', () => expect(categorize(http(501))).toBe('unavailable'))
})

describe('401 handling', () => {
  it('a genuine 401 is an auth problem', () => expect(categorize(http(401))).toBe('auth'))
  it('a masked 401 (session proved valid) is a server error, not a logout trigger', () => expect(categorize(http(401, { sessionValid: true }))).toBe('server'))
  it('a masked 401 on a planned endpoint means the route is missing', () => expect(categorize(http(401, { sessionValid: true }), { planned: true })).toBe('unavailable'))
  it('a 401 on a planned PUBLIC endpoint means the route is missing', () => expect(categorize(http(401), { planned: true, publicEndpoint: true })).toBe('unavailable'))
  it('a coded 401 on a planned public endpoint is a real error', () => expect(categorize(http(401, { code: 'RESET_TOKEN_INVALID' }), { planned: true, publicEndpoint: true })).toBe('auth'))
})

describe('transport errors and safety', () => {
  it('maps transport kinds', () => {
    expect(categorize(new ApiError('network'))).toBe('network')
    expect(categorize(new ApiError('timeout'))).toBe('timeout')
    expect(categorize(new ApiError('malformed'))).toBe('malformed')
  })
  it('treats non-API errors as server errors', () => expect(categorize(new Error('boom'))).toBe('server'))
  it('uses the Retry-After value for 429', () => expect(normalizeError(http(429, { retryAfterSeconds: 12 })).message).toContain('12 seconds'))
  it('never leaks server prose or internals', () => {
    const n = normalizeError(http(500))
    expect(JSON.stringify(n)).not.toMatch(/exception|sql|stack|java\./i)
  })
})
