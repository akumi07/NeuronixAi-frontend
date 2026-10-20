import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Search, X } from 'lucide-react'
import { AGENT_PROFILES } from '../data/agentCatalog'
import { CatalogNotice } from '../components/CatalogNotice'
import { StatusPill } from '../components/StatusPill'

export default function AgentDirectoryPage() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string | null>(null)

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    return AGENT_PROFILES.filter((p) => {
      if (category && p.agent.id !== category) return false
      if (!q) return true
      return [p.agent.name, p.category, p.agent.description, p.tagline, ...p.inputs, ...p.outputs].some((t) => t.toLowerCase().includes(q))
    })
  }, [query, category])

  return (
    <div className="space-y-8">
      <header className="max-w-2xl">
        <p className="text-xs font-bold tracking-[0.16em] text-violet">AGENT DIRECTORY</p>
        <h1 className="mt-3 text-4xl font-extrabold leading-[1.08] sm:text-5xl">Specialists for every kind of work.</h1>
        <p className="mt-3 text-muted">Browse the capabilities NeuronixAI is designed around and see how each one is used today.</p>
      </header>

      <CatalogNotice />

      {/* Capability strip doubles as the category filter */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-0 flex-1 basis-64">
            <label htmlFor="agent-search" className="sr-only">Search capabilities</label>
            <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input
              id="agent-search"
              type="search"
              value={query}
              maxLength={80}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, input, or output"
              className="w-full rounded-xl border border-line bg-white py-3 pl-11 pr-4 shadow-sm outline-none focus:border-violet focus:ring-4 focus:ring-violet/15"
            />
          </div>
          <p role="status" className="text-sm text-muted">{results.length} of {AGENT_PROFILES.length} capabilities</p>
        </div>

        <ul aria-label="Filter by capability" className="flex flex-wrap gap-2">
          {AGENT_PROFILES.map(({ agent, category: label }) => {
            const Icon = agent.icon
            const on = category === agent.id
            return (
              <li key={agent.id}>
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => setCategory(on ? null : agent.id)}
                  className="inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition"
                  style={on ? { background: agent.color, borderColor: agent.color, color: '#fff' } : { background: '#fff', borderColor: `${agent.color}55` }}
                >
                  <Icon size={15} aria-hidden="true" style={on ? undefined : { color: agent.color }} />
                  {label}
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      {results.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-line bg-white/70 p-10 text-center">
          <h2 className="font-display text-xl font-bold">No capabilities match</h2>
          <p className="mt-1 text-sm text-muted">Try a different search or clear the filter.</p>
          <button type="button" onClick={() => { setQuery(''); setCategory(null) }} className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-line bg-white px-4 py-2 text-sm font-semibold hover:border-violet/40 hover:text-violet">
            <X size={14} aria-hidden="true" /> Clear filters
          </button>
        </div>
      ) : (
        <ul className="space-y-4">
          {results.map(({ agent, category: label, tagline, inputs, outputs, availability }, i) => {
            const Icon = agent.icon
            return (
              <li key={agent.id}>
                <Link
                  to={`/app/agents/${agent.id}`}
                  className="group relative grid items-center gap-5 overflow-hidden rounded-3xl border border-line bg-white p-5 pl-7 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:p-6 sm:pl-8"
                >
                  <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1.5" style={{ background: agent.color }} />
                  <span aria-hidden="true" className="absolute -right-16 -top-16 size-48 rounded-full opacity-[0.07] transition group-hover:opacity-[0.14]" style={{ background: agent.color }} />
                  <span className="relative grid size-14 place-items-center rounded-2xl sm:size-16" style={{ background: `${agent.color}1F`, color: agent.color }}>
                    <Icon size={28} aria-hidden="true" />
                  </span>
                  <div className="relative min-w-0">
                    <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="font-mono text-xs text-muted">{String(i + 1).padStart(2, '0')}</span>
                      <span className="text-xs font-bold uppercase tracking-[0.14em]" style={{ color: agent.color }}>{label}</span>
                    </p>
                    <h2 className="mt-1 font-display text-2xl font-extrabold">{agent.name}</h2>
                    <p className="mt-1 text-muted">{agent.description}</p>
                    <p className="mt-3 text-sm"><span className="font-semibold">Takes:</span> <span className="text-muted">{inputs[0]}</span> <span className="mx-1 text-muted/60">→</span> <span className="font-semibold">Returns:</span> <span className="text-muted">{outputs[0]}</span></p>
                    <p className="sr-only">{tagline}</p>
                  </div>
                  <div className="relative flex items-center justify-between gap-3 sm:flex-col sm:items-end sm:gap-6">
                    <StatusPill availability={availability} />
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-violet">Details <ArrowUpRight size={16} aria-hidden="true" className="transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></span>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
