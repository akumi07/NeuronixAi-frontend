import { useCallback, useEffect, useRef, useState } from 'react'
import { clearUnavailable, isMarkedUnavailable, useFeatureUnavailable } from '../../../api/availability'
import { isTerminal, type Execution } from '../../../api/contracts/orchestration'
import { isApiError } from '../../../api/errors'
import { categorize } from '../../../api/normalize'
import { describeFailure, isAborted, type Failure } from '../../dashboard/api/failures'
import { useOrchestrationApi } from '../api/orchestrationApi'

const POLL_MS = 1500
const MAX_POLLS = 400 // ~10 minutes at the base interval, then stop and let the user check again

export interface ExecutionsApi {
  executions: Execution[]
  latest: Execution | null
  loading: boolean
  /** The backend has confirmed the executions endpoints are not available yet. */
  unavailable: boolean
  failure: Failure | null
  hasActive: boolean
  pollingStopped: boolean
  cancelFailure: Failure | null
  track: (e: Execution) => void
  cancel: (executionId: string) => Promise<void>
  /** Clears the "unavailable" memory and re-checks (use after the backend has been updated). */
  recheck: () => void
}

/**
 * Real execution state for a conversation: loads the backend's execution list, polls active executions, and exposes cancel.
 * It reports only what the backend returns; with no data there is simply nothing to show.
 */
export function useExecutions(conversationId: number | null, seed: Execution | null): ExecutionsApi {
  const api = useOrchestrationApi()
  const unavailableFlag = useFeatureUnavailable('executions')
  const orchestrationUnavailable = useFeatureUnavailable('orchestration')
  const [executions, setExecutions] = useState<Execution[]>(seed ? [seed] : [])
  const [loading, setLoading] = useState(conversationId !== null && !isMarkedUnavailable('executions'))
  const [failure, setFailure] = useState<Failure | null>(null)
  const [cancelFailure, setCancelFailure] = useState<Failure | null>(null)
  const [pollingStopped, setPollingStopped] = useState(false)
  const [attempt, setAttempt] = useState(0)

  const upsert = useCallback((e: Execution) => {
    setExecutions((list) => {
      const i = list.findIndex((x) => x.executionId === e.executionId)
      return i === -1 ? [e, ...list] : list.map((x, j) => (j === i ? { ...x, ...e } : x))
    })
  }, [])

  // Load history for this conversation (skipped once confirmed unavailable).
  useEffect(() => {
    if (conversationId === null || isMarkedUnavailable('executions')) return
    const controller = new AbortController()
    api.listForConversation(conversationId, controller.signal).then(
      (list) => { setFailure(null); setLoading(false); setExecutions((cur) => { const ids = new Set(list.map((x) => x.executionId)); return [...list, ...cur.filter((x) => !ids.has(x.executionId))] }) },
      (e) => { if (isAborted(e)) return; setLoading(false); if (!(isApiError(e) && categorize(e, { planned: true }) === 'unavailable')) setFailure(describeFailure(e, { planned: true })) },
    )
    return () => controller.abort()
  }, [api, conversationId, attempt])

  // Poll active executions until the backend reports a terminal state.
  const activeKey = executions.filter((e) => !isTerminal(e.status)).map((e) => e.executionId).join(',')
  const polls = useRef(0)
  useEffect(() => {
    if (!activeKey || orchestrationUnavailable) return
    const controller = new AbortController()
    let timer: number | undefined
    const tick = async () => {
      polls.current++
      if (polls.current > MAX_POLLS) { setPollingStopped(true); return }
      await Promise.all(activeKey.split(',').map(async (id) => {
        try { upsert(await api.get(id, controller.signal)) } catch { /* transient: try again on the next tick */ }
      }))
      if (!controller.signal.aborted) timer = window.setTimeout(tick, POLL_MS * (polls.current > 20 ? 3 : 1))
    }
    timer = window.setTimeout(tick, POLL_MS)
    return () => { controller.abort(); window.clearTimeout(timer) }
  }, [activeKey, api, upsert, orchestrationUnavailable, attempt])

  const track = useCallback((e: Execution) => { polls.current = 0; setPollingStopped(false); upsert(e) }, [upsert])

  const cancel = useCallback(async (executionId: string) => {
    setCancelFailure(null)
    try {
      await api.cancel(executionId)
      upsert(await api.get(executionId))
    } catch (e) {
      setCancelFailure(describeFailure(e, { planned: true }))
    }
  }, [api, upsert])

  const recheck = useCallback(() => {
    clearUnavailable('executions'); clearUnavailable('orchestration')
    setFailure(null); setLoading(conversationId !== null); setPollingStopped(false); setAttempt((n) => n + 1)
  }, [conversationId])

  // Newest first when timestamps are supplied; otherwise keep the order the backend/tracker gave us.
  const sorted = [...executions].sort((a, b) => (a.createdAt && b.createdAt ? b.createdAt.localeCompare(a.createdAt) : 0))
  return {
    executions: sorted,
    latest: sorted[0] ?? null,
    loading,
    unavailable: unavailableFlag || orchestrationUnavailable,
    failure,
    hasActive: activeKey !== '',
    pollingStopped,
    cancelFailure,
    track,
    cancel,
    recheck,
  }
}
