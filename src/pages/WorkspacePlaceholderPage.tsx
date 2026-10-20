import { useState } from 'react'
import { LogOut } from 'lucide-react'
import { BrandLogo } from '../features/landing/components/BrandLogo'
import { useAuth } from '../features/auth/context/AuthContext'

/** Post-sign-in landing spot until the workspace screens are built. */
export default function WorkspacePlaceholderPage() {
  const { email, logout } = useAuth()
  const [busy, setBusy] = useState(false)
  return (
    <main className="grid min-h-screen place-items-center px-6 text-center">
      <div>
        <BrandLogo className="mb-8" />
        <h1 className="text-3xl font-extrabold">You’re signed in</h1>
        <p className="mt-3 text-muted">Signed in as {email}. The workspace screens are still being built.</p>
        <button
          type="button"
          disabled={busy}
          onClick={async () => { setBusy(true); await logout() }}
          className="mt-6 inline-flex items-center gap-2 rounded-xl border border-line bg-white px-5 py-3 font-semibold shadow-sm hover:border-violet/40 hover:text-violet disabled:opacity-60"
        >
          <LogOut size={18} aria-hidden="true" /> Sign out
        </button>
      </div>
    </main>
  )
}
