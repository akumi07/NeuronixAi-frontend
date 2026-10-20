import { useSyncExternalStore } from 'react'

/**
 * Remembers, for this tab only, which planned backend features have been confirmed unavailable, so the app doesn't
 * keep sending the same unsupported request. "Check again" clears an entry once the backend has been updated.
 * Nothing is persisted.
 */
export type FeatureKey =
  | 'registerOtp' | 'passwordResetOtp'
  | 'orchestration' | 'executions'
  | 'documentList' | 'documentDelete' | 'documentProcess' | 'documentQa'

const unavailable = new Set<FeatureKey>()
const listeners = new Set<() => void>()
let version = 0
const notify = () => { version++; listeners.forEach((l) => l()) }

export function markUnavailable(key: FeatureKey) { if (!unavailable.has(key)) { unavailable.add(key); notify() } }
export function clearUnavailable(key: FeatureKey) { if (unavailable.delete(key)) notify() }
export function clearAllAvailability() { if (unavailable.size) { unavailable.clear(); notify() } }
export const isMarkedUnavailable = (key: FeatureKey) => unavailable.has(key)

function subscribe(cb: () => void) { listeners.add(cb); return () => { listeners.delete(cb) } }

/** True once the feature has been confirmed unavailable in this session. */
export function useFeatureUnavailable(key: FeatureKey): boolean {
  useSyncExternalStore(subscribe, () => version)
  return unavailable.has(key)
}
