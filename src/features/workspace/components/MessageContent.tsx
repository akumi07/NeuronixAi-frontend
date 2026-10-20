import { useState, type ReactNode } from 'react'
import { Check, Copy } from 'lucide-react'

type Segment = { type: 'text'; value: string } | { type: 'code'; lang: string; value: string }

/** Splits fenced code blocks from prose. Everything is rendered as React text nodes, never as HTML. */
function parse(content: string): Segment[] {
  const out: Segment[] = []
  const re = /```([\w+#.-]*)[^\S\n]*\n?([\s\S]*?)(?:```|$)/g
  let last = 0
  for (let m = re.exec(content); m; m = re.exec(content)) {
    if (m.index > last) out.push({ type: 'text', value: content.slice(last, m.index) })
    out.push({ type: 'code', lang: m[1], value: m[2].replace(/\n$/, '') })
    last = m.index + m[0].length
    if (m[0].length === 0) re.lastIndex++
  }
  if (last < content.length) out.push({ type: 'text', value: content.slice(last) })
  return out
}

export function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [done, setDone] = useState(false)
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text)
          setDone(true)
          window.setTimeout(() => setDone(false), 1500)
        } catch { /* clipboard unavailable: ignore */ }
      }}
      className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-muted hover:bg-line/60 hover:text-ink"
    >
      {done ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
      {done ? 'Copied' : label}
    </button>
  )
}

function Inline({ text }: { text: string }): ReactNode {
  return text.split(/(`[^`\n]+`)/g).map((part, i) =>
    part.length > 2 && part.startsWith('`') && part.endsWith('`') ? (
      <code key={i} className="rounded-md bg-violet/10 px-1.5 py-0.5 font-mono text-[0.85em] text-indigo">{part.slice(1, -1)}</code>
    ) : (
      <span key={i}>{part}</span>
    ),
  )
}

/** Code is displayed only; the app never evaluates or executes it. */
export function MessageContent({ content }: { content: string }) {
  return (
    <div className="space-y-3 break-words">
      {parse(content).map((seg, i) =>
        seg.type === 'code' ? (
          <figure key={i} className="overflow-hidden rounded-xl border border-line bg-[#F3F4FB] text-left">
            <figcaption className="flex items-center justify-between border-b border-line bg-white/70 px-3 py-1">
              <span className="font-mono text-xs text-muted">{seg.lang || 'code'}</span>
              <CopyButton text={seg.value} />
            </figcaption>
            <pre className="overflow-x-auto p-3 font-mono text-[0.82rem] leading-relaxed text-ink"><code>{seg.value}</code></pre>
          </figure>
        ) : (
          seg.value.split(/\n{2,}/).filter((p) => p.trim()).map((p, j) => (
            <p key={`${i}-${j}`} className="whitespace-pre-wrap leading-relaxed"><Inline text={p.trim()} /></p>
          ))
        ),
      )}
    </div>
  )
}
