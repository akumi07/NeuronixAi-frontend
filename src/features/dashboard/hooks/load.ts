import type { Failure } from '../api/failures'

export type Load<T> = { status: 'loading' } | { status: 'ready'; data: T } | { status: 'error'; failure: Failure }
