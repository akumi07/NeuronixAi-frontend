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
 * Development-only switch that lets the Knowledge screen drive the backend's internal RAG *test* endpoints
 * (chunk / embeddings / ask). Those routes have no ownership checks, so this is ignored in production builds.
 */
export const ENABLE_RAG_TEST_ENDPOINTS: boolean = IS_DEV && import.meta.env.VITE_ENABLE_RAG_TEST_ENDPOINTS === 'true'

export const REQUEST_TIMEOUT_MS = 15_000
