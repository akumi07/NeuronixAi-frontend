# Conversations and Knowledge Base

## Conversations (`/app/conversations[/:id]`)
Contract (verified): `GET /conversations`, `GET /conversations/{id}/messages`, `DELETE /conversations/{id}/deleteConversation`; ownership is enforced
server-side (`findByIdAndUser`). Distinct from Tasks (goal/result view): this is the full **transcript reader**.
- List with metadata (title, started, last message), client-side title search, range filter, sort, pagination, refresh.
- Transcript: every message in order with role and day, copy for assistant messages, in-conversation search (filters already-loaded messages in the browser;
  the API has no message search), continue in workspace, delete with confirmation (success shown only after the backend confirms and the list is re-read).
- Message text is rendered as text/code only. Missing/foreign/errored ids show one neutral "isn't available" message. Page state is keyed by account.
- Not supported by the backend, so not offered: rename (service method exists, no route), export, cross-conversation content search (would require fetching every conversation).

## Knowledge Base (`/app/knowledge`)
Contract (verified): only `POST /api/v1/documents` (multipart field `file`) → `{id,fileName,fileType,fileSize,status:"UPLOADED",createdAt,updatedAt}`.
Server rules: non-empty; file name must end in `.pdf`; content type must be `application/pdf` or `application/octet-stream`. The storage path is not returned.
There is **no** list, get, delete, status, duplicate-detection, or user-facing search endpoint.
- Upload with drag/drop or file picker; one file at a time; indeterminate progress (fetch exposes no upload progress); 60s timeout.
- Client validation (convenience only): non-empty, `.pdf`, PDF/octet-stream MIME, ≤10 MB, and the `%PDF-` signature (extension and MIME are client-controlled). Clear messages for each.
- Failures: 413 → file too large; 403 → not permitted; 400/415/500 → generic "couldn't accept this file" (the backend returns 500 for invalid files and does not say why); network/timeout/401 via shared handling.
- Status honesty: a successful upload is shown as **File stored** + **Not indexed or searchable**, with the raw backend status ("UPLOADED"). Nothing says processing/indexed because no such state is reported.
- Duplicates: the backend does no duplicate detection. The UI warns only for the same name+size uploaded earlier **in this browser session** (labelled as such) and lets the user proceed.
- The "Uploaded this session" list is in-memory only (no list endpoint) and is cleared on sign-out/reload; the page says so. No delete control exists because no delete endpoint exists, and the page says uploads can't be removed from here.
- Search/retrieval controls are intentionally absent and explained (see gap 1).

## Gaps and risks (backend work required; not changed)
1. **Retrieval IDOR:** `/api/v1/rag/test/documents/{documentId}/search|ask`, `/rag/test/**/embeddings`, `/documents/test/{id}/chunk|extract-text` take a `documentId`
   and use `documentRepository.findById` / retrieval without an owner check, so any authenticated user may read or process another user's document (and trigger embedding cost).
   These are also "test" controllers exposed in production. Add ownership checks (`findByIdAndUserId`) or remove them.
2. **No document lifecycle API:** list, get, delete (including S3 object + chunks), status (`UPLOADED → PROCESSING → INDEXED/FAILED`) and a user-facing search/ask endpoint are missing. Indexing is not triggered by upload.
3. **Upload validation is weak:** extension/MIME only (both client-controlled), no PDF signature/content scan, no malware scanning, no explicit size limit (`spring.servlet.multipart.*` is unset, so Spring's 1 MB default applies and oversized uploads fail),
   no per-user quota or rate limit. Invalid input throws `IllegalArgumentException` → HTTP 500 rather than 400/415.
4. **Duplicate handling:** no content hash/unique constraint; identical files create separate records and S3 objects.
5. **Object key** embeds the client-supplied file name (`users/{id}/documents/{uuid}-{fileName}`): sanitize it. The S3 bucket name is hard-coded in `S3StorageService`.
6. **Prompt-injection:** RAG context is concatenated into a user message. Retrieved text is untrusted and must stay unable to authorize tools; there are no tools today, but add this guard before introducing any.
7. Conversation gaps listed in docs/TASKS.md and docs/DASHBOARD.md also apply (500 instead of 404, timestamps without zone, unbounded list).
