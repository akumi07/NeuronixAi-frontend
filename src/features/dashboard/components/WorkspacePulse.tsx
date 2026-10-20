import type { Conversation, CurrentUser } from '../api/types'
import type { Load } from '../hooks/load'
import { formatDay } from '../data/formatDate'
import { ErrorNotice, Skeleton } from './StateViews'

/** Only figures the API really provides: conversation count, latest activity, and account creation date. */
export function WorkspacePulse({ me, conversations, onRetryMe }: { me: Load<CurrentUser>; conversations: Load<Conversation[]>; onRetryMe: () => void }) {
  const list = conversations.status === 'ready' ? conversations.data : null
  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet via-indigo to-blue p-6 text-white shadow-lift">
      <svg aria-hidden="true" className="absolute -right-6 -top-6 size-40 opacity-20" viewBox="0 0 160 160" fill="none" stroke="#fff">
        <circle cx="80" cy="80" r="30" /><circle cx="80" cy="80" r="55" strokeDasharray="3 6" /><circle cx="135" cy="80" r="5" fill="#fff" /><circle cx="42" cy="38" r="4" fill="#fff" />
      </svg>
      <h2 className="relative font-display text-xl font-bold">Your workspace</h2>
      <dl className="relative mt-5 space-y-5">
        <div>
          <dt className="text-xs uppercase tracking-[0.14em] text-white/70">Conversations</dt>
          <dd className="font-display text-5xl font-extrabold">{list ? list.length : conversations.status === 'loading' ? <Skeleton className="mt-1 h-10 w-16 bg-white/25" /> : '—'}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-[0.14em] text-white/70">Last activity</dt>
          <dd className="font-semibold">{list ? (list[0] ? formatDay(list[0].updatedAt) : 'No activity yet') : '—'}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-[0.14em] text-white/70">Member since</dt>
          <dd className="font-semibold">{me.status === 'ready' ? formatDay(me.data.createdAt) : me.status === 'loading' ? '…' : '—'}</dd>
        </div>
      </dl>
      {me.status === 'error' && <div className="relative mt-4"><ErrorNotice failure={me.failure} onRetry={onRetryMe} /></div>}
      <p className="relative mt-6 border-t border-white/20 pt-4 text-xs text-white/75">Task-level status and agent activity will appear here once the backend provides them.</p>
    </section>
  )
}
