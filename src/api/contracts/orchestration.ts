import { z } from 'zod'

/**
 * ORCHESTRATION CONTRACTS (proposed, not implemented in the backend).
 * Spring Boot is the only API the browser talks to; it fronts the Python/LangGraph service.
 * The UI renders exactly what the backend returns: it never decides which agent runs.
 */
const id = z.union([z.string(), z.number()]).transform(String)

export const EXECUTION_STATUSES = ['QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED'] as const
export type ExecutionStatus = (typeof EXECUTION_STATUSES)[number] | 'UNKNOWN'
const status = z.string().transform((s): ExecutionStatus => ((EXECUTION_STATUSES as readonly string[]).includes(s.toUpperCase()) ? (s.toUpperCase() as ExecutionStatus) : 'UNKNOWN'))

export const TERMINAL_STATUSES: readonly ExecutionStatus[] = ['COMPLETED', 'FAILED', 'CANCELLED']
export const isTerminal = (s: ExecutionStatus) => TERMINAL_STATUSES.includes(s)

const agentRef = z.object({ id: id, name: z.string().optional(), capability: z.string().optional(), role: z.string().optional() })
const safeError = z.object({ code: z.string().optional(), message: z.string().optional() })

export const executionStep = z.object({
  id: id,
  name: z.string().optional(),
  agent: z.union([agentRef, z.string()]).optional(),
  status,
  startedAt: z.string().optional(),
  finishedAt: z.string().optional(),
  durationMs: z.number().optional(),
  attempt: z.number().optional(),
  dependsOn: z.array(id).optional(),
  result: z.string().nullish(),
  error: safeError.nullish(),
})
export type ExecutionStep = z.infer<typeof executionStep>

export const execution = z.object({
  executionId: id,
  conversationId: id.optional(),
  prompt: z.string().optional(),
  status,
  selectedAgents: z.array(z.union([agentRef, z.string()])).default([]),
  steps: z.array(executionStep).default([]),
  result: z.string().nullish(),
  error: safeError.nullish(),
  message: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  durationMs: z.number().optional(),
  retryCount: z.number().optional(),
})
export type Execution = z.infer<typeof execution>

export const executionList = z.array(execution)

export type ExecutionMode = 'AUTO'
export interface StartOrchestrationRequest {
  prompt: string
  conversationId?: number | string
  documentIds: Array<number | string>
  executionMode: ExecutionMode
}
