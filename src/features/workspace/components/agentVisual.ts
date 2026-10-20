import { Bot, type LucideIcon } from 'lucide-react'
import { AGENTS } from '../../landing/data/landingContent'
import type { Execution } from '../../../api/contracts/orchestration'

type AgentLike = Execution['selectedAgents'][number]

export interface AgentVisual { key: string; name: string; role?: string; color: string; Icon: LucideIcon }

const ALIASES: Array<[RegExp, string]> = [[/rag|knowledge|document/i, 'knowledge'], [/code|coding|debug/i, 'coding'], [/plan/i, 'planning'], [/writ|content/i, 'writing'], [/research/i, 'research'], [/analy/i, 'analysis']]

/** Presentation only: gives backend-reported agents the matching catalog colour/icon, or a neutral style for unknown agents. */
export function resolveAgent(agent: AgentLike): AgentVisual {
  const raw = typeof agent === 'string' ? { id: agent, name: agent, capability: undefined, role: undefined } : agent
  const haystack = `${raw.id} ${raw.name ?? ''} ${raw.capability ?? ''}`
  const hit = ALIASES.find(([re]) => re.test(haystack))
  const known = hit ? AGENTS.find((a) => a.id === hit[1]) : undefined
  return {
    key: raw.id,
    name: raw.name ?? known?.name ?? raw.id,
    role: raw.role ?? raw.capability,
    color: known?.color ?? '#6B7088',
    Icon: known?.icon ?? Bot,
  }
}
