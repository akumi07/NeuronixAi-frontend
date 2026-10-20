import { ArrowRight, CheckCircle2, MessageSquareText } from 'lucide-react'
import { Fragment } from 'react'
import { AGENT_BY_ID, WORKFLOW_EXAMPLES } from '../data/landingContent'
import { Reveal } from './Reveal'

export function WorkflowExamplesSection() {
  return (
    <section id="product" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
      <Reveal className="max-w-2xl">
        <p className="text-xs font-bold tracking-[0.16em] text-violet">WORKFLOW EXAMPLES</p>
        <h2 className="mt-3 text-4xl font-extrabold sm:text-5xl">Different Tasks. The Right Intelligence.</h2>
        <p className="mt-4 text-muted">
          Illustrative workflows showing how different requests can involve different capabilities. These are
          examples, not recorded executions.
        </p>
      </Reveal>

      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        {WORKFLOW_EXAMPLES.map((w, i) => (
          <Reveal key={w.id} delay={i * 0.08}>
            <article
              className="relative h-full overflow-hidden rounded-3xl border border-line bg-white p-6 shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-lift"
            >
              <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1" style={{ background: w.color }} />
              <p className="text-xs font-bold uppercase tracking-[0.14em]" style={{ color: w.color }}>{w.label}</p>
              <div className="mt-4 flex gap-3 rounded-2xl bg-canvas p-4">
                <MessageSquareText size={18} className="mt-0.5 shrink-0 text-muted" aria-hidden="true" />
                <p className="font-medium leading-snug">“{w.request}”</p>
              </div>

              <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.14em] text-muted">Illustrative workflow</p>
              <ol className="mt-3 flex flex-wrap items-center gap-2">
                {w.steps.map((id) => {
                  const a = AGENT_BY_ID[id]
                  const Icon = a.icon
                  return (
                    <Fragment key={id}>
                      <li className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold" style={{ borderColor: `${a.color}55`, background: `${a.color}12` }}>
                        <Icon size={16} style={{ color: a.color }} aria-hidden="true" />
                        {a.name}
                      </li>
                      <li aria-hidden="true" className="text-muted"><ArrowRight size={16} /></li>
                    </Fragment>
                  )
                })}
                <li className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-white" style={{ background: w.color }}>
                  <CheckCircle2 size={16} aria-hidden="true" />
                  {w.outcome}
                </li>
              </ol>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
