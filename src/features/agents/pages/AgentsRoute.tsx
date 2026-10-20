import { useAuth } from '../../auth/context/AuthContext'
import { AppShell } from '../../dashboard/components/AppShell'

/** Shell wrapper for the agent screens. The catalog holds no private data. */
export default function AgentsRoute({ children }: { children: React.ReactNode }) {
  const { email, logout } = useAuth()
  if (!email) return null
  return <AppShell email={email} onLogout={logout} active="agents">{children}</AppShell>
}
