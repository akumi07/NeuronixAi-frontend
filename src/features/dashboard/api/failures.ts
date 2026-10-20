import { ApiError } from '../../auth/api/httpClient'
import { normalizeError, type CategorizeOptions, type ErrorCategory } from '../../../api/normalize'

export interface Failure {
  title: string
  message: string
  category?: ErrorCategory
}

/** Safe, generic copy for failed calls (see src/api/normalize.ts). Server text and record data are never shown. */
export function describeFailure(error: unknown, options?: CategorizeOptions): Failure {
  const n = normalizeError(error, options)
  return { title: n.title, message: n.message, category: n.category }
}

export const isAborted = (e: unknown) => e instanceof ApiError && e.kind === 'aborted'
