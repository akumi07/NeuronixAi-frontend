import type { FeatureKey } from './availability'

/**
 * Central registry of every backend endpoint the frontend knows about.
 *   implemented    : exists in the Spring Boot source (verified by reading controllers/DTOs)
 *   proposed       : contract defined by the frontend; NOT implemented in the backend yet
 *   internal-test  : exists but is a development test route; never used in production builds
 */
export type ContractStatus = 'implemented' | 'proposed' | 'internal-test'
export type HttpMethod = 'GET' | 'POST' | 'DELETE'

export interface Endpoint<P = void> {
  readonly method: HttpMethod
  readonly auth: 'public' | 'bearer'
  readonly status: ContractStatus
  readonly path: (params: P) => string
  readonly feature?: FeatureKey
  readonly timeoutMs?: number
}

const ep = <P = void>(method: HttpMethod, auth: Endpoint['auth'], status: ContractStatus, path: (p: P) => string, extra: { feature?: FeatureKey; timeoutMs?: number } = {}): Endpoint<P> =>
  ({ method, auth, status, path, ...extra })

const V1 = '/api/v1'
const enc = encodeURIComponent

export const ENDPOINTS = {
  auth: {
    login: ep('POST', 'public', 'implemented', () => `${V1}/auth/login`),
    register: ep('POST', 'public', 'implemented', () => `${V1}/auth/register`),
    logout: ep('POST', 'bearer', 'implemented', () => `${V1}/auth/logout`),
    changePassword: ep('POST', 'bearer', 'implemented', () => `${V1}/auth/new-password`),
    verifyEmailOtp: ep('POST', 'public', 'proposed', () => `${V1}/auth/verify-email-otp`, { feature: 'registerOtp' }),
    resendOtp: ep('POST', 'public', 'proposed', () => `${V1}/auth/resend-otp`, { feature: 'registerOtp' }),
    forgotRequest: ep('POST', 'public', 'proposed', () => `${V1}/auth/forgot-password/request`, { feature: 'passwordResetOtp' }),
    forgotVerifyOtp: ep('POST', 'public', 'proposed', () => `${V1}/auth/forgot-password/verify-otp`, { feature: 'passwordResetOtp' }),
    forgotReset: ep('POST', 'public', 'proposed', () => `${V1}/auth/forgot-password/reset`, { feature: 'passwordResetOtp' }),
  },
  users: {
    me: ep('GET', 'bearer', 'implemented', () => `${V1}/users/me`),
  },
  conversations: {
    list: ep('GET', 'bearer', 'implemented', () => `${V1}/conversations`),
    messages: ep<number>('GET', 'bearer', 'implemented', (id) => `${V1}/conversations/${id}/messages`),
    remove: ep<number>('DELETE', 'bearer', 'implemented', (id) => `${V1}/conversations/${id}/deleteConversation`),
    executions: ep<number>('GET', 'bearer', 'proposed', (id) => `${V1}/conversations/${id}/executions`, { feature: 'executions' }),
  },
  chat: {
    send: ep('POST', 'bearer', 'implemented', () => `${V1}/chat`, { timeoutMs: 90_000 }),
  },
  orchestrations: {
    start: ep('POST', 'bearer', 'proposed', () => `${V1}/orchestrations`, { feature: 'orchestration', timeoutMs: 30_000 }),
    get: ep<string>('GET', 'bearer', 'proposed', (id) => `${V1}/orchestrations/${enc(id)}`, { feature: 'orchestration' }),
    cancel: ep<string>('POST', 'bearer', 'proposed', (id) => `${V1}/orchestrations/${enc(id)}/cancel`, { feature: 'orchestration' }),
  },
  documents: {
    upload: ep('POST', 'bearer', 'implemented', () => `${V1}/documents`, { timeoutMs: 60_000 }),
    list: ep('GET', 'bearer', 'proposed', () => `${V1}/documents`, { feature: 'documentList' }),
    remove: ep<string>('DELETE', 'bearer', 'proposed', (id) => `${V1}/documents/${enc(id)}`, { feature: 'documentDelete' }),
    process: ep<string>('POST', 'bearer', 'proposed', (id) => `${V1}/documents/${enc(id)}/process`, { feature: 'documentProcess', timeoutMs: 120_000 }),
    ask: ep<string>('POST', 'bearer', 'proposed', (id) => `${V1}/documents/${enc(id)}/ask`, { feature: 'documentQa', timeoutMs: 90_000 }),
  },
  /** Backend development test routes. Used only when ENABLE_RAG_TEST_ENDPOINTS is on (dev builds). */
  ragTest: {
    chunk: ep<string>('POST', 'bearer', 'internal-test', (id) => `${V1}/documents/test/${enc(id)}/chunk`, { timeoutMs: 120_000 }),
    embeddings: ep<string>('POST', 'bearer', 'internal-test', (id) => `${V1}/rag/test/documents/${enc(id)}/embeddings`, { timeoutMs: 120_000 }),
    ask: ep<string>('GET', 'bearer', 'internal-test', (id) => `${V1}/rag/test/documents/${enc(id)}/ask`, { timeoutMs: 90_000 }),
  },
  system: {
    health: ep('GET', 'public', 'implemented', () => '/actuator/health', { timeoutMs: 8000 }),
  },
} as const
