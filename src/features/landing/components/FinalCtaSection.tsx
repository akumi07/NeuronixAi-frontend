import { ROUTES } from '../data/landingContent'
import { LandingButton } from './LandingButton'
import { Reveal } from './Reveal'

export function FinalCtaSection() {
  return (
    <section id="get-started" className="px-5 pb-20 sm:px-8 lg:pb-28">
      <Reveal>
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-gradient-to-br from-violet via-indigo to-blue px-6 py-16 text-center text-white sm:px-12 lg:py-24">
          <svg aria-hidden="true" className="absolute inset-0 size-full opacity-20" preserveAspectRatio="xMidYMid slice" viewBox="0 0 800 400" fill="none">
            <g stroke="#fff" strokeWidth="1">
              <path d="M0 300 C200 240 300 360 520 280 S720 200 800 240" />
              <path d="M0 340 C220 290 320 400 540 320 S740 250 800 290" />
            </g>
            <g fill="#fff">
              <circle cx="520" cy="280" r="4" /><circle cx="200" cy="268" r="3" /><circle cx="680" cy="226" r="3" />
            </g>
          </svg>
          <h2 className="relative mx-auto max-w-3xl text-4xl font-extrabold leading-tight sm:text-5xl">
            Your Goals. The Right Agents. One Workspace.
          </h2>
          <p className="relative mx-auto mt-5 max-w-xl text-lg text-white/85">
            Bring your tasks together in one intelligent workspace designed around specialized AI capabilities.
          </p>
          <div className="relative mt-9 flex justify-center">
            <LandingButton href={ROUTES.register} variant="light">Get Started</LandingButton>
          </div>
        </div>
      </Reveal>
    </section>
  )
}
