import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { AuthShell } from '../components/AuthShell'
import { FormAlert, PasswordField, SubmitButton, TextField } from '../components/FormControls'
import { describeAuthFailure, type AuthFailure } from '../api/authErrors'
import { useAuth } from '../context/AuthContext'
import { useAuthFlow } from '../flow/AuthFlowContext'
import { maskEmail } from '../otp/otp'
import { registerSchema, type RegisterValues } from '../schemas'

export default function RegisterPage() {
  const { register: signUp } = useAuth()
  const { setRegistration } = useAuthFlow()
  const navigate = useNavigate()
  const [failure, setFailure] = useState<AuthFailure | null>(null)
  const {
    register,
    handleSubmit,
    resetField,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({ resolver: zodResolver(registerSchema) })

  const onSubmit = handleSubmit(async ({ email, password }) => {
    setFailure(null)
    try {
      const outcome = await signUp(email, password)
      // signedIn: the current backend issues a token immediately; the guest-only route then redirects to the dashboard.
      if (outcome.kind === 'pendingVerification') {
        setRegistration({ email, maskedEmail: outcome.maskedEmail ?? maskEmail(email), resendAfterSeconds: outcome.resendAvailableInSeconds })
        navigate('/register/verify')
      }
    } catch (e) {
      setFailure(describeAuthFailure(e, 'register'))
      resetField('password')
      resetField('confirmPassword')
    }
  })

  return (
    <AuthShell
      eyebrow="GET STARTED"
      title="Create your workspace"
      subtitle="One account for every specialized capability."
      footer={<>Already have an account? <Link to="/login" className="font-semibold text-violet hover:underline">Sign in</Link></>}
    >
      {failure && <FormAlert tone="error" title={failure.title}>{failure.message}</FormAlert>}
      <form method="post" noValidate onSubmit={onSubmit} className="space-y-5">
        <TextField label="Email" type="email" autoComplete="username" inputMode="email" autoCapitalize="off" spellCheck={false} error={errors.email?.message} {...register('email')} />
        <PasswordField label="Password" autoComplete="new-password" hint="At least 8 characters." error={errors.password?.message} {...register('password')} />
        <PasswordField label="Confirm password" autoComplete="new-password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
        <SubmitButton loading={isSubmitting}>{isSubmitting ? 'Creating account…' : 'Create account'}</SubmitButton>
      </form>
    </AuthShell>
  )
}
