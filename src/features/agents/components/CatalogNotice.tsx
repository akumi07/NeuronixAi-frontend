import { Info } from 'lucide-react'

export function CatalogNotice() {
  return (
    <div className="flex gap-3 rounded-2xl border border-dashed border-violet/40 bg-violet/5 p-4 text-sm text-indigo">
      <Info size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
      <p>
        <strong>Capability catalog, not a live agent registry.</strong> NeuronixAI’s backend doesn’t expose agent records, status, or
        configuration yet, so these entries describe the intended experience. Nothing here is confirmed as a running agent.
      </p>
    </div>
  )
}
