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

describe('apiRequest error and retry behaviour', () => {
  it('keeps only a stable error code from JSON error bodies and drops prose', async () => {
    stub(async () => new Response(JSON.stringify({ code: 'DOCUMENT_NOT_FOUND', message: 'java.lang.NullPointerException at com.x', trace: 'secret' }), { status: 404 }))
    const err = (await apiRequest('GET', '/x').catch((e: unknown) => e)) as ApiError
    expect(err.status).toBe(404)
    expect(err.code).toBe('DOCUMENT_NOT_FOUND')
    expect(JSON.stringify(err)).not.toContain('NullPointer')
  })
  it('ignores malformed codes and non-JSON error bodies', async () => {
    stub(async () => new Response('<html>Whitelabel Error Page</html>', { status: 500 }))
    const err = (await apiRequest('POST', '/x').catch((e: unknown) => e)) as ApiError
    expect(err.code).toBeUndefined()
    stub(async () => new Response(JSON.stringify({ code: 'bad code!' }), { status: 400 }))
    expect(((await apiRequest('POST', '/x').catch((e: unknown) => e)) as ApiError).code).toBeUndefined()
  })
  it('reads Retry-After on 429', async () => {
    stub(async () => new Response('{}', { status: 429, headers: { 'Retry-After': '30' } }))
    expect(((await apiRequest('POST', '/x').catch((e: unknown) => e)) as ApiError).retryAfterSeconds).toBe(30)
  })
  it('retries idempotent GETs on 503 and then succeeds', async () => {
    let n = 0
    const f = stub(async () => (++n < 3 ? new Response('', { status: 503 }) : new Response('{"ok":1}')))
    expect(await apiRequest('GET', '/x')).toEqual({ ok: 1 })
    expect(f).toHaveBeenCalledTimes(3)
  })
  it('never retries writes', async () => {
    const f = stub(async () => new Response('', { status: 503 }))
    await apiRequest('POST', '/x').catch(() => undefined)
    expect(f).toHaveBeenCalledTimes(1)
  })
  it('appends query parameters without leaking them into errors', async () => {
    const f = stub(async () => new Response('', { status: 500 }))
    const err = (await apiRequest('GET', '/ask', { query: { question: 'secret question', topK: 5 } }).catch((e: unknown) => e)) as ApiError
    expect(f.mock.calls[0][0]).toContain('question=secret+question')
    expect(err.message).toBe('HTTP 500')
  })
})
