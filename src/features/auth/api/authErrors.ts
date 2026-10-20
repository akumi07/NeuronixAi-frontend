import { ApiError } from './httpClient'

export type AuthAction = 'login' | 'register' | 'forgot' | 'reset'

export interface AuthFailure {
  title: string
  message: string
  /** Offer a "start over" path (used when a reset session is invalid or expired). */
  recoverable?: 'restart-reset'
}

const NETWORK: AuthFailure = {
  title: 'Can’t reach NeuronixAI',
  message: 'Check your connection and try again.',
}
const TIMEOUT: AuthFailure = {
  title: 'That took too long',
  message: 'The server didn’t respond in time. Please try again.',
}
const RATE: AuthFailure = {
  title: 'Too many attempts',
  message: 'Please wait a little while before trying again.',
}
const SERVER: AuthFailure = {
  title: 'Something went wrong on our side',
  message: 'Please try again in a moment.',
}

/**
 * Maps transport/HTTP failures to safe, non-revealing copy. Server-supplied messages are never
 * displayed, so the UI cannot leak account existence beyond what the status code itself implies.
 */
export function describeAuthFailure(error: unknown, action: AuthAction): AuthFailure {
  if (!(error instanceof ApiError)) return SERVER
  if (error.kind === 'network') return NETWORK
  if (error.kind === 'timeout') return TIMEOUT
  const { status } = error
  if (status === 429) return RATE

  switch (action) {
    case 'login':
      if (status === 401 || status === 403 || status === 400)
        return { title: 'Sign-in failed', message: 'Invalid email or password.' }
      break
    case 'register':
      if (status === 409 || status === 400)
        return {
          title: 'We couldn’t create that account',
          message: 'Check your details and try again, or sign in if you already have an account.',
        }
      break
    case 'forgot':
      if (status === 404 || status === 400)
        return {
          title: 'We couldn’t start a reset',
          message: 'Check the email address and try again.',
        }
      break
    case 'reset':
      // The backend has no dedicated error contract here: an expired/invalid token surfaces as 401/403/500.
      if (status === 400 || status === 401 || status === 403 || status === 500)
        return {
          title: 'Reset session expired or invalid',
          message: 'Start the reset again to get a fresh session.',
          recoverable: 'restart-reset',
        }
      break
  }
  return SERVER
}
