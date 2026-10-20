import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Play, Search, Trash2 } from 'lucide-react'
import type { Failure } from '../../dashboard/api/failures'
import type { Conversation } from '../../dashboard/api/types'
import { ErrorNotice, Skeleton } from '../../dashboard/components/StateViews'
import { formatDay } from '../../dashboard/data/formatDate'
import { ConfirmDialog } from '../../tasks/components/ConfirmDialog'
import { useTaskDetail } from '../../tasks/hooks/useTaskDetail'
import { CopyButton, MessageContent } from '../../workspace/components/MessageContent'

interface Props {
  conversation: Conversation
  onDelete: (id: number) => Promise<{ ok: boolean; failure: Failure | null }>
}

/**
 * Reading view: the full message history in order. Message text is rendered as text/code only.
 * Search here filters the already-loaded messages of this conversation in the browser; the API has no message search.
 */
export function ConversationTranscript({ conversation, onDelete }: Props) {
  const { state, retry } = useTaskDetail(conversation.id)
  const [query, setQuery] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteFailure, setDeleteFailure] = useState<Failure | null>(null)
  const title = conversation.title?.trim() || 'Untitled conversation'

  const messages = useMemo(() => (state.status === 'ready' ? state.data : []), [state])
  const q = query.trim().toLowerCase()
  const shown = useMemo(() => (q ? messages.filter((m) => m.content.toLowerCase().includes(q)) : messages), [messages, q])

  const confirmDelete = async () => {
    setDeleting(true)
    const r = await onDelete(conversation.id)
    setDeleting(false)
    if (!r.ok) { setDeleteFailure(r.failure); setConfirming(false) }
  }

  return (
    <article aria-label="Conversation transcript" className="min-w-0 space-y-5">
      <Link to="/app/conversations" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-violet xl:hidden"><ArrowLeft size={16} aria-hidden="true" /> All conversations</Link>

      <header className="rounded-3xl border border-line bg-white p-6 shadow-soft">
        <p className="text-xs text-muted">Started {formatDay(conversation.createdAt)} · Last message {formatDay(conversation.updatedAt)}{state.status === 'ready' ? ` · ${messages.length} messages` : ''}</p>
        <h1 className="mt-2 break-words font-display text-2xl font-extrabold sm:text-3xl">{title}</h1>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link to={`/app/workspace/${conversation.id}`} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-violet to-indigo px-4 py-2.5 text-sm font-semibold text-white"><Play size={15} aria-hidden="true" /> Continue in workspace</Link>
          <button type="button" onClick={() => { setDeleteFailure(null); setConfirming(true) }} className="inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-muted hover:border-coral/50 hover:text-coral"><Trash2 size={15} aria-hidden="true" /> Delete</button>
        </div>
        {deleteFailure && <div className="mt-4"><ErrorNotice failure={deleteFailure} /></div>}
      </header>

      {state.status === 'loading' && <div className="space-y-3" aria-busy="true"><Skeleton className="ml-auto h-12 w-2/3" /><Skeleton className="h-28 w-4/5" /><Skeleton className="ml-auto h-12 w-1/2" /></div>}
      {state.status === 'error' && <ErrorNotice failure={state.failure} onRetry={retry} />}
      {state.status === 'ready' && messages.length === 0 && <p className="rounded-2xl border border-dashed border-line bg-white/70 p-6 text-center text-sm text-muted">This conversation has no saved messages.</p>}

      {messages.length > 0 && (
        <>
          <div className="relative">
            <label htmlFor="msg-search" className="sr-only">Search in this conversation</label>
            <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input id="msg-search" type="search" maxLength={80} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search in this conversation" className="w-full rounded-xl border border-line bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-violet focus:ring-4 focus:ring-violet/15" />
          </div>
          {q && <p role="status" className="text-sm text-muted">{shown.length} of {messages.length} messages match</p>}

          {shown.length === 0 ? (
            <p className="rounded-2xl bg-white/70 p-6 text-center text-sm text-muted">No messages match “{query.trim()}”.</p>
          ) : (
            <ol className="space-y-4">
              {shown.map((m) => {
                const mine = m.role === 'USER'
                return (
                  <li key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`min-w-0 max-w-[95%] rounded-2xl px-4 py-3 sm:max-w-[85%] ${mine ? 'rounded-br-md bg-violet text-white' : 'rounded-bl-md border border-line bg-white shadow-sm'}`}>
                      <p className={`mb-1 flex items-center justify-between gap-4 text-[11px] font-bold uppercase tracking-[0.12em] ${mine ? 'text-white/70' : 'text-muted'}`}>
                        <span>{mine ? 'You' : 'NeuronixAI'}{formatDay(m.createdAt) && ` · ${formatDay(m.createdAt)}`}</span>
                        {!mine && <CopyButton text={m.content} />}
                      </p>
                      {mine ? <p className="whitespace-pre-wrap break-words leading-relaxed">{m.content}</p> : <MessageContent content={m.content} />}
                    </div>
                  </li>
                )
              })}
            </ol>
          )}
        </>
      )}

      {confirming && (
        <ConfirmDialog
          title="Delete this conversation?"
          body="This permanently deletes the conversation and every message in it. This can’t be undone."
          confirmLabel="Delete conversation"
          busy={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setConfirming(false)}
        />
      )}
    </article>
  )
}
