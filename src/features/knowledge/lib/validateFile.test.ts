import { describe, expect, it } from 'vitest'
import { MAX_FILE_BYTES, formatBytes, validatePdf } from './validateFile'

const pdf = (name = 'a.pdf', body = '%PDF-1.4 hello', type = 'application/pdf') => new File([body], name, { type })

describe('validatePdf', () => {
  it('accepts a real PDF signature', async () => expect((await validatePdf(pdf())).ok).toBe(true))
  it('accepts octet-stream, which the backend allows', async () => expect((await validatePdf(pdf('a.pdf', '%PDF-1', 'application/octet-stream'))).ok).toBe(true))
  it('rejects empty files', async () => expect(await validatePdf(new File([], 'a.pdf'))).toMatchObject({ ok: false }))
  it('rejects wrong extensions even with a PDF MIME type', async () => expect(await validatePdf(pdf('a.txt'))).toMatchObject({ ok: false }))
  it('rejects wrong MIME types', async () => expect(await validatePdf(pdf('a.pdf', '%PDF-1', 'text/plain'))).toMatchObject({ ok: false }))
  it('rejects a spoofed extension without the PDF signature', async () => expect(await validatePdf(pdf('a.pdf', 'not a pdf'))).toMatchObject({ ok: false }))
  it('rejects files over the limit', async () => {
    const big = new File(['%PDF-' + 'x'.repeat(MAX_FILE_BYTES)], 'big.pdf', { type: 'application/pdf' })
    expect(await validatePdf(big)).toMatchObject({ ok: false })
  })
  it('formats sizes', () => { expect(formatBytes(10 * 1024 * 1024)).toBe('10 MB'); expect(formatBytes(2048)).toBe('2 KB') })
})
