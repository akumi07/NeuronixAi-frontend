import { z } from 'zod'

/**
 * AUTH CONTRACTS
 *  implemented: login, register (legacy: returns an access token immediately), logout, new-password (authenticated change)
 *  proposed   : OTP registration / OTP password recovery (see docs/API_CONTRACT.md). Not implemented in the Spring Boot backend yet.
 */
export const OTP_LENGTH = 4

export const accessTokenResponse = z.object({ accessToken: z.string().min(1) })
export type AccessTokenResponse = z.infer<typeof accessTokenResponse>

/** Registration may answer with a token (current backend) or a pending-verification state (OTP flow). */
export const registerResponse = z.union([
  accessTokenResponse,
  z.object({
    status: z.string(), // e.g. PENDING_VERIFICATION
    maskedEmail: z.string().optional(),
    expiresInSeconds: z.number().optional(),
    resendAvailableInSeconds: z.number().optional(),
  }),
])
export type RegisterResponse = z.infer<typeof registerResponse>

export const otpSentResponse = z.object({
  expiresInSeconds: z.number().optional(),
  resendAvailableInSeconds: z.number().optional(),
  maskedEmail: z.string().optional(),
}).passthrough()
export type OtpSentResponse = z.infer<typeof otpSentResponse>

/** Verifying a registration OTP either signs the user in (accessToken) or confirms the account (they then log in). */
export const verifyRegistrationResponse = z.object({ accessToken: z.string().min(1).optional(), status: z.string().optional() }).passthrough()
export type VerifyRegistrationResponse = z.infer<typeof verifyRegistrationResponse>

/** A short-lived, single-use, purpose-specific token. It is NOT an access token. */
export const verifyResetOtpResponse = z.object({ resetToken: z.string().min(1), expiresInSeconds: z.number().optional() })
export type VerifyResetOtpResponse = z.infer<typeof verifyResetOtpResponse>

export type OtpPurpose = 'REGISTRATION' | 'PASSWORD_RESET'

export interface RegisterRequest { email: string; password: string }
export interface VerifyOtpRequest { email: string; otp: string }
export interface ResendOtpRequest { email: string; purpose: OtpPurpose }
export interface ForgotPasswordRequest { email: string }
export interface ResetPasswordRequest { resetToken: string; newPassword: string; confirmPassword: string }
