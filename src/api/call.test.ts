import { afterEach, describe, expect, it } from 'vitest'
import { z } from 'zod'
import { clearAllAvailability, isMarkedUnavailable } from './availability'
import { callEndpoint } from './call'
import { ENDPOINTS } from './endpoints'
import { ApiError } from './errors'

afterEach(() => clearAllAvailability())
const failing = (status: number, extra = {}) => (async () => { throw new ApiError('http', status, extra) }) as never
const returning = (value: unknown) => (async () => value) as never

describe('callEndpoint', () => {
  it('records a confirmed-unavailable planned feature (and rethrows)', async () => {
    await expect(callEndpoint(failing(404), ENDPOINTS.orchestrations.start)).rejects.toBeInstanceOf(ApiError)
    expect(isMarkedUnavailable('orchestration')).toBe(true)
  })
  it('does not mark a feature unavailable for a real resource 404', async () => {
    await expect(callEndpoint(failing(404, { code: 'DOCUMENT_NOT_FOUND' }), ENDPOINTS.documents.ask, { params: '1' })).rejects.toBeInstanceOf(ApiError)
    expect(isMarkedUnavailable('documentQa')).toBe(false)
  })
  it('does not mark anything for failures like 500/503/network', async () => {
    await expect(callEndpoint(failing(500), ENDPOINTS.orchestrations.start)).rejects.toBeTruthy()
    await expect(callEndpoint(failing(503), ENDPOINTS.orchestrations.start)).rejects.toBeTruthy()
    expect(isMarkedUnavailable('orchestration')).toBe(false)
  })
  it('never marks implemented endpoints unavailable', async () => {
    await expect(callEndpoint(failing(404), ENDPOINTS.users.me)).rejects.toBeTruthy()
    expect(isMarkedUnavailable('orchestration')).toBe(false)
  })
  it('turns a malformed payload into a handled error', async () => {
    await expect(callEndpoint(returning({ nope: 1 }), ENDPOINTS.users.me, { schema: z.object({ id: z.number() }) })).rejects.toMatchObject({ kind: 'malformed' })
  })
  it('returns validated data', async () => {
    expect(await callEndpoint(returning({ id: 7 }), ENDPOINTS.users.me, { schema: z.object({ id: z.number() }) })).toEqual({ id: 7 })
  })
  it('builds paths from params and marks the right feature', async () => {
    expect(ENDPOINTS.documents.ask.path('12')).toBe('/api/v1/documents/12/ask')
    expect(ENDPOINTS.conversations.executions.path(5)).toBe('/api/v1/conversations/5/executions')
    expect(ENDPOINTS.orchestrations.get.path('a/b')).toBe('/api/v1/orchestrations/a%2Fb')
  })
})
