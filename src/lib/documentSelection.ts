import { useSyncExternalStore } from 'react'

/**
 * Documents the user chose (in Knowledge) to use as context for their next workspace task. In-memory, account-bound, never persisted.
 * A selection is only a request: the backend decides whether a document may be used, and whether it was.
 */
export interface SelectedDocument { id: string; name: string }

let state: { email: string; docs: SelectedDocument[] } | null = null
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())
const EMPTY: SelectedDocument[] = []

export function setSelectedDocuments(email: string, docs: SelectedDocument[]) { state = { email, docs }; emit() }
export function clearSelectedDocuments() { if (state) { state = null; emit() } }

export function useSelectedDocuments(email: string): SelectedDocument[] {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => { listeners.delete(cb) } },
    () => (state && state.email === email ? state.docs : EMPTY),
  )
}
