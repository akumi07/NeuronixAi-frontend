import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { AuthShell } from '../components/AuthShell'
import { FormAlert, PasswordField, SubmitButton } from '../components/FormControls'
import { describeAuthFailure, type AuthFailure } from '../api/authErrors'
import { useAuth } from '../context/AuthContext'
import { resetSchema, type ResetValues } from '../schemas'

export default function ResetPasswordPage() {
  const { hasResetSession, completePasswordReset, discardResetSession } = useAuth()
  const navigate = useNavigate()
  const [failure, setFailure] = useState<AuthFailure | null>(null)
  const {
    register,
    handleSubmit,
    resetField,
    formState: { errors, isSubmitting },
  } = useForm<ResetValues>({ resolver: zodResolver(resetSchema) })

  const restart = () => {
    discardResetSession()
    navigate('/forgot-password')
  }

  const onSubmit = handleSubmit(async ({ password }) => {
    setFailure(null)
    try {
      await completePasswordReset(password)
      navigate('/login', { replace: true, state: { notice: 'password-reset' } })
    } catch (e) {
      setFailure(describeAuthFailure(e, 'reset'))
      resetField('password')
      resetField('confirmPassword')
    }
  })

  return (
    <AuthShell
      eyebrow="ACCOUNT RECOVERY"
      title="Choose a new password"
      subtitle="Use at least 8 characters. You’ll sign in with it right after."
      footer={<Link to="/login" className="font-semibold text-violet hover:underline">Back to sign in</Link>}
    >
      {!hasResetSession && !failure ? (
        <>
          <FormAlert tone="info" title="No active reset">Start a password reset first, then come back here.</FormAlert>
          <Link to="/forgot-password" className="inline-block font-semibold text-violet hover:underline">Start a reset</Link>
        </>
      ) : (
        <>
          {failure && (
            <FormAlert tone="error" title={failure.title}>
              {failure.message}
              {failure.recoverable === 'restart-reset' && (
                <button type="button" onClick={restart} className="mt-2 block font-semibold underline">Start over</button>
              )}
            </FormAlert>
          )}
          {!(failure?.recoverable) && (
            <form method="post" noValidate onSubmit={onSubmit} className="space-y-5">
              <PasswordField label="New password" autoComplete="new-password" hint="At least 8 characters." error={errors.password?.message} {...register('password')} />
              <PasswordField label="Confirm new password" autoComplete="new-password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
              <SubmitButton loading={isSubmitting}>{isSubmitting ? 'Updating…' : 'Update password'}</SubmitButton>
            </form>
          )}
        </>
      )}
    </AuthShell>
  )
}
