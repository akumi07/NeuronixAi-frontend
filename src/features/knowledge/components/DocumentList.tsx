import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { FileText, Loader2, MessageSquareText, Play, Trash2 } from 'lucide-react'
import { useFeatureUnavailable } from '../../../api/availability'
import { ENABLE_RAG_TEST_ENDPOINTS } from '../../../api/config'
import type { DocumentPhase } from '../../../api/contracts/documents'
import { ErrorNotice, InDevelopmentNotice, Skeleton } from '../../dashboard/components/StateViews'
import { formatDay } from '../../dashboard/data/formatDate'
import { ConfirmDialog } from '../../tasks/components/ConfirmDialog'
import type { Displayed, KnowledgeApi } from '../hooks/useKnowledge'
import { formatBytes } from '../lib/validateFile'

const PHASE: Record<DocumentPhase, { label: string; cls: string }> = {
  uploaded: { label: 'Uploaded', cls: 'bg-blue/10 text-[#1F5BB8]' },
  processing: { label: 'Processing', cls: 'bg-amber/25 text-[#7A5410]' },
  ready: { label: 'Ready for retrieval', cls: 'bg-mint/20 text-[#14704D]' },
  failed: { label: 'Processing failed', cls: 'bg-coral/15 text-[#9E2B1B]' },
  unknown: { label: 'Status not confirmed', cls: 'bg-line text-muted' },
}

function DocRow({ doc, k, onAsk, askActive, onDelete }: { doc: Displayed; k: KnowledgeApi; onAsk: () => void; askActive: boolean; onDelete: () => void }) {
  const proc = k.process[doc.id]
  const processUnavailable = useFeatureUnavailable('documentProcess') && !ENABLE_RAG_TEST_ENDPOINTS
  const deleteUnavailable = useFeatureUnavailable('documentDelete')
  const askUnavailable = useFeatureUnavailable('documentQa') && !ENABLE_RAG_TEST_ENDPOINTS
  const p = PHASE[doc.phase]
  const ready = doc.phase === 'ready'
  const btn = 'inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-semibold transition hover:border-violet/40 hover:text-violet disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-line disabled:hover:text-inherit'
  return (
    <motion.li layout initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="py-4">
      <div className="flex items-start gap-3">
        <input type="checkbox" checked={k.selected.has(doc.id)} onChange={() => k.toggleSelected(doc.id)} aria-label={`Use ${doc.fileName} as context in the workspace`} className="mt-3.5 size-4 shrink-0 accent-violet" />
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-mint/20 text-[#14704D]"><FileText size={20} aria-hidden="true" /></span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{doc.fileName}</p>
          <p className="text-xs text-muted">{formatBytes(doc.fileSize)} · Uploaded {formatDay(doc.createdAt) || 'just now'} · ID {doc.id}</p>
          <p className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <span className={`rounded-full px-2.5 py-1 font-bold ${p.cls}`}>{p.label}</span>
            {doc.phase === 'unknown' && <span className="text-muted">Backend status: “{doc.status}”</span>}
            {doc.phase === 'uploaded' && <span className="rounded-full border border-dashed border-muted/40 px-2.5 py-1 font-semibold text-muted">Not indexed yet</span>}
            {doc.chunkCount !== undefined && <span className="text-muted">{doc.chunkCount} chunks</span>}
          </p>
          {doc.note && <p className="mt-1 text-xs text-muted">{doc.note}</p>}
          {doc.phase === 'failed' && doc.failureReason && <p className="mt-1 text-xs text-[#9E2B1B]">{doc.failureReason.slice(0, 240)}</p>}
          {doc.phase === 'uploaded' && <p className="mt-1 text-xs text-muted">Upload success only means the file is stored. It isn’t usable for answers until the backend reports it as ready.</p>}

          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className={btn} onClick={() => void k.processDocument(doc.id)} disabled={proc?.running || processUnavailable || ready} title={ready ? 'Already ready' : processUnavailable ? 'Processing is still in development' : undefined}>
              {proc?.running ? <Loader2 size={13} className="animate-spin" aria-hidden="true" /> : <Play size={13} aria-hidden="true" />} {proc?.running ? 'Processing…' : doc.phase === 'failed' ? 'Retry processing' : 'Process'}
            </button>
            <button type="button" className={btn} onClick={onAsk} disabled={askUnavailable} aria-pressed={askActive} title={askUnavailable ? 'Document questions are still in development' : undefined}>
              <MessageSquareText size={13} aria-hidden="true" /> Ask about this
            </button>
            <button type="button" className={btn} onClick={onDelete} disabled={deleteUnavailable} title={deleteUnavailable ? 'Deleting documents is still in development' : undefined}>
              <Trash2 size={13} aria-hidden="true" /> Delete
            </button>
          </div>
          {(processUnavailable || deleteUnavailable || askUnavailable) && <p className="mt-2 text-xs text-muted">Disabled actions are still in development.</p>}
          {proc?.failure && <div className="mt-2"><ErrorNotice failure={proc.failure} /></div>}
          {proc?.note && !proc.running && !proc.failure && <p className="mt-2 text-xs text-muted">{proc.note}</p>}
        </div>
      </div>
    </motion.li>
  )
}

function AddById({ k }: { k: KnowledgeApi }) {
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  return (
    <form className="mt-4 rounded-2xl border border-dashed border-amber/60 bg-amber/10 p-4 text-sm" onSubmit={(e) => { e.preventDefault(); const err = k.addExistingDocument(value); setError(err); if (!err) setValue('') }}>
      <p className="font-semibold text-[#7A5410]">Development: ask a document that is already on the server</p>
      <p className="mt-1 text-xs text-[#7A5410]">The backend has no document list yet. Enter the ID of a document you already processed (for example one you processed in Postman) to ask it questions.</p>
      <div className="mt-3 flex flex-wrap items-start gap-2">
        <div>
          <label htmlFor="doc-id" className="sr-only">Document ID</label>
          <input id="doc-id" inputMode="numeric" value={value} onChange={(e) => setValue(e.target.value)} placeholder="Document ID" aria-invalid={error ? true : undefined} className="w-44 rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-violet focus:ring-4 focus:ring-violet/15" />
          {error && <p role="alert" className="mt-1 text-xs text-[#9E2B1B]">{error}</p>}
        </div>
        <button type="submit" className="rounded-lg bg-amber px-3 py-2 text-sm font-semibold text-ink">Add to list</button>
      </div>
    </form>
  )
}

export function DocumentList({ k, askId, onAsk }: { k: KnowledgeApi; askId: string | null; onAsk: (id: string) => void }) {
  const [confirm, setConfirm] = useState<Displayed | null>(null)
  const [deleting, setDeleting] = useState(false)
  const fromServer = k.list.phase === 'ready'

  return (
    <section aria-label="Documents" className="rounded-3xl border border-line bg-white p-5 shadow-soft sm:p-6">
      <h2 className="font-display text-xl font-bold">{fromServer ? 'Your documents' : 'Uploaded this session'}</h2>

      {k.list.phase === 'loading' && <div aria-busy="true" className="mt-4 space-y-3"><Skeleton className="h-16" /><Skeleton className="h-16" /></div>}
      {k.list.phase === 'error' && <div className="mt-4"><ErrorNotice failure={k.list.failure} onRetry={k.recheckList} /></div>}
      {k.list.phase === 'unavailable' && (
        <div className="mt-3"><InDevelopmentNotice compact message="Your full document list is still in development. Until then this shows only what you uploaded since signing in; it empties when you sign out or reload." onRetry={k.recheckList} /></div>
      )}
      {k.deleteFailure && <div className="mt-3"><ErrorNotice failure={k.deleteFailure} /></div>}

      {k.docs.length === 0 && k.list.phase !== 'loading' ? (
        <div className="mt-6 rounded-2xl border border-dashed border-line p-8 text-center">
          <p className="font-semibold">No documents yet</p>
          <p className="mt-1 text-sm text-muted">Upload a PDF above. It will appear here with the status the backend reports.</p>
        </div>
      ) : (
        <ul className="mt-3 divide-y divide-line">
          <AnimatePresence initial={false}>
            {k.docs.map((d) => <DocRow key={d.id} doc={d} k={k} askActive={askId === d.id} onAsk={() => onAsk(d.id)} onDelete={() => setConfirm(d)} />)}
          </AnimatePresence>
        </ul>
      )}
      {ENABLE_RAG_TEST_ENDPOINTS && <AddById k={k} />}
      {k.docs.length > 0 && <p className="mt-3 text-xs text-muted">Tick documents to offer them as context in the workspace. The backend decides whether they are used.</p>}

      {confirm && (
        <ConfirmDialog
          title="Delete this document?"
          body={`“${confirm.fileName}” will be removed. This can’t be undone.`}
          confirmLabel="Delete document"
          busy={deleting}
          onCancel={() => setConfirm(null)}
          onConfirm={async () => { setDeleting(true); await k.deleteDocument(confirm.id); setDeleting(false); setConfirm(null) }}
        />
      )}
    </section>
  )
}
