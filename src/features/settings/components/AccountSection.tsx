import { useState } from 'react'
import { Loader2, LogOut } from 'lucide-react'
import { useAuth } from '../../auth/context/AuthContext'
import { SettingsSection, Unavailable } from './SettingsParts'

export function AccountSection() {
  const { logout } = useAuth()
  const [busy, setBusy] = useState(false)
  return (
    <SettingsSection id="account" title="Account" description="Sign out of this browser.">
      <div>
        <button type="button" disabled={busy} onClick={async () => { setBusy(true); await logout() }} className="inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm font-semibold hover:border-coral/50 hover:text-coral disabled:opacity-60">
          {busy ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <LogOut size={15} aria-hidden="true" />} Sign out
        </button>
        <p className="mt-2 text-xs text-muted">Signing out asks the server to revoke this session’s token and clears everything held in this tab.</p>
      </div>
      <Unavailable>Account deletion and “sign out everywhere” aren’t available: the backend has no endpoints for them. You can delete individual conversations from the Conversations screen.</Unavailable>
    </SettingsSection>
  )
}
