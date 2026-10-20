import { Ban, Search, ShieldAlert } from 'lucide-react'

const rows = [
  { Icon: Search, title: 'Search and retrieval', body: 'Not available. There is no user-facing search endpoint; the retrieval endpoints that exist are internal test routes.' },
  { Icon: Ban, title: 'Deleting documents', body: 'Not available. The backend has no delete endpoint, so uploaded files can’t be removed from here.' },
  { Icon: ShieldAlert, title: 'Why retrieval isn’t wired in', body: 'Those test routes take a document id and show no ownership check, so using them could expose another user’s document. They stay disconnected until the backend enforces ownership.' },
]

export function RetrievalNotes() {
  return (
    <section aria-label="What is not available" className="rounded-3xl border border-dashed border-line bg-white/60 p-5 sm:p-6">
      <h2 className="font-display text-xl font-bold">What isn’t available yet</h2>
      <ul className="mt-4 space-y-4">
        {rows.map(({ Icon, title, body }) => (
          <li key={title} className="flex gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-canvas text-muted"><Icon size={16} aria-hidden="true" /></span>
            <div><p className="font-semibold">{title}</p><p className="text-sm text-muted">{body}</p></div>
          </li>
        ))}
      </ul>
    </section>
  )
}
