import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, ArrowUpRight, Lock, Wand2 } from 'lucide-react'
import { useAuth } from '../../auth/context/AuthContext'
import { setHandoffDraft } from '../../workspace/data/handoff'
import { AVAILABILITY_LABEL, AGENT_PROFILES, PROFILE_BY_ID } from '../data/agentCatalog'
import { CatalogNotice } from '../components/CatalogNotice'
import { StatusPill } from '../components/StatusPill'
import type { AgentId } from '../../landing/data/landingContent'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-line bg-white p-6 shadow-soft">
      <h2 className="font-display text-xl font-bold">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  )
}

const Bullets = ({ items }: { items: string[] }) => (
  <ul className="space-y-2">
    {items.map((t) => <li key={t} className="flex gap-3 text-[0.95rem] leading-relaxed"><span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-muted/50" />{t}</li>)}
  </ul>
)

export default function AgentDetailPage() {
  const { agentId } = useParams()
  const { email } = useAuth()
  const navigate = useNavigate()
  const profile = agentId && Object.hasOwn(PROFILE_BY_ID, agentId) ? PROFILE_BY_ID[agentId as AgentId] : null

  if (!profile) {
    return (
      <div className="rounded-3xl border border-dashed border-line bg-white/70 p-10 text-center">
        <h1 className="font-display text-2xl font-bold">Capability not found</h1>
        <p className="mt-2 text-muted">That capability isn’t in the directory.</p>
        <Link to="/app/agents" className="mt-5 inline-flex items-center gap-1.5 font-semibold text-violet hover:underline"><ArrowLeft size={16} aria-hidden="true" /> Back to the directory</Link>
      </div>
    )
  }

  const { agent, category, tagline, inputs, outputs, constraints, examples, availability } = profile
  const Icon = agent.icon

  /** Real action: opens the workspace with the example pre-filled (in memory, never in the URL). Nothing is sent until the user submits. */
  const tryExample = (text: string) => {
    if (email) setHandoffDraft(email, text)
    navigate('/app/workspace')
  }

  return (
    <div className="space-y-6">
      <Link to="/app/agents" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-violet"><ArrowLeft size={16} aria-hidden="true" /> All capabilities</Link>

      <header className="relative overflow-hidden rounded-[2rem] border border-line bg-white p-6 shadow-soft sm:p-8">
        <span aria-hidden="true" className="absolute -right-20 -top-20 size-72 rounded-full opacity-[0.12]" style={{ background: agent.color }} />
        <div className="relative flex flex-wrap items-start gap-5">
          <span className="grid size-20 place-items-center rounded-3xl" style={{ background: `${agent.color}1F`, color: agent.color }}><Icon size={38} aria-hidden="true" /></span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-[0.16em]" style={{ color: agent.color }}>{category}</p>
            <h1 className="mt-1 text-4xl font-extrabold sm:text-5xl">{agent.name}</h1>
            <p className="mt-2 max-w-2xl text-lg text-muted">{agent.description}</p>
            <p className="mt-1 text-muted">{tagline}</p>
          </div>
          <StatusPill availability={availability} />
        </div>
        <p className="relative mt-5 text-sm text-muted">{AVAILABILITY_LABEL[availability].detail}</p>
      </header>

      <CatalogNotice />

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Section title="Inputs and outputs">
            <div className="grid gap-6 sm:grid-cols-2">
              <div><h3 className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-muted">You provide</h3><Bullets items={inputs} /></div>
              <div><h3 className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-muted">You get</h3><Bullets items={outputs} /></div>
            </div>
          </Section>
          <Section title="Constraints"><Bullets items={constraints} /></Section>
          <Section title="Configuration">
            <div className="flex gap-3 rounded-2xl bg-canvas p-4 text-sm text-muted">
              <Lock size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
              <p>There are no configurable settings. The backend exposes no way to create, edit, enable, or disable agents, so no controls are shown. Prompts, system instructions, and provider details are not exposed to the browser.</p>
            </div>
          </Section>
        </div>

        <div className="space-y-6">
          <Section title="Usage examples">
            <ul className="space-y-3">
              {examples.map((ex) => (
                <li key={ex}>
                  <button type="button" onClick={() => tryExample(ex)} className="group flex w-full items-center gap-3 rounded-2xl border border-line bg-canvas px-4 py-3 text-left transition hover:border-violet/40 hover:bg-white">
                    <Wand2 size={16} className="shrink-0" style={{ color: agent.color }} aria-hidden="true" />
                    <span className="flex-1">“{ex}”</span>
                    <ArrowUpRight size={16} className="shrink-0 text-muted group-hover:text-violet" aria-hidden="true" />
                    <span className="sr-only">Open in workspace</span>
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted">Opens the workspace with the prompt filled in. Nothing is sent until you submit it.</p>
          </Section>

          <Section title="Explore other capabilities">
            <ul className="space-y-1">
              {AGENT_PROFILES.filter((p) => p.agent.id !== agent.id).map((p) => {
                const I = p.agent.icon
                return (
                  <li key={p.agent.id}>
                    <Link to={`/app/agents/${p.agent.id}`} className="flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-canvas">
                      <span className="grid size-8 place-items-center rounded-lg" style={{ background: `${p.agent.color}1F`, color: p.agent.color }}><I size={16} aria-hidden="true" /></span>
                      <span className="flex-1 font-semibold">{p.agent.name}</span>
                      <ArrowRight size={16} className="text-muted" aria-hidden="true" />
                    </Link>
                  </li>
                )
              })}
            </ul>
          </Section>
        </div>
      </div>
    </div>
  )
}
