import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { MessageContent } from './MessageContent'

const html = (c: string) => renderToStaticMarkup(<MessageContent content={c} />)

describe('MessageContent safety', () => {
  it('escapes HTML in prose', () => {
    const out = html('hi <script>alert(1)</script> <img src=x onerror=alert(1)>')
    expect(out).not.toContain('<script')
    expect(out).not.toContain('<img')
    expect(out).toContain('&lt;script&gt;')
  })
  it('escapes HTML inside code blocks and inline code', () => {
    const out = html('```html\n<script>alert(1)</script>\n```\nand `<b>x</b>`')
    expect(out).not.toContain('<script')
    expect(out).not.toContain('<b>')
    expect(out).toContain('<pre')
  })
  it('does not render links or event handlers', () => {
    const out = html('[click](javascript:alert(1)) <a href="javascript:alert(1)" onclick="x()">x</a>')
    expect(out).not.toContain('<a ')
    expect(out).not.toMatch(/<[^>]*\b(href|onclick)=/) // only escaped text may mention them, never a real attribute
  })
  it('handles an unclosed code fence', () => expect(html('```js\nconst a = 1')).toContain('const a = 1'))
  it('renders http(s) links safely and ignores other schemes', () => {
    const ok = html('See [docs](https://example.com/a?b=1)')
    expect(ok).toContain('href="https://example.com/a?b=1"')
    expect(ok).toContain('rel="noopener noreferrer nofollow"')
    const bad = html('[x](javascript:alert(1)) and [y](data:text/html,hi)')
    expect(bad).not.toContain('<a ')
  })
  it('renders headings, lists, bold, italics and quotes as elements', () => {
    const out = html('# Title\n\n- one\n- **two**\n\n1. first\n2. second\n\n> quoted *text*')
    expect(out).toContain('role="heading"')
    expect(out).toContain('<ul')
    expect(out).toContain('<strong>two</strong>')
    expect(out).toContain('<ol')
    expect(out).toContain('<blockquote')
    expect(out).toContain('<em>text</em>')
  })
  it('shows a note for empty assistant content', () => expect(html('   ')).toContain('empty response'))
})
