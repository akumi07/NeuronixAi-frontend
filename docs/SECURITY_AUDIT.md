# Frontend security and quality review (self-review, not a penetration test)

Scope: all implemented screens (landing, auth, dashboard, workspace, agents, tasks, conversations, knowledge, settings) and the backend
code in `akumi07/NeuronixAI` read for contracts. **No penetration test or third-party audit has been performed.** Findings come from code review,
automated scans (grep, `npm audit`), unit tests, and scripted browser runs against a local mock server that follows the verified contract (not the real backend).

## Verified in the frontend
| Area | Result | How verified |
|---|---|---|
| Secrets in source/bundle | None found. Only `VITE_API_BASE_URL` (non-secret) is read by app code; `VITE_DEV_API_TARGET` is read only by `vite.config.ts` and is absent from `dist/`. `.env*` is git-ignored except `.env.example`. | grep over `src`, built-bundle scan |
| Sensitive data in URLs/logs | No `console.*` calls; reset credential and drafts are kept in memory, never in URL/history state; forms use `method="post"`; referrer policy `no-referrer`. | grep, code review, browser run |
| Token storage | Bearer token in memory only (no localStorage/sessionStorage/cookies/IndexedDB). Only non-sensitive UI preferences use localStorage (validated against a whitelist). | grep + browser storage dump |
| Auth contract | Login/register/forget-password/new-password/logout and `/users/me` match the Spring controllers. | code review |
| Session handling | 401 → `GET /users/me` probe → sign out only if the token is truly rejected (a masked server error no longer signs the user out). Expiry timer signs out and shows a notice; no redirect loop. | browser run (dead token, masked 401) |
| Logout / account switch | Session, reset token and hand-off draft are cleared; every private page is keyed by account email; in-flight requests abort on unmount. A→logout→B showed none of A's data, draft, or URLs. | browser run, two accounts |
| Route guards | `RequireAuth` is UX only. Direct navigation signed out redirects to `/login`. | browser run |
| Cross-user access | Foreign/missing conversation or task ids return one neutral "isn't available" message and never render the other user's text. (The mock enforces ownership; in the real backend this relies on `findByIdAndUser`, verified by reading `ConversationService`/`ChatService`.) | browser run + code review |
| Output safety | No `dangerouslySetInnerHTML`/`innerHTML`/`eval`. Messages, code, titles, file names render as React text. Unit tests confirm `<script>`, `<img onerror>`, `javascript:` links and code-block HTML are escaped. | grep, vitest, browser |
| Input validation | Client checks (zod/RHF, PDF checks incl. `%PDF-` signature) are conveniences; server errors are mapped to generic messages. | vitest |
| Error messages | Server text is never displayed; network/timeout/401/403/404/413/429/5xx are mapped to fixed copy. ErrorBoundary shows a generic message and logs nothing. | code review, vitest |
| No mock fallback | Failed requests show an error with retry; no fake data (network-abort test). | browser run |
| Destructive actions | Confirm dialog (focus trap, Escape); success text only after the backend confirms and data is re-read; failure keeps the item. | browser run |
| Headers | Production CSP meta; 0 CSP violations over all screens. Real headers must be set at the host (docs/SECURITY_HEADERS.md). | `vite preview` run |
| Dependencies | `npm audit`: 0 vulnerabilities. Runtime deps: react, react-dom, react-router-dom, motion, lucide-react, react-hook-form, zod, @hookform/resolvers (pinned to v5 due to a v6 peer-dependency conflict), two @fontsource fonts (self-hosted, no third-party requests). Dev: vite, vitest, tailwind, typescript, eslint. All maintained; none unused. shadcn/ui and React Flow were not added. | `npm audit`, `npm ls` |
| Accessibility | Labels, `aria-*`, live regions, visible focus ring, skip link, focus trap in dialogs/drawer, tab semantics, reduced motion (OS setting or Settings toggle; motion library + CSS), contrast fixes for small light-on-gradient text. No automated axe run was done. | code review, browser run |
| Responsive | No horizontal overflow at 375px on settings, knowledge, agents, tasks, conversations, workspace. | browser run |

## Checks run
`npm run lint` clean · `npm run build` (tsc + vite) clean · `npm test` 27 passing (validation, date helpers, auth error mapping, API client behaviour, safe rendering, preferences) · scripted browser flows for: unauthenticated access, expired session, masked-401, network failure, health-check failure, validation failures, wrong current password, password change + relogin, two-account isolation, foreign ids, duplicate/invalid uploads, delete failure/success, CSP.

## Backend gaps (not changed; need separate work)
Verified by reading the Spring Boot source:
1. **Password reset takeover**: `POST /auth/forget-password` is public and returns a valid 24h access token for any email; `/auth/new-password` accepts it. Anyone knowing an email can take over that account.
2. `/auth/new-password` accepts any valid access token (no current-password check) and does not revoke existing tokens; Settings re-verifies the current password via `/auth/login` on the client as a mitigation, which a direct API caller can bypass.
3. `RAG/retrieval/chunk/extract-text/embedding "test"` controllers take a `documentId` with no ownership check (IDOR) and are exposed in production.
4. Spring secures the `/error` dispatch, so server errors surface as **401**; many exceptions are unhandled (500 instead of 400/404/413).
5. No rate limiting/lockout anywhere (no bucket4j/filter found); account enumeration via 409 (register) and 404 (forget-password).
6. `TokenRevocationService` is in-memory (lost on restart, not cluster-safe) and prints full tokens to stdout; `JwtAuthenticationFilter` prints exception messages.
7. `jwt.secret` is committed in `application.properties` (rotate; load from env only). `springdoc-openapi` UI and `devtools` are dependencies: ensure they're disabled/absent in production.
8. No CORS configuration; no explicit security-header configuration beyond Spring Security defaults; HTTPS/HSTS must be provided by the platform.
9. Upload: extension/MIME-only validation, no signature/malware scan, no explicit multipart size limits (Spring default 1 MB), no quota, no duplicate detection, raw client file name embedded in the S3 key, hard-coded bucket name.
10. `GET /users` and `GET /users/{id}` expose all users' emails to any authenticated user; `POST /users` is public with no password-length rule.
11. Timestamps have no time zone; unbounded list endpoints; no list/get/delete/status endpoints for documents, no task/execution/agent resources.

## Remaining production risks
- Frontend protections do not secure the app; items 1–5 above are exploitable with direct API calls.
- Session lives in memory: reload signs the user out (a deliberate trade-off; no refresh-token flow exists).
- Meta-CSP only; real response headers (incl. `frame-ancestors`, HSTS) are unverified until deployed.
- Preferences in localStorage are readable by any script on the origin (non-sensitive by design).
- Dashboard/agent/knowledge content describes intended capability; the backend is a single LLM chat with no multi-agent orchestration.
- Time zone assumption (UTC) for display.
- No end-to-end test suite against the real backend; browser scenarios were run on a mock.
