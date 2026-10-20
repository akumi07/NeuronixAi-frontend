import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { clearUnavailable, isMarkedUnavailable, useFeatureUnavailable } from '../../../api/availability'
import { ENABLE_RAG_TEST_ENDPOINTS } from '../../../api/config'
import { documentPhase, type DocumentPhase } from '../../../api/contracts/documents'
import { ApiError, effectiveStatus, isApiError } from '../../../api/errors'
import { categorize } from '../../../api/normalize'
import { getSelectedDocuments, setSelectedDocuments } from '../../../lib/documentSelection'
import { describeFailure, isAborted, type Failure } from '../../dashboard/api/failures'
import { useDocumentApi, type DocumentRecord } from '../api/documentApi'
import { validatePdf } from '../lib/validateFile'

const key = (f: { name: string; size: number }) => `${f.name}\u0000${f.size}`

function describeUploadFailure(e: unknown): Failure {
  if (isApiError(e) && e.kind === 'http') {
    const status = effectiveStatus(e)
    if (status === 413) return { title: 'File too large', message: 'The server rejected this file because it exceeds its size limit.', category: 'validation' }
    if (status === 403) return { title: 'Not allowed', message: 'Your account isn’t permitted to upload documents.', category: 'forbidden' }
    if (status === 409) return { title: 'Duplicate document', message: 'The server reports that this document already exists.', category: 'conflict' }
    if (status === 400 || status === 415 || status === 500)
      return { title: 'Upload failed', message: 'The server couldn’t accept this file. Make sure it is a valid PDF and try again. The server doesn’t say why uploads are rejected.', category: 'validation' }
  }
  return describeFailure(e)
}

export type ListState = { phase: 'loading' } | { phase: 'ready'; docs: DocumentRecord[] } | { phase: 'unavailable' } | { phase: 'error'; failure: Failure }
export interface ProcessState { running: boolean; failure: Failure | null; note: string | null }
export interface AskState { phase: 'idle' | 'loading' | 'ready' | 'error'; answer?: string; source?: 'production' | 'dev-test'; sources?: Array<{ chunkIndex?: number; content?: string; similarity?: number }>; failure?: Failure; question?: string }
export interface Displayed extends DocumentRecord { phase: DocumentPhase; note?: string }

/**
 * Knowledge screen state. The list comes from the backend when its list endpoint exists; until then only this session's
 * uploads are known. A document is shown as ready for retrieval only when the backend says so (status vocabulary in the contract,
 * or a confirmed embeddings response from the dev test pipeline). Nothing is inferred.
 */
export function useKnowledge(email: string) {
  const api = useDocumentApi()
  const listUnavailable = useFeatureUnavailable('documentList')
  const [list, setList] = useState<ListState>(isMarkedUnavailable('documentList') ? { phase: 'unavailable' } : { phase: 'loading' })
  const [sessionDocs, setSessionDocs] = useState<DocumentRecord[]>([])
  const [uploadedKeys, setUploadedKeys] = useState<Set<string>>(() => new Set())
  const [overrides, setOverrides] = useState<Record<string, { phase: DocumentPhase; note: string }>>({})
  const [process, setProcess] = useState<Record<string, ProcessState>>({})
  const [uploading, setUploading] = useState<string | null>(null)
  const [progress, setProgress] = useState<number | null>(null)
  const [invalid, setInvalid] = useState<string | null>(null)
  const [uploadFailure, setUploadFailure] = useState<Failure | null>(null)
  const [possibleDuplicate, setPossibleDuplicate] = useState<File | null>(null)
  const [selected, setSelected] = useState<Set<string>>(() => new Set(getSelectedDocuments(email).map((d) => d.id)))
  const [deleteFailure, setDeleteFailure] = useState<Failure | null>(null)
  const [ask, setAsk] = useState<AskState>({ phase: 'idle' })
  const [attempt, setAttempt] = useState(0)
  const inflight = useRef<AbortController | null>(null)

  const refreshList = useCallback((signal?: AbortSignal) => {
    api.list(signal).then(
      (docs) => setList({ phase: 'ready', docs }),
      (e) => {
        if (isAborted(e)) return
        setList(categorize(e, { planned: true }) === 'unavailable' ? { phase: 'unavailable' } : { phase: 'error', failure: describeFailure(e, { planned: true }) })
      },
    )
  }, [api])

  useEffect(() => {
    if (isMarkedUnavailable('documentList')) return
    const c = new AbortController()
    refreshList(c.signal)
    return () => c.abort()
  }, [refreshList, attempt])

  useEffect(() => () => inflight.current?.abort(), [])

  // While the backend reports a document as still processing, re-read the list so the real status appears (no guessing).
  const anyProcessing = list.phase === 'ready' && list.docs.some((d) => documentPhase(d.status) === 'processing')
  useEffect(() => {
    if (!anyProcessing) return
    const id = window.setInterval(() => refreshList(), 2500)
    return () => window.clearInterval(id)
  }, [anyProcessing, refreshList])

  const recheckList = useCallback(() => { clearUnavailable('documentList'); setList({ phase: 'loading' }); setAttempt((n) => n + 1) }, [])

  const base: DocumentRecord[] = list.phase === 'ready' ? list.docs : sessionDocs
  const docs: Displayed[] = useMemo(() => base.map((d) => {
    const o = overrides[d.id]
    return { ...d, phase: o?.phase ?? documentPhase(d.status), note: o?.note }
  }), [base, overrides])

  // Share the chosen documents with the workspace (in memory, account-bound).
  useEffect(() => {
    if (list.phase === 'loading') return // don't overwrite the shared selection before we know which documents exist
    setSelectedDocuments(email, docs.filter((d) => selected.has(d.id)).map((d) => ({ id: d.id, name: d.fileName })))
  }, [email, docs, selected, list.phase])

  const toggleSelected = useCallback((id: string) => setSelected((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n }), [])

  // ---- upload ----
  const send = useCallback(async (file: File) => {
    const controller = new AbortController()
    inflight.current = controller
    setUploading(file.name); setProgress(0)
    try {
      const doc = await api.upload(file, { signal: controller.signal, onProgress: setProgress })
      setSessionDocs((d) => [doc, ...d])
      setUploadedKeys((k) => new Set(k).add(key(file)))
      if (!isMarkedUnavailable('documentList')) refreshList()
    } catch (e) {
      if (!(e instanceof ApiError && e.kind === 'aborted')) setUploadFailure(describeUploadFailure(e))
    } finally {
      setUploading(null); setProgress(null); inflight.current = null
    }
  }, [api, refreshList])

  const choose = useCallback(async (file: File) => {
    setInvalid(null); setUploadFailure(null); setPossibleDuplicate(null)
    const check = await validatePdf(file)
    if (!check.ok) { setInvalid(check.message); return }
    // Client-side hint only: the backend performs no duplicate detection today.
    if (uploadedKeys.has(key(file))) { setPossibleDuplicate(file); return }
    await send(file)
  }, [uploadedKeys, send])

  const confirmDuplicate = useCallback(async () => { const f = possibleDuplicate; setPossibleDuplicate(null); if (f) await send(f) }, [possibleDuplicate, send])

  // ---- process / index ----
  const setProc = (id: string, p: Partial<ProcessState>) => setProcess((m) => { const prev: ProcessState = m[id] ?? { running: false, failure: null, note: null }; return { ...m, [id]: { ...prev, ...p } } })

  const processDocument = useCallback(async (id: string) => {
    if (process[id]?.running) return // prevents duplicate processing requests
    setProc(id, { running: true, failure: null, note: null })
    try {
      let handled = false
      if (!ENABLE_RAG_TEST_ENDPOINTS && !isMarkedUnavailable('documentProcess')) {
        try {
          const rec = await api.process(id)
          handled = true
          // Show the status the backend just returned; the server list (re-read below) stays the source of truth afterwards.
          if (rec?.status) setSessionDocs((d) => d.map((x) => (x.id === id ? { ...x, status: rec.status } : x)))
          if (!isMarkedUnavailable('documentList')) refreshList()
          setProc(id, { running: false, note: 'Processing requested. The status above reflects what the backend reports.' })
        } catch (e) {
          if (categorize(e, { planned: true }) !== 'unavailable') throw e
        }
      }
      if (!handled) {
        if (!ENABLE_RAG_TEST_ENDPOINTS) { setProc(id, { running: false, failure: { title: 'In development', message: '', category: 'unavailable' } }); return }
        // DEV ONLY: drive the backend's internal test pipeline. Responses are plain-text confirmations from the backend.
        const chunks = await api.test.chunk(id)
        const embeddings = await api.test.embeddings(id)
        setOverrides((o) => ({ ...o, [id]: { phase: 'ready', note: `Dev test pipeline: ${chunks.trim()}; ${embeddings.trim()}` } }))
        setProc(id, { running: false, note: 'Confirmed by the backend test endpoints (development only).' })
      }
    } catch (e) {
      const f = describeFailure(e, { planned: true })
      if (isApiError(e) && effectiveStatus(e) === 409) f.message = 'This document is already being processed or has been processed.'
      setProc(id, { running: false, failure: f })
      if (isApiError(e) && e.code === 'DOCUMENT_NOT_FOUND') refreshList()
    }
  }, [api, process, refreshList])

  // ---- add an existing document by id (test-endpoint mode only: the backend has no list endpoint) ----
  const addExistingDocument = useCallback((rawId: string): string | null => {
    const id = rawId.trim()
    if (!/^\d{1,15}$/.test(id)) return 'Enter a numeric document ID.'
    if (base.some((d) => d.id === id)) return 'That document is already in the list.'
    const now = new Date().toISOString().slice(0, 19)
    setSessionDocs((d) => [{ id, fileName: `Document #${id} (added by ID)`, fileType: '', fileSize: 0, status: 'UNVERIFIED', createdAt: now, updatedAt: now }, ...d])
    return null
  }, [base])

  // ---- delete ----
  const deleteDocument = useCallback(async (id: string): Promise<boolean> => {
    setDeleteFailure(null)
    try {
      await api.remove(id)
    } catch (e) {
      if (isApiError(e) && e.code === 'DOCUMENT_NOT_FOUND') { /* already gone: fall through and drop it locally */ }
      else { setDeleteFailure(describeFailure(e, { planned: true })); return false }
    }
    setSessionDocs((d) => d.filter((x) => x.id !== id))
    setSelected((s) => { const n = new Set(s); n.delete(id); return n })
    if (!isMarkedUnavailable('documentList')) refreshList()
    return true
  }, [api, refreshList])

  // ---- ask ----
  const askDocument = useCallback(async (id: string, question: string, topK: number) => {
    setAsk({ phase: 'loading', question })
    const controller = new AbortController()
    inflight.current = controller
    try {
      if (!ENABLE_RAG_TEST_ENDPOINTS && !isMarkedUnavailable('documentQa')) {
        try {
          const r = await api.ask(id, question, topK, controller.signal)
          setAsk({ phase: 'ready', answer: r.answer, sources: r.sources, source: 'production', question })
          return
        } catch (e) {
          if (categorize(e, { planned: true }) !== 'unavailable') throw e
        }
      }
      if (!ENABLE_RAG_TEST_ENDPOINTS) { setAsk({ phase: 'error', question, failure: { title: 'In development', message: '', category: 'unavailable' } }); return }
      const answer = await api.test.ask(id, question, topK, controller.signal)
      setAsk({ phase: 'ready', answer, source: 'dev-test', question })
    } catch (e) {
      if (!isAborted(e)) setAsk({ phase: 'error', question, failure: describeFailure(e, { planned: true }) })
    } finally {
      inflight.current = null
    }
  }, [api])

  return {
    list, listUnavailable, docs, recheckList,
    uploading, progress, invalid, uploadFailure, possibleDuplicate, choose, confirmDuplicate, dismissDuplicate: () => setPossibleDuplicate(null),
    selected, toggleSelected,
    process, processDocument,
    deleteDocument, deleteFailure, addExistingDocument,
    ask, askDocument, resetAsk: () => setAsk({ phase: 'idle' }),
  }
}
export type KnowledgeApi = ReturnType<typeof useKnowledge>
