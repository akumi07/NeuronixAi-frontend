import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../../auth/context/AuthContext'
import { ApiError, effectiveStatus } from '../../../api/errors'
import { describeFailure, isAborted, type Failure } from '../../dashboard/api/failures'
import type { ChatMessage } from '../../dashboard/api/types'
import { createWorkspaceApi } from '../../dashboard/api/workspaceApi'
import type { Load } from '../../dashboard/hooks/load'

/** Only states the client can truly observe. The backend exposes no routing, agent, or step events. */
export type RunPhase = 'idle' | 'sending' | 'received' | 'failed' | 'cancelled'

interface Options {
  /** null for a brand-new task. The server decides whether the user may access an id. */
  conversationId: number | null
  onChanged: () => void
  onCreated: (conversationId: number) => void
}

const UNAVAILABLE: Failure = {
  title: 'This conversation isn’t available',
  message: 'It may not exist, or you may not have access to it.',
}

/** Same message for 403/404/500 so another user's conversation can't be told apart from a missing one. */
export function describeThreadFailure(e: unknown): Failure {
  if (e instanceof ApiError && e.kind === 'http' && [400, 403, 404, 500].includes(effectiveStatus(e))) return UNAVAILABLE
  return describeFailure(e)
}

export function useTaskSession({ conversationId, onChanged, onCreated }: Options) {
  const { authedRequest } = useAuth()
  const api = useMemo(() => createWorkspaceApi(authedRequest), [authedRequest])

  const [thread, setThread] = useState<Load<ChatMessage[]>>(
    conversationId === null ? { status: 'ready', data: [] } : { status: 'loading' },
  )
  const [pending, setPending] = useState<string | null>(null)
  const [phase, setPhase] = useState<RunPhase>('idle')
  const [failure, setFailure] = useState<Failure | null>(null)
  const [failedMessage, setFailedMessage] = useState<string | null>(null)
  const [durationMs, setDurationMs] = useState<number | null>(null)
  const [attempt, setAttempt] = useState(0)
  const inflight = useRef<AbortController | null>(null)

  useEffect(() => {
    if (conversationId === null) return
    const controller = new AbortController()
    api.messages(conversationId, controller.signal).then(
      (data) => setThread({ status: 'ready', data }),
      (e) => { if (!isAborted(e)) setThread({ status: 'error', failure: describeThreadFailure(e) }) },
    )
    return () => controller.abort()
  }, [api, conversationId, attempt])

  useEffect(() => () => inflight.current?.abort(), [])

  const reloadThread = useCallback(() => { setThread({ status: 'loading' }); setAttempt((n) => n + 1) }, [])

  const refetchMessages = useCallback(async () => {
    if (conversationId === null) return
    try {
      setThread({ status: 'ready', data: await api.messages(conversationId) })
    } catch (e) {
      if (!isAborted(e)) setThread({ status: 'error', failure: describeThreadFailure(e) })
    }
  }, [api, conversationId])

  /** Resolves true when the reply was received, so the composer can clear; otherwise the draft is kept. */
  const send = useCallback(
    async (message: string) => {
      const controller = new AbortController()
      inflight.current = controller
      const started = performance.now()
      setFailure(null)
      setFailedMessage(null)
      setPending(message)
      setPhase('sending')
      try {
        const reply = await api.chat(message, conversationId, controller.signal)
        setDurationMs(performance.now() - started)
        setPhase('received')
        onChanged()
        if (conversationId === null) onCreated(reply.conversationId)
        else await refetchMessages()
        return true
      } catch (e) {
        setDurationMs(performance.now() - started)
        setFailedMessage(message)
        if (isAborted(e)) {
          setPhase('cancelled')
          onChanged()
          await refetchMessages() // the server may have saved the turn before we stopped waiting
        } else {
          setPhase('failed')
          setFailure(describeFailure(e))
        }
        return false
      } finally {
        setPending(null)
        inflight.current = null
      }
    },
    [api, conversationId, onChanged, onCreated, refetchMessages],
  )

  /** Stops waiting in the browser only. It cannot stop the backend, which may still finish and save the reply. */
  const cancel = useCallback(() => inflight.current?.abort(), [])

  return { thread, pending, phase, failure, failedMessage, durationMs, send, cancel, reloadThread }
}
