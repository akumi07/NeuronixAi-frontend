import { apiRequest } from '../../auth/api/httpClient'

export interface HealthResult { status: string }

/**
 * `GET /actuator/health` is public in SecurityConfig and exposed by `management.endpoints.web.exposure.include=health,info`.
 * We read only the overall status string; details are never requested or shown.
 */
export const settingsApi = {
  health: (signal?: AbortSignal) => apiRequest<HealthResult>('GET', '/actuator/health', { signal, timeoutMs: 8000 }),
}
