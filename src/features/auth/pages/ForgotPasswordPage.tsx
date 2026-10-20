import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { AuthShell } from '../components/AuthShell'
import { FormAlert, SubmitButton, TextField } from '../components/FormControls'
import { describeAuthFailure, type AuthFailure } from '../api/authErrors'
import { useAuth } from '../context/AuthContext'
import { forgotSchema, type ForgotValues } from '../schemas'

export default function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuth()
  const navigate = useNavigate()
  const [failure, setFailure] = useState<AuthFailure | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotValues>({ resolver: zodResolver(forgotSchema) })

  const onSubmit = handleSubmit(async ({ email }) => {
    setFailure(null)
    try {
      await requestPasswordReset(email)
      navigate('/reset-password') // the reset credential stays in memory, never in the URL
    } catch (e) {
      setFailure(describeAuthFailure(e, 'forgot'))
    }
  })

  return (
    <AuthShell
      eyebrow="ACCOUNT RECOVERY"
      title="Reset your password"
      subtitle="Enter the email address for your account to start a password reset."
      footer={<Link to="/login" className="font-semibold text-violet hover:underline">Back to sign in</Link>}
    >
      {failure && <FormAlert tone="error" title={failure.title}>{failure.message}</FormAlert>}
      <form method="post" noValidate onSubmit={onSubmit} className="space-y-5">
        <TextField label="Email" type="email" autoComplete="username" inputMode="email" autoCapitalize="off" spellCheck={false} error={errors.email?.message} {...register('email')} />
        <SubmitButton loading={isSubmitting}>{isSubmitting ? 'Starting reset…' : 'Continue'}</SubmitButton>
      </form>
    </AuthShell>
  )
}
