import { useState } from 'react'
import { Loader2, RotateCw } from 'lucide-react'
import type { Failure } from '../../dashboard/api/failures'
import { ErrorNotice } from '../../dashboard/components/StateViews'
import { FormAlert, SubmitButton } from '../components/FormControls'
import { describeOtpFailure } from './otpErrors'
import { OtpInput } from './OtpInput'
import { isCompleteOtp } from './otp'
import { useResendCooldown } from './useResendCooldown'

interface Props {
  maskedEmail: string
  /** Seconds until resend is offered (backend value when provided; otherwise a UI-only default). */
  initialCooldownSeconds: number
  verify: (code: string) => Promise<void>
  /** Returns the backend-provided cooldown for the next resend, if any. */
  resend: () => Promise<{ resendAvailableInSeconds?: number } | void>
  submitLabel?: string
}

const DEFAULT_COOLDOWN = 30

export function OtpVerifyForm({ maskedEmail, initialCooldownSeconds, verify, resend, submitLabel = 'Verify code' }: Props) {
  const [code, setCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [failure, setFailure] = useState<Failure | null>(null)
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)
  const { secondsLeft, restart } = useResendCooldown(initialCooldownSeconds)

  const submit = async (value: string) => {
    if (submitting || !isCompleteOtp(value)) return
    setSubmitting(true); setFailure(null); setResent(false)
    try {
      await verify(value)
    } catch (e) {
      const f = describeOtpFailure(e, 'verify')
      setFailure(f)
      if (f.category !== 'unavailable') setCode('') // keep the digits when the feature is simply not available yet
    } finally {
      setSubmitting(false)
    }
  }

  const onResend = async () => {
    if (resending || secondsLeft > 0) return
    setResending(true); setFailure(null)
    try {
      const r = await resend()
      restart((r && r.resendAvailableInSeconds) || DEFAULT_COOLDOWN)
      setResent(true); setCode('')
    } catch (e) {
      setFailure(describeOtpFailure(e, 'resend'))
    } finally {
      setResending(false)
    }
  }

  const fieldError = failure && failure.category !== 'unavailable' && failure.category !== 'server' && failure.category !== 'network' && failure.category !== 'timeout' ? failure.message : null

  return (
    <form method="post" noValidate onSubmit={(e) => { e.preventDefault(); void submit(code) }} className="space-y-5">
      <p className="text-sm text-muted">We sent a 4-digit code to <strong className="text-ink">{maskedEmail}</strong>. It expires soon, so enter it now.</p>
      {resent && <FormAlert tone="success" title="New code requested">Check your inbox for the latest code.</FormAlert>}
      {failure && !fieldError && <ErrorNotice failure={failure} />}
      <OtpInput value={code} onChange={setCode} onComplete={(v) => void submit(v)} disabled={submitting} error={fieldError} />
      <SubmitButton loading={submitting}>{submitting ? 'Verifying…' : submitLabel}</SubmitButton>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted">Didn’t get a code?</span>
        <button type="button" onClick={onResend} disabled={secondsLeft > 0 || resending} className="inline-flex items-center gap-1.5 font-semibold text-violet hover:underline disabled:cursor-not-allowed disabled:text-muted disabled:no-underline">
          {resending ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <RotateCw size={14} aria-hidden="true" />}
          {secondsLeft > 0 ? `Resend in ${secondsLeft}s` : 'Resend code'}
        </button>
      </div>
    </form>
  )
}
