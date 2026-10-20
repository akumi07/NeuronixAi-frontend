import { describe, expect, it } from 'vitest'
import { isCompleteOtp, maskEmail, passwordStrength, sanitizeOtp, setDigit } from './otp'

describe('otp helpers', () => {
  it('keeps only digits and caps at four', () => {
    expect(sanitizeOtp('1 2-3a4')).toBe('1234')
    expect(sanitizeOtp('123456')).toBe('1234')
    expect(sanitizeOtp('abc')).toBe('')
  })
  it('requires exactly four digits', () => {
    expect(isCompleteOtp('1234')).toBe(true)
    expect(isCompleteOtp('123')).toBe(false)
    expect(isCompleteOtp('12a4')).toBe(false)
  })
  it('sets and clears individual digits', () => {
    expect(setDigit('', 0, '5')).toBe('5')
    expect(setDigit('123', 1, '9')).toBe('193')
    expect(setDigit('1234', 3, '')).toBe('123')
    expect(setDigit('12', 0, 'x')).toBe('2')
  })
  it('masks emails for display', () => {
    expect(maskEmail('user@example.com')).toBe('u***@example.com')
    expect(maskEmail('a@b.co')).toMatch(/^a\*+@b\.co$/)
    expect(maskEmail('not-an-email')).toBe('not-an-email')
  })
  it('gives guidance, not enforcement', () => {
    expect(passwordStrength('').level).toBe(0)
    expect(passwordStrength('short').label).toBe('Too short')
    expect(passwordStrength('LongEnough123!').level).toBeGreaterThanOrEqual(3)
  })
})
