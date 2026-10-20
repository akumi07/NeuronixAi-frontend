import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import type { Failure } from '../../dashboard/api/failures'
import type { Conversation } from '../../dashboard/api/types'
import type { Load } from '../../dashboard/hooks/load'
import { ErrorNotice, Skeleton } from '../../dashboard/components/StateViews'

interface Props {
  state: Load<Conversation[]>
  activeId: number | null
  actionFailure: Failure | null
  onRetry: () => void
  onDelete: (id: number) => void
  onNavigate?: () => void
}

export function HistoryList({ state, activeId, actionFailure, onRetry, onDelete, onNavigate }: Props) {
  const [confirming, setConfirming] = useState<number | null>(null)
  return (
    <nav aria-label="Task history">
      <p className="mb-2 px-1 text-[11px] font-bold uppercase tracking-[0.14em] text-muted">History</p>
      {actionFailure && <div className="mb-2"><ErrorNotice failure={actionFailure} /></div>}
      {state.status === 'loading' && <div className="space-y-2"><Skeleton className="h-9" /><Skeleton className="h-9" /><Skeleton className="h-9" /></div>}
      {state.status === 'error' && <ErrorNotice failure={state.failure} onRetry={onRetry} />}
      {state.status === 'ready' && state.data.length === 0 && <p className="px-1 text-sm text-muted">No tasks yet. Your conversations will appear here.</p>}
      {state.status === 'ready' && (
        <ul className="space-y-0.5">
          {state.data.map((c) => {
            const title = c.title?.trim() || 'Untitled task'
            return (
              <li key={c.id} className="group flex items-center gap-1">
                <Link
                  to={`/app/workspace/${c.id}`}
                  onClick={onNavigate}
                  aria-current={c.id === activeId ? 'page' : undefined}
                  className={`min-w-0 flex-1 truncate rounded-lg px-2.5 py-2 text-sm ${c.id === activeId ? 'bg-violet/10 font-semibold text-violet' : 'text-ink/80 hover:bg-canvas'}`}
                >
                  {title}
                </Link>
                {confirming === c.id ? (
                  <span className="flex shrink-0 gap-1 text-xs">
                    <button type="button" onClick={() => { setConfirming(null); onDelete(c.id) }} className="rounded-md bg-coral px-2 py-1 font-semibold text-white">Delete</button>
                    <button type="button" onClick={() => setConfirming(null)} className="px-1 font-semibold text-muted">No</button>
                  </span>
                ) : (
                  <button type="button" onClick={() => setConfirming(c.id)} aria-label={`Delete “${title}”`} className="grid size-8 shrink-0 place-items-center rounded-md text-muted opacity-60 hover:bg-coral/10 hover:text-coral hover:opacity-100 focus-visible:opacity-100 group-hover:opacity-100">
                    <Trash2 size={14} aria-hidden="true" />
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </nav>
  )
}
