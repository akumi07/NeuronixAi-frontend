import { Loader2, Plus } from 'lucide-react'
import type { ChatMessage } from '../api/types'
import type { Load } from '../hooks/useWorkspace'
import { ErrorNotice, Skeleton } from './StateViews'

interface Props {
  title: string
  thread: Load<ChatMessage[]>
  pendingMessage: string | null
  onNewTask: () => void
  onRetry: () => void
}

/** Message content is rendered as plain text only (never as HTML or markdown). */
function Bubble({ role, children }: { role: string; children: string }) {
  const mine = role === 'USER'
  return (
    <li className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[90%] whitespace-pre-wrap break-words rounded-2xl px-4 py-3 text-[0.95rem] leading-relaxed sm:max-w-[80%] ${mine ? 'rounded-br-md bg-violet text-white' : 'rounded-bl-md border border-line bg-white shadow-sm'}`}>
        <span className="sr-only">{mine ? 'You: ' : 'NeuronixAI: '}</span>
        {children}
      </div>
    </li>
  )
}

export function ConversationThread({ title, thread, pendingMessage, onNewTask, onRetry }: Props) {
  return (
    <section aria-label="Conversation" className="rounded-3xl border border-line bg-canvas/60 p-4 sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="min-w-0 truncate font-display text-xl font-bold">{title}</h2>
        <button type="button" onClick={onNewTask} className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-line bg-white px-3 py-2 text-sm font-semibold hover:border-violet/40 hover:text-violet">
          <Plus size={16} aria-hidden="true" /> New task
        </button>
      </div>

      {thread.status === 'loading' && !pendingMessage && <div className="space-y-3"><Skeleton className="ml-auto h-12 w-2/3" /><Skeleton className="h-24 w-4/5" /></div>}
      {thread.status === 'error' && <ErrorNotice failure={thread.failure} onRetry={onRetry} />}

      <ul className="space-y-3">
        {thread.status === 'ready' && thread.data.map((m) => <Bubble key={m.id} role={m.role}>{m.content}</Bubble>)}
        {pendingMessage && <Bubble role="USER">{pendingMessage}</Bubble>}
      </ul>

      {pendingMessage && (
        <p role="status" className="mt-4 flex items-center gap-2 text-sm text-muted">
          <Loader2 size={16} className="animate-spin" aria-hidden="true" /> NeuronixAI is working on it…
        </p>
      )}
    </section>
  )
}
