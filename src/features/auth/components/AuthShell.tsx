import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { BrandLogo } from '../../landing/components/BrandLogo'
import { AuthIllustration } from './AuthIllustration'

interface Props {
  eyebrow: string
  title: string
  subtitle: string
  children: ReactNode
  footer?: ReactNode
}

/** Split layout: form on the left, agent-themed brand panel on the right (hidden on small screens). */
export function AuthShell({ eyebrow, title, subtitle, children, footer }: Props) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <main className="flex flex-col px-5 py-6 sm:px-10 lg:px-16">
        <Link to="/" aria-label="NeuronixAI home" className="w-fit"><BrandLogo /></Link>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
          <p className="text-xs font-bold tracking-[0.16em] text-violet">{eyebrow}</p>
          <h1 className="mt-3 text-4xl font-extrabold leading-tight">{title}</h1>
          <p className="mt-3 text-muted">{subtitle}</p>
          <div className="mt-8 space-y-5">{children}</div>
          {footer && <div className="mt-8 text-sm text-muted">{footer}</div>}
        </div>
      </main>

      <aside aria-hidden="true" className="relative hidden overflow-hidden border-l border-line bg-gradient-to-br from-[#EEEAFF] via-[#EAF1FF] to-[#E4FAFB] lg:flex lg:flex-col lg:items-center lg:justify-center lg:px-12">
        <div className="dot-grid absolute inset-0" />
        <div className="relative flex flex-col items-center text-center">
          <AuthIllustration />
          <h2 className="mt-8 max-w-sm text-3xl font-extrabold">Your goals. The right agents.</h2>
          <p className="mt-3 max-w-sm text-muted">One workspace for coding, planning, writing, research, analysis, and knowledge.</p>
        </div>
      </aside>
    </div>
  )
}
