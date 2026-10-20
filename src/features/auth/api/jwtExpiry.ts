/**
 * Reads the `exp` claim (seconds) for UX scheduling only. This does NOT verify the token;
 * the backend remains the sole authority on whether a token is valid.
 */
export function readTokenExpiryMs(token: string): number | null {
  try {
    const payload = token.split('.')[1]
    if (!payload) return null
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    const exp = (JSON.parse(json) as { exp?: unknown }).exp
    return typeof exp === 'number' ? exp * 1000 : null
  } catch {
    return null
  }
}
