import { useState } from 'react'
import { ArrowUpRight, MessagesSquare, Trash2 } from 'lucide-react'
import type { Failure } from '../api/failures'
import type { Conversation } from '../api/types'
import type { Load } from '../hooks/useWorkspace'
import { formatDay } from '../data/formatDate'
import { ErrorNotice, Panel, Skeleton } from './StateViews'

const EXAMPLES = ['Help me debug this Java exception.', 'Plan a product launch and write the announcement.', 'Explain how OAuth 2.0 works.']

interface Props {
  state: Load<Conversation[]>
  activeId: number | null
  actionFailure: Failure | null
  onOpen: (id: number) => void
  onDelete: (id: number) => void
  onRetry: () => void
  onExample: (text: string) => void
}

export function RecentWork({ state, activeId, actionFailure, onOpen, onDelete, onRetry, onExample }: Props) {
  const [confirming, setConfirming] = useState<number | null>(null)

  return (
    <Panel title="Recent work">
      {actionFailure && <div className="mb-3"><ErrorNotice failure={actionFailure} /></div>}

      {state.status === 'loading' && (
        <div className="space-y-3"><Skeleton className="h-14" /><Skeleton className="h-14" /><Skeleton className="h-14" /></div>
      )}
      {state.status === 'error' && <ErrorNotice failure={state.failure} onRetry={onRetry} />}

      {state.status === 'ready' && state.data.length === 0 && (
        <div className="rounded-2xl border border-dashed border-line bg-canvas p-6 text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-violet/10 text-violet"><MessagesSquare size={22} aria-hidden="true" /></span>
          <h3 className="mt-4 text-lg font-bold">Your first task starts here</h3>
          <p className="mx-auto mt-1 max-w-xs text-sm text-muted">Tasks you start will appear here so you can pick them back up. Try one of these:</p>
          <ul className="mt-4 flex flex-col items-center gap-2">
            {EXAMPLES.map((t) => (
              <li key={t}>
                <button type="button" onClick={() => onExample(t)} className="rounded-full border border-line bg-white px-4 py-2 text-sm font-medium hover:border-violet/40 hover:text-violet">
                  “{t}”
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {state.status === 'ready' && state.data.length > 0 && (
        <ul className="divide-y divide-line">
          {state.data.slice(0, 8).map((c) => (
            <li key={c.id} className="flex items-center gap-2 py-1">
              <button
                type="button"
                onClick={() => onOpen(c.id)}
                aria-current={c.id === activeId ? 'true' : undefined}
                className="group flex min-w-0 flex-1 items-center gap-3 rounded-xl px-2 py-3 text-left transition hover:bg-canvas"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{c.title?.trim() || 'Untitled task'}</span>
                  <span className="block text-xs text-muted">Updated {formatDay(c.updatedAt)}</span>
                </span>
                <ArrowUpRight size={16} className="shrink-0 text-muted transition group-hover:text-violet" aria-hidden="true" />
              </button>
              {confirming === c.id ? (
                <span className="flex items-center gap-1 text-xs">
                  <button type="button" onClick={() => { setConfirming(null); onDelete(c.id) }} className="rounded-lg bg-coral px-2.5 py-1.5 font-semibold text-white">Delete</button>
                  <button type="button" onClick={() => setConfirming(null)} className="rounded-lg px-2 py-1.5 font-semibold text-muted hover:text-ink">Cancel</button>
                </span>
              ) : (
                <button type="button" onClick={() => setConfirming(c.id)} aria-label={`Delete “${c.title?.trim() || 'Untitled task'}”`} className="grid size-9 shrink-0 place-items-center rounded-lg text-muted hover:bg-coral/10 hover:text-coral">
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}
