/** Usability checks only. The backend must (and only partly does) enforce the same rules. */
export const MAX_FILE_BYTES = 10 * 1024 * 1024

export type FileCheck = { ok: true } | { ok: false; message: string }

export async function validatePdf(file: File): Promise<FileCheck> {
  if (file.size === 0) return { ok: false, message: 'This file is empty.' }
  if (!file.name.toLowerCase().endsWith('.pdf')) return { ok: false, message: 'Only PDF files (.pdf) are supported.' }
  if (file.type && file.type !== 'application/pdf' && file.type !== 'application/octet-stream') return { ok: false, message: 'Only PDF files are supported.' }
  if (file.size > MAX_FILE_BYTES) return { ok: false, message: `This file is larger than ${MAX_FILE_BYTES / 1024 / 1024} MB.` }
  // Extension and MIME type are client-controlled; check the PDF signature too. Still not authoritative.
  try {
    const head = await file.slice(0, 5).text()
    if (head !== '%PDF-') return { ok: false, message: 'This file doesn’t look like a valid PDF.' }
  } catch {
    return { ok: false, message: 'This file couldn’t be read.' }
  }
  return { ok: true }
}

export const formatBytes = (n: number) => (n < 1024 * 1024 ? `${Math.max(1, Math.round(n / 1024))} KB` : `${Number((n / 1024 / 1024).toFixed(1))} MB`)
