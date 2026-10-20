import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CapabilityStarters } from '../../dashboard/components/CapabilityStarters'
import { TaskComposer } from '../../dashboard/components/TaskComposer'
import { ConversationView } from '../components/ConversationView'
import { OrchestrationPanel } from '../components/OrchestrationPanel'
import { clearHandoffDraft, peekHandoffDraft } from '../../../lib/handoffDraft'
import { useTaskSession } from '../hooks/useTaskSession'

interface Props {
  email: string
  conversationId: number | null
  onHistoryChanged: () => void
}

/**
 * One task/conversation. Remounted (via `key`) whenever the conversation changes, which discards the
 * previous conversation's messages and draft from memory.
 */
export default function WorkspaceSession({ email, conversationId, onHistoryChanged }: Props) {
  const navigate = useNavigate()
  const [draft, setDraft] = useState(() => (conversationId === null ? peekHandoffDraft(email) : ''))
  const [tab, setTab] = useState<'conversation' | 'details'>('conversation')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    clearHandoffDraft()
    textareaRef.current?.focus()
  }, [])

  const onCreated = useCallback((id: number) => navigate(`/app/workspace/${id}`, { replace: true }), [navigate])
  const session = useTaskSession({ conversationId, onChanged: onHistoryChanged, onCreated })

  const submit = async () => {
    const message = draft.trim()
    if (!message) return
    if (await session.send(message)) setDraft('')
  }
  const retry = () => { if (session.failedMessage) void session.send(session.failedMessage) }
  const newTask = () => navigate('/app/workspace')

  const messageCount = session.thread.status === 'ready' ? session.thread.data.length : 0
  const tabCls = (active: boolean) => `flex-1 rounded-lg px-3 py-2 text-sm font-semibold ${active ? 'bg-white text-violet shadow-sm' : 'text-muted'}`

  return (
    <div>
      <div role="tablist" aria-label="Workspace view" className="mb-4 flex gap-1 rounded-xl bg-line/60 p-1 xl:hidden">
        <button role="tab" aria-selected={tab === 'conversation'} aria-controls="pane-conversation" onClick={() => setTab('conversation')} className={tabCls(tab === 'conversation')}>Conversation</button>
        <button role="tab" aria-selected={tab === 'details'} aria-controls="pane-details" onClick={() => setTab('details')} className={tabCls(tab === 'details')}>Task details</button>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div id="pane-conversation" role="tabpanel" className={`${tab === 'conversation' ? '' : 'hidden'} min-w-0 space-y-5 xl:block`}>
          <ConversationView
            thread={session.thread}
            pending={session.pending}
            phase={session.phase}
            failure={session.failure}
            hasFailedMessage={session.failedMessage !== null}
            onRetryThread={session.reloadThread}
            onRetrySend={retry}
            onCancel={session.cancel}
            onNewTask={newTask}
          />
          <div className="sticky bottom-0 z-10 space-y-3 bg-gradient-to-t from-canvas via-canvas/95 to-transparent pb-3 pt-6">
            <TaskComposer
              value={draft}
              onChange={setDraft}
              onSubmit={submit}
              sending={session.phase === 'sending'}
              failure={null}
              textareaRef={textareaRef}
              placeholder={conversationId === null ? 'Describe your goal…' : 'Continue this task…'}
            />
            {conversationId === null && messageCount === 0 && (
              <CapabilityStarters onPick={(t) => { setDraft(t); textareaRef.current?.focus() }} />
            )}
          </div>
        </div>

        <div id="pane-details" role="tabpanel" className={`${tab === 'details' ? '' : 'hidden'} xl:sticky xl:top-8 xl:block`}>
          <OrchestrationPanel phase={session.phase} hasConversation={conversationId !== null} durationMs={session.durationMs} messageCount={messageCount} />
        </div>
      </div>
    </div>
  )
}
