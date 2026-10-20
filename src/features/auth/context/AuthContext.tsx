import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { authApi } from '../api/authApi'
import { ApiError, apiRequest, apiUpload, type HttpMethod } from '../api/httpClient'
import { readTokenExpiryMs } from '../api/jwtExpiry'
import { clearHandoffDraft } from '../../../lib/handoffDraft'
import { clearHeldExecution } from '../../../lib/executionHandoff'
import { clearSelectedDocuments } from '../../../lib/documentSelection'
import { clearAllAvailability } from '../../../api/availability'

/** Everything private or session-specific that lives outside React state. */
const clearPrivateMemory = () => { clearHandoffDraft(); clearHeldExecution(); clearSelectedDocuments(); clearAllAvailability() }

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
  options?: { body?: unknown; timeoutMs?: number; signal?: AbortSignal; query?: Record<string, string | number | undefined> },
) => Promise<T>

export type RegisterOutcome =
  | { kind: 'signedIn' }
  | { kind: 'pendingVerification'; maskedEmail?: string; resendAvailableInSeconds?: number }

export type AuthedUpload = <T>(path: string, form: FormData, options?: { signal?: AbortSignal; onProgress?: (fraction: number) => void; timeoutMs?: number }) => Promise<T>

interface AuthContextValue {
  /** Multipart upload with progress; same session handling as authedRequest. */
  authedUpload: AuthedUpload
  /** Sends a request with the in-memory bearer token. A 401 signs the user out only if the token is truly rejected. */
  authedRequest: AuthedRequest
  email: string | null
  isAuthenticated: boolean
  /** True when the last sign-out was caused by token expiry. */
  sessionExpired: boolean
  login: (email: string, password: string) => Promise<void>
  /** Current backend: signs in immediately. OTP-enabled backend: returns pendingVerification and creates no session. */
  register: (email: string, password: string) => Promise<RegisterOutcome>
  /** Adopts an access token issued by the backend after a verified flow (e.g. OTP registration). */
  startSession: (email: string, accessToken: string) => void
  logout: () => Promise<void>
  clearSessionExpired: () => void
}

const SESSION_PROBE_PATH = '/api/v1/users/me'

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [sessionExpired, setSessionExpired] = useState(false)

  const login = useCallback(async (email: string, password: string) => {
    const { accessToken } = await authApi.login(email, password)
    setSessionExpired(false)
    setSession({ token: accessToken, email })
  }, [])

  const register = useCallback(async (email: string, password: string): Promise<RegisterOutcome> => {
    const res = await authApi.register(email, password)
    if ('accessToken' in res) {
      setSessionExpired(false)
      setSession({ token: res.accessToken, email })
      return { kind: 'signedIn' }
    }
    return { kind: 'pendingVerification', maskedEmail: res.maskedEmail, resendAvailableInSeconds: res.resendAvailableInSeconds }
  }, [])

  const startSession = useCallback((email: string, accessToken: string) => {
    setSessionExpired(false)
    setSession({ token: accessToken, email })
  }, [])

  const logout = useCallback(async () => {
    const current = session
    setSession(null) // always sign out locally, even if the network call fails
    setSessionExpired(false)
    clearPrivateMemory()
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
   * server-side failures (e.g. a rejected or oversized upload, a storage error, a missing route) can surface as 401. So on a 401
   * we ask the backend whether the token is still accepted (GET /users/me) and only sign out if it is not.
   */
  const guarded = useCallback(
    async <T,>(run: (token: string) => Promise<T>): Promise<T> => {
      if (!session) throw new ApiError('http', 401)
      const is401 = (e: unknown) => e instanceof ApiError && e.kind === 'http' && e.status === 401
      const endSession = () => { setSession(null); clearPrivateMemory(); setSessionExpired(true) }
      try {
        return await run(session.token)
      } catch (e) {
        if (!is401(e)) throw e
        if (e instanceof ApiError && e.sessionValid) throw e
        try {
          await apiRequest('GET', SESSION_PROBE_PATH, { bearer: session.token })
        } catch (probeError) {
          if (is401(probeError)) { endSession(); throw e }
          throw new ApiError('network') // couldn't verify the session; don't sign out on a guess
        }
        // The token is still valid, so this 401 did not come from the session (Spring masks server errors and missing routes as 401).
        throw new ApiError('http', 401, { code: (e as ApiError).code, sessionValid: true })
      }
    },
    [session],
  )

  const authedRequest = useCallback<AuthedRequest>(
    (method, path, options) => guarded((token) => apiRequest(method, path, { ...options, bearer: token })),
    [guarded],
  )
  // The probe itself must not recurse: a 401 on /users/me means the session is really invalid.
  const authedUpload = useCallback<AuthedUpload>(
    (path, form, options) => guarded((token) => apiUpload(path, form, { ...options, bearer: token })),
    [guarded],
  )

  const clearSessionExpired = useCallback(() => setSessionExpired(false), [])

  // Sign out when the token's own expiry passes so the UI never pretends to be signed in.
  useEffect(() => {
    if (!session) return
    const expiresAt = readTokenExpiryMs(session.token)
    if (!expiresAt) return
    const delay = Math.min(Math.max(expiresAt - Date.now(), 0), 2 ** 31 - 1)
    const id = window.setTimeout(() => {
      setSession(null)
        clearPrivateMemory()
      setSessionExpired(true)
    }, delay)
    return () => window.clearTimeout(id)
  }, [session])

  const value = useMemo<AuthContextValue>(
    () => ({
      authedRequest,
      authedUpload,
      email: session?.email ?? null,
      isAuthenticated: session !== null,
      sessionExpired,
      login,
      register,
      startSession,
      logout,
      clearSessionExpired,
    }),
    [authedRequest, authedUpload, session, sessionExpired, login, register, startSession, logout, clearSessionExpired],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
