import { useRef, useState } from 'react'
import { useAuth } from '../../auth/context/AuthContext'
import { AppShell } from '../components/AppShell'
import { CapabilityStarters } from '../components/CapabilityStarters'
import { ConversationThread } from '../components/ConversationThread'
import { RecentWork } from '../components/RecentWork'
import { TaskComposer } from '../components/TaskComposer'
import { WorkspacePulse } from '../components/WorkspacePulse'
import { useWorkspace } from '../hooks/useWorkspace'

/** Rendered with `key={email}` by the route so every piece of private state resets on account change. */
export default function DashboardPage({ email }: { email: string }) {
  const { logout } = useAuth()
  const ws = useWorkspace()
  const [draft, setDraft] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const prefill = (text: string) => {
    setDraft(text)
    textareaRef.current?.focus()
  }

  const submit = async () => {
    const message = draft.trim()
    if (await ws.send(message)) setDraft('')
  }

  const conversationTitle =
    ws.conversations.status === 'ready'
      ? ws.conversations.data.find((c) => c.id === ws.activeId)?.title?.trim() || 'Conversation'
      : 'Conversation'

  return (
    <AppShell email={email} onLogout={logout} onNewTask={() => { ws.startNewTask(); setDraft('') }}>
      {ws.thread ? (
        <div className="space-y-6">
          <ConversationThread title={conversationTitle} thread={ws.thread} pendingMessage={ws.pendingMessage} onNewTask={ws.startNewTask} onRetry={ws.reloadThread} />
          <TaskComposer value={draft} onChange={setDraft} onSubmit={submit} sending={ws.pendingMessage !== null} failure={ws.sendFailure} textareaRef={textareaRef} placeholder="Continue this task…" />
        </div>
      ) : (
        <div className="space-y-10">
          <header className="max-w-2xl">
            <p className="text-xs font-bold tracking-[0.16em] text-violet">YOUR WORKSPACE</p>
            <h1 className="mt-3 text-4xl font-extrabold leading-[1.08] sm:text-5xl">
              What would you like to <span className="bg-gradient-to-r from-violet to-blue bg-clip-text text-transparent">get done</span> today?
            </h1>
          </header>

          <div className="space-y-5">
            <TaskComposer value={draft} onChange={setDraft} onSubmit={submit} sending={ws.pendingMessage !== null} failure={ws.sendFailure} textareaRef={textareaRef} />
            <CapabilityStarters onPick={prefill} />
          </div>

          <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <RecentWork
              state={ws.conversations}
              activeId={ws.activeId}
              actionFailure={ws.actionFailure}
              onOpen={ws.openConversation}
              onDelete={ws.removeConversation}
              onRetry={ws.reloadConversations}
              onExample={prefill}
            />
            <WorkspacePulse me={ws.me} conversations={ws.conversations} onRetryMe={ws.reloadMe} />
          </div>
        </div>
      )}
    </AppShell>
  )
}
