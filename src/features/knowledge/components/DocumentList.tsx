import { AnimatePresence, motion } from 'motion/react'
import { FileText, Info } from 'lucide-react'
import { formatDay } from '../../dashboard/data/formatDate'
import type { DocumentRecord } from '../api/documentApi'
import { formatBytes } from '../lib/validateFile'

export function DocumentList({ docs }: { docs: DocumentRecord[] }) {
  return (
    <section aria-label="Documents uploaded this session" className="rounded-3xl border border-line bg-white p-5 shadow-soft sm:p-6">
      <h2 className="font-display text-xl font-bold">Uploaded this session</h2>
      <p className="mt-2 flex gap-2 rounded-xl bg-canvas p-3 text-xs text-muted">
        <Info size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
        The backend can’t list or delete documents, so this shows only what you uploaded since signing in. It will be empty again after you sign out or reload.
      </p>

      {docs.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-line p-8 text-center text-sm text-muted">No documents uploaded yet.</p>
      ) : (
        <ul className="mt-5 divide-y divide-line">
          <AnimatePresence initial={false}>
            {docs.map((d) => (
              <motion.li key={d.id} layout initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-4 py-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-mint/20 text-[#14704D]"><FileText size={20} aria-hidden="true" /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{d.fileName}</p>
                  <p className="text-xs text-muted">{formatBytes(d.fileSize)} · Uploaded {formatDay(d.createdAt) || 'just now'} · ID {d.id}</p>
                  <p className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded-full bg-blue/10 px-2.5 py-1 font-bold text-[#1F5BB8]">File stored</span>
                    <span className="rounded-full border border-dashed border-muted/40 px-2.5 py-1 font-semibold text-muted">Not indexed or searchable</span>
                  </p>
                  <p className="mt-1.5 text-xs text-muted">Backend status: “{d.status}”. The upload is stored, but the backend doesn’t report any indexing, so this document isn’t used in answers.</p>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </section>
  )
}
