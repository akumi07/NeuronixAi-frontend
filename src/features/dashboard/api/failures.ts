import { ApiError } from '../../auth/api/httpClient'

export interface Failure {
  title: string
  message: string
}

/** Safe, generic copy for failed authenticated calls. Server text and record data are never shown. */
export function describeFailure(error: unknown): Failure {
  if (error instanceof ApiError) {
    if (error.kind === 'network') return { title: 'Can’t reach NeuronixAI', message: 'Check your connection and try again.' }
    if (error.kind === 'timeout') return { title: 'That took too long', message: 'The server didn’t respond in time.' }
    if (error.status === 403) return { title: 'No permission', message: 'Your account isn’t allowed to access this.' }
    if (error.status === 404) return { title: 'Not found', message: 'That item is no longer available.' }
    if (error.status === 429) return { title: 'Too many requests', message: 'Please wait a moment and try again.' }
  }
  return { title: 'Something went wrong on our side', message: 'Please try again in a moment.' }
}

export const isAborted = (e: unknown) => e instanceof ApiError && e.kind === 'aborted'
