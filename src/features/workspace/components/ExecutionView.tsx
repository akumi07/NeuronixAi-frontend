import { CheckCircle2, CircleDashed, Clock, Loader2, RotateCw, XCircle, Ban, HelpCircle, Square } from 'lucide-react'
import { isTerminal, type Execution, type ExecutionStatus, type ExecutionStep } from '../../../api/contracts/orchestration'
import { ErrorNotice, InDevelopmentNotice, Skeleton } from '../../dashboard/components/StateViews'
import { formatDay, secondsBetween } from '../../dashboard/data/formatDate'
import type { ExecutionsApi } from '../hooks/useExecutions'
import { resolveAgent } from './agentVisual'
import { MessageContent } from './MessageContent'

const STATUS: Record<ExecutionStatus, { label: string; cls: string; Icon: typeof Clock; spin?: boolean }> = {
  QUEUED: { label: 'Queued', cls: 'bg-amber/25 text-[#7A5410]', Icon: Clock },
  RUNNING: { label: 'Running', cls: 'bg-blue/15 text-[#1F5BB8]', Icon: Loader2, spin: true },
  COMPLETED: { label: 'Completed', cls: 'bg-mint/20 text-[#14704D]', Icon: CheckCircle2 },
  FAILED: { label: 'Failed', cls: 'bg-coral/15 text-[#9E2B1B]', Icon: XCircle },
  CANCELLED: { label: 'Cancelled', cls: 'bg-line text-muted', Icon: Ban },
  UNKNOWN: { label: 'Unknown status', cls: 'bg-line text-muted', Icon: HelpCircle },
}

export function StatusBadge({ status }: { status: ExecutionStatus }) {
  const { label, cls, Icon, spin } = STATUS[status]
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${cls}`}><Icon size={13} className={spin ? 'animate-spin' : ''} aria-hidden="true" />{label}</span>
}

/** Duration only when the backend supplies it (directly, or as two timestamps). Nothing is estimated. */
function duration(item: { durationMs?: number; startedAt?: string; finishedAt?: string; createdAt?: string; updatedAt?: string }, terminal: boolean): string | null {
  if (item.durationMs !== undefined) return `${(item.durationMs / 1000).toFixed(1)}s`
  const s = item.startedAt && item.finishedAt ? secondsBetween(item.startedAt, item.finishedAt) : terminal && item.createdAt && item.updatedAt ? secondsBetween(item.createdAt, item.updatedAt) : null
  return s === null ? null : `${s}s`
}

const clip = (t: string, n = 240) => (t.length > n ? `${t.slice(0, n)}…` : t)

function StepRow({ step }: { step: ExecutionStep }) {
  const agent = step.agent ? resolveAgent(step.agent) : null
  const s = STATUS[step.status]
  const d = duration(step, isTerminal(step.status))
  return (
    <li className="relative flex gap-3">
      <span aria-hidden="true" className={`z-10 mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-white ring-2 ring-line ${step.status === 'COMPLETED' ? 'text-[#14704D]' : step.status === 'FAILED' ? 'text-coral' : step.status === 'RUNNING' ? 'text-blue' : 'text-muted'}`}>
        {step.status === 'QUEUED' || step.status === 'UNKNOWN' ? <CircleDashed size={14} /> : <s.Icon size={14} className={s.spin ? 'animate-spin' : ''} />}
      </span>
      <div className="min-w-0 flex-1 pb-3">
        <p className="flex flex-wrap items-center gap-x-2 text-sm font-semibold">
          {step.name ?? agent?.name ?? `Step ${step.id}`}
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${s.cls}`}>{s.label}</span>
          {d && <span className="text-xs font-normal text-muted">{d}</span>}
          {step.attempt !== undefined && step.attempt > 1 && <span className="text-xs font-normal text-muted">attempt {step.attempt}</span>}
        </p>
        {agent && step.name && <p className="text-xs text-muted">{agent.name}{agent.role ? ` · ${agent.role}` : ''}</p>}
        {step.dependsOn && step.dependsOn.length > 0 && <p className="text-xs text-muted">After step {step.dependsOn.join(', ')}</p>}
        {step.error?.message && <p className="mt-1 text-xs text-[#9E2B1B]">{clip(step.error.message)}</p>}
        {step.result && <details className="mt-1 text-xs"><summary className="cursor-pointer font-semibold text-violet">Step result</summary><div className="mt-1 rounded-lg bg-canvas p-2 text-sm"><MessageContent content={step.result} /></div></details>}
      </div>
    </li>
  )
}

function ExecutionCard({ ex, tracker }: { ex: Execution; tracker: ExecutionsApi }) {
  const terminal = isTerminal(ex.status)
  const d = duration(ex, terminal)
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={ex.status} />
        {d && <span className="text-xs text-muted">{d}</span>}
        {ex.retryCount !== undefined && ex.retryCount > 0 && <span className="text-xs text-muted">{ex.retryCount} {ex.retryCount === 1 ? 'retry' : 'retries'}</span>}
        {ex.createdAt && <span className="text-xs text-muted">Started {formatDay(ex.createdAt)}</span>}
      </div>
      {ex.message && !terminal && <p className="text-sm text-muted">{clip(ex.message)}</p>}

      <div>
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-muted">Selected by the backend</p>
        {ex.selectedAgents.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line p-3 text-sm text-muted">The backend hasn’t reported which agents were selected yet.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {ex.selectedAgents.map((a) => {
              const v = resolveAgent(a)
              return (
                <li key={v.key} className="inline-flex items-center gap-2 rounded-xl border px-2.5 py-1.5 text-sm font-semibold" style={{ borderColor: `${v.color}66`, background: `${v.color}12` }}>
                  <v.Icon size={15} style={{ color: v.color }} aria-hidden="true" />
                  <span>{v.name}{v.role && <span className="ml-1 font-normal text-muted">· {v.role}</span>}</span>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {ex.steps.length > 0 && (
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-muted">Workflow steps</p>
          <ol className="relative">
            <span aria-hidden="true" className="absolute bottom-3 left-[11px] top-3 w-px bg-line" />
            {ex.steps.map((s) => <StepRow key={s.id} step={s} />)}
          </ol>
        </div>
      )}

      {ex.error?.message && <p role="alert" className="rounded-xl bg-coral/10 p-3 text-sm text-[#9E2B1B]">{clip(ex.error.message, 400)}</p>}
      {ex.result && <details className="text-sm"><summary className="cursor-pointer font-semibold text-violet">Execution result</summary><div className="mt-2 rounded-xl bg-canvas p-3"><MessageContent content={ex.result} /></div></details>}

      {!terminal && (
        <button type="button" onClick={() => void tracker.cancel(ex.executionId)} className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm font-semibold hover:border-coral/50 hover:text-coral">
          <Square size={12} aria-hidden="true" /> Cancel execution
        </button>
      )}
    </div>
  )
}

/** Renders ONLY execution data returned by the backend. Nothing here is inferred or simulated. */
export function ExecutionView({ tracker }: { tracker: ExecutionsApi }) {
  if (tracker.loading) return <div aria-busy="true" className="space-y-2"><Skeleton className="h-6 w-32" /><Skeleton className="h-16" /></div>
  const { latest } = tracker
  const earlier = tracker.executions.slice(1)
  return (
    <div className="space-y-4">
      {tracker.failure && <ErrorNotice failure={tracker.failure} onRetry={tracker.recheck} />}
      {tracker.cancelFailure && <ErrorNotice failure={tracker.cancelFailure} />}
      {tracker.pollingStopped && (
        <p role="status" className="flex items-center gap-2 rounded-xl bg-amber/15 p-3 text-sm text-[#7A5410]">
          Stopped checking for updates. <button type="button" onClick={tracker.recheck} className="inline-flex items-center gap-1 font-semibold underline"><RotateCw size={13} aria-hidden="true" /> Check again</button>
        </p>
      )}
      {latest && <ExecutionCard ex={latest} tracker={tracker} />}
      {earlier.length > 0 && (
        <details className="rounded-xl border border-line p-3 text-sm">
          <summary className="cursor-pointer font-semibold">Earlier executions ({earlier.length})</summary>
          <ul className="mt-3 space-y-3">
            {earlier.map((e) => (
              <li key={e.executionId} className="flex flex-wrap items-center gap-2 border-t border-line pt-3 first:border-0 first:pt-0">
                <StatusBadge status={e.status} />
                <span className="min-w-0 flex-1 truncate text-muted">{e.prompt ? clip(e.prompt, 80) : `Execution ${e.executionId}`}</span>
                {e.createdAt && <span className="text-xs text-muted">{formatDay(e.createdAt)}</span>}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}

export function ExecutionUnavailable({ tracker }: { tracker: ExecutionsApi }) {
  return <InDevelopmentNotice compact message="Automatic agent selection and execution tracking are still in development. They will appear here when the backend integration is ready." onRetry={tracker.recheck} />
}
