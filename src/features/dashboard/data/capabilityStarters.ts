import type { AgentId } from '../../landing/data/landingContent'

/**
 * Prompt starters only. They pre-fill the composer; they do not select an agent, because the backend
 * exposes a single chat endpoint and no agent-routing contract.
 */
export const STARTERS: Record<AgentId, { label: string; prompt: string }> = {
  planning: { label: 'Plan', prompt: 'Break this goal into a step-by-step plan: ' },
  coding: { label: 'Code', prompt: 'Help me write or debug this code: ' },
  writing: { label: 'Write', prompt: 'Draft clear, well-structured copy for: ' },
  research: { label: 'Research', prompt: 'Summarize what is generally known about: ' },
  analysis: { label: 'Analyze', prompt: 'Analyze the following and give structured insights: ' },
  knowledge: { label: 'Explain', prompt: 'Explain this concept clearly with examples: ' },
}
