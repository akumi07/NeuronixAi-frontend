import { useAuth } from '../../auth/context/AuthContext'
import WorkspacePage from './WorkspacePage'

/** Keyed by account so all in-memory private state is discarded when the signed-in user changes. */
export default function WorkspaceRoute() {
  const { email } = useAuth()
  if (!email) return null
  return <WorkspacePage key={email} email={email} />
}
