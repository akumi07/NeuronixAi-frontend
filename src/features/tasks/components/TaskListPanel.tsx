import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, RefreshCw, Search } from 'lucide-react'
import type { Conversation } from '../../dashboard/api/types'
import type { Load } from '../../dashboard/hooks/load'
import { daysAgo, formatDay } from '../../dashboard/data/formatDate'
import { ErrorNotice, Skeleton } from '../../dashboard/components/StateViews'

const PAGE_SIZE = 8
type Sort = 'updated' | 'created' | 'title'
type Range = 'all' | '1' | '7' | '30'

const titleOf = (c: Conversation) => c.title?.trim() || 'Untitled task'
const bucket = (iso: string) => { const d = daysAgo(iso); return d <= 0 ? 'Today' : d === 1 ? 'Yesterday' : d <= 7 ? 'This week' : 'Earlier' }

interface Props {
  state: Load<Conversation[]>
  activeId: number | null
  refreshing: boolean
  onRefresh: () => void
  onRetry: () => void
  /** Route prefix for item links, e.g. '/app/tasks' or '/app/conversations'. */
  basePath?: string
  noun?: { plural: string; startLabel: string; emptyBody: string }
}

/**
 * Search, range filter, sort and pagination are all client-side: the API returns the user's whole
 * conversation list with no server-side query, sort or paging.
 */
const TASK_NOUN = { plural: 'tasks', startLabel: 'Start a task', emptyBody: 'Every task you start in the workspace is saved here so you can revisit the goal and the result.' }

export function TaskListPanel({ state, activeId, refreshing, onRefresh, onRetry, basePath = '/app/tasks', noun = TASK_NOUN }: Props) {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<Sort>('updated')
  const [range, setRange] = useState<Range>('all')
  const [page, setPage] = useState(0)

  const filtered = useMemo(() => {
    if (state.status !== 'ready') return []
    const q = query.trim().toLowerCase()
    const items = state.data.filter((c) => (!q || titleOf(c).toLowerCase().includes(q)) && (range === 'all' || daysAgo(c.updatedAt) <= Number(range)))
    const key = (c: Conversation) => (sort === 'created' ? c.createdAt : c.updatedAt)
    return items.sort((a, b) => (sort === 'title' ? titleOf(a).localeCompare(titleOf(b)) : key(b).localeCompare(key(a))))
  }, [state, query, sort, range])

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current = Math.min(page, pages - 1)
  const visible = filtered.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE)
  const reset = <T,>(set: (v: T) => void) => (v: T) => { set(v); setPage(0) }
  const selectCls = 'rounded-xl border border-line bg-white px-3 py-2 text-sm font-medium outline-none focus:border-violet focus:ring-4 focus:ring-violet/15'

  return (
    <section aria-label={`${noun.plural} list`} className="min-w-0 rounded-3xl border border-line bg-white p-4 shadow-soft sm:p-5">
      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <label htmlFor="task-search" className="sr-only">Search {noun.plural}</label>
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input id="task-search" type="search" maxLength={80} value={query} onChange={(e) => reset(setQuery)(e.target.value)} placeholder={`Search ${noun.plural} by title`} className="w-full rounded-xl border border-line bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-violet focus:ring-4 focus:ring-violet/15" />
        </div>
        <button type="button" onClick={onRefresh} aria-label={`Refresh ${noun.plural}`} className="grid size-10 shrink-0 place-items-center rounded-xl border border-line text-muted hover:border-violet/40 hover:text-violet">
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} aria-hidden="true" />
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <label className="sr-only" htmlFor="task-range">Time range</label>
        <select id="task-range" value={range} onChange={(e) => reset(setRange)(e.target.value as Range)} className={selectCls}>
          <option value="all">Any time</option><option value="1">Last 2 days</option><option value="7">Last 7 days</option><option value="30">Last 30 days</option>
        </select>
        <label className="sr-only" htmlFor="task-sort">Sort by</label>
        <select id="task-sort" value={sort} onChange={(e) => reset(setSort)(e.target.value as Sort)} className={selectCls}>
          <option value="updated">Recently updated</option><option value="created">Recently created</option><option value="title">Title A–Z</option>
        </select>
      </div>

      <div className="mt-5">
        {state.status === 'loading' && <div className="space-y-3" aria-busy="true"><Skeleton className="h-16" /><Skeleton className="h-16" /><Skeleton className="h-16" /></div>}
        {state.status === 'error' && <ErrorNotice failure={state.failure} onRetry={onRetry} />}

        {state.status === 'ready' && state.data.length === 0 && (
          <div className="rounded-2xl border border-dashed border-line bg-canvas p-8 text-center">
            <h2 className="font-display text-lg font-bold">No {noun.plural} yet</h2>
            <p className="mx-auto mt-1 max-w-xs text-sm text-muted">{noun.emptyBody}</p>
            <Link to="/app/workspace" className="mt-4 inline-block rounded-xl bg-gradient-to-br from-violet to-indigo px-4 py-2.5 text-sm font-semibold text-white">{noun.startLabel}</Link>
          </div>
        )}
        {state.status === 'ready' && state.data.length > 0 && filtered.length === 0 && (
          <p className="rounded-2xl bg-canvas p-6 text-center text-sm text-muted">Nothing matches your filters.</p>
        )}

        {visible.length > 0 && (
          <ol className="relative space-y-1">
            <span aria-hidden="true" className="absolute bottom-3 left-[7px] top-3 w-px bg-line" />
            {visible.map((c, i) => {
              const group = sort !== 'title' ? bucket(sort === 'created' ? c.createdAt : c.updatedAt) : null
              const prev = i > 0 && sort !== 'title' ? bucket(sort === 'created' ? visible[i - 1].createdAt : visible[i - 1].updatedAt) : null
              const active = c.id === activeId
              return (
                <li key={c.id}>
                  {group && group !== prev && <p className="mb-1 ml-7 mt-3 text-[11px] font-bold uppercase tracking-[0.14em] text-muted">{group}</p>}
                  <Link to={`${basePath}/${c.id}`} aria-current={active ? 'page' : undefined} className={`relative flex items-start gap-3 rounded-2xl py-3 pl-0 pr-3 transition ${active ? 'bg-violet/10' : 'hover:bg-canvas'}`}>
                    <span aria-hidden="true" className={`z-10 mt-1.5 size-[15px] shrink-0 rounded-full border-[3px] ${active ? 'border-violet bg-white' : 'border-line bg-white'}`} />
                    <span className="min-w-0 flex-1">
                      <span className={`block truncate font-semibold ${active ? 'text-violet' : ''}`}>{titleOf(c)}</span>
                      <span className="block text-xs text-muted">Updated {formatDay(c.updatedAt)} · Created {formatDay(c.createdAt)}</span>
                    </span>
                  </Link>
                </li>
              )
            })}
          </ol>
        )}

        {filtered.length > PAGE_SIZE && (
          <nav aria-label="Pagination" className="mt-4 flex items-center justify-between text-sm">
            <button type="button" disabled={current === 0} onClick={() => setPage(current - 1)} className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 font-semibold text-violet disabled:text-muted/50"><ChevronLeft size={16} aria-hidden="true" /> Newer</button>
            <span className="text-muted">Page {current + 1} of {pages}</span>
            <button type="button" disabled={current >= pages - 1} onClick={() => setPage(current + 1)} className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 font-semibold text-violet disabled:text-muted/50">Older <ChevronRight size={16} aria-hidden="true" /></button>
          </nav>
        )}
        {state.status === 'ready' && <p role="status" className="mt-4 text-xs text-muted">{filtered.length} of {state.data.length} {noun.plural}</p>}
      </div>
    </section>
  )
}
