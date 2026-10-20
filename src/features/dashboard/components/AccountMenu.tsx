import { useEffect, useRef, useState } from 'react'
import { ChevronUp, Loader2, LogOut } from 'lucide-react'

export function AccountMenu({ email, onLogout }: { email: string; onLogout: () => Promise<void> }) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey) }
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 rounded-2xl border border-line bg-white p-2.5 text-left shadow-sm hover:border-violet/40"
      >
        <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-violet to-blue font-bold uppercase text-white">{email.charAt(0)}</span>
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-bold uppercase tracking-[0.12em] text-muted">Account</span>
          <span className="block truncate text-sm font-semibold">{email}</span>
        </span>
        <ChevronUp size={16} className={`shrink-0 text-muted transition ${open ? '' : 'rotate-180'}`} aria-hidden="true" />
      </button>
      {open && (
        <div role="menu" className="absolute inset-x-0 bottom-full z-10 mb-2 rounded-2xl border border-line bg-white p-1.5 shadow-lift">
          <button
            type="button"
            role="menuitem"
            disabled={busy}
            onClick={async () => { setBusy(true); await onLogout() }}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold hover:bg-coral/10 hover:text-[#B8321F] disabled:opacity-60"
          >
            {busy ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <LogOut size={16} aria-hidden="true" />}
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}
