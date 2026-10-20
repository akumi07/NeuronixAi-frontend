import { CAPABILITIES } from '../data/landingContent'
import { Reveal } from './Reveal'

export function CoreCapabilitiesSection() {
  return (
    <section id="capabilities" className="border-t border-line bg-white/70">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[minmax(0,4fr)_minmax(0,7fr)] lg:py-28">
        <Reveal>
          <p className="text-xs font-bold tracking-[0.16em] text-violet">CORE CAPABILITIES</p>
          <h2 className="mt-3 text-4xl font-extrabold">Built around what you need to get done.</h2>
          <p className="mt-4 text-muted">
            Capabilities are listed as the platform’s design goals; availability depends on what is implemented in your
            workspace.
          </p>
        </Reveal>

        <ul className="grid gap-x-8 sm:grid-cols-2">
          {CAPABILITIES.map((c, i) => (
            <li key={c.title} className="border-t border-line py-5">
              <Reveal delay={(i % 2) * 0.06}>
                <div className="flex gap-4">
                  <span aria-hidden="true" className="mt-1.5 size-2.5 shrink-0 rounded-full" style={{ background: c.color }} />
                  <div>
                    <h3 className="text-[1.05rem] font-bold">{c.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted">{c.body}</p>
                  </div>
                </div>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
