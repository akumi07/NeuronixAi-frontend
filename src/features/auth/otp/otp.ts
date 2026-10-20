import { OTP_LENGTH } from '../../../api/contracts/auth'

/** Keeps digits only and caps the length. Used for typing and pasting ("1 2-3 4" → "1234"). */
export const sanitizeOtp = (raw: string): string => raw.replace(/\D/g, '').slice(0, OTP_LENGTH)

export const isCompleteOtp = (value: string): boolean => new RegExp(`^\\d{${OTP_LENGTH}}$`).test(value)

/** Sets the digit at `index` (or clears it when `digit` is empty) and returns the new code string. */
export function setDigit(value: string, index: number, digit: string): string {
  const cells = Array.from({ length: OTP_LENGTH }, (_, i) => value[i] ?? '')
  cells[index] = sanitizeOtp(digit).slice(0, 1)
  // Trim trailing empty cells but keep inner gaps as spaces-free by rebuilding from left to right.
  return cells.join('').replace(/\s/g, '')
}

/** "user@example.com" → "u***@example.com". Used only for display. */
export function maskEmail(email: string): string {
  const at = email.lastIndexOf('@')
  if (at < 1) return email
  const local = email.slice(0, at)
  return `${local[0]}${'*'.repeat(Math.max(2, Math.min(local.length - 1, 6)))}${email.slice(at)}`
}

export type StrengthLevel = 0 | 1 | 2 | 3 | 4
/** Usability guidance only; the backend enforces the real password policy (currently: at least 8 characters). */
export function passwordStrength(password: string): { level: StrengthLevel; label: string } {
  if (!password) return { level: 0, label: '' }
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
  if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) score++
  const level = (password.length < 8 ? 1 : Math.max(2, score)) as StrengthLevel
  return { level, label: ['', 'Too short', 'Fair', 'Good', 'Strong'][level] }
}
