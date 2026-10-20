import { useEffect, useRef } from 'react'
import { Loader2 } from 'lucide-react'

interface Props {
  title: string
  body: string
  confirmLabel: string
  busy: boolean
  onConfirm: () => void
  onCancel: () => void
}

/** Modal confirmation for destructive actions. Focus starts on the safe option; Escape cancels. */
export function ConfirmDialog({ title, body, confirmLabel, busy, onConfirm, onCancel }: Props) {
  const cancelRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    cancelRef.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !busy) onCancel() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [busy, onCancel])

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-ink/40" onClick={busy ? undefined : onCancel} aria-hidden="true" />
      <div role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-body" className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-lift">
        <h2 id="confirm-title" className="font-display text-xl font-bold">{title}</h2>
        <p id="confirm-body" className="mt-2 text-sm text-muted">{body}</p>
        <div className="mt-6 flex justify-end gap-2">
          <button ref={cancelRef} type="button" disabled={busy} onClick={onCancel} className="rounded-xl border border-line px-4 py-2.5 text-sm font-semibold hover:border-violet/40 disabled:opacity-60">Cancel</button>
          <button type="button" disabled={busy} onClick={onConfirm} className="inline-flex items-center gap-2 rounded-xl bg-coral px-4 py-2.5 text-sm font-semibold text-white hover:brightness-95 disabled:opacity-70">
            {busy && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}{confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
