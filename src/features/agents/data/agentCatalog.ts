import { AGENT_BY_ID, type Agent, type AgentId } from '../../landing/data/landingContent'

/**
 * Product-intent catalog. The Spring Boot API has NO agent endpoints or tables (verified), so nothing here is a
 * backend record. Every entry is displayed as a capability description, never as an operational agent.
 *
 * `availability` is derived from what the backend verifiably does:
 *  - 'chat'          : the single /api/v1/chat endpoint (one LLM, text in/text out) can be prompted for this.
 *  - 'not-connected' : requires a backend capability that is not exposed to users.
 */
export type Availability = 'chat' | 'not-connected'

export interface AgentProfile {
  agent: Agent
  category: string
  tagline: string
  inputs: string[]
  outputs: string[]
  constraints: string[]
  examples: string[]
  availability: Availability
}

const COMMON_CONSTRAINTS = [
  'Runs as a single request/response in the workspace; there is no streaming or step-by-step progress.',
  'Text in, text out. No tools, file access, or external integrations are configured for end users.',
]

const profile = (id: AgentId, p: Omit<AgentProfile, 'agent'>): AgentProfile => ({ agent: AGENT_BY_ID[id], ...p })

export const AGENT_PROFILES: AgentProfile[] = [
  profile('coding', {
    category: 'Coding',
    tagline: 'Write, explain, and debug software.',
    inputs: ['Code snippets', 'Stack traces and error messages', 'Plain-language requirements'],
    outputs: ['Code with explanations', 'Suggested fixes', 'Step-by-step debugging notes'],
    constraints: [...COMMON_CONSTRAINTS, 'Code is shown for you to review; NeuronixAI never runs it for you.'],
    examples: ['Help me debug this Java exception.', 'Write a function that validates an email address in TypeScript.', 'Explain what this regular expression does.'],
    availability: 'chat',
  }),
  profile('planning', {
    category: 'Planning',
    tagline: 'Turn goals into structured plans.',
    inputs: ['A goal or project description', 'Constraints such as time or team size'],
    outputs: ['Task breakdowns', 'Milestones and sequencing', 'Checklists'],
    constraints: [...COMMON_CONSTRAINTS, 'Plans are suggestions; nothing is scheduled or created in other tools.'],
    examples: ['Plan a product launch in six weeks.', 'Break “migrate our app to a new database” into milestones.', 'Create a study plan for a certification exam.'],
    availability: 'chat',
  }),
  profile('writing', {
    category: 'Writing',
    tagline: 'Draft, improve, and adapt written content.',
    inputs: ['Topic, audience and tone', 'Existing text to improve'],
    outputs: ['Drafts', 'Rewrites and edits', 'Summaries'],
    constraints: [...COMMON_CONSTRAINTS, 'Review output for accuracy before publishing; content is not published anywhere for you.'],
    examples: ['Write the announcement for our new feature.', 'Rewrite this paragraph to be more concise.', 'Draft a polite follow-up email.'],
    availability: 'chat',
  }),
  profile('research', {
    category: 'Research',
    tagline: 'Organize what is known about a topic.',
    inputs: ['A question or topic', 'Scope and depth you want'],
    outputs: ['Structured summaries', 'Comparisons', 'Open questions'],
    constraints: [...COMMON_CONSTRAINTS, 'No live web access or source citations are configured, so answers reflect the model’s general knowledge and may be outdated.'],
    examples: ['Summarize the trade-offs between REST and GraphQL.', 'Compare two approaches to caching.', 'What are the main ideas behind event sourcing?'],
    availability: 'chat',
  }),
  profile('analysis', {
    category: 'Analysis',
    tagline: 'Evaluate information and surface insight.',
    inputs: ['Pasted data or text', 'The question you want answered'],
    outputs: ['Structured findings', 'Pros and cons', 'Recommendations'],
    constraints: [...COMMON_CONSTRAINTS, 'Works only on content you paste into the conversation; it cannot open files or query your systems.'],
    examples: ['Analyze these survey comments and group them by theme.', 'Evaluate the risks in this rollout plan.', 'What stands out in this list of numbers?'],
    availability: 'chat',
  }),
  profile('knowledge', {
    category: 'Knowledge / RAG',
    tagline: 'Answers grounded in your documents.',
    inputs: ['A question about your uploaded documents'],
    outputs: ['Answers grounded in retrieved passages'],
    constraints: [
      'Not connected: document retrieval is not exposed to end users, and chat does not use your documents.',
      'Until it is, you can still ask general knowledge questions in the workspace.',
    ],
    examples: ['Explain the authentication architecture in my documents.', 'Explain how JWT authentication works in general.'],
    availability: 'not-connected',
  }),
]

export const PROFILE_BY_ID = Object.fromEntries(AGENT_PROFILES.map((p) => [p.agent.id, p])) as Record<AgentId, AgentProfile>

export const AVAILABILITY_LABEL: Record<Availability, { label: string; detail: string }> = {
  chat: { label: 'Via workspace chat', detail: 'No dedicated agent record. You can ask for this in the workspace.' },
  'not-connected': { label: 'Not connected', detail: 'The required backend capability is not available to users yet.' },
}
