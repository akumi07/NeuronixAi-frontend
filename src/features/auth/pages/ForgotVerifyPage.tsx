import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useApi } from '../../../api/call'
import { otpSentResponse, verifyResetOtpResponse } from '../../../api/contracts/auth'
import { ENDPOINTS } from '../../../api/endpoints'
import { AuthShell } from '../components/AuthShell'
import { useAuthFlow } from '../flow/AuthFlowContext'
import { OtpVerifyForm } from '../otp/OtpVerifyForm'
import { maskEmail } from '../otp/otp'

/** Step 2 of OTP password recovery. On success the backend issues a short-lived reset token, which is held in memory only. */
export default function ForgotVerifyPage() {
  const call = useApi()
  const navigate = useNavigate()
  const { reset, setReset } = useAuthFlow()
  if (!reset) return <Navigate to="/forgot-password" replace />
  const { email } = reset

  const verify = async (otp: string) => {
    const res = await call(ENDPOINTS.auth.forgotVerifyOtp, { body: { email, otp }, schema: verifyResetOtpResponse })
    setReset({ email, stage: 'verified', resetToken: res.resetToken })
    navigate('/reset-password')
  }
  const resend = () => call(ENDPOINTS.auth.resendOtp, { body: { email, purpose: 'PASSWORD_RESET' }, schema: otpSentResponse })

  return (
    <AuthShell
      eyebrow="ACCOUNT RECOVERY"
      title="Check your email"
      subtitle="If an account exists for this email address, we’ll send a verification code."
      footer={<Link to="/forgot-password" onClick={() => setReset(null)} className="font-semibold text-violet hover:underline">Use a different email</Link>}
    >
      <OtpVerifyForm maskedEmail={maskEmail(email)} initialCooldownSeconds={reset.resendAfterSeconds ?? 30} verify={verify} resend={resend} />
    </AuthShell>
  )
}
