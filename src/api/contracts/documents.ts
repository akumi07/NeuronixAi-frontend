import { z } from 'zod'

/**
 * DOCUMENT CONTRACTS
 *  implemented    : POST /documents (upload → status "UPLOADED"; the backend never advances this status today)
 *  internal-test  : chunk, embeddings, ask, search under /documents/test and /rag/test (no ownership checks; dev flag only)
 *  proposed       : list, get, delete, process, ask (production RAG)
 */
const id = z.union([z.string(), z.number()]).transform(String)

export const documentRecord = z.object({
  id: id,
  fileName: z.string(),
  fileType: z.string().optional().default(''),
  fileSize: z.number().optional().default(0),
  status: z.string(),
  createdAt: z.string().optional().default(''),
  updatedAt: z.string().optional().default(''),
  chunkCount: z.number().optional(),
  failureReason: z.string().nullish(),
}).passthrough()
export type DocumentRecord = z.infer<typeof documentRecord>
export const documentList = z.array(documentRecord)

/**
 * Status vocabulary. The current backend only ever writes UPLOADED. The READY set is the proposed vocabulary: a document is
 * shown as usable for retrieval ONLY when the backend reports one of these. Unknown values are shown verbatim as "not confirmed ready".
 */
export const READY_STATUSES: ReadonlySet<string> = new Set(['INDEXED', 'READY', 'EMBEDDED'])
export const PROCESSING_STATUSES: ReadonlySet<string> = new Set(['PROCESSING', 'EXTRACTING', 'CHUNKING', 'EMBEDDING', 'QUEUED'])
export const FAILED_STATUSES: ReadonlySet<string> = new Set(['FAILED', 'ERROR'])

export type DocumentPhase = 'uploaded' | 'processing' | 'ready' | 'failed' | 'unknown'
export function documentPhase(status: string): DocumentPhase {
  const s = status.toUpperCase()
  if (s === 'UPLOADED') return 'uploaded'
  if (READY_STATUSES.has(s)) return 'ready'
  if (PROCESSING_STATUSES.has(s)) return 'processing'
  if (FAILED_STATUSES.has(s)) return 'failed'
  return 'unknown'
}

export const askResponse = z.object({
  answer: z.string(),
  sources: z.array(z.object({ chunkIndex: z.number().optional(), content: z.string().optional(), similarity: z.number().optional() })).optional(),
  documentIds: z.array(id).optional(),
}).passthrough()
export type AskResponse = z.infer<typeof askResponse>

export interface AskRequest { question: string; topK?: number }
