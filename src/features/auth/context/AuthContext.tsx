import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { authApi } from '../api/authApi'
import { ApiError, apiRequest, type HttpMethod } from '../api/httpClient'
import { readTokenExpiryMs } from '../api/jwtExpiry'

/**
 * Session state lives in memory only: the backend issues a 24h bearer JWT with no refresh endpoint,
 * and we deliberately do not persist it to localStorage/sessionStorage. A full page reload therefore
 * signs the user out (documented trade-off; see docs/AUTHENTICATION.md).
 *
 * The password-reset credential is held separately and never placed in a URL.
 */
interface Session {
  token: string
  email: string
}

export type AuthedRequest = <T>(
  method: HttpMethod,
  path: string,
  options?: { body?: unknown; timeoutMs?: number; signal?: AbortSignal },
) => Promise<T>

interface AuthContextValue {
  /** Sends a request with the in-memory bearer token. A 401 signs the user out (expired/revoked session). */
  authedRequest: AuthedRequest
  email: string | null
  isAuthenticated: boolean
  /** True when the last sign-out was caused by token expiry. */
  sessionExpired: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  clearSessionExpired: () => void
  /** Starts a reset; the returned credential is stored in memory for the reset step. */
  requestPasswordReset: (email: string) => Promise<void>
  hasResetSession: boolean
  completePasswordReset: (newPassword: string) => Promise<void>
  discardResetSession: () => void
}

const SESSION_PROBE_PATH = '/api/v1/users/me'

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [sessionExpired, setSessionExpired] = useState(false)
  const [resetToken, setResetToken] = useState<string | null>(null)

  const login = useCallback(async (email: string, password: string) => {
    const { accessToken } = await authApi.login(email, password)
    setSessionExpired(false)
    setSession({ token: accessToken, email })
  }, [])

  const register = useCallback(async (email: string, password: string) => {
    const { accessToken } = await authApi.register(email, password)
    setSessionExpired(false)
    setSession({ token: accessToken, email })
  }, [])

  const logout = useCallback(async () => {
    const current = session
    setSession(null) // always sign out locally, even if the network call fails
    setSessionExpired(false)
    if (current) {
      try {
        await authApi.logout(current.token)
      } catch {
        /* best effort: the token expires on its own */
      }
    }
  }, [session])

  /**
   * A 401 does not always mean the session ended: with Spring Security's secured /error dispatch, ordinary
   * server-side failures (e.g. a rejected or oversized upload, a storage error) can surface as 401. So on a 401
   * we ask the backend whether the token is still accepted (GET /users/me) and only sign out if it is not.
   */
  const authedRequest = useCallback<AuthedRequest>(
    async (method, path, options) => {
      if (!session) throw new ApiError('http', 401)
      const is401 = (e: unknown) => e instanceof ApiError && e.kind === 'http' && e.status === 401
      const endSession = () => { setSession(null); setSessionExpired(true) }
      try {
        return await apiRequest(method, path, { ...options, bearer: session.token })
      } catch (e) {
        if (!is401(e)) throw e
        if (path === SESSION_PROBE_PATH) { endSession(); throw e }
        try {
          await apiRequest('GET', SESSION_PROBE_PATH, { bearer: session.token })
        } catch (probeError) {
          if (is401(probeError)) { endSession(); throw e }
          throw new ApiError('http', 500) // couldn't verify the session; don't sign out on a guess
        }
        throw new ApiError('http', 500) // token is still valid: the 401 masked a server-side failure
      }
    },
    [session],
  )

  const requestPasswordReset = useCallback(async (email: string) => {
    const { accessToken } = await authApi.forgetPassword(email)
    setResetToken(accessToken)
  }, [])

  const completePasswordReset = useCallback(
    async (newPassword: string) => {
      if (!resetToken) throw new Error('no reset session')
      await authApi.newPassword(resetToken, newPassword)
      setResetToken(null)
    },
    [resetToken],
  )

  const discardResetSession = useCallback(() => setResetToken(null), [])
  const clearSessionExpired = useCallback(() => setSessionExpired(false), [])

  // Sign out when the token's own expiry passes so the UI never pretends to be signed in.
  useEffect(() => {
    if (!session) return
    const expiresAt = readTokenExpiryMs(session.token)
    if (!expiresAt) return
    const delay = Math.min(Math.max(expiresAt - Date.now(), 0), 2 ** 31 - 1)
    const id = window.setTimeout(() => {
      setSession(null)
      setSessionExpired(true)
    }, delay)
    return () => window.clearTimeout(id)
  }, [session])

  const value = useMemo<AuthContextValue>(
    () => ({
      authedRequest,
      email: session?.email ?? null,
      isAuthenticated: session !== null,
      sessionExpired,
      login,
      register,
      logout,
      clearSessionExpired,
      requestPasswordReset,
      hasResetSession: resetToken !== null,
      completePasswordReset,
      discardResetSession,
    }),
    [authedRequest, session, sessionExpired, resetToken, login, register, logout, clearSessionExpired, requestPasswordReset, completePasswordReset, discardResetSession],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
