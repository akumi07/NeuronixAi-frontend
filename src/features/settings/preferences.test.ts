import { describe, expect, it } from 'vitest'
import { DEFAULT_PREFERENCES, sanitizePreferences } from './preferences'

describe('sanitizePreferences', () => {
  it('keeps known values', () => expect(sanitizePreferences({ motion: 'reduce', textSize: 'large' })).toEqual({ motion: 'reduce', textSize: 'large' }))
  it('falls back to defaults for tampered or malformed storage', () => {
    expect(sanitizePreferences({ motion: '<script>', textSize: 99 })).toEqual(DEFAULT_PREFERENCES)
    expect(sanitizePreferences(null)).toEqual(DEFAULT_PREFERENCES)
    expect(sanitizePreferences('x')).toEqual(DEFAULT_PREFERENCES)
  })
})
