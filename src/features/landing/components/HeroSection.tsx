import { ArrowRight } from 'lucide-react'
import { AgentOrchestrationVisual } from './AgentOrchestrationVisual'
import { LandingButton } from './LandingButton'
import { ROUTES } from '../data/landingContent'

export function HeroSection() {
  return (
    <section id="top" className="relative overflow-hidden">
      <div aria-hidden="true" className="dot-grid absolute inset-0" />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-[560px] bg-[radial-gradient(60%_60%_at_80%_20%,rgb(112_71_235/0.10),transparent),radial-gradient(40%_50%_at_95%_60%,rgb(32_201_215/0.12),transparent)]"
      />
      <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 pb-20 pt-14 sm:px-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-10 lg:pb-28 lg:pt-20">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-2 rounded-full border border-violet/20 bg-white px-3.5 py-1.5 text-[11px] font-bold tracking-[0.16em] text-violet shadow-sm">
            <span className="size-1.5 rounded-full bg-gradient-to-br from-violet to-cyan" />
            INTELLIGENT MULTI-AGENT AI
          </p>
          <h1 className="mt-6 text-[2.5rem] font-extrabold leading-[1.05] sm:text-6xl lg:text-5xl xl:text-[3.5rem]">
            One AI Workspace.{' '}
            <span className="bg-gradient-to-r from-violet via-indigo to-blue bg-clip-text text-transparent">
              A Team of Specialized Agents.
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
            From coding and planning to writing, research, analysis, and document intelligence, NeuronixAI brings the
            right AI capabilities together around your goals.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <LandingButton href={ROUTES.register}>
              Start Building <ArrowRight size={18} />
            </LandingButton>
            <LandingButton href="#product" variant="secondary">Explore the Platform</LandingButton>
          </div>
          <p className="mt-8 flex items-center gap-3 text-sm font-medium text-ink/70">
            <span aria-hidden="true" className="h-px w-8 bg-gradient-to-r from-violet to-cyan" />
            One workspace. Multiple specialized capabilities.
          </p>
        </div>

        <AgentOrchestrationVisual />
      </div>
    </section>
  )
}
