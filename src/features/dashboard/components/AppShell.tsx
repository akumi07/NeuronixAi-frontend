import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Bot, Globe, History, Library, MessagesSquare, LayoutDashboard, Menu, Plus, Sparkles, X } from 'lucide-react'
import { BrandLogo } from '../../landing/components/BrandLogo'
import { AccountMenu } from './AccountMenu'

interface Props {
  email: string
  onLogout: () => Promise<void>
  active: 'dashboard' | 'workspace' | 'tasks' | 'conversations' | 'agents' | 'knowledge'
  /** Extra sidebar content (e.g. task history), rendered between navigation and the account menu. */
  sidebarExtra?: (closeMenu: () => void) => ReactNode
  wide?: boolean
  children: ReactNode
}

/** Application shell. Only sections that exist are linked: the dashboard and the public website. */
export function AppShell({ email, onLogout, active, sidebarExtra, wide, children }: Props) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const sidebar = (
    <div className="flex h-full flex-col gap-6 p-5">
      <Link to="/app" aria-label="NeuronixAI dashboard"><BrandLogo /></Link>
      <Link
        to="/app/workspace"
        onClick={() => setOpen(false)}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-violet to-indigo px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_-10px_rgb(112_71_235/0.7)] hover:-translate-y-0.5"
      >
        <Plus size={18} aria-hidden="true" /> New task
      </Link>
      <nav aria-label="Application">
        <ul className="space-y-1">
          {[
            { id: 'dashboard', to: '/app', label: 'Dashboard', Icon: LayoutDashboard },
            { id: 'workspace', to: '/app/workspace', label: 'Workspace', Icon: Sparkles },
            { id: 'tasks', to: '/app/tasks', label: 'Tasks', Icon: History },
            { id: 'conversations', to: '/app/conversations', label: 'Conversations', Icon: MessagesSquare },
            { id: 'agents', to: '/app/agents', label: 'Agents', Icon: Bot },
            { id: 'knowledge', to: '/app/knowledge', label: 'Knowledge', Icon: Library },
          ].map(({ id, to, label, Icon }) => (
            <li key={id}>
              <Link to={to} aria-current={active === id ? 'page' : undefined} onClick={() => setOpen(false)} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${active === id ? 'bg-violet/10 font-semibold text-violet' : 'font-medium text-muted hover:bg-canvas hover:text-ink'}`}>
                <Icon size={18} aria-hidden="true" /> {label}
              </Link>
            </li>
          ))}
          <li>
            <Link to="/" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted hover:bg-canvas hover:text-ink">
              <Globe size={18} aria-hidden="true" /> Website
            </Link>
          </li>
        </ul>
      </nav>
      <div className="min-h-0 flex-1 overflow-y-auto">{sidebarExtra?.(() => setOpen(false))}</div>
      <AccountMenu email={email} onLogout={onLogout} />
    </div>
  )

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[272px_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-screen border-r border-line bg-white/80 lg:block">{sidebar}</aside>

      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-canvas/90 px-4 backdrop-blur lg:hidden">
        <Link to="/app" aria-label="NeuronixAI dashboard"><BrandLogo /></Link>
        <button type="button" aria-label="Open menu" aria-expanded={open} aria-controls="mobile-sidebar" onClick={() => setOpen(true)} className="grid size-10 place-items-center rounded-lg border border-line bg-white">
          <Menu size={20} aria-hidden="true" />
        </button>
      </header>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button type="button" aria-label="Close menu" className="absolute inset-0 bg-ink/30" onClick={() => setOpen(false)} />
          <div id="mobile-sidebar" role="dialog" aria-modal="true" aria-label="Menu" className="absolute inset-y-0 left-0 w-72 max-w-[85%] bg-white shadow-lift">
            <button type="button" aria-label="Close menu" onClick={() => setOpen(false)} className="absolute right-3 top-4 grid size-9 place-items-center rounded-lg text-muted hover:text-ink"><X size={20} aria-hidden="true" /></button>
            {sidebar}
          </div>
        </div>
      )}

      <div className="relative min-w-0">
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(50%_80%_at_75%_0%,rgb(112_71_235/0.10),transparent),radial-gradient(35%_60%_at_100%_30%,rgb(32_201_215/0.10),transparent)]" />
        <main id="dashboard-main" className={`relative mx-auto px-4 py-6 sm:px-8 lg:py-10 ${wide ? 'max-w-7xl' : 'max-w-5xl'}`}>{children}</main>
      </div>
    </div>
  )
}
