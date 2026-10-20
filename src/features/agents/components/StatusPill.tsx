import type { Availability } from '../data/agentCatalog'
import { AVAILABILITY_LABEL } from '../data/agentCatalog'

export function StatusPill({ availability }: { availability: Availability }) {
  const chat = availability === 'chat'
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${chat ? 'bg-blue/10 text-[#1F5BB8]' : 'border border-dashed border-muted/40 text-muted'}`}>
      <span aria-hidden="true" className={`size-1.5 rounded-full ${chat ? 'bg-blue' : 'bg-muted/50'}`} />
      {AVAILABILITY_LABEL[availability].label}
    </span>
  )
}
