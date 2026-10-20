import { describe, expect, it } from 'vitest'
import { describeAuthFailure } from './authErrors'
import { ApiError } from './httpClient'

const http = (s: number) => new ApiError('http', s)

describe('describeAuthFailure', () => {
  it('uses one generic login message for 400/401/403', () => {
    const msgs = [400, 401, 403].map((s) => describeAuthFailure(http(s), 'login').message)
    expect(new Set(msgs).size).toBe(1)
    expect(msgs[0]).toBe('Invalid email or password.')
  })
  it('does not reveal whether an email is registered', () => {
    expect(describeAuthFailure(http(409), 'register').message.toLowerCase()).not.toContain('already registered')
    expect(describeAuthFailure(http(404), 'forgot').message.toLowerCase()).not.toContain('not found')
  })
  it('offers a restart for expired reset sessions', () => expect(describeAuthFailure(http(500), 'reset').recoverable).toBe('restart-reset'))
  it('maps transport failures', () => {
    expect(describeAuthFailure(new ApiError('network'), 'login').title).toMatch(/reach/i)
    expect(describeAuthFailure(new ApiError('timeout'), 'login').title).toMatch(/too long/i)
  })
  it('never echoes server-supplied text', () => expect(new ApiError('http', 500).message).toBe('HTTP 500'))
})
