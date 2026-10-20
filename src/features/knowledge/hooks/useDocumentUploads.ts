import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../../auth/context/AuthContext'
import { ApiError } from '../../auth/api/httpClient'
import type { Failure } from '../../dashboard/api/failures'
import { describeFailure } from '../../dashboard/api/failures'
import { createDocumentApi, type DocumentRecord } from '../api/documentApi'
import { validatePdf } from '../lib/validateFile'

const key = (f: { name: string; size: number }) => `${f.name}\u0000${f.size}`

function describeUploadFailure(e: unknown): Failure {
  if (e instanceof ApiError && e.kind === 'http') {
    if (e.status === 413) return { title: 'File too large', message: 'The server rejected this file because it exceeds its size limit.' }
    if (e.status === 403) return { title: 'Not allowed', message: 'Your account isn’t permitted to upload documents.' }
    if (e.status === 400 || e.status === 415 || e.status === 500)
      return { title: 'Upload failed', message: 'The server couldn’t accept this file. Make sure it is a valid PDF and try again. The server doesn’t say why uploads are rejected.' }
  }
  return describeFailure(e)
}

/**
 * Session-only record of documents uploaded from this page. The backend has no list endpoint, so
 * nothing else about the user's documents can be known; this state is discarded on sign-out.
 */
export function useDocumentUploads() {
  const { authedRequest } = useAuth()
  const api = useMemo(() => createDocumentApi(authedRequest), [authedRequest])
  const [docs, setDocs] = useState<DocumentRecord[]>([])
  const [uploadedKeys, setUploadedKeys] = useState<Set<string>>(() => new Set())
  const [uploading, setUploading] = useState<string | null>(null)
  const [invalid, setInvalid] = useState<string | null>(null)
  const [failure, setFailure] = useState<Failure | null>(null)
  const [possibleDuplicate, setPossibleDuplicate] = useState<File | null>(null)
  const inflight = useRef<AbortController | null>(null)

  useEffect(() => () => inflight.current?.abort(), [])

  const send = useCallback(async (file: File) => {
    const controller = new AbortController()
    inflight.current = controller
    setUploading(file.name)
    try {
      const doc = await api.upload(file, controller.signal)
      setDocs((d) => [doc, ...d])
      setUploadedKeys((k) => new Set(k).add(key(file)))
    } catch (e) {
      if (!(e instanceof ApiError && e.kind === 'aborted')) setFailure(describeUploadFailure(e))
    } finally {
      setUploading(null)
      inflight.current = null
    }
  }, [api])

  const choose = useCallback(async (file: File) => {
    setInvalid(null); setFailure(null); setPossibleDuplicate(null)
    const check = await validatePdf(file)
    if (!check.ok) { setInvalid(check.message); return }
    // Client-side hint only: the backend performs no duplicate detection at all.
    if (uploadedKeys.has(key(file))) { setPossibleDuplicate(file); return }
    await send(file)
  }, [uploadedKeys, send])

  const confirmDuplicate = useCallback(async () => {
    const f = possibleDuplicate
    setPossibleDuplicate(null)
    if (f) await send(f)
  }, [possibleDuplicate, send])

  return { docs, uploading, invalid, failure, possibleDuplicate, choose, confirmDuplicate, dismissDuplicate: () => setPossibleDuplicate(null) }
}
