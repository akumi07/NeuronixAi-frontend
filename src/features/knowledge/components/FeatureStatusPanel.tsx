import { useFeatureUnavailable, type FeatureKey } from '../../../api/availability'
import { ENABLE_RAG_TEST_ENDPOINTS } from '../../../api/config'

function Row({ label, feature, devTest }: { label: string; feature: FeatureKey; devTest?: boolean }) {
  const unavailable = useFeatureUnavailable(feature)
  const state = unavailable ? (devTest && ENABLE_RAG_TEST_ENDPOINTS ? 'Dev test route' : 'In development') : 'Not checked yet'
  const cls = unavailable ? 'bg-violet/10 text-indigo' : 'bg-line text-muted'
  return (
    <li className="flex items-center justify-between gap-3 text-sm">
      <span>{label}</span>
      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}>{state}</span>
    </li>
  )
}

/** Honest availability of each document capability, based on what the backend has actually answered in this session. */
export function FeatureStatusPanel() {
  return (
    <section aria-label="Document capabilities" className="rounded-3xl border border-dashed border-line bg-white/60 p-5 sm:p-6">
      <h2 className="font-display text-xl font-bold">Capabilities</h2>
      <p className="mt-1 text-xs text-muted">Shown as “In development” only after the backend confirms a feature isn’t available yet.</p>
      <ul className="mt-4 space-y-3">
        <li className="flex items-center justify-between gap-3 text-sm"><span>Upload PDF</span><span className="rounded-full bg-mint/20 px-2.5 py-1 text-xs font-semibold text-[#14704D]">Available</span></li>
        <Row label="Document list" feature="documentList" />
        <Row label="Processing and indexing" feature="documentProcess" devTest />
        <Row label="Document questions" feature="documentQa" devTest />
        <Row label="Delete document" feature="documentDelete" />
      </ul>
      {ENABLE_RAG_TEST_ENDPOINTS && <p className="mt-4 rounded-xl bg-amber/15 p-3 text-xs text-[#7A5410]">Development mode: internal RAG test endpoints are enabled. They perform no ownership checks and are never used in production builds.</p>}
    </section>
  )
}
