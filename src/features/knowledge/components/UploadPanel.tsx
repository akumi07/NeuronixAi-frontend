import { useRef, useState } from 'react'
import { AlertTriangle, FileUp, Loader2 } from 'lucide-react'
import type { Failure } from '../../dashboard/api/failures'
import { ErrorNotice } from '../../dashboard/components/StateViews'
import { MAX_FILE_BYTES, formatBytes } from '../lib/validateFile'

interface Props {
  uploading: string | null
  invalid: string | null
  failure: Failure | null
  possibleDuplicate: File | null
  onChoose: (file: File) => void
  onConfirmDuplicate: () => void
  onDismissDuplicate: () => void
}

export function UploadPanel({ uploading, invalid, failure, possibleDuplicate, onChoose, onConfirmDuplicate, onDismissDuplicate }: Props) {
  const input = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const busy = uploading !== null

  const pick = (files: FileList | null) => {
    const f = files?.[0]
    if (f && !busy) onChoose(f)
    if (input.current) input.current.value = '' // allow re-selecting the same file
  }

  return (
    <section aria-label="Upload a document" className="rounded-3xl border border-line bg-white p-5 shadow-soft sm:p-6">
      <h2 className="font-display text-xl font-bold">Upload a PDF</h2>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); pick(e.dataTransfer.files) }}
        className={`mt-4 rounded-2xl border-2 border-dashed p-8 text-center transition ${dragging ? 'border-violet bg-violet/5' : 'border-line bg-canvas'}`}
      >
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-mint/20 text-[#14704D]">
          {busy ? <Loader2 size={22} className="animate-spin" aria-hidden="true" /> : <FileUp size={22} aria-hidden="true" />}
        </span>
        <p className="mt-3 font-semibold">{busy ? `Uploading ${uploading}…` : 'Drag a PDF here, or'}</p>
        <label className={`mt-3 inline-block cursor-pointer rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold shadow-sm hover:border-violet/40 hover:text-violet focus-within:ring-4 focus-within:ring-violet/15 ${busy ? 'pointer-events-none opacity-60' : ''}`}>
          Choose file
          <input ref={input} type="file" accept=".pdf,application/pdf" disabled={busy} onChange={(e) => pick(e.target.files)} className="sr-only" />
        </label>
        <p className="mt-3 text-xs text-muted">PDF only · up to {formatBytes(MAX_FILE_BYTES)} here. These checks are for convenience; the server decides what it accepts.</p>
      </div>

      <div className="mt-4 space-y-3" aria-live="polite">
        {invalid && <ErrorNotice failure={{ title: 'This file can’t be uploaded', message: invalid }} />}
        {failure && <ErrorNotice failure={failure} />}
        {possibleDuplicate && (
          <div role="alert" className="rounded-2xl border border-amber/60 bg-amber/10 p-4 text-sm text-[#7A5410]">
            <p className="flex items-center gap-2 font-semibold"><AlertTriangle size={16} aria-hidden="true" /> You already uploaded “{possibleDuplicate.name}” in this session</p>
            <p className="mt-1">Same name and size. The backend does not detect duplicates, so uploading again creates another copy.</p>
            <div className="mt-3 flex gap-2">
              <button type="button" onClick={onConfirmDuplicate} className="rounded-lg bg-amber px-3 py-1.5 font-semibold text-ink">Upload anyway</button>
              <button type="button" onClick={onDismissDuplicate} className="rounded-lg border border-amber/60 px-3 py-1.5 font-semibold">Cancel</button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
