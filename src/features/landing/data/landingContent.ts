import {
  BarChart3,
  BookOpenText,
  Code2,
  ListChecks,
  PenLine,
  Search,
  type LucideIcon,
} from 'lucide-react'

/** Routes the landing page links to. Only anchors and the two placeholder routes exist today. */
export const ROUTES = {
  login: '/login',
  register: '/register',
} as const

export const NAV_LINKS = [
  { label: 'Product', href: '#product' },
  { label: 'Agents', href: '#agents' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Capabilities', href: '#capabilities' },
] as const

export type AgentId = 'planning' | 'coding' | 'writing' | 'research' | 'analysis' | 'knowledge'

export interface Agent {
  id: AgentId
  name: string
  short: string
  description: string
  color: string
  icon: LucideIcon
}

export const AGENTS: Agent[] = [
  {
    id: 'planning',
    name: 'Planning Agent',
    short: 'Structures goals',
    description: 'Turns complex goals into structured, actionable plans.',
    color: '#7047EB',
    icon: ListChecks,
  },
  {
    id: 'coding',
    name: 'Coding Agent',
    short: 'Builds & debugs',
    description: 'Helps with software engineering, code generation, and debugging.',
    color: '#3685F5',
    icon: Code2,
  },
  {
    id: 'writing',
    name: 'Writing Agent',
    short: 'Drafts & refines',
    description: 'Creates and improves clear, effective written content.',
    color: '#FF7867',
    icon: PenLine,
  },
  {
    id: 'research',
    name: 'Research Agent',
    short: 'Gathers findings',
    description: 'Gathers available information and organizes findings.',
    color: '#E89A1C',
    icon: Search,
  },
  {
    id: 'analysis',
    name: 'Analysis Agent',
    short: 'Produces insight',
    description: 'Evaluates information and produces structured insights.',
    color: '#20C9D7',
    icon: BarChart3,
  },
  {
    id: 'knowledge',
    name: 'Knowledge Agent',
    short: 'Grounded answers',
    description: 'Answers questions grounded in supported document and knowledge sources.',
    color: '#2FBF8A',
    icon: BookOpenText,
  },
]

export const AGENT_BY_ID = Object.fromEntries(AGENTS.map((a) => [a.id, a])) as Record<AgentId, Agent>

export interface WorkflowExample {
  id: string
  label: string
  request: string
  steps: AgentId[]
  outcome: string
  color: string
}

export const WORKFLOW_EXAMPLES: WorkflowExample[] = [
  {
    id: 'coding',
    label: 'Coding',
    request: 'Help me debug this Java exception.',
    steps: ['coding', 'analysis'],
    outcome: 'Suggested Fix',
    color: '#3685F5',
  },
  {
    id: 'planning-writing',
    label: 'Planning and Writing',
    request: 'Plan a product launch and write the announcement.',
    steps: ['planning', 'writing'],
    outcome: 'Deliverable',
    color: '#7047EB',
  },
  {
    id: 'knowledge',
    label: 'Knowledge',
    request: 'Explain the authentication architecture in my documents.',
    steps: ['knowledge'],
    outcome: 'Explanation',
    color: '#2FBF8A',
  },
]

export const HOW_IT_WORKS = [
  {
    title: 'Describe your goal',
    body: 'Tell NeuronixAI what you want to accomplish.',
  },
  {
    title: 'Coordinate the capabilities',
    body: 'The platform determines the appropriate capabilities and coordinates supported agent workflows.',
  },
  {
    title: 'Review the result',
    body: 'Get the result and inspect execution details where supported.',
  },
] as const

export const CAPABILITIES = [
  { title: 'Intelligent task routing', body: 'Match each goal with the capabilities it calls for.', color: '#7047EB' },
  { title: 'Specialized agent workflows', body: 'Coordinate agents with distinct responsibilities.', color: '#5145CD' },
  { title: 'Coding and debugging', body: 'Software engineering help, from generation to fixes.', color: '#3685F5' },
  { title: 'Planning and task decomposition', body: 'Break big goals into structured, actionable steps.', color: '#7047EB' },
  { title: 'Writing and content creation', body: 'Draft and refine clear, effective written content.', color: '#FF7867' },
  { title: 'Research and analysis', body: 'Organize findings and turn them into structured insight.', color: '#20C9D7' },
  { title: 'Knowledge retrieval with RAG', body: 'Answers grounded in supported document sources.', color: '#2FBF8A' },
  { title: 'Execution visibility', body: 'Inspect execution details where supported.', color: '#E89A1C' },
] as const

export const FOOTER_LINKS = {
  Product: [
    { label: 'Product', href: '#product' },
    { label: 'Agents', href: '#agents' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Capabilities', href: '#capabilities' },
  ],
} as const
