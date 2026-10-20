import { useState, type ReactNode } from 'react'
import { Check, Copy } from 'lucide-react'

/**
 * Safe Markdown subset. Everything is built as React elements (text nodes), never injected as HTML:
 * fenced code, headings, lists, block quotes, rules, paragraphs, **bold**, *italic*, `code`, and http(s) links.
 * Raw HTML in the source is shown as literal text. Other URL schemes (javascript:, data:, …) are never turned into links.
 * Code is displayed only; it is never executed.
 */
type Block =
  | { type: 'code'; lang: string; value: string }
  | { type: 'heading'; level: 1 | 2 | 3; value: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'quote'; value: string }
  | { type: 'rule' }
  | { type: 'paragraph'; value: string }

export function parseBlocks(content: string): Block[] {
  const out: Block[] = []
  const fence = /```([\w+#.-]*)[^\S\n]*\n?([\s\S]*?)(?:```|$)/g
  let last = 0
  const pushText = (text: string) => out.push(...parseTextBlocks(text))
  for (let m = fence.exec(content); m; m = fence.exec(content)) {
    if (m.index > last) pushText(content.slice(last, m.index))
    out.push({ type: 'code', lang: m[1], value: m[2].replace(/\n$/, '') })
    last = m.index + m[0].length
    if (m[0].length === 0) fence.lastIndex++
  }
  if (last < content.length) pushText(content.slice(last))
  return out
}

function parseTextBlocks(text: string): Block[] {
  const blocks: Block[] = []
  const lines = text.split('\n')
  let para: string[] = []
  const flush = () => { if (para.length) { blocks.push({ type: 'paragraph', value: para.join('\n') }); para = [] } }
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const heading = /^(#{1,3})\s+(.+)$/.exec(line)
    const bullet = /^\s*[-*+]\s+(.+)$/.exec(line)
    const numbered = /^\s*\d+[.)]\s+(.+)$/.exec(line)
    const quote = /^>\s?(.*)$/.exec(line)
    if (!line.trim()) { flush() }
    else if (heading) { flush(); blocks.push({ type: 'heading', level: heading[1].length as 1 | 2 | 3, value: heading[2] }) }
    else if (/^\s*([-*_])\1{2,}\s*$/.test(line)) { flush(); blocks.push({ type: 'rule' }) }
    else if (bullet || numbered) {
      flush()
      const ordered = !!numbered
      const items: string[] = []
      while (i < lines.length) {
        const b = /^\s*[-*+]\s+(.+)$/.exec(lines[i])
        const n = /^\s*\d+[.)]\s+(.+)$/.exec(lines[i])
        const hit = ordered ? n : b
        if (!hit) { i--; break }
        items.push(hit[1])
        i++
      }
      blocks.push({ type: 'list', ordered, items })
    } else if (quote) {
      flush()
      const q: string[] = [quote[1]]
      while (i + 1 < lines.length && /^>\s?/.test(lines[i + 1])) { i++; q.push(lines[i].replace(/^>\s?/, '')) }
      blocks.push({ type: 'quote', value: q.join('\n') })
    } else para.push(line)
  }
  flush()
  return blocks
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

const INLINE = /(`[^`\n]+`|\*\*[^*\n]+\*\*|\*[^*\s][^*\n]*\*|\[[^\]\n]+\]\([^)\s]+\))/g

export function safeHttpUrl(raw: string): string | null {
  try {
    const u = new URL(raw)
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.toString() : null
  } catch { return null }
}

function Inline({ text }: { text: string }): ReactNode {
  return text.split(INLINE).map((part, i) => {
    if (part.length > 2 && part.startsWith('`') && part.endsWith('`')) return <code key={i} className="rounded-md bg-violet/10 px-1.5 py-0.5 font-mono text-[0.85em] text-indigo">{part.slice(1, -1)}</code>
    if (part.length > 4 && part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>
    if (part.length > 2 && part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) return <em key={i}>{part.slice(1, -1)}</em>
    const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(part)
    if (link) {
      const href = safeHttpUrl(link[2])
      if (href) return <a key={i} href={href} target="_blank" rel="noopener noreferrer nofollow" className="font-medium text-violet underline underline-offset-2">{link[1]}</a>
      return <span key={i}>{part}</span> // unsafe scheme: shown as plain text
    }
    return <span key={i}>{part}</span>
  })
}

export function MessageContent({ content }: { content: string }) {
  if (!content.trim()) return <p className="text-sm italic text-muted">The assistant returned an empty response.</p>
  return (
    <div className="space-y-3 break-words">
      {parseBlocks(content).map((b, i) => {
        switch (b.type) {
          case 'code':
            return (
              <figure key={i} className="overflow-hidden rounded-xl border border-line bg-[#F3F4FB] text-left">
                <figcaption className="flex items-center justify-between border-b border-line bg-white/70 px-3 py-1">
                  <span className="font-mono text-xs text-muted">{b.lang || 'code'}</span>
                  <CopyButton text={b.value} />
                </figcaption>
                <pre className="overflow-x-auto p-3 font-mono text-[0.82rem] leading-relaxed text-ink"><code>{b.value}</code></pre>
              </figure>
            )
          case 'heading': {
            const cls = b.level === 1 ? 'text-xl' : b.level === 2 ? 'text-lg' : 'text-base'
            return <p key={i} role="heading" aria-level={b.level + 2} className={`font-display font-bold ${cls}`}><Inline text={b.value} /></p>
          }
          case 'list': {
            const Tag = b.ordered ? 'ol' : 'ul'
            return <Tag key={i} className={`space-y-1 pl-5 ${b.ordered ? 'list-decimal' : 'list-disc'}`}>{b.items.map((it, j) => <li key={j} className="leading-relaxed"><Inline text={it} /></li>)}</Tag>
          }
          case 'quote':
            return <blockquote key={i} className="border-l-4 border-violet/30 pl-4 italic text-muted whitespace-pre-wrap"><Inline text={b.value} /></blockquote>
          case 'rule':
            return <hr key={i} className="border-line" />
          default:
            return <p key={i} className="whitespace-pre-wrap leading-relaxed"><Inline text={b.value} /></p>
        }
      })}
    </div>
  )
}
