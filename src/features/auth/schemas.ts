import { z } from 'zod'

/** Mirrors the backend DTO constraints for usability only. Spring Boot validation is authoritative. */
const email = z.string().trim().min(1, 'Email is required').email('Enter a valid email address').max(255)
const newPassword = z.string().min(8, 'Use at least 8 characters').max(128, 'Use 128 characters or fewer')

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required'),
})

export const registerSchema = z
  .object({ email, password: newPassword, confirmPassword: z.string().min(1, 'Confirm your password') })
  .refine((v) => v.password === v.confirmPassword, { path: ['confirmPassword'], message: 'Passwords don’t match' })

export const forgotSchema = z.object({ email })

export const resetSchema = z
  .object({ password: newPassword, confirmPassword: z.string().min(1, 'Confirm your password') })
  .refine((v) => v.password === v.confirmPassword, { path: ['confirmPassword'], message: 'Passwords don’t match' })

export type LoginValues = z.infer<typeof loginSchema>
export type RegisterValues = z.infer<typeof registerSchema>
export type ForgotValues = z.infer<typeof forgotSchema>
export type ResetValues = z.infer<typeof resetSchema>
