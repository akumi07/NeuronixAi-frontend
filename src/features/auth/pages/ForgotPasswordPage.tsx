import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { useApi } from '../../../api/call'
import { otpSentResponse } from '../../../api/contracts/auth'
import { ENDPOINTS } from '../../../api/endpoints'
import type { Failure } from '../../dashboard/api/failures'
import { ErrorNotice } from '../../dashboard/components/StateViews'
import { AuthShell } from '../components/AuthShell'
import { SubmitButton, TextField } from '../components/FormControls'
import { useAuthFlow } from '../flow/AuthFlowContext'
import { describeOtpFailure } from '../otp/otpErrors'
import { forgotSchema, type ForgotValues } from '../schemas'

/** Step 1 of OTP password recovery (proposed backend contract). Never reveals whether the account exists. */
export default function ForgotPasswordPage() {
  const call = useApi()
  const navigate = useNavigate()
  const { setReset } = useAuthFlow()
  const [failure, setFailure] = useState<Failure | null>(null)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotValues>({ resolver: zodResolver(forgotSchema) })

  const onSubmit = handleSubmit(async ({ email }) => {
    setFailure(null)
    const proceed = (resendAfterSeconds?: number) => { setReset({ email, stage: 'requested', resendAfterSeconds }); navigate('/forgot-password/verify') }
    try {
      const res = await call(ENDPOINTS.auth.forgotRequest, { body: { email }, schema: otpSentResponse })
      proceed(res.resendAvailableInSeconds)
    } catch (e) {
      const f = describeOtpFailure(e, 'request')
      // A resource-style 404 ("no such account") must look identical to success so accounts can't be enumerated.
      if (f.category === 'not_found') { proceed(); return }
      setFailure(f)
    }
  })

  return (
    <AuthShell
      eyebrow="ACCOUNT RECOVERY"
      title="Reset your password"
      subtitle="Enter your email and we’ll send a 4-digit verification code."
      footer={<Link to="/login" className="font-semibold text-violet hover:underline">Back to sign in</Link>}
    >
      {failure && <ErrorNotice failure={failure} />}
      <form method="post" noValidate onSubmit={onSubmit} className="space-y-5">
        <TextField label="Email" type="email" autoComplete="username" inputMode="email" autoCapitalize="off" spellCheck={false} error={errors.email?.message} {...register('email')} />
        <SubmitButton loading={isSubmitting}>{isSubmitting ? 'Sending…' : 'Send code'}</SubmitButton>
      </form>
    </AuthShell>
  )
}
