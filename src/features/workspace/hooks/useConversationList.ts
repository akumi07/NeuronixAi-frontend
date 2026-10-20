import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../../auth/context/AuthContext'
import { describeFailure, isAborted, type Failure } from '../../dashboard/api/failures'
import type { Conversation } from '../../dashboard/api/types'
import { createWorkspaceApi } from '../../dashboard/api/workspaceApi'
import type { Load } from '../../dashboard/hooks/load'

/** Conversation history for the signed-in user. Ownership filtering happens on the server. */
export function useConversationList() {
  const { authedRequest } = useAuth()
  const api = useMemo(() => createWorkspaceApi(authedRequest), [authedRequest])
  const [state, setState] = useState<Load<Conversation[]>>({ status: 'loading' })
  const [actionFailure, setActionFailure] = useState<Failure | null>(null)
  const [attempt, setAttempt] = useState(0)
  const lifetime = useRef<AbortController | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    lifetime.current = controller
    api.conversations(controller.signal).then(
      (data) => setState({ status: 'ready', data }),
      (e) => { if (!isAborted(e)) setState({ status: 'error', failure: describeFailure(e) }) },
    )
    return () => controller.abort()
  }, [api, attempt])

  const retry = useCallback(() => { setState({ status: 'loading' }); setAttempt((n) => n + 1) }, [])

  /** Silent refresh that keeps the current list visible. */
  const refresh = useCallback(() => {
    api.conversations(lifetime.current?.signal).then(
      (data) => setState({ status: 'ready', data }),
      () => { /* keep showing the previous list */ },
    )
  }, [api])

  const remove = useCallback(
    async (id: number) => {
      setActionFailure(null)
      try {
        await api.deleteConversation(id)
        refresh()
        return true
      } catch (e) {
        if (!isAborted(e)) setActionFailure(describeFailure(e))
        return false
      }
    },
    [api, refresh],
  )

  return { state, actionFailure, retry, refresh, remove }
}
