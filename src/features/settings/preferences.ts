import { useSyncExternalStore } from 'react'

/**
 * Non-sensitive interface preferences only (never tokens, passwords, or private data). They live in localStorage
 * so they survive reloads; storage failures are tolerated and fall back to defaults.
 */
export interface Preferences {
  motion: 'system' | 'reduce'
  textSize: 'default' | 'large'
}

export const DEFAULT_PREFERENCES: Preferences = { motion: 'system', textSize: 'default' }
const KEY = 'neuronix.ui-preferences'

/** Accepts only known values, so tampered storage can't inject arbitrary data. */
export function sanitizePreferences(raw: unknown): Preferences {
  const o = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>
  return {
    motion: o.motion === 'reduce' ? 'reduce' : 'system',
    textSize: o.textSize === 'large' ? 'large' : 'default',
  }
}

function read(): Preferences {
  try {
    const text = window.localStorage.getItem(KEY)
    return text ? sanitizePreferences(JSON.parse(text)) : DEFAULT_PREFERENCES
  } catch {
    return DEFAULT_PREFERENCES
  }
}

let current: Preferences = read()
const listeners = new Set<() => void>()

export function applyPreferences(p: Preferences = current) {
  const root = document.documentElement
  if (p.motion === 'reduce') root.dataset.motion = 'reduce'
  else delete root.dataset.motion
  root.style.fontSize = p.textSize === 'large' ? '112.5%' : ''
}

export function setPreferences(next: Partial<Preferences>) {
  current = sanitizePreferences({ ...current, ...next })
  try { window.localStorage.setItem(KEY, JSON.stringify(current)) } catch { /* storage unavailable: keep in memory */ }
  applyPreferences(current)
  listeners.forEach((l) => l())
}

export function usePreferences(): Preferences {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb) },
    () => current,
  )
}
