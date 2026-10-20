import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useLocation } from 'react-router-dom'
import { AuthShell } from '../components/AuthShell'
import { FormAlert, PasswordField, SubmitButton, TextField } from '../components/FormControls'
import { describeAuthFailure, type AuthFailure } from '../api/authErrors'
import { useAuth } from '../context/AuthContext'
import { loginSchema, type LoginValues } from '../schemas'

export default function LoginPage() {
  const { login, sessionExpired } = useAuth()
  const location = useLocation()
  const notice = (location.state as { notice?: string } | null)?.notice
  const passwordReset = notice === 'password-reset' || notice === 'password-changed'
  const [failure, setFailure] = useState<AuthFailure | null>(null)
  const {
    register,
    handleSubmit,
    resetField,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) })

  const onSubmit = handleSubmit(async ({ email, password }) => {
    setFailure(null)
    try {
      await login(email, password)
    } catch (e) {
      setFailure(describeAuthFailure(e, 'login'))
      resetField('password')
    }
  })

  return (
    <AuthShell
      eyebrow="WELCOME BACK"
      title="Sign in to NeuronixAI"
      subtitle="Pick up where you left off with your team of specialized agents."
      footer={<>New to NeuronixAI? <Link to="/register" className="font-semibold text-violet hover:underline">Create an account</Link></>}
    >
      {passwordReset && <FormAlert tone="success" title="Password updated">Sign in with your new password.</FormAlert>}
      {sessionExpired && <FormAlert tone="info" title="Your session expired">Please sign in again to continue.</FormAlert>}
      {failure && <FormAlert tone="error" title={failure.title}>{failure.message}</FormAlert>}

      <form method="post" noValidate onSubmit={onSubmit} className="space-y-5">
        <TextField label="Email" type="email" autoComplete="username" inputMode="email" autoCapitalize="off" spellCheck={false} error={errors.email?.message} {...register('email')} />
        <PasswordField label="Password" autoComplete="current-password" error={errors.password?.message} {...register('password')} />
        <div className="text-right text-sm">
          <Link to="/forgot-password" className="font-semibold text-violet hover:underline">Forgot password?</Link>
        </div>
        <SubmitButton loading={isSubmitting}>{isSubmitting ? 'Signing in…' : 'Sign in'}</SubmitButton>
      </form>
    </AuthShell>
  )
}
