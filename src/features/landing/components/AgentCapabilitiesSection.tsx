import { AGENTS } from '../data/landingContent'
import { Reveal } from './Reveal'

export function AgentCapabilitiesSection() {
  return (
    <section id="agents" className="border-y border-line bg-white/70">
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
        <Reveal className="grid gap-6 lg:grid-cols-2 lg:items-end">
          <div>
            <p className="text-xs font-bold tracking-[0.16em] text-violet">SPECIALIZED AGENTS</p>
            <h2 className="mt-3 text-4xl font-extrabold sm:text-5xl">Specialists for Every Kind of Work.</h2>
          </div>
          <p className="text-muted lg:pb-2">
            Each agent has a distinct responsibility. NeuronixAI is designed to coordinate the capabilities needed for
            your goal.
          </p>
        </Reveal>

        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {AGENTS.map((a, i) => {
            const Icon = a.icon
            return (
              <li key={a.id} className={i % 3 === 1 ? 'lg:translate-y-6' : ''}>
                <Reveal delay={(i % 3) * 0.07}>
                  <article className="group relative flex h-full min-h-[200px] flex-col overflow-hidden rounded-3xl border border-line bg-canvas p-6 transition duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-lift">
                    <span
                      aria-hidden="true"
                      className="absolute -right-10 -top-10 size-32 rounded-full opacity-0 blur-2xl transition duration-500 group-hover:opacity-30"
                      style={{ background: a.color }}
                    />
                    <span className="relative grid size-12 place-items-center rounded-2xl" style={{ background: `${a.color}1F`, color: a.color }}>
                      <Icon size={24} aria-hidden="true" />
                    </span>
                    <h3 className="relative mt-5 text-xl font-bold">{a.name}</h3>
                    <p className="relative mt-2 leading-relaxed text-muted">{a.description}</p>
                  </article>
                </Reveal>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
