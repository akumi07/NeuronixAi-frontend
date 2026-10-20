import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, apiRequest } from './httpClient'

afterEach(() => vi.unstubAllGlobals())

const stub = (impl: (url: string, init: RequestInit) => Promise<Response>) => {
  const fn = vi.fn(impl)
  vi.stubGlobal('fetch', fn)
  return fn
}

describe('apiRequest', () => {
  it('sends the bearer token, omits cookies, and disables caching', async () => {
    const f = stub(async () => new Response('{"ok":true}'))
    await apiRequest('GET', '/api/v1/x', { bearer: 'tok' })
    const init = f.mock.calls[0][1]
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer tok')
    expect(init.credentials).toBe('omit')
    expect(init.cache).toBe('no-store')
    expect(init.referrerPolicy).toBe('no-referrer')
  })
  it('lets the browser set the multipart content type for FormData', async () => {
    const f = stub(async () => new Response('{}'))
    await apiRequest('POST', '/api/v1/documents', { body: new FormData() })
    expect((f.mock.calls[0][1].headers as Record<string, string>)['Content-Type']).toBeUndefined()
  })
  it('turns HTTP failures into ApiError without server text', async () => {
    stub(async () => new Response('secret stack trace', { status: 500 }))
    const err = (await apiRequest('GET', '/x').catch((e: unknown) => e)) as ApiError
    expect(err).toBeInstanceOf(ApiError)
    expect(err.status).toBe(500)
    expect(err.message).not.toContain('secret')
  })
  it('classifies network failures and does not fall back to fake data', async () => {
    stub(async () => { throw new TypeError('failed') })
    await expect(apiRequest('GET', '/x')).rejects.toMatchObject({ kind: 'network' })
  })
  it('returns plain-text bodies as strings', async () => {
    stub(async () => new Response('Logged out successfully'))
    expect(await apiRequest('POST', '/x')).toBe('Logged out successfully')
  })
})
