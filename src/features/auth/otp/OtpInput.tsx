import { useId, useRef, type ClipboardEvent, type KeyboardEvent } from 'react'
import { OTP_LENGTH } from '../../../api/contracts/auth'
import { sanitizeOtp, setDigit } from './otp'

interface Props {
  value: string
  onChange: (value: string) => void
  onComplete?: (value: string) => void
  disabled?: boolean
  error?: string | null
  label?: string
}

/** Four separated numeric cells with auto-advance, backspace navigation and paste support. */
export function OtpInput({ value, onChange, onComplete, disabled, error, label = 'Verification code' }: Props) {
  const refs = useRef<Array<HTMLInputElement | null>>([])
  const uid = useId()
  const focus = (i: number) => refs.current[Math.max(0, Math.min(OTP_LENGTH - 1, i))]?.focus()

  const commit = (next: string, focusIndex: number) => {
    onChange(next)
    focus(focusIndex)
    if (next.length === OTP_LENGTH) onComplete?.(next)
  }

  const onInput = (i: number, raw: string) => {
    const digits = sanitizeOtp(raw)
    if (!digits) { commit(setDigit(value, i, ''), i); return }
    if (digits.length > 1) { // browsers/autofill may deliver several digits into one cell
      const merged = sanitizeOtp(value.slice(0, i) + digits)
      commit(merged, merged.length)
      return
    }
    const next = setDigit(value, i, digits)
    commit(next, i + 1)
  }

  const onKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !value[i] && i > 0) { e.preventDefault(); commit(value.slice(0, i - 1), i - 1) }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); focus(i - 1) }
    else if (e.key === 'ArrowRight') { e.preventDefault(); focus(i + 1) }
  }

  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = sanitizeOtp(e.clipboardData.getData('text'))
    if (pasted) commit(pasted, pasted.length)
  }

  return (
    <div role="group" aria-labelledby={`${uid}-l`} aria-describedby={error ? `${uid}-e` : undefined}>
      <p id={`${uid}-l`} className="mb-2 text-sm font-semibold">{label}</p>
      <div className="flex gap-3">
        {Array.from({ length: OTP_LENGTH }, (_, i) => (
          <input
            key={i}
            ref={(el) => { refs.current[i] = el }}
            value={value[i] ?? ''}
            onChange={(e) => onInput(i, e.target.value)}
            onKeyDown={(e) => onKeyDown(i, e)}
            onPaste={onPaste}
            onFocus={(e) => e.target.select()}
            disabled={disabled}
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete={i === 0 ? 'one-time-code' : 'off'}
            aria-label={`Digit ${i + 1} of ${OTP_LENGTH}`}
            aria-invalid={error ? true : undefined}
            maxLength={OTP_LENGTH}
            className={`size-14 rounded-xl border bg-white text-center font-display text-2xl font-bold shadow-sm outline-none transition focus:border-violet focus:ring-4 focus:ring-violet/15 disabled:opacity-60 sm:size-16 ${error ? 'border-coral' : 'border-line'}`}
          />
        ))}
      </div>
      {error && <p id={`${uid}-e`} role="alert" className="mt-2 text-sm text-[#D4442F]">{error}</p>}
    </div>
  )
}
