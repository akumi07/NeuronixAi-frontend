import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../auth/context/AuthContext'
import { isAborted, type Failure } from '../../dashboard/api/failures'
import type { ChatMessage } from '../../dashboard/api/types'
import { createWorkspaceApi } from '../../dashboard/api/workspaceApi'
import type { Load } from '../../dashboard/hooks/load'
import { describeThreadFailure } from '../../workspace/hooks/useTaskSession'

export function useTaskDetail(taskId: number) {
  const { authedRequest } = useAuth()
  const api = useMemo(() => createWorkspaceApi(authedRequest), [authedRequest])
  const [state, setState] = useState<Load<ChatMessage[]>>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    api.messages(taskId, controller.signal).then(
      (data) => setState({ status: 'ready', data }),
      (e) => { if (!isAborted(e)) setState({ status: 'error', failure: describeThreadFailure(e) as Failure }) },
    )
    return () => controller.abort()
  }, [api, taskId, attempt])

  const retry = useCallback(() => { setState({ status: 'loading' }); setAttempt((n) => n + 1) }, [])
  return { state, retry }
}
