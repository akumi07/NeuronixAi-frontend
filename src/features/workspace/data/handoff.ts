/**
 * In-memory hand-off of a draft from the dashboard composer to the workspace. It is never written to
 * storage or the URL/history state, is bound to the signed-in account, and is cleared when read.
 */
let draft: { email: string; text: string } | null = null

export const setHandoffDraft = (email: string, text: string) => { draft = { email, text } }
export const peekHandoffDraft = (email: string) => (draft && draft.email === email ? draft.text : '')
export const clearHandoffDraft = () => { draft = null }
