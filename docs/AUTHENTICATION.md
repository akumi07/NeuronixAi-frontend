# Authentication: verified backend contract and security notes

Source of truth: `akumi07/NeuronixAI` (Spring Boot), read at the time of implementation:
`AuthController`, `AuthService`, `SecurityConfig`, `JwtAuthenticationFilter`, `JwtService`,
`TokenRevocationService`, `GlobalExceptionHandler`, auth DTOs, `application.properties`.

## Verified contract (all under `/api/v1/auth`)

| Endpoint | Request | Success |
|---|---|---|
| `POST /login` | `{email, password}` | `{accessToken}` |
| `POST /register` | `{email, password}` (password min 8) | `{accessToken}` |
| `POST /forget-password` | `{email}` | `{accessToken}` |
| `POST /new-password` | `Authorization: Bearer <token>`, `{password}` (min 8) | 200, empty body |
| `POST /logout` | `Authorization: Bearer <token>` | `"Logged out successfully"` |
| `GET /api/v1/users/me` | Bearer | `{id,email,createdAt}` (not used yet) |

- **Mechanism:** stateless HS256 JWT bearer, 24h lifetime (`jwt.expiration=86400000`), no refresh endpoint,
  no cookies, CSRF disabled (appropriate for header-borne bearer tokens).
- **Errors:** `401 {message}` invalid credentials, `409 {message}` email exists, `404 {message}` unknown email on
  forget-password. Bean-validation failures (400) and JWT parse errors have no dedicated handler (Spring default / 500).
- **CORS:** none configured. Dev uses the Vite `/api` proxy; a separate production origin needs backend CORS or a same-origin reverse proxy.

## Frontend behaviour

- Token is held **in memory only** (React context). Nothing is written to localStorage/sessionStorage, so a page reload signs the user out. Requests use `credentials: 'omit'`, `cache: 'no-store'`, `referrerPolicy: 'no-referrer'`.
- Server-supplied error text is never rendered; messages come from status code mapping (`authErrors.ts`).
- Login shows one generic message for any 400/401/403. Passwords are cleared after a failed attempt; submit buttons disable while in flight; forms use `method="post"` so credentials can never end up in a URL.
- The reset credential is kept in memory and never put in a URL; the reset page works only in the same page session.
- On token expiry (read from the `exp` claim, UX only) the app signs out and shows "Your session expired".
- `RequireAuth` is a UX redirect only. The backend enforces access.
- Not claimed as active (not verified in backend): rate limiting, account lockout, CSRF protection, secure cookies, email verification.

## Backend security gaps found (NOT changed — need backend work)

1. **Critical — account takeover via password reset.** `POST /forget-password` is unauthenticated and returns a valid
   24h access token for any registered email; `/new-password` then sets that account's password with it. Anyone who knows an email can take over the account. No email is sent and there is no single-purpose, short-lived, single-use reset token. The frontend wires this flow because it is the only reset contract that exists; **do not expose it in production until the backend is fixed** (email delivery of a short-lived single-use reset token with a `purpose` claim).
2. `/new-password` accepts any valid access token (including a normal login token) with no current-password check, and does not revoke existing tokens afterwards.
3. Account enumeration: `/register` returns 409 and `/forget-password` returns 404 with the email in the message for unknown users.
4. No rate limiting / lockout on `/login`, `/register`, `/forget-password`.
5. `TokenRevocationService` is an in-memory set: revocations are lost on restart and don't work across instances; it also **prints full tokens to stdout** (`REVOKED TOKEN: …`). `JwtAuthenticationFilter` prints exception messages.
6. An expired/invalid token on `/new-password` is not handled (likely HTTP 500).
7. `jwt.secret` appears in committed `application.properties` (including a commented-out line); rotate it and load from the environment only.
8. `POST /api/v1/users` is public and its DTO has no password-length constraint (bypasses the 8-char rule of `/register`).
9. `GET /api/v1/users` and `GET /api/v1/users/{id}` are available to any authenticated user (lists all users' emails).
10. No CORS configuration.

## Update: 401 can mask server errors (found while testing uploads)
Spring Security secures the `/error` dispatch when `anyRequest().authenticated()` is used and `/error` is not permitted. Any exception in a controller
(e.g. rejected/oversized upload, S3 failure, `IllegalArgumentException`, unhandled `ConversationNotFoundException`) is then forwarded to `/error`, where the
request is unauthenticated, so the client receives **401 Unauthorized** instead of 4xx/5xx. Backend fix: permit the error dispatch
(`.dispatcherTypeMatchers(DispatcherType.ERROR).permitAll()` or `.requestMatchers("/error").permitAll()`), then add proper exception handlers.

Frontend mitigation: on a 401 the authenticated client calls `GET /api/v1/users/me`; it signs the user out only if that also returns 401. Otherwise the original
request is reported as a server error and the session is kept.
