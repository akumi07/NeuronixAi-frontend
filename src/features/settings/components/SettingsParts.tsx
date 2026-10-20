import type { ReactNode } from 'react'

export function SettingsSection({ id, title, description, children }: { id: string; title: string; description: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="grid gap-6 rounded-3xl border border-line bg-white p-6 shadow-soft lg:grid-cols-[240px_minmax(0,1fr)] lg:p-8">
      <div>
        <h2 id={`${id}-h`} className="font-display text-xl font-bold">{title}</h2>
        <p className="mt-1 text-sm text-muted">{description}</p>
      </div>
      <div className="min-w-0 space-y-5">{children}</div>
    </section>
  )
}

export function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4 last:border-0 last:pb-0">
      <dt className="text-sm font-semibold">{label}</dt>
      <dd className="min-w-0 break-words text-sm text-muted">{children}</dd>
    </div>
  )
}

export function Unavailable({ children }: { children: ReactNode }) {
  return <p className="rounded-2xl border border-dashed border-line bg-canvas p-4 text-sm text-muted">{children}</p>
}

export function StatusDot({ tone }: { tone: 'ok' | 'bad' | 'unknown' }) {
  const cls = tone === 'ok' ? 'bg-mint' : tone === 'bad' ? 'bg-coral' : 'bg-muted/50'
  return <span aria-hidden="true" className={`inline-block size-2.5 rounded-full ${cls}`} />
}
