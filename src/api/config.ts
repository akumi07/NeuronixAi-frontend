/**
 * Single source of truth for runtime configuration. Only non-secret values belong here:
 * everything under VITE_* is embedded in the public bundle.
 *
 * VITE_API_BASE_URL  Origin of the Spring Boot API (e.g. https://api.example.com). Leave empty to use the same origin
 *                    (recommended: reverse-proxy /api and /actuator). Endpoint paths already include "/api/v1".
 */
export const API_BASE_URL: string = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

export const IS_DEV: boolean = import.meta.env.DEV

/**
 * Lets the Knowledge screen use the backend's internal RAG *test* endpoints (chunk / embeddings / ask) until production
 * document endpoints exist. Those routes take a document id and perform NO ownership checks (any signed-in user could query
 * another user's document), so:
 *   - dev builds: ON by default (set VITE_ENABLE_RAG_TEST_ENDPOINTS=false to turn it off)
 *   - production builds: OFF unless VITE_ENABLE_RAG_TEST_ENDPOINTS=true is set explicitly (a deliberate, documented decision)
 */
const ragFlag = import.meta.env.VITE_ENABLE_RAG_TEST_ENDPOINTS
export const ENABLE_RAG_TEST_ENDPOINTS: boolean = ragFlag === 'true' || (IS_DEV && ragFlag !== 'false')

export const REQUEST_TIMEOUT_MS = 15_000
