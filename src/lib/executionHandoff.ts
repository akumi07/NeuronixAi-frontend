import type { Execution } from '../api/contracts/orchestration'

/**
 * In-memory hand-off of a just-started execution from a brand-new workspace session to the session that mounts after the
 * route changes to the new conversation id. Account-bound, cleared on read, never persisted.
 */
let held: { email: string; conversationId: string; execution: Execution } | null = null

export const holdExecution = (email: string, conversationId: string, execution: Execution) => { held = { email, conversationId, execution } }
export function takeExecution(email: string, conversationId: string): Execution | null {
  const h = held
  held = null
  return h && h.email === email && h.conversationId === conversationId ? h.execution : null
}
export const clearHeldExecution = () => { held = null }
export function peekExecution(email: string, conversationId: string): Execution | null {
  return held && held.email === email && held.conversationId === conversationId ? held.execution : null
}
