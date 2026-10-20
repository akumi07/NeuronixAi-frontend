# Agent directory and details

## Backend verification
Searched all controllers, DTOs, services, migrations (V1–V6) and properties in `akumi07/NeuronixAI`: there is **no agent, capability, tool,
or configuration resource**: no endpoints, no tables, no admin/role model. The only AI surface is `POST /api/v1/chat` (one LLM, text in/out)
plus un-productized `/api/v1/rag/test/**` endpoints.

## What was built (`/app/agents`, `/app/agents/:agentId`, authenticated)
- A **capability catalog** (`features/agents/data/agentCatalog.ts`) for Coding, Planning, Writing, Research, Analysis, Knowledge/RAG.
  Every page carries a "Capability catalog, not a live agent registry" notice; nothing is presented as an operational record.
- Status is derived only from verified backend behaviour: **Via workspace chat** (can be prompted through the single chat endpoint, no dedicated
  agent record) or **Not connected** (Knowledge/RAG: retrieval is not exposed to users and chat does not use documents).
- Directory: search (name, category, inputs, outputs), per-capability filter chips, empty/no-match state, rows with colour rail/icon/I-O summary.
- Details: description, intended inputs/outputs, constraints grounded in the backend (single request/response, no tools, no web access,
  code never executed), configuration section (explicitly none), usage examples, links to other capabilities.
- The only action is **Try example**: opens the workspace with the prompt pre-filled via the in-memory hand-off (no URL/storage); nothing is sent until the user submits.
- No create/edit/enable/disable/config controls exist, because no backend operation exists. No prompts, system instructions, provider details or secrets are shown (the client has none).
- Route ids are looked up with `Object.hasOwn` against the fixed catalog; unknown ids show "Capability not found".

## Gaps (backend work needed before this can become a real registry)
1. Agent resource API, e.g. `GET /api/v1/agents` and `GET /api/v1/agents/{id}` → `{id, name, category, description, inputs, outputs, status, constraints}` with a
   **public-safe DTO** (no prompts/provider config).
2. Admin operations (create/edit/enable/disable/config) need role-based authorization in Spring Security (there are no roles today; `User` has none)
   plus server-side validation and audit logging. The UI must treat hidden/disabled controls as cosmetic only.
3. Status/health per agent and usage/execution records (see docs/WORKSPACE.md).
4. Knowledge/RAG: add ownership checks to document retrieval, then a user-facing endpoint, before enabling it (see docs/WORKSPACE.md item 4).
5. Until then, the catalog text is maintained in the frontend and can drift from backend reality.
