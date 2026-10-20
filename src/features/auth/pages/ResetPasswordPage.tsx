import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useApi } from '../../../api/call'
import { ENDPOINTS } from '../../../api/endpoints'
import { effectiveStatus, isApiError } from '../../../api/errors'
import { describeFailure, type Failure } from '../../dashboard/api/failures'
import { ErrorNotice } from '../../dashboard/components/StateViews'
import { AuthShell } from '../components/AuthShell'
import { PasswordRequirements } from '../components/PasswordRequirements'
import { PasswordField, SubmitButton } from '../components/FormControls'
import { useAuthFlow } from '../flow/AuthFlowContext'
import { resetSchema, type ResetValues } from '../schemas'

const EXPIRED: Failure = { title: 'Reset session expired or invalid', message: 'Your verification is no longer valid. Start the reset again.', category: 'auth' }

/**
 * Step 3 of OTP password recovery (proposed backend contract). Requires the reset token issued after OTP verification;
 * an ordinary access token is never used here. On success the user is sent to the login page.
 */
export default function ResetPasswordPage() {
  const call = useApi()
  const navigate = useNavigate()
  const { reset, setReset } = useAuthFlow()
  const [failure, setFailure] = useState<Failure | null>(null)
  const [completed, setCompleted] = useState(false) // stops the guard below from redirecting while we navigate to /login
  const { register, handleSubmit, control, resetField, formState: { errors, isSubmitting } } = useForm<ResetValues>({ resolver: zodResolver(resetSchema) })
  const newPassword = useWatch({ control, name: 'password' })

  if (!completed && (!reset || reset.stage !== 'verified' || !reset.resetToken)) return <Navigate to="/forgot-password" replace />
  const resetToken = reset?.resetToken ?? ''

  const restart = () => { setReset(null); navigate('/forgot-password', { replace: true }) }

  const onSubmit = handleSubmit(async ({ password, confirmPassword }) => {
    setFailure(null)
    try {
      await call(ENDPOINTS.auth.forgotReset, { body: { resetToken, newPassword: password, confirmPassword } })
      setCompleted(true)
      setReset(null)
      navigate('/login', { replace: true, state: { notice: 'password-reset' } })
    } catch (e) {
      resetField('password'); resetField('confirmPassword')
      const code = isApiError(e) ? e.code : undefined
      const status = isApiError(e) && e.kind === 'http' ? effectiveStatus(e) : 0
      if (code === 'RESET_TOKEN_EXPIRED' || code === 'RESET_TOKEN_INVALID' || status === 410 || (status === 401 && code)) setFailure(EXPIRED)
      else if (code === 'PASSWORD_POLICY_VIOLATION' || status === 400) setFailure({ title: 'Password not accepted', message: 'Choose a different password that meets the requirements.', category: 'validation' })
      else setFailure(describeFailure(e, { planned: true, publicEndpoint: true }))
    }
  })

  const expired = failure === EXPIRED
  return (
    <AuthShell
      eyebrow="ACCOUNT RECOVERY"
      title="Choose a new password"
      subtitle="You’ll sign in with it right after."
      footer={<Link to="/login" className="font-semibold text-violet hover:underline">Back to sign in</Link>}
    >
      {failure && <ErrorNotice failure={failure} />}
      {expired ? (
        <button type="button" onClick={restart} className="font-semibold text-violet underline">Start over</button>
      ) : (
        <form method="post" noValidate onSubmit={onSubmit} className="space-y-5">
          <PasswordField label="New password" autoComplete="new-password" error={errors.password?.message} {...register('password')} />
          <PasswordRequirements password={newPassword ?? ''} />
          <PasswordField label="Confirm new password" autoComplete="new-password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
          <SubmitButton loading={isSubmitting}>{isSubmitting ? 'Updating…' : 'Update password'}</SubmitButton>
        </form>
      )}
    </AuthShell>
  )
}
