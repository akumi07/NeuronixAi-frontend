import { passwordStrength } from '../otp/otp'

/** Usability guidance only. The backend enforces the real policy (today: at least 8 characters). */
export function PasswordRequirements({ password }: { password: string }) {
  const { level, label } = passwordStrength(password)
  const bars = ['bg-coral', 'bg-amber', 'bg-blue', 'bg-mint']
  return (
    <div aria-live="polite" className="space-y-1.5 text-xs text-muted">
      <div className="flex gap-1.5" aria-hidden="true">
        {[1, 2, 3, 4].map((i) => <span key={i} className={`h-1.5 flex-1 rounded-full ${password && i <= level ? bars[Math.max(0, level - 1)] : 'bg-line'}`} />)}
      </div>
      <p><span className={password.length >= 8 ? 'font-semibold text-[#14704D]' : ''}>{password.length >= 8 ? '✓' : '•'} At least 8 characters (required)</span>{password && <span className="ml-2">Strength: {label}</span>}</p>
      <p>Tip: mix upper and lower case letters, numbers and symbols.</p>
    </div>
  )
}
