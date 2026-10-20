import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ENDPOINTS } from '../../../api/endpoints'
import { otpSentResponse, verifyRegistrationResponse } from '../../../api/contracts/auth'
import { useApi } from '../../../api/call'
import { AuthShell } from '../components/AuthShell'
import { useAuth } from '../context/AuthContext'
import { useAuthFlow } from '../flow/AuthFlowContext'
import { OtpVerifyForm } from '../otp/OtpVerifyForm'
import { maskEmail } from '../otp/otp'

/**
 * Step 2 of OTP registration (proposed backend contract). Reachable only after the backend answered /register with a
 * pending-verification state. A session is created ONLY from a token the backend returns after verification.
 */
export default function RegisterVerifyPage() {
  const call = useApi()
  const navigate = useNavigate()
  const { startSession } = useAuth()
  const { registration, setRegistration } = useAuthFlow()
  const [completed, setCompleted] = useState(false) // stops the guard below from redirecting while we sign in / navigate
  if (!registration && !completed) return <Navigate to="/register" replace />
  const email = registration?.email ?? ''

  const verify = async (otp: string) => {
    const res = await call(ENDPOINTS.auth.verifyEmailOtp, { body: { email, otp }, schema: verifyRegistrationResponse })
    setCompleted(true)
    setRegistration(null)
    if (res.accessToken) startSession(email, res.accessToken) // guest-only route then redirects to the dashboard
    else navigate('/login', { replace: true, state: { notice: 'registered' } })
  }
  const resend = () => call(ENDPOINTS.auth.resendOtp, { body: { email, purpose: 'REGISTRATION' }, schema: otpSentResponse })

  return (
    <AuthShell
      eyebrow="VERIFY YOUR EMAIL"
      title="Enter your code"
      subtitle="Confirm your email address to finish creating your account."
      footer={<Link to="/register" onClick={() => setRegistration(null)} className="font-semibold text-violet hover:underline">Use a different email</Link>}
    >
      <OtpVerifyForm maskedEmail={registration?.maskedEmail ?? maskEmail(email)} initialCooldownSeconds={registration?.resendAfterSeconds ?? 30} verify={verify} resend={resend} submitLabel="Verify and continue" />
    </AuthShell>
  )
}
