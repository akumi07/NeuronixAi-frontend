# Dashboard: verified backend contract, security model, gaps

Verified in `akumi07/NeuronixAI` controllers/DTOs/services (`ChatController`, `ConversationController`, `ConversationService`,
`ChatService`, `UserController`, `DocumentController`, `SecurityConfig`).

## Endpoints used (all require `Authorization: Bearer <token>`)

| Call | Contract |
|---|---|
| `GET /api/v1/users/me` | `{id,email,createdAt}` |
| `GET /api/v1/conversations` | `[{id,title,createdAt,updatedAt}]`, newest first, current user only |
| `GET /api/v1/conversations/{id}/messages` | `[{id,role,content,createdAt}]`, `role` = `USER` / `ASSISTANT` |
| `POST /api/v1/chat` | `{conversationId?, message}` → `{conversationId, response}` (creates a conversation when `conversationId` is omitted) |
| `DELETE /api/v1/conversations/{id}/deleteConversation` | plain string |

Ownership is enforced server-side (`findByIdAndUser` using the user derived from the JWT). The browser never sends a user id,
role, or organization id.

## Frontend security behaviour

- `/app` is wrapped in `RequireAuth` (UX only). Every request carries the in-memory bearer token; the backend is the boundary.
- A `401` from any authenticated call clears the session and routes to `/login` with a "session expired" notice. `/login` makes no
  authenticated calls, so there is no redirect loop.
- Private data lives only in React state of `useWorkspace`; the page is keyed by account email, so logout or account change discards it.
  No localStorage/sessionStorage/IndexedDB/service-worker caching of API responses. Requests use `cache: 'no-store'`.
- In-flight requests are aborted on unmount/sign-out.
- Message and title text is rendered as plain text (no HTML/markdown). Server error text is never displayed; errors are mapped by status.
- Failed requests never fall back to mock data.

## What is deliberately NOT shown (no backend contract)

- **Task / execution status, agent activity, agent routing:** no such endpoints. The backend is a single LLM chat with history (no agent selection).
  Capability chips are *prompt starters* that pre-fill the composer; they do not select an agent. The "Your workspace" panel shows only
  conversation count, last activity, and account creation date.
- **Documents:** only `POST /api/v1/documents` (upload) exists; there is no list endpoint, so no documents UI.
- **Rename conversation:** `ConversationService.updateConversationTitle` exists but has no controller route.
- Sidebar links only to existing screens (Dashboard, public website).

## Backend gaps / risks found (not changed)

1. `ConversationNotFoundException`, `IllegalArgumentException("Conversation not found")` and `IllegalStateException` have no handlers
   (only some are in `GlobalExceptionHandler`) → likely **HTTP 500** instead of 404 for another user's / missing conversation. The UI treats 404 and 5xx generically.
2. `POST /api/v1/chat`: no max length on `message`, no rate limiting (LLM cost/abuse risk); the UI caps input at 4000 chars for usability only.
3. Timestamps are `LocalDateTime` with no zone. The UI assumes UTC and shows day-level dates only.
4. No pagination on `GET /conversations` (the UI shows the 8 newest).
5. `GET /api/v1/users` / `GET /api/v1/users/{id}` expose all users' emails to any authenticated user (see AUTHENTICATION.md).
6. No CORS configuration (dev uses the Vite `/api` proxy).
7. Chat can take long; the UI waits up to 90s. A timeout does not mean the message wasn't saved.
