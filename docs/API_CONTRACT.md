# API contract (single source of truth: `src/api/endpoints.ts`)

Spring Boot is the only API the browser talks to. It will front the future Python/LangGraph service; the browser never calls that service.
Every endpoint is registered once with a status:

- **implemented**: exists in the Spring Boot source (verified by reading controllers/DTOs in `akumi07/NeuronixAI`).
- **proposed**: contract defined by the frontend; **not implemented** in the backend. The UI is ready for it.
- **internal-test**: backend development test route; used only when `VITE_ENABLE_RAG_TEST_ENDPOINTS=true` in a dev build.

## Implemented (current backend)
| Method | Path | Request → Response |
|---|---|---|
| POST | `/api/v1/auth/login` | `{email,password}` → `{accessToken}` |
| POST | `/api/v1/auth/register` | `{email,password}` → `{accessToken}` (no OTP today; a pending body is also understood, see below) |
| POST | `/api/v1/auth/logout` | Bearer → text |
| POST | `/api/v1/auth/new-password` | Bearer, `{password}` → 200 (used only for the authenticated change-password form in Settings) |
| GET | `/api/v1/users/me` | → `{id,email,createdAt}` |
| GET | `/api/v1/conversations` | → `[{id,title,createdAt,updatedAt}]` |
| GET | `/api/v1/conversations/{id}/messages` | → `[{id,role,content,createdAt}]` |
| DELETE | `/api/v1/conversations/{id}/deleteConversation` | → text |
| POST | `/api/v1/chat` | `{conversationId?,message}` → `{conversationId,response}` |
| POST | `/api/v1/documents` | multipart `file` → `{id,fileName,fileType,fileSize,status:"UPLOADED",createdAt,updatedAt}` |
| GET | `/actuator/health` | → `{status}` |

The legacy `forget-password` → `new-password` reset (which hands out a normal access token) is **no longer used** by the UI.

## Proposed (not implemented; the UI handles "not available" for each)
**Auth (OTP, 4 digits)**
- `POST /api/v1/auth/register` may answer `{status:"PENDING_VERIFICATION", maskedEmail?, resendAvailableInSeconds?, expiresInSeconds?}`. The UI then goes to `/register/verify` and creates no session.
- `POST /api/v1/auth/verify-email-otp` `{email,otp}` → `{accessToken}` (signs in) or `{status:"VERIFIED"}` (user logs in).
- `POST /api/v1/auth/resend-otp` `{email,purpose:"REGISTRATION"|"PASSWORD_RESET"}` → `{resendAvailableInSeconds?}`
- `POST /api/v1/auth/forgot-password/request` `{email}` → generic 200 (must not reveal whether the account exists)
- `POST /api/v1/auth/forgot-password/verify-otp` `{email,otp}` → `{resetToken, expiresInSeconds?}` (short-lived, single-use, purpose-specific; never an access JWT)
- `POST /api/v1/auth/forgot-password/reset` `{resetToken,newPassword,confirmPassword}` → 200; the user is sent to `/login`
- Error codes the UI understands: `OTP_INVALID`, `OTP_EXPIRED` (or 410), `OTP_ATTEMPTS_EXCEEDED`, `OTP_RESEND_TOO_SOON`, `RESET_TOKEN_INVALID`, `RESET_TOKEN_EXPIRED`, `PASSWORD_POLICY_VIOLATION`. Use 400/410/429 for these; a 401 *without* a code on these public routes is read as "route not implemented".
- The backend must enforce OTP expiry, single use, attempt limits and resend cooldowns. The UI countdown is only a convenience.

**Orchestration (automatic agent selection)**
- `POST /api/v1/orchestrations` `{prompt, conversationId?, documentIds:[], executionMode:"AUTO"}` → `{executionId, conversationId, status, selectedAgents:[], message?}`
- `GET /api/v1/orchestrations/{executionId}` → execution
- `GET /api/v1/conversations/{id}/executions` → `[execution]`
- `POST /api/v1/orchestrations/{executionId}/cancel`
- `execution` = `{executionId, conversationId?, prompt?, status: QUEUED|RUNNING|COMPLETED|FAILED|CANCELLED, selectedAgents:[{id,name?,capability?,role?}|string], steps:[{id,name?,agent?,status,startedAt?,finishedAt?,durationMs?,attempt?,dependsOn?,result?,error?:{code?,message?}}], result?, error?:{code?,message?}, createdAt?, updatedAt?, durationMs?, retryCount?}`
- Error messages in `error.message` are displayed (truncated), so the backend must only send messages that are safe to show.
- The UI shows agents, steps, durations and statuses only when the backend returns them. It never infers progress. While the orchestration route is missing, chat uses `/api/v1/chat`.

**Documents / RAG**
- `GET /api/v1/documents` → `[document]` with `status` and optional `chunkCount`, `failureReason`
- `DELETE /api/v1/documents/{id}`
- `POST /api/v1/documents/{id}/process` → document (status `PROCESSING`…)
- `POST /api/v1/documents/{id}/ask` `{question, topK?}` → `{answer, sources?:[{chunkIndex?,content?,similarity?}]}`
- Status vocabulary: `UPLOADED`, `PROCESSING`/`EXTRACTING`/`CHUNKING`/`EMBEDDING`/`QUEUED`, ready = `INDEXED`/`READY`/`EMBEDDED`, `FAILED`/`ERROR`. A document is shown as "Ready for retrieval" only for the ready set; the current backend only ever returns `UPLOADED`.
- Test routes (used by the Knowledge screen while production endpoints don't exist; ON by default in dev builds, OFF in production unless `VITE_ENABLE_RAG_TEST_ENDPOINTS=true`): `POST /api/v1/documents/test/{id}/chunk`, `POST /api/v1/rag/test/documents/{id}/embeddings`, `GET /api/v1/rag/test/documents/{id}/ask?question=&topK=`. They have no ownership checks; do not expose them in production.

## Error handling (`src/api/errors.ts`, `src/api/normalize.ts`)
Suggested standard body (a proposal, not an existing backend behaviour): `{timestamp,status,error,code,message,path}`. The client keeps only `code` (matching `^[A-Z][A-Z0-9_]{2,63}$`) and discards prose.

| Situation | Treated as |
|---|---|
| `code` = `ENDPOINT_NOT_IMPLEMENTED` / `ENDPOINT_NOT_FOUND`, or HTTP 501 | feature unavailable ("In development") |
| 404 with a resource code (e.g. `DOCUMENT_NOT_FOUND`) | missing resource |
| code-less 404, 405, or a 401 that the session probe proved is not a session problem, **on an endpoint registered as proposed** | feature unavailable |
| the same responses on an implemented endpoint | missing resource / unsupported / server error (never "in development") |
| 400/422 · 403 · 409 · 429 (+`Retry-After`) · 502/504 · 503 · other 5xx | validation · forbidden · conflict · rate limited · bad gateway · service unavailable · server |
| network / timeout / malformed JSON | handled errors; the UI stays usable |
| genuine 401 (session probe `/users/me` also 401) | sign out with a notice |

Confirmed-unavailable features are remembered for the tab so unsupported requests aren't repeated; "Check again" (Settings → Connections, or the notice) clears them. Idempotent GETs are retried up to 3 times on network errors and 502/503/504; writes are never retried. Dev builds log only method, path (no query), status and code.

> Why 401 can mean "missing route": Spring Security secures the `/error` dispatch, so missing routes and server errors surface as 401. Fix on the backend with `.dispatcherTypeMatchers(DispatcherType.ERROR).permitAll()` and real exception handlers; the frontend does not rely on it.

## Configuration
`src/api/config.ts`: `VITE_API_BASE_URL` (origin only, default same-origin), `VITE_DEV_API_TARGET` (dev proxy), `VITE_ENABLE_RAG_TEST_ENDPOINTS` (default on in dev, off in production). See `.env.example`.
