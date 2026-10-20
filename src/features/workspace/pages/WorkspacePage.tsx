import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../auth/context/AuthContext'
import { AppShell } from '../../dashboard/components/AppShell'
import { HistoryList } from '../components/HistoryList'
import { useConversationList } from '../hooks/useConversationList'
import WorkspaceSession from './WorkspaceSession'

export default function WorkspacePage({ email }: { email: string }) {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const { conversationId: raw } = useParams()
  const list = useConversationList()

  const parsed = raw === undefined ? null : /^\d{1,15}$/.test(raw) ? Number(raw) : NaN
  if (Number.isNaN(parsed)) return <Navigate to="/app/workspace" replace />

  return (
    <AppShell
      email={email}
      onLogout={logout}
      active="workspace"
      wide
      sidebarExtra={(close) => (
        <HistoryList
          state={list.state}
          activeId={parsed}
          actionFailure={list.actionFailure}
          onRetry={list.retry}
          onNavigate={close}
          onDelete={async (id) => { if ((await list.remove(id)) && id === parsed) navigate('/app/workspace') }}
        />
      )}
    >
      <WorkspaceSession key={parsed ?? 'new'} email={email} conversationId={parsed} onHistoryChanged={list.refresh} />
    </AppShell>
  )
}
