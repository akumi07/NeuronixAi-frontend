import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

type Variant = 'primary' | 'secondary' | 'ghost' | 'light'

const base =
  'inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-[0.95rem] font-semibold transition duration-200 active:scale-[0.98] whitespace-nowrap'

const variants: Record<Variant, string> = {
  primary:
    'bg-gradient-to-br from-violet to-indigo text-white shadow-[0_10px_24px_-8px_rgb(112_71_235/0.65)] hover:shadow-[0_14px_28px_-8px_rgb(112_71_235/0.75)] hover:-translate-y-0.5',
  secondary: 'border border-line bg-white text-ink shadow-sm hover:border-violet/40 hover:text-violet',
  ghost: 'text-ink/80 hover:text-violet px-3',
  light: 'bg-white text-indigo shadow-[0_12px_28px_-10px_rgb(20_20_80/0.5)] hover:-translate-y-0.5',
}

interface Props {
  href: string
  variant?: Variant
  className?: string
  children: ReactNode
  onClick?: () => void
}

/** Renders a router Link for app routes ("/…") and a plain anchor for in-page "#section" links. */
export function LandingButton({ href, variant = 'primary', className = '', children, onClick }: Props) {
  const cls = `${base} ${variants[variant]} ${className}`
  if (href.startsWith('/')) {
    return (
      <Link to={href} className={cls} onClick={onClick}>
        {children}
      </Link>
    )
  }
  return (
    <a href={href} className={cls} onClick={onClick}>
      {children}
    </a>
  )
}
