import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { useAuth } from '../../auth/context/AuthContext'
import { describeFailure, type Failure } from '../../dashboard/api/failures'
import { AppShell } from '../../dashboard/components/AppShell'
import { ErrorNotice } from '../../dashboard/components/StateViews'
import { TaskListPanel } from '../../tasks/components/TaskListPanel'
import { useConversationList } from '../../workspace/hooks/useConversationList'
import { ConversationTranscript } from '../components/ConversationTranscript'

const UNAVAILABLE: Failure = { title: 'This conversation isn’t available', message: 'It may not exist, or you may not have access to it.' }
const NOUN = { plural: 'conversations', startLabel: 'Start a conversation', emptyBody: 'Conversations you have in the workspace are saved here so you can reread them later.' }

/** Rendered with `key={email}` so private state resets on account change. */
export default function ConversationsPage({ email }: { email: string }) {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const { conversationId: raw } = useParams()
  const list = useConversationList()
  const [refreshing, setRefreshing] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const id = raw === undefined ? null : /^\d{1,15}$/.test(raw) ? Number(raw) : NaN
  if (Number.isNaN(id)) return <Navigate to="/app/conversations" replace />

  const conversation = id !== null && list.state.status === 'ready' ? list.state.data.find((c) => c.id === id) ?? null : null

  const refresh = () => { setRefreshing(true); list.refresh(); window.setTimeout(() => setRefreshing(false), 600) }

  /** Success is reported only after the backend confirms the delete. */
  const deleteConversation = async (target: number) => {
    const result = await list.remove(target)
    if (result.ok) { setNotice('Conversation deleted.'); navigate('/app/conversations'); return { ok: true, failure: null } }
    return { ok: false, failure: result.failure ?? describeFailure(new Error('delete')) }
  }

  const showDetail = id !== null
  return (
    <AppShell email={email} onLogout={logout} active="conversations" wide>
      <div className="mb-6 max-w-2xl">
        <p className="text-xs font-bold tracking-[0.16em] text-violet">CONVERSATIONS</p>
        <h1 className="mt-3 text-4xl font-extrabold leading-[1.08] sm:text-5xl">Reread any conversation.</h1>
      </div>
      {notice && (
        <p role="status" className="mb-4 flex items-center gap-2 rounded-2xl border border-mint/50 bg-mint/15 p-3 text-sm font-semibold text-[#14704D]">
          <CheckCircle2 size={16} aria-hidden="true" /> {notice}
          <button type="button" onClick={() => setNotice(null)} className="ml-auto text-xs underline">Dismiss</button>
        </p>
      )}
      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <div className={showDetail ? 'hidden xl:block' : ''}>
          <TaskListPanel state={list.state} activeId={id} refreshing={refreshing} onRefresh={refresh} onRetry={list.retry} basePath="/app/conversations" noun={NOUN} />
        </div>
        <div className={showDetail ? '' : 'hidden xl:block'}>
          {!showDetail && (
            <div className="rounded-3xl border border-dashed border-line bg-white/60 p-10 text-center">
              <h2 className="font-display text-xl font-bold">Select a conversation</h2>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted">Choose one from the list to read its full message history.</p>
            </div>
          )}
          {showDetail && list.state.status === 'loading' && <div aria-busy="true" className="h-64 animate-pulse rounded-3xl bg-line/60" />}
          {showDetail && list.state.status === 'error' && <ErrorNotice failure={list.state.failure} onRetry={list.retry} />}
          {showDetail && list.state.status === 'ready' && !conversation && <ErrorNotice failure={UNAVAILABLE} />}
          {showDetail && conversation && <ConversationTranscript key={conversation.id} conversation={conversation} onDelete={deleteConversation} />}
        </div>
      </div>
    </AppShell>
  )
}
