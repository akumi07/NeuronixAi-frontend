import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/context/AuthContext'
import { setHandoffDraft } from '../../../lib/handoffDraft'
import { useConversationList } from '../../workspace/hooks/useConversationList'
import { AppShell } from '../components/AppShell'
import { CapabilityStarters } from '../components/CapabilityStarters'
import { RecentWork } from '../components/RecentWork'
import { TaskComposer } from '../components/TaskComposer'
import { WorkspacePulse } from '../components/WorkspacePulse'
import { useCurrentUser } from '../hooks/useCurrentUser'

/** Rendered with `key={email}` by the route so every piece of private state resets on account change. */
export default function DashboardPage({ email }: { email: string }) {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const list = useConversationList()
  const { me, retry: retryMe } = useCurrentUser()
  const [draft, setDraft] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const prefill = (text: string) => {
    setDraft(text)
    textareaRef.current?.focus()
  }

  /** The workspace owns execution; the dashboard hands the draft over in memory (never via URL or history state). */
  const openWorkspace = () => {
    setHandoffDraft(email, draft.trim())
    navigate('/app/workspace')
  }

  return (
    <AppShell email={email} onLogout={logout} active="dashboard">
      <div className="space-y-10">
        <header className="max-w-2xl">
          <p className="text-xs font-bold tracking-[0.16em] text-violet">YOUR WORKSPACE</p>
          <h1 className="mt-3 text-4xl font-extrabold leading-[1.08] sm:text-5xl">
            What would you like to <span className="bg-gradient-to-r from-violet to-blue bg-clip-text text-transparent">get done</span> today?
          </h1>
        </header>

        <div className="space-y-5">
          <TaskComposer value={draft} onChange={setDraft} onSubmit={openWorkspace} sending={false} failure={null} textareaRef={textareaRef} submitLabel="Open in workspace" />
          <CapabilityStarters onPick={prefill} />
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <RecentWork
            state={list.state}
            activeId={null}
            actionFailure={list.actionFailure}
            onOpen={(id) => navigate(`/app/workspace/${id}`)}
            onDelete={list.remove}
            onRetry={list.retry}
            onExample={prefill}
          />
          <WorkspacePulse me={me} conversations={list.state} onRetryMe={retryMe} />
        </div>
      </div>
    </AppShell>
  )
}
