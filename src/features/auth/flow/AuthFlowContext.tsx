import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

/**
 * In-memory state shared between the multi-screen sign-up and password-recovery flows. It is never written to storage or the URL.
 * Holding a value here is NOT proof of verification: the backend must re-check OTPs and reset tokens on every call.
 */
export interface RegistrationFlow { email: string; maskedEmail?: string; resendAfterSeconds?: number }
export interface ResetFlow {
  email: string
  stage: 'requested' | 'verified'
  /** Short-lived, single-use, purpose-specific token issued by the backend after the OTP is verified. Not an access token. */
  resetToken?: string
  resendAfterSeconds?: number
}

interface AuthFlowValue {
  registration: RegistrationFlow | null
  reset: ResetFlow | null
  setRegistration: (v: RegistrationFlow | null) => void
  setReset: (v: ResetFlow | null) => void
  clearAll: () => void
}

const Ctx = createContext<AuthFlowValue | null>(null)

export function AuthFlowProvider({ children }: { children: ReactNode }) {
  const [registration, setRegistration] = useState<RegistrationFlow | null>(null)
  const [reset, setReset] = useState<ResetFlow | null>(null)
  const clearAll = useCallback(() => { setRegistration(null); setReset(null) }, [])
  const value = useMemo(() => ({ registration, reset, setRegistration, setReset, clearAll }), [registration, reset, clearAll])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuthFlow() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useAuthFlow must be used within AuthFlowProvider')
  return v
}
