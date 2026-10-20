# NeuronixAI Frontend

Vite + React + TypeScript + Tailwind CSS v4. Feature code is in `src/features/*`.

```
npm install
npm run dev      # dev server; proxies /api and /actuator to VITE_DEV_API_TARGET (default http://localhost:8080)
npm run lint
npm test
npm run build
```

Screens: landing, sign in / register / reset, dashboard, workspace, tasks, conversations, agents, knowledge base, settings.
The session token is kept in memory only, so a page reload signs you out.

Docs: **`docs/API_CONTRACT.md`** (implemented vs proposed endpoints, error handling), `docs/AUTHENTICATION.md`, `DASHBOARD.md`, `WORKSPACE.md`, `AGENTS.md`, `TASKS.md`, `CONVERSATIONS_KNOWLEDGE.md`, `SECURITY_AUDIT.md`, `SECURITY_HEADERS.md`.
Configuration (non-secret only) is described in `.env.example`.
