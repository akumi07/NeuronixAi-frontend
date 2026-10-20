# AI Workspace: verified backend capabilities, security model, integration gaps

Verified in `akumi07/NeuronixAI` (`ChatController`, `ChatService`, `LlmClient`/`OpenAiLlmClient`, `ConversationController`/`Service`,
`RagService` + `*TestController`s, `DocumentService`, `SecurityConfig`).

## What the backend really provides
- `POST /api/v1/chat {conversationId?, message}` → `{conversationId, response}`: **one synchronous call** to a single LLM with the
  conversation history. No streaming/SSE/WebSocket, no agent routing, no planning stage, no per-step execution events, no task ids,
  no cancel endpoint.
- Conversation history: `GET /conversations`, `GET /conversations/{id}/messages`, `DELETE /conversations/{id}/deleteConversation`.
- Document upload exists (`POST /documents`); RAG exists only as `/api/v1/rag/test/**` endpoints (see gaps) and is **not wired into chat**.

## What the UI shows, and how real vs. illustrative is separated
- **This task** tab (real): Goal → Routing & planning → Specialist agents → Result. Only states the browser observed are marked **Actual**
  (sent, waiting, received, failed, stopped; the duration is measured in the browser). Routing and Specialist-agent stages are dashed and
  labelled **Not available** because the backend reports nothing about them.
- **Concept** tab (illustrative): the orchestration map, labelled "Illustrative only … not what happened for your task".
- Latest answer is shown as the **Final result** card (copy button). Earlier turns are normal bubbles.
- **Stop waiting** aborts the browser request only; the UI says the backend may still finish and save the reply, then re-reads history.
  **Send again** retries a failed/stopped message (with a warning that a timed-out request may already be saved).
- Document-grounded knowledge is shown as **Not connected**.

## Security behaviour
- Every call goes through the authenticated client; the browser sends only the bearer token and a conversation id in the path/body.
  Access decisions are the backend's (`findByIdAndUser`). Knowing an id grants nothing client-side.
- Loading a conversation that is missing, not owned, or errors (400/403/404/500) shows one identical message, so another user's
  conversation can't be told apart from a nonexistent one.
- Route ids are validated as digits only; anything else redirects to a new task.
- Message/code content is rendered only as React text nodes (fenced code → `<pre><code>`, inline code → `<code>`). No `dangerouslySetInnerHTML`,
  no HTML/markdown-to-HTML, no links, and code is never evaluated. Verified with `<script>`, `<b>` and `<img onerror>` payloads.
- Draft hand-off from the dashboard is in-memory, account-bound, cleared on read; no URL/history-state/storage use.
- Workspace state is keyed by account and conversation (remount discards old messages/drafts); in-flight requests abort on unmount.
- No `console` logging of task content. A 401 signs the user out and routes to `/login`.
- No tool-action or confirmation UI is shown because the backend has no tools/actions. Deleting a conversation uses a two-step confirm.

## Integration gaps / backend risks (not changed)
1. **No orchestration contract.** To show real routing/agents/dependencies/status the API needs (e.g.) a task resource with
   `{id, status, steps:[{agent, status, startedAt, finishedAt, dependsOn}], result}` or an SSE stream, plus a cancel endpoint. Until then those stages stay "Not available".
2. **No cancel.** Stop-waiting cannot stop server-side work or LLM spend.
3. **No streaming**, so long answers appear only when complete (client timeout 90s).
4. **RAG IDOR risk.** `GET /api/v1/rag/test/documents/{documentId}/ask` and the retrieval/chunk/embedding test endpoints take a `documentId`
   and the retrieval code shows no ownership filter, so any authenticated user may be able to query another user's document. They are
   also named "test" endpoints. The frontend deliberately does **not** call them. Fix ownership + productize before enabling document Q&A.
5. `POST /documents` has no list/get endpoints, so the UI cannot show a user's documents.
6. Unhandled exceptions (`ConversationNotFoundException`, `IllegalArgumentException`) yield HTTP 500 rather than 404.
7. Chat input has no server-side length limit/rate limit; the system prompt/safety handling is not visible to the client (and isn't exposed).
8. New-task runs remount after the conversation id is assigned, so the "Response received in Ns" detail is not retained for the first turn.

## Voice input (composer)
A **Voice** button appears in the task composer (workspace and dashboard) when the browser supports the Web Speech API (Chrome, Edge, Safari; not Firefox).
Speech is transcribed into the editable text box (interim words appear live); nothing is sent until the user presses send, and the text can be edited first.
- Recognition is done by the **browser vendor's speech service** (in Chrome, audio is sent to Google). The UI says so while listening. NeuronixAI's backend never receives audio and the app stores none.
- Microphone permission is requested by the browser on first use; denial, no microphone, no speech, and network failures show clear messages.
- Send stops listening. The transcript is treated as plain text like any typed message. Server header `Permissions-Policy` must allow `microphone=(self)` (see docs/SECURITY_HEADERS.md).
- Not offered: audio file upload, server-side transcription, or speech output (the backend has no such endpoints).
