import { AGENTS } from '../../landing/data/landingContent'
import { STARTERS } from '../data/capabilityStarters'

export function CapabilityStarters({ onPick }: { onPick: (prompt: string) => void }) {
  return (
    <div>
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-muted">Start with a prompt</p>
      <ul className="flex flex-wrap gap-2.5">
        {AGENTS.map((a) => {
          const Icon = a.icon
          const s = STARTERS[a.id]
          return (
            <li key={a.id}>
              <button
                type="button"
                onClick={() => onPick(s.prompt)}
                title={a.description}
                className="group inline-flex items-center gap-2 rounded-full border bg-white py-1.5 pl-1.5 pr-4 text-sm font-semibold shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft"
                style={{ borderColor: `${a.color}55` }}
              >
                <span className="grid size-7 place-items-center rounded-full" style={{ background: `${a.color}1F`, color: a.color }}>
                  <Icon size={15} aria-hidden="true" />
                </span>
                {s.label}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
