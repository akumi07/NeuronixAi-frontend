import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../../auth/api/authApi'
import { ApiError } from '../../auth/api/httpClient'
import { describeFailure, type Failure } from '../../dashboard/api/failures'
import { useAuth } from '../../auth/context/AuthContext'
import { FormAlert, PasswordField, SubmitButton } from '../../auth/components/FormControls'
import { SettingsSection } from './SettingsParts'

const schema = z
  .object({
    current: z.string().min(1, 'Enter your current password'),
    password: z.string().min(8, 'Use at least 8 characters').max(128, 'Use 128 characters or fewer'),
    confirm: z.string().min(1, 'Confirm your new password'),
  })
  .refine((v) => v.password === v.confirm, { path: ['confirm'], message: 'Passwords don’t match' })
  .refine((v) => v.password !== v.current, { path: ['password'], message: 'Choose a different password' })
type Values = z.infer<typeof schema>

export function SecuritySection() {
  const { email, authedRequest, logout } = useAuth()
  const navigate = useNavigate()
  const [failure, setFailure] = useState<Failure | null>(null)
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<Values>({ resolver: zodResolver(schema) })

  /**
   * The backend's only password-change contract is POST /auth/new-password with a bearer token and no current-password check.
   * To avoid a stolen token being enough, we first re-verify the current password through the real login endpoint
   * (the returned token is discarded), then call new-password with the session token, then sign out.
   */
  const onSubmit = handleSubmit(async ({ current, password }) => {
    setFailure(null)
    if (!email) return
    try {
      await authApi.login(email, current)
    } catch (e) {
      reset({ current: '', password: '', confirm: '' })
      setFailure(e instanceof ApiError && e.kind === 'http' && (e.status === 401 || e.status === 403 || e.status === 400)
        ? { title: 'Current password is incorrect', message: 'Check it and try again.' }
        : describeFailure(e))
      return
    }
    try {
      await authedRequest<void>('POST', '/api/v1/auth/new-password', { body: { password } })
    } catch (e) {
      reset({ current: '', password: '', confirm: '' })
      setFailure(describeFailure(e))
      return
    }
    await logout()
    navigate('/login', { replace: true, state: { notice: 'password-changed' } })
  })

  return (
    <SettingsSection id="security" title="Password" description="Change the password you use to sign in.">
      {failure && <FormAlert tone="error" title={failure.title}>{failure.message}</FormAlert>}
      <form method="post" noValidate onSubmit={onSubmit} className="max-w-md space-y-5">
        <PasswordField label="Current password" autoComplete="current-password" error={errors.current?.message} {...register('current')} />
        <PasswordField label="New password" autoComplete="new-password" hint="At least 8 characters." error={errors.password?.message} {...register('password')} />
        <PasswordField label="Confirm new password" autoComplete="new-password" error={errors.confirm?.message} {...register('confirm')} />
        <SubmitButton loading={isSubmitting}>{isSubmitting ? 'Updating…' : 'Update password'}</SubmitButton>
      </form>
      <p className="max-w-md text-xs text-muted">After a change you’ll be signed out here and asked to sign in again. The backend doesn’t revoke tokens already issued, so other signed-in sessions may stay active until they expire.</p>
    </SettingsSection>
  )
}
