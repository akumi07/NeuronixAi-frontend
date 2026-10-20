import { useMemo } from 'react'
import { z } from 'zod'
import { parseResponse, useApi } from '../../../api/call'
import { askResponse, documentList, documentRecord, type AskResponse, type DocumentRecord } from '../../../api/contracts/documents'
import { ENDPOINTS } from '../../../api/endpoints'
import { useAuth } from '../../auth/context/AuthContext'

export type { DocumentRecord, AskResponse }

/**
 * Document client.
 *  implemented    : upload
 *  proposed       : list, remove, process, ask  (docs/API_CONTRACT.md)
 *  internal-test  : chunk, embeddings, askTest  (backend test routes with NO ownership checks; only used when ENABLE_RAG_TEST_ENDPOINTS is on in dev)
 * The Knowledge UI depends only on this module, so swapping the test routes for the final product endpoints touches nothing else.
 */
export function useDocumentApi() {
  const call = useApi()
  const { authedUpload } = useAuth()
  return useMemo(() => ({
    upload: async (file: File, o: { signal?: AbortSignal; onProgress?: (fraction: number) => void }): Promise<DocumentRecord> => {
      const form = new FormData()
      form.append('file', file)
      const raw = await authedUpload<unknown>(ENDPOINTS.documents.upload.path(), form, { ...o, timeoutMs: ENDPOINTS.documents.upload.timeoutMs })
      return parseResponse(documentRecord, raw)
    },
    list: (signal?: AbortSignal) => call(ENDPOINTS.documents.list, { signal, schema: documentList }),
    remove: (id: string) => call(ENDPOINTS.documents.remove, { params: id }),
    process: (id: string) => call(ENDPOINTS.documents.process, { params: id, schema: documentRecord.optional() }),
    ask: (id: string, question: string, topK: number, signal?: AbortSignal) => call(ENDPOINTS.documents.ask, { params: id, body: { question, topK }, signal, schema: askResponse }),
    test: {
      chunk: (id: string) => call(ENDPOINTS.ragTest.chunk, { params: id, schema: z.unknown() }).then(String),
      embeddings: (id: string) => call(ENDPOINTS.ragTest.embeddings, { params: id, schema: z.unknown() }).then(String),
      ask: (id: string, question: string, topK: number, signal?: AbortSignal) => call(ENDPOINTS.ragTest.ask, { params: id, query: { question, topK }, signal, schema: z.unknown() }).then(String),
    },
  }), [call, authedUpload])
}
