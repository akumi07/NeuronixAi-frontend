import { useId, useState } from 'react'
import { AgentOrchestrationVisual } from '../../landing/components/AgentOrchestrationVisual'
import type { RunPhase } from '../hooks/useTaskSession'
import { RunPipeline } from './RunPipeline'

interface Props {
  phase: RunPhase
  hasConversation: boolean
  durationMs: number | null
  messageCount: number
}

/** Two clearly separated views: what actually happened, and an illustrative concept of orchestration. */
export function OrchestrationPanel({ phase, hasConversation, durationMs, messageCount }: Props) {
  const [tab, setTab] = useState<'run' | 'concept'>('run')
  const id = useId()
  const tabCls = (active: boolean) =>
    `flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition ${active ? 'bg-white text-violet shadow-sm' : 'text-muted hover:text-ink'}`

  return (
    <section aria-label="Task details" className="rounded-3xl border border-line bg-white p-5 shadow-soft">
      <div role="tablist" aria-label="Task details view" className="flex gap-1 rounded-2xl bg-canvas p-1">
        <button role="tab" id={`${id}-run`} aria-selected={tab === 'run'} aria-controls={`${id}-run-p`} onClick={() => setTab('run')} className={tabCls(tab === 'run')}>This task</button>
        <button role="tab" id={`${id}-concept`} aria-selected={tab === 'concept'} aria-controls={`${id}-concept-p`} onClick={() => setTab('concept')} className={tabCls(tab === 'concept')}>Concept</button>
      </div>

      {tab === 'run' ? (
        <div role="tabpanel" id={`${id}-run-p`} aria-labelledby={`${id}-run`} className="mt-5">
          <RunPipeline phase={phase} hasConversation={hasConversation} durationMs={durationMs} />
          <dl className="mt-6 grid grid-cols-2 gap-3 border-t border-line pt-4 text-sm">
            <div><dt className="text-xs uppercase tracking-wider text-muted">Messages</dt><dd className="font-semibold">{messageCount}</dd></div>
            <div><dt className="text-xs uppercase tracking-wider text-muted">Documents</dt><dd className="font-semibold text-muted">Not connected</dd></div>
          </dl>
        </div>
      ) : (
        <div role="tabpanel" id={`${id}-concept-p`} aria-labelledby={`${id}-concept`} className="mt-5">
          <p className="mb-4 rounded-xl border border-dashed border-violet/40 bg-violet/5 p-3 text-xs text-indigo">
            <strong>Illustrative only.</strong> This shows how NeuronixAI is designed to route goals to specialists. It is not what happened for your task.
          </p>
          <AgentOrchestrationVisual compact />
        </div>
      )}
    </section>
  )
}
