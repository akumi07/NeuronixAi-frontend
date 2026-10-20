import { HOW_IT_WORKS } from '../data/landingContent'
import { Reveal } from './Reveal'

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-32">
      <Reveal className="max-w-2xl">
        <p className="text-xs font-bold tracking-[0.16em] text-violet">HOW IT WORKS</p>
        <h2 className="mt-3 text-4xl font-extrabold sm:text-5xl">From goal to result in three steps.</h2>
      </Reveal>

      <ol className="relative mt-14 grid gap-10 lg:grid-cols-3 lg:gap-8">
        <span
          aria-hidden="true"
          className="absolute left-6 top-6 h-[calc(100%-3rem)] w-px bg-gradient-to-b from-violet via-blue to-cyan lg:left-6 lg:h-px lg:w-[calc(100%-3rem)] lg:bg-gradient-to-r"
        />
        {HOW_IT_WORKS.map((s, i) => (
          <li key={s.title} className="relative pl-16 lg:pl-0 lg:pt-16">
            <Reveal delay={i * 0.1}>
              <span className="absolute left-0 top-0 grid size-12 place-items-center rounded-2xl bg-white font-display text-lg font-extrabold text-violet shadow-soft ring-1 ring-line lg:left-0">
                {i + 1}
              </span>
              <h3 className="text-2xl font-bold">{s.title}</h3>
              <p className="mt-2 max-w-sm leading-relaxed text-muted">{s.body}</p>
            </Reveal>
          </li>
        ))}
      </ol>
    </section>
  )
}
