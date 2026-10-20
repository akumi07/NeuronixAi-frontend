import { Loader2, RotateCw, Sparkles, Square } from 'lucide-react'
import type { Failure } from '../../dashboard/api/failures'
import type { ChatMessage } from '../../dashboard/api/types'
import type { Load } from '../../dashboard/hooks/load'
import { ErrorNotice, Skeleton } from '../../dashboard/components/StateViews'
import type { RunPhase } from '../hooks/useTaskSession'
import { CopyButton, MessageContent } from './MessageContent'

interface Props {
  thread: Load<ChatMessage[]>
  pending: string | null
  phase: RunPhase
  failure: Failure | null
  hasFailedMessage: boolean
  onRetryThread: () => void
  onRetrySend: () => void
  onCancel: () => void
  onNewTask: () => void
  /** True while the backend reports an active execution for this conversation. */
  executionActive?: boolean
  onCancelExecution?: () => void
}

function UserBubble({ children }: { children: string }) {
  return (
    <li className="flex justify-end">
      <div className="max-w-[90%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-violet px-4 py-3 leading-relaxed text-white sm:max-w-[80%]">
        <span className="sr-only">You: </span>{children}
      </div>
    </li>
  )
}

function AssistantBubble({ content }: { content: string }) {
  return (
    <li className="flex justify-start">
      <div className="max-w-[95%] rounded-2xl rounded-bl-md border border-line bg-white px-4 py-3 shadow-sm sm:max-w-[85%]">
        <span className="sr-only">NeuronixAI: </span>
        <MessageContent content={content} />
      </div>
    </li>
  )
}

/** The latest answer gets its own prominent "Final result" treatment. */
function ResultCard({ content }: { content: string }) {
  return (
    <li>
      <section aria-label="Final result" className="rounded-3xl bg-gradient-to-br from-violet via-blue to-cyan p-[1.5px] shadow-lift">
        <div className="rounded-[calc(1.5rem-1.5px)] bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-violet">
              <Sparkles size={14} aria-hidden="true" /> Final result
            </p>
            <CopyButton text={content} label="Copy result" />
          </div>
          <MessageContent content={content} />
        </div>
      </section>
    </li>
  )
}

export function ConversationView({ thread, pending, phase, failure, hasFailedMessage, onRetryThread, onRetrySend, onCancel, onNewTask, executionActive, onCancelExecution }: Props) {
  const messages = thread.status === 'ready' ? thread.data : []
  const lastAssistant = (() => {
    for (let i = messages.length - 1; i >= 0; i--) if (messages[i].role === 'ASSISTANT') return messages[i].id
    return null
  })()
  const showResultAsCard = !pending && lastAssistant !== null && messages[messages.length - 1]?.id === lastAssistant

  if (thread.status === 'error') {
    return (
      <div className="space-y-3">
        <ErrorNotice failure={thread.failure} onRetry={onRetryThread} />
        <button type="button" onClick={onNewTask} className="text-sm font-semibold text-violet hover:underline">Start a new task</button>
      </div>
    )
  }

  if (thread.status === 'loading') {
    return <div className="space-y-3" aria-busy="true"><Skeleton className="ml-auto h-12 w-2/3" /><Skeleton className="h-28 w-4/5" /></div>
  }

  return (
    <div className="space-y-4">
      {messages.length === 0 && !pending && (
        <div className="rounded-3xl border border-dashed border-line bg-white/60 p-8 text-center">
          <h2 className="font-display text-2xl font-bold">Describe your goal</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">Coding, planning, writing, research, or analysis: write it in plain language and NeuronixAI will respond below.</p>
        </div>
      )}

      <ul className="space-y-3" aria-live="polite">
        {messages.map((m) =>
          m.role === 'USER' ? <UserBubble key={m.id}>{m.content}</UserBubble>
          : m.id === lastAssistant && showResultAsCard ? <ResultCard key={m.id} content={m.content} />
          : <AssistantBubble key={m.id} content={m.content} />,
        )}
        {pending && <UserBubble>{pending}</UserBubble>}
      </ul>

      {phase === 'sending' && (
        <div role="status" className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-white p-4 text-sm">
          <Loader2 size={16} className="animate-spin text-violet" aria-hidden="true" />
          <span className="flex-1 text-muted">Waiting for NeuronixAI to respond…</span>
          <button type="button" onClick={onCancel} className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 font-semibold hover:border-coral/50 hover:text-coral">
            <Square size={12} aria-hidden="true" /> Stop waiting
          </button>
        </div>
      )}

      {phase === 'running' && executionActive && (
        <div role="status" className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-white p-4 text-sm">
          <Loader2 size={16} className="animate-spin text-violet" aria-hidden="true" />
          <span className="flex-1 text-muted">The backend is working on this task. Progress appears in Task details when it reports it.</span>
          {onCancelExecution && <button type="button" onClick={onCancelExecution} className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 font-semibold hover:border-coral/50 hover:text-coral"><Square size={12} aria-hidden="true" /> Cancel execution</button>}
        </div>
      )}

      {phase === 'cancelled' && (
        <div role="status" className="rounded-2xl border border-amber/50 bg-amber/10 p-4 text-sm text-[#7A5410]">
          <p className="font-semibold">You stopped waiting</p>
          <p>This only stops the browser. The backend may still finish and save the reply, so check your history before sending again.</p>
          {hasFailedMessage && <button type="button" onClick={onRetrySend} className="mt-2 inline-flex items-center gap-1.5 font-semibold underline"><RotateCw size={14} aria-hidden="true" /> Send again</button>}
        </div>
      )}

      {failure && (
        <div className="space-y-2">
          <ErrorNotice failure={failure} onRetry={hasFailedMessage ? onRetrySend : undefined} />
          {failure.title === 'That took too long' && <p className="px-1 text-xs text-muted">The request may still have been saved. Check your history before retrying.</p>}
        </div>
      )}
    </div>
  )
}
