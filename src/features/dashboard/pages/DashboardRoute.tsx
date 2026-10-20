import { useAuth } from '../../auth/context/AuthContext'
import DashboardPage from './DashboardPage'

/** Keyed by account so all in-memory private state is discarded when the signed-in user changes. */
export default function DashboardRoute() {
  const { email } = useAuth()
  if (!email) return null // RequireAuth redirects; nothing private is rendered without a session
  return <DashboardPage key={email} email={email} />
}
