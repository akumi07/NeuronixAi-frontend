import { useAuth } from '../../auth/context/AuthContext'
import { AppShell } from '../../dashboard/components/AppShell'
import { AccountSection } from '../components/AccountSection'
import { ConnectionsSection } from '../components/ConnectionsSection'
import { PreferencesSection } from '../components/PreferencesSection'
import { ProfileSection } from '../components/ProfileSection'
import { SecuritySection } from '../components/SecuritySection'

const NAV = [['profile', 'Profile'], ['security', 'Password'], ['preferences', 'Interface'], ['connections', 'Connections'], ['account', 'Account']] as const

/** Rendered with `key={email}` so form and profile state reset on account change. */
export default function SettingsPage({ email }: { email: string }) {
  const { logout } = useAuth()
  return (
    <AppShell email={email} onLogout={logout} active="settings" wide>
      <div className="mb-6 max-w-2xl">
        <p className="text-xs font-bold tracking-[0.16em] text-violet">SETTINGS</p>
        <h1 className="mt-3 text-4xl font-extrabold leading-[1.08] sm:text-5xl">Your account, your way.</h1>
      </div>
      <nav aria-label="Settings sections" className="mb-6 flex flex-wrap gap-2">
        {NAV.map(([id, label]) => (
          <a key={id} href={`#${id}`} className="rounded-full border border-line bg-white px-4 py-1.5 text-sm font-semibold hover:border-violet/40 hover:text-violet">{label}</a>
        ))}
      </nav>
      <div className="space-y-6">
        <ProfileSection />
        <SecuritySection />
        <PreferencesSection />
        <ConnectionsSection />
        <AccountSection />
      </div>
    </AppShell>
  )
}
