import { describe, expect, it } from 'vitest'
import { DEFAULT_PREFERENCES, sanitizePreferences } from './preferences'

describe('sanitizePreferences', () => {
  it('keeps known values', () => expect(sanitizePreferences({ motion: 'reduce', textSize: 'large' })).toEqual({ motion: 'reduce', textSize: 'large', onDeviceVoice: false }))
  it('only accepts a real boolean for voice consent', () => {
    expect(sanitizePreferences({ onDeviceVoice: true }).onDeviceVoice).toBe(true)
    expect(sanitizePreferences({ onDeviceVoice: 'true' }).onDeviceVoice).toBe(false)
  })
  it('falls back to defaults for tampered or malformed storage', () => {
    expect(sanitizePreferences({ motion: '<script>', textSize: 99 })).toEqual(DEFAULT_PREFERENCES)
    expect(sanitizePreferences(null)).toEqual(DEFAULT_PREFERENCES)
    expect(sanitizePreferences('x')).toEqual(DEFAULT_PREFERENCES)
  })
})
