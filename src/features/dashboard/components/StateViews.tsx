import type { ReactNode } from 'react'
import { AlertCircle, RotateCw } from 'lucide-react'
import type { Failure } from '../api/failures'

export function ErrorNotice({ failure, onRetry }: { failure: Failure; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex items-start gap-3 rounded-2xl border border-coral/40 bg-coral/10 p-4 text-sm text-[#9E2B1B]">
      <AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
      <div className="flex-1">
        <p className="font-semibold">{failure.title}</p>
        <p className="opacity-90">{failure.message}</p>
      </div>
      {onRetry && (
        <button type="button" onClick={onRetry} className="inline-flex items-center gap-1.5 rounded-lg border border-coral/40 bg-white px-3 py-1.5 font-semibold hover:bg-coral/5">
          <RotateCw size={14} aria-hidden="true" /> Retry
        </button>
      )}
    </div>
  )
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-xl bg-line/70 ${className}`} />
}

export function Panel({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="rounded-3xl border border-line bg-white p-5 shadow-soft sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-display text-xl font-bold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}
