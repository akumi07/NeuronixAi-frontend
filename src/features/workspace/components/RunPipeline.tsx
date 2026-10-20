import { AGENTS } from '../../landing/data/landingContent'
import type { RunPhase } from '../hooks/useTaskSession'

interface Props {
  phase: RunPhase
  hasConversation: boolean
  durationMs: number | null
}

type Tone = 'done' | 'active' | 'idle' | 'error' | 'na'

const toneDot: Record<Tone, string> = {
  done: 'bg-mint text-white border-mint',
  active: 'bg-violet text-white border-violet animate-pulse',
  idle: 'bg-white text-muted border-line',
  error: 'bg-coral text-white border-coral',
  na: 'bg-white text-muted/60 border-dashed border-muted/40',
}

/**
 * Honest run view. Solid nodes reflect states the browser actually observed. Dashed nodes are stages
 * the backend does not report (no routing, agent-selection, or per-step events exist in its API).
 */
export function RunPipeline({ phase, hasConversation, durationMs }: Props) {
  const goal: { tone: Tone; text: string } =
    phase === 'sending' ? { tone: 'done', text: 'Sent to the backend' }
    : phase === 'idle' ? { tone: hasConversation ? 'done' : 'idle', text: hasConversation ? 'Conversation loaded' : 'Waiting for a goal' }
    : { tone: 'done', text: 'Sent to the backend' }

  const result: { tone: Tone; text: string } =
    phase === 'sending' ? { tone: 'active', text: 'Waiting for the response…' }
    : phase === 'received' ? { tone: 'done', text: `Response received${durationMs ? ` in ${(durationMs / 1000).toFixed(1)}s (measured here)` : ''}` }
    : phase === 'failed' ? { tone: 'error', text: 'Request failed' }
    : phase === 'cancelled' ? { tone: 'error', text: 'You stopped waiting' }
    : { tone: 'idle', text: hasConversation ? 'See the conversation' : 'No result yet' }

  const steps = [
    { n: 1, title: 'Your goal', tone: goal.tone, text: goal.text, actual: true },
    { n: 2, title: 'Routing & planning', tone: 'na' as Tone, text: 'Not reported. The backend doesn’t expose routing decisions.', actual: false },
    { n: 3, title: 'Specialist agents', tone: 'na' as Tone, text: 'Not reported. Which capabilities handled a task isn’t exposed.', actual: false },
    { n: 4, title: 'Result', tone: result.tone, text: result.text, actual: true },
  ]

  return (
    <div>
      <ol className="relative space-y-5">
        <span aria-hidden="true" className="absolute left-[15px] top-4 h-[calc(100%-2rem)] w-px bg-gradient-to-b from-violet/50 via-line to-cyan/50" />
        {steps.map((s) => (
          <li key={s.n} className="relative flex gap-4">
            <span aria-hidden="true" className={`z-10 grid size-8 shrink-0 place-items-center rounded-full border-2 text-xs font-bold ${toneDot[s.tone]}`}>{s.n}</span>
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2 font-semibold">
                {s.title}
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${s.actual ? 'bg-mint/20 text-[#14704D]' : 'border border-dashed border-muted/40 text-muted'}`}>
                  {s.actual ? 'Actual' : 'Not available'}
                </span>
              </p>
              <p className="mt-0.5 text-sm text-muted">{s.text}</p>
              {s.n === 3 && (
                <ul className="mt-2 flex gap-1.5" aria-label="Specialist capabilities (not selected by this task)">
                  {AGENTS.map((a) => {
                    const Icon = a.icon
                    return <li key={a.id} title={a.name} className="grid size-7 place-items-center rounded-lg border border-dashed border-line text-muted/60"><Icon size={14} aria-hidden="true" /><span className="sr-only">{a.name}</span></li>
                  })}
                </ul>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
