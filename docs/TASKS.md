# Tasks and execution history

## Backend verification
The API has **no task or execution resource**: no task table, status column, result summary, step/agent records, cancel or retry endpoint.
The only persisted unit of work is a **conversation** (`id, title, createdAt, updatedAt`) with **messages** (`id, role, content, createdAt`).
So a "task" in the UI is a conversation. Endpoints used: `GET /api/v1/conversations`, `GET /api/v1/conversations/{id}/messages`,
`DELETE /api/v1/conversations/{id}/deleteConversation`. Ownership is enforced server-side (`findByIdAndUser`).

## Screens (`/app/tasks`, `/app/tasks/:taskId`)
- **List:** title (the first 50 chars of the goal), created/updated day, grouped Today / Yesterday / This week / Earlier on a timeline rail.
  Client-side search (titles), time-range filter, sorting (updated / created / title) and pagination (8 per page), plus a refresh button.
  These are client-side because the API returns the full list with no query/sort/paging parameters.
- **Details (master/detail on wide screens, separate view on mobile):** original goal (first user message), final result (last assistant message,
  rendered as text/code only), conversation-turn timeline, created/updated dates, and a reply latency computed from two server timestamps
  (zone-independent difference).
- **Status:** the backend has none. The UI infers only **Answered** (last saved message is from the assistant) or **No reply recorded** (last saved message is the
  user's: the LLM call may have failed or still be running). The panel says it is inferred. Nothing is shown as running/failed/cancelled.
- **Agent steps / execution graph:** not shown; the panel states that the backend does not record them.
- **Actions (all real):** Continue in workspace; New task from this goal (in-memory hand-off, nothing sent until submitted); Delete.
  No cancel or retry-in-place exists server-side, so none is offered.
- **Delete:** modal confirmation (focus on Cancel, Escape cancels). Success is shown only after the DELETE succeeds and the list is re-read from the server;
  on failure the task stays listed and an error is shown. The UI never fakes success.

## Security behaviour
- Task detail renders only if the id is in the list returned by the backend for the signed-in user; otherwise one neutral message
  ("isn't available") is shown, identical for missing, foreign, or errored ids. Messages for a task are fetched only after that check, and message errors
  (400/403/404/500) also map to the same neutral message.
- Route ids must be digits; invalid ids redirect to the list. Account change remounts the page (`key={email}`), clearing in-memory data.
- No task content in logs/telemetry; no storage; no HTML rendering.

## Gaps (backend work needed)
1. A task/execution resource: `{id, conversationId, status, startedAt, finishedAt, resultSummary, steps:[{agent, status, ...}]}` with ownership checks,
   plus cancel/retry endpoints (each authorized by owner).
2. Server-side `GET /conversations?q=&sort=&page=&size=` (the list is unbounded today and filtered in the browser).
3. Timestamps lack a time zone (day-level display only; UTC assumed).
4. `ConversationNotFoundException` and `IllegalArgumentException("Conversation not found")` are unhandled → HTTP 500 instead of 404;
   delete of a missing/foreign conversation also surfaces as 500.
5. `deleteConversation` is a `DELETE` returning a plain string; a standard `204`/`404` contract would be clearer.
