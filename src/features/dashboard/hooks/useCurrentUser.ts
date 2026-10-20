import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../auth/context/AuthContext'
import { describeFailure, isAborted } from '../api/failures'
import type { CurrentUser } from '../api/types'
import { createWorkspaceApi } from '../api/workspaceApi'
import type { Load } from './load'

export function useCurrentUser() {
  const { authedRequest } = useAuth()
  const api = useMemo(() => createWorkspaceApi(authedRequest), [authedRequest])
  const [me, setMe] = useState<Load<CurrentUser>>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    api.me(controller.signal).then(
      (data) => setMe({ status: 'ready', data }),
      (e) => { if (!isAborted(e)) setMe({ status: 'error', failure: describeFailure(e) }) },
    )
    return () => controller.abort()
  }, [api, attempt])

  const retry = useCallback(() => { setMe({ status: 'loading' }); setAttempt((n) => n + 1) }, [])
  return { me, retry }
}
