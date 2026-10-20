import { useId, useState } from 'react'
import { Loader2, Send } from 'lucide-react'
import { useFeatureUnavailable } from '../../../api/availability'
import { ENABLE_RAG_TEST_ENDPOINTS } from '../../../api/config'
import { ErrorNotice } from '../../dashboard/components/StateViews'
import { CopyButton, MessageContent } from '../../workspace/components/MessageContent'
import type { Displayed, KnowledgeApi } from '../hooks/useKnowledge'

const MAX_QUESTION = 1000

export function AskPanel({ k, doc }: { k: KnowledgeApi; doc: Displayed | null }) {
  const [question, setQuestion] = useState('')
  const [topK, setTopK] = useState(5)
  const id = useId()
  const unavailable = useFeatureUnavailable('documentQa') && !ENABLE_RAG_TEST_ENDPOINTS
  const loading = k.ask.phase === 'loading'
  const notReady = doc !== null && doc.phase !== 'ready'
  const canAsk = !!doc && question.trim().length > 0 && !loading && !unavailable

  return (
    <section aria-label="Ask a document" className="rounded-3xl border border-line bg-white p-5 shadow-soft sm:p-6">
      <h2 className="font-display text-xl font-bold">Ask a document</h2>
      {!doc ? (
        <p className="mt-3 rounded-2xl border border-dashed border-line p-4 text-sm text-muted">Choose “Ask about this” on a document to ask it a question.</p>
      ) : (
        <form className="mt-3 space-y-3" onSubmit={(e) => { e.preventDefault(); if (canAsk) void k.askDocument(doc.id, question.trim(), topK) }}>
          <p className="text-sm">Asking <strong className="break-words">{doc.fileName}</strong></p>
          {notReady && <p className="rounded-xl bg-amber/15 p-3 text-xs text-[#7A5410]">The backend hasn’t reported this document as ready for retrieval, so the answer may be empty or unavailable.</p>}
          <div>
            <label htmlFor={`${id}-q`} className="mb-1 block text-sm font-semibold">Your question</label>
            <textarea id={`${id}-q`} rows={3} maxLength={MAX_QUESTION} value={question} onChange={(e) => setQuestion(e.target.value)} disabled={loading} className="w-full resize-none rounded-xl border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-violet focus:ring-4 focus:ring-violet/15 disabled:opacity-60" />
          </div>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <label htmlFor={`${id}-k`} className="mb-1 block text-xs font-semibold text-muted">Passages to retrieve</label>
              <select id={`${id}-k`} value={topK} onChange={(e) => setTopK(Number(e.target.value))} className="rounded-lg border border-line bg-white px-2 py-1.5 text-sm">
                {[3, 5, 8].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <button type="submit" disabled={!canAsk} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-violet to-indigo px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
              {loading ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <Send size={15} aria-hidden="true" />} {loading ? 'Asking…' : 'Ask'}
            </button>
          </div>
        </form>
      )}

      <div aria-live="polite" className="mt-4 space-y-3">
        {k.ask.phase === 'error' && k.ask.failure && <ErrorNotice failure={k.ask.failure} onRetry={doc ? () => void k.askDocument(doc.id, k.ask.question ?? question, topK) : undefined} />}
        {k.ask.phase === 'ready' && k.ask.answer !== undefined && (
          <div className="rounded-2xl border border-line bg-canvas p-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">Answer from the backend</p>
              <CopyButton text={k.ask.answer} />
            </div>
            <MessageContent content={k.ask.answer} />
            {k.ask.source === 'dev-test' && <p className="mt-3 text-xs text-[#7A5410]">Development only: answered through an internal test endpoint that performs no ownership checks.</p>}
            {k.ask.sources && k.ask.sources.length > 0 && (
              <details className="mt-3 text-xs"><summary className="cursor-pointer font-semibold text-violet">Retrieved passages ({k.ask.sources.length})</summary>
                <ul className="mt-2 space-y-2">{k.ask.sources.map((s, i) => <li key={i} className="rounded-lg bg-white p-2 text-muted">{s.chunkIndex !== undefined && <span className="font-semibold">Chunk {s.chunkIndex}: </span>}{(s.content ?? '').slice(0, 400)}</li>)}</ul>
              </details>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
