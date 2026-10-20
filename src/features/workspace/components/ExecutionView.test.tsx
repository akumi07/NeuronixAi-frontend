import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { execution } from '../../../api/contracts/orchestration'
import type { ExecutionsApi } from '../hooks/useExecutions'
import { ExecutionView } from './ExecutionView'

const tracker = (partial: Parameters<typeof execution.parse>[0] | null): ExecutionsApi => {
  const latest = partial ? execution.parse(partial) : null
  return { executions: latest ? [latest] : [], latest, loading: false, unavailable: false, failure: null, hasActive: false, pollingStopped: false, cancelFailure: null, track: () => {}, cancel: async () => {}, recheck: () => {} }
}
const html = (t: ExecutionsApi) => renderToStaticMarkup(<ExecutionView tracker={t} />)

describe('ExecutionView renders only backend data', () => {
  it('shows nothing when there is no execution', () => expect(html(tracker(null))).not.toContain('Workflow steps'))
  it('does not claim agents were selected when none are reported', () => {
    const out = html(tracker({ executionId: 'e1', status: 'QUEUED', selectedAgents: [] }))
    expect(out).toContain('hasn’t reported which agents')
    expect(out).toContain('Queued')
  })
  it('shows reported agents, steps, durations and states', () => {
    const out = html(tracker({
      executionId: 'e2', status: 'COMPLETED', selectedAgents: [{ id: 'planner', name: 'Planning Agent' }, { id: 'writer', name: 'Writing Agent', role: 'Drafts' }],
      steps: [{ id: 's1', name: 'Plan', agent: 'planner', status: 'COMPLETED', durationMs: 1200 }, { id: 's2', name: 'Draft', agent: 'writer', status: 'FAILED', error: { message: 'Model timed out' } }],
    }))
    expect(out).toContain('Planning Agent')
    expect(out).toContain('Writing Agent')
    expect(out).toContain('1.2s')
    expect(out).toContain('Model timed out')
    expect(out).not.toContain('%') // no invented progress percentages
  })
  it('offers cancel only for non-terminal executions', () => {
    expect(html(tracker({ executionId: 'e3', status: 'RUNNING' }))).toContain('Cancel execution')
    expect(html(tracker({ executionId: 'e4', status: 'COMPLETED' }))).not.toContain('Cancel execution')
  })
  it('escapes backend-provided text', () => expect(html(tracker({ executionId: 'e5', status: 'FAILED', error: { message: '<script>alert(1)</script>' } }))).not.toContain('<script'))
})
