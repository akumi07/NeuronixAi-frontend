import { Link } from 'react-router-dom'
import { BrandLogo } from './BrandLogo'
import { FOOTER_LINKS, ROUTES } from '../data/landingContent'

export function LandingFooter() {
  const linkCls = 'text-sm text-muted transition hover:text-violet'
  return (
    <footer className="border-t border-line bg-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 md:grid-cols-[2fr_1fr_1fr]">
        <div>
          <BrandLogo />
          <p className="mt-4 max-w-xs text-sm text-muted">An intelligent multi-agent AI workspace for coordinating specialized capabilities around your goals.</p>
        </div>
        <nav aria-label="Product">
          <h2 className="font-sans text-xs font-bold uppercase tracking-[0.14em] text-ink">Product</h2>
          <ul className="mt-4 space-y-3">
            {FOOTER_LINKS.Product.map((l) => (
              <li key={l.href}><a href={l.href} className={linkCls}>{l.label}</a></li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Account">
          <h2 className="font-sans text-xs font-bold uppercase tracking-[0.14em] text-ink">Account</h2>
          <ul className="mt-4 space-y-3">
            <li><Link to={ROUTES.login} className={linkCls}>Login</Link></li>
            <li><Link to={ROUTES.register} className={linkCls}>Register</Link></li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-line py-5 text-center text-xs text-muted">© {new Date().getFullYear()} NeuronixAI</div>
    </footer>
  )
}
