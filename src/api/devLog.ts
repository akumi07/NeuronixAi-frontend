import { IS_DEV } from './config'

/**
 * Development-only diagnostics. Callers must pass only non-sensitive metadata (method, path without query, status, code).
 * Never pass tokens, passwords, OTPs, reset tokens, request/response bodies, or document contents.
 */
export function devLog(event: string, meta: Record<string, string | number | boolean | undefined>) {
  if (IS_DEV) console.debug(`[neuronix] ${event}`, meta)
}
