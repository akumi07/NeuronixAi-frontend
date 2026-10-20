import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CapabilityStarters } from '../../dashboard/components/CapabilityStarters'
import { TaskComposer } from '../../dashboard/components/TaskComposer'
import { ConversationView } from '../components/ConversationView'
import { OrchestrationPanel } from '../components/OrchestrationPanel'
import { clearHandoffDraft, peekHandoffDraft } from '../../../lib/handoffDraft'
import { setSelectedDocuments, useSelectedDocuments } from '../../../lib/documentSelection'
import { useTaskSession } from '../hooks/useTaskSession'
import { FileText, X } from 'lucide-react'

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
  const session = useTaskSession({ email, conversationId, onChanged: onHistoryChanged, onCreated })
  const selectedDocs = useSelectedDocuments(email)

  const submit = async () => {
    const message = draft.trim()
    if (!message) return
    if (await session.send(message, selectedDocs.map((d) => d.id))) setDraft('')
  }
  const retry = () => { if (session.failedMessage) void session.send(session.failedMessage, selectedDocs.map((d) => d.id)) }
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
            executionActive={session.executions.hasActive}
            onCancelExecution={session.executions.latest ? () => void session.executions.cancel(session.executions.latest!.executionId) : undefined}
          />
          {session.documentsNotUsed && (
            <p role="status" className="rounded-2xl border border-amber/50 bg-amber/10 p-3 text-sm text-[#7A5410]">Your selected documents were <strong>not</strong> used: document-grounded answers aren’t available in this chat yet, so this reply is general.</p>
          )}
          <div className="sticky bottom-0 z-10 space-y-3 bg-gradient-to-t from-canvas via-canvas/95 to-transparent pb-3 pt-6">
            {selectedDocs.length > 0 && (
              <ul aria-label="Selected documents" className="flex flex-wrap gap-2">
                {selectedDocs.map((d) => (
                  <li key={d.id} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white py-1 pl-3 pr-1.5 text-xs font-semibold">
                    <FileText size={13} className="text-[#14704D]" aria-hidden="true" /> {d.name}
                    <button type="button" aria-label={`Remove ${d.name}`} onClick={() => setSelectedDocuments(email, selectedDocs.filter((x) => x.id !== d.id))} className="grid size-5 place-items-center rounded-full text-muted hover:bg-line hover:text-ink"><X size={12} aria-hidden="true" /></button>
                  </li>
                ))}
                <li className="self-center text-xs text-muted">Sent as context only if the backend supports it.</li>
              </ul>
            )}
            <TaskComposer
              value={draft}
              onChange={setDraft}
              onSubmit={submit}
              sending={session.phase === 'sending' || session.phase === 'running'}
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
          <OrchestrationPanel phase={session.phase} hasConversation={conversationId !== null} durationMs={session.durationMs} messageCount={messageCount} tracker={session.executions} />
        </div>
      </div>
    </div>
  )
}
