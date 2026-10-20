import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { BrandLogo } from './BrandLogo'
import { LandingButton } from './LandingButton'
import { NAV_LINKS, ROUTES } from '../data/landingContent'

export function LandingNavbar() {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  return (
    <header className="sticky top-0 z-50 border-b border-line/70 bg-canvas/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        <a href="#top" aria-label="NeuronixAI home" onClick={close}>
          <BrandLogo />
        </a>

        <nav aria-label="Primary" className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href} className="text-[0.92rem] font-medium text-muted transition hover:text-violet">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <LandingButton href={ROUTES.login} variant="ghost">Login</LandingButton>
          <LandingButton href={ROUTES.register} className="!py-2.5">Get Started</LandingButton>
        </div>

        <button
          type="button"
          className="grid size-10 place-items-center rounded-lg border border-line bg-white text-ink md:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <div id="mobile-menu" className="border-t border-line bg-white px-5 pb-5 pt-3 md:hidden">
          <nav aria-label="Mobile" className="flex flex-col">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} onClick={close} className="rounded-lg px-2 py-3 font-medium text-ink hover:bg-canvas">
                {l.label}
              </a>
            ))}
          </nav>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <LandingButton href={ROUTES.login} variant="secondary" onClick={close}>Login</LandingButton>
            <LandingButton href={ROUTES.register} onClick={close}>Get Started</LandingButton>
          </div>
        </div>
      )}
    </header>
  )
}
