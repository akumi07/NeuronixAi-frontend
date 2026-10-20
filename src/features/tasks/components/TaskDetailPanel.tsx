import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Clock, Play, RotateCcw, Trash2 } from 'lucide-react'
import { useAuth } from '../../auth/context/AuthContext'
import type { Failure } from '../../dashboard/api/failures'
import type { ChatMessage, Conversation } from '../../dashboard/api/types'
import { ErrorNotice, Skeleton } from '../../dashboard/components/StateViews'
import { formatDay, secondsBetween } from '../../dashboard/data/formatDate'
import { setHandoffDraft } from '../../../lib/handoffDraft'
import { CopyButton, MessageContent } from '../../workspace/components/MessageContent'
import { useTaskDetail } from '../hooks/useTaskDetail'
import { ConfirmDialog } from './ConfirmDialog'

interface Props {
  task: Conversation
  onDelete: (id: number) => Promise<{ ok: boolean; failure: Failure | null }>
}

/** Status is derived only from saved messages: a trailing user message means no reply was recorded. */
function deriveStatus(messages: ChatMessage[]) {
  if (messages.length === 0) return null
  return messages[messages.length - 1].role === 'ASSISTANT' ? 'answered' : 'no-reply'
}

export function TaskDetailPanel({ task, onDelete }: Props) {
  const { email } = useAuth()
  const navigate = useNavigate()
  const { state, retry } = useTaskDetail(task.id)
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteFailure, setDeleteFailure] = useState<Failure | null>(null)
  const title = task.title?.trim() || 'Untitled task'

  const messages = state.status === 'ready' ? state.data : []
  const goal = messages.find((m) => m.role === 'USER')
  const result = [...messages].reverse().find((m) => m.role === 'ASSISTANT')
  const status = state.status === 'ready' ? deriveStatus(messages) : null

  const runAgain = () => {
    if (email && goal) setHandoffDraft(email, goal.content)
    navigate('/app/workspace')
  }

  const confirmDelete = async () => {
    setDeleting(true)
    const r = await onDelete(task.id)
    setDeleting(false)
    if (!r.ok) { setDeleteFailure(r.failure); setConfirming(false) }
  }

  return (
    <article aria-label="Task details" className="min-w-0 space-y-5">
      <Link to="/app/tasks" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-violet xl:hidden"><ArrowLeft size={16} aria-hidden="true" /> All tasks</Link>

      <header className="rounded-3xl border border-line bg-white p-6 shadow-soft">
        <div className="flex flex-wrap items-center gap-3">
          {status === 'answered' && <span className="inline-flex items-center gap-1.5 rounded-full bg-mint/20 px-3 py-1 text-xs font-bold text-[#14704D]"><span className="size-1.5 rounded-full bg-mint" aria-hidden="true" />Answered</span>}
          {status === 'no-reply' && <span className="inline-flex items-center gap-1.5 rounded-full bg-amber/25 px-3 py-1 text-xs font-bold text-[#7A5410]"><span className="size-1.5 rounded-full bg-amber" aria-hidden="true" />No reply recorded</span>}
          {state.status === 'loading' && <Skeleton className="h-6 w-24" />}
          <span className="text-xs text-muted">Created {formatDay(task.createdAt)} · Updated {formatDay(task.updatedAt)}</span>
        </div>
        <h1 className="mt-3 break-words font-display text-2xl font-extrabold sm:text-3xl">{title}</h1>
        {status === 'no-reply' && <p className="mt-2 text-sm text-muted">The last saved message is yours. The reply may have failed or may still be in progress. This status is inferred from saved messages; the backend has no task status field.</p>}
        <div className="mt-5 flex flex-wrap gap-2">
          <Link to={`/app/workspace/${task.id}`} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-violet to-indigo px-4 py-2.5 text-sm font-semibold text-white"><Play size={15} aria-hidden="true" /> Continue in workspace</Link>
          <button type="button" disabled={!goal} onClick={runAgain} className="inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm font-semibold hover:border-violet/40 hover:text-violet disabled:opacity-50"><RotateCcw size={15} aria-hidden="true" /> New task from this goal</button>
          <button type="button" onClick={() => { setDeleteFailure(null); setConfirming(true) }} className="inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-muted hover:border-coral/50 hover:text-coral"><Trash2 size={15} aria-hidden="true" /> Delete</button>
        </div>
        {deleteFailure && <div className="mt-4"><ErrorNotice failure={deleteFailure} /></div>}
      </header>

      {state.status === 'loading' && <div className="space-y-3" aria-busy="true"><Skeleton className="h-24" /><Skeleton className="h-40" /></div>}
      {state.status === 'error' && <ErrorNotice failure={state.failure} onRetry={retry} />}

      {state.status === 'ready' && messages.length === 0 && <p className="rounded-2xl border border-dashed border-line bg-white/70 p-6 text-center text-sm text-muted">This task has no saved messages.</p>}

      {goal && (
        <section className="rounded-3xl border border-line bg-white p-6 shadow-soft">
          <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-muted">Original goal</h2>
          <p className="mt-3 whitespace-pre-wrap break-words text-lg leading-relaxed">{goal.content}</p>
        </section>
      )}

      {result && (
        <section aria-label="Final result" className="rounded-3xl bg-gradient-to-br from-violet via-blue to-cyan p-[1.5px] shadow-lift">
          <div className="rounded-[calc(1.5rem-1.5px)] bg-white p-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-violet">Final result</h2>
              <CopyButton text={result.content} label="Copy result" />
            </div>
            <MessageContent content={result.content} />
          </div>
        </section>
      )}

      {messages.length > 0 && (
        <section className="rounded-3xl border border-line bg-white p-6 shadow-soft">
          <h2 className="font-display text-xl font-bold">Conversation turns</h2>
          <ol className="relative mt-5 space-y-5">
            <span aria-hidden="true" className="absolute bottom-2 left-[13px] top-2 w-px bg-line" />
            {messages.map((m, i) => {
              const mine = m.role === 'USER'
              const replyAfter = !mine && i > 0 ? secondsBetween(messages[i - 1].createdAt, m.createdAt) : null
              return (
                <li key={m.id} className="relative flex gap-4">
                  <span aria-hidden="true" className={`z-10 grid size-7 shrink-0 place-items-center rounded-full text-[11px] font-bold ${mine ? 'bg-violet text-white' : 'border-2 border-mint bg-white text-[#14704D]'}`}>{mine ? 'You' : 'AI'}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{mine ? 'You' : 'NeuronixAI'} {formatDay(m.createdAt) && <span className="font-normal text-muted">· {formatDay(m.createdAt)}</span>}</p>
                    {replyAfter !== null && <p className="inline-flex items-center gap-1 text-xs text-muted"><Clock size={12} aria-hidden="true" /> replied {replyAfter}s after your message (server timestamps)</p>}
                    <p className="mt-1 line-clamp-3 whitespace-pre-wrap break-words text-sm text-ink/80">{m.content}</p>
                  </div>
                </li>
              )
            })}
          </ol>
          <p className="mt-6 rounded-2xl border border-dashed border-line p-3 text-xs text-muted">
            <strong>Agent steps: not available.</strong> The backend doesn’t record which agents or steps handled a task, so no execution graph is shown.
          </p>
        </section>
      )}

      {confirming && (
        <ConfirmDialog
          title="Delete this task?"
          body="This permanently deletes the conversation and all of its messages. This can’t be undone."
          confirmLabel="Delete task"
          busy={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setConfirming(false)}
        />
      )}
    </article>
  )
}
