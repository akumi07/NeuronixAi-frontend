import { forwardRef, useId, useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2 } from 'lucide-react'

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
}

const inputCls =
  'w-full rounded-xl border bg-white px-4 py-3 text-[0.95rem] text-ink shadow-sm outline-none transition placeholder:text-muted/60 focus:border-violet focus:ring-4 focus:ring-violet/15 disabled:opacity-60'

export const TextField = forwardRef<HTMLInputElement, FieldProps>(function TextField({ label, error, hint, id, ...rest }, ref) {
  const uid = useId()
  const fieldId = id ?? uid
  const describedBy = error ? `${fieldId}-err` : hint ? `${fieldId}-hint` : undefined
  return (
    <div>
      <label htmlFor={fieldId} className="mb-1.5 block text-sm font-semibold text-ink">{label}</label>
      <input
        ref={ref}
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`${inputCls} ${error ? 'border-coral' : 'border-line'}`}
        {...rest}
      />
      {error ? (
        <p id={`${fieldId}-err`} role="alert" className="mt-1.5 text-sm text-[#D4442F]">{error}</p>
      ) : hint ? (
        <p id={`${fieldId}-hint`} className="mt-1.5 text-sm text-muted">{hint}</p>
      ) : null}
    </div>
  )
})

export const PasswordField = forwardRef<HTMLInputElement, Omit<FieldProps, 'type'>>(function PasswordField({ label, error, hint, id, ...rest }, ref) {
  const uid = useId()
  const fieldId = id ?? uid
  const [visible, setVisible] = useState(false)
  const describedBy = error ? `${fieldId}-err` : hint ? `${fieldId}-hint` : undefined
  return (
    <div>
      <label htmlFor={fieldId} className="mb-1.5 block text-sm font-semibold text-ink">{label}</label>
      <div className="relative">
        <input
          ref={ref}
          id={fieldId}
          type={visible ? 'text' : 'password'}
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`${inputCls} pr-12 ${error ? 'border-coral' : 'border-line'}`}
          {...rest}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-muted hover:text-violet"
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {error ? (
        <p id={`${fieldId}-err`} role="alert" className="mt-1.5 text-sm text-[#D4442F]">{error}</p>
      ) : hint ? (
        <p id={`${fieldId}-hint`} className="mt-1.5 text-sm text-muted">{hint}</p>
      ) : null}
    </div>
  )
})

export function SubmitButton({ loading, children }: { loading: boolean; children: ReactNode }) {
  return (
    <button
      type="submit"
      disabled={loading}
      aria-busy={loading}
      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-violet to-indigo px-5 py-3.5 font-semibold text-white shadow-[0_10px_24px_-8px_rgb(112_71_235/0.65)] transition hover:-translate-y-0.5 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
    >
      {loading && <Loader2 size={18} className="animate-spin" aria-hidden="true" />}
      {children}
    </button>
  )
}

type Tone = 'error' | 'success' | 'info'
const tones: Record<Tone, { cls: string; Icon: typeof AlertCircle }> = {
  error: { cls: 'border-coral/40 bg-coral/10 text-[#9E2B1B]', Icon: AlertCircle },
  success: { cls: 'border-mint/50 bg-mint/15 text-[#14704D]', Icon: CheckCircle2 },
  info: { cls: 'border-blue/30 bg-blue/10 text-[#1F5BB8]', Icon: AlertCircle },
}

export function FormAlert({ tone, title, children }: { tone: Tone; title: string; children?: ReactNode }) {
  const { cls, Icon } = tones[tone]
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`flex gap-3 rounded-xl border p-4 text-sm ${cls}`}>
      <Icon size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
      <div>
        <p className="font-semibold">{title}</p>
        {children && <div className="mt-0.5 opacity-90">{children}</div>}
      </div>
    </div>
  )
}
