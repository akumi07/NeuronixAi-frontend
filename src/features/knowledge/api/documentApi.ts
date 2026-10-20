import type { AuthedRequest } from '../../auth/context/AuthContext'

/** Mirrors DocumentResponse. The backend never returns the storage path, so none is modelled here. */
export interface DocumentRecord {
  id: number
  fileName: string
  fileType: string
  fileSize: number
  status: string
  createdAt: string
  updatedAt: string
}

const UPLOAD_TIMEOUT_MS = 60_000

/**
 * Verified: the ONLY user-facing document endpoint is `POST /api/v1/documents` (multipart field "file").
 * There is no list, get, delete, status, or search endpoint for documents.
 */
export function createDocumentApi(request: AuthedRequest) {
  return {
    upload: (file: File, signal?: AbortSignal) => {
      const form = new FormData()
      form.append('file', file)
      return request<DocumentRecord>('POST', '/api/v1/documents', { body: form, timeoutMs: UPLOAD_TIMEOUT_MS, signal })
    },
  }
}
