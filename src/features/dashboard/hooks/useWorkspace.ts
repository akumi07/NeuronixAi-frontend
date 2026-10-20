import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../../auth/context/AuthContext'
import { describeFailure, isAborted, type Failure } from '../api/failures'
import type { ChatMessage, Conversation, CurrentUser } from '../api/types'
import { createWorkspaceApi } from '../api/workspaceApi'

export type Load<T> = { status: 'loading' } | { status: 'ready'; data: T } | { status: 'error'; failure: Failure }

/**
 * All private data lives in this hook's React state only: nothing is cached in storage, and it is
 * discarded when the dashboard unmounts (sign-out or account change; the page is keyed by account).
 */
export function useWorkspace() {
  const { authedRequest } = useAuth()
  const api = useMemo(() => createWorkspaceApi(authedRequest), [authedRequest])

  const [me, setMe] = useState<Load<CurrentUser>>({ status: 'loading' })
  const [conversations, setConversations] = useState<Load<Conversation[]>>({ status: 'loading' })
  const [activeId, setActiveId] = useState<number | null>(null)
  const [thread, setThread] = useState<Load<ChatMessage[]> | null>(null)
  const [pendingMessage, setPendingMessage] = useState<string | null>(null)
  const [sendFailure, setSendFailure] = useState<Failure | null>(null)
  const [actionFailure, setActionFailure] = useState<Failure | null>(null)

  const lifetime = useRef<AbortController | null>(null)
  const threadRequest = useRef(0)

  const signal = () => lifetime.current?.signal

  const fetchMe = useCallback(async () => {
    try {
      setMe({ status: 'ready', data: await api.me(signal()) })
    } catch (e) {
      if (!isAborted(e)) setMe({ status: 'error', failure: describeFailure(e) })
    }
  }, [api])

  const fetchConversations = useCallback(async () => {
    try {
      setConversations({ status: 'ready', data: await api.conversations(signal()) })
    } catch (e) {
      if (!isAborted(e)) setConversations({ status: 'error', failure: describeFailure(e) })
    }
  }, [api])

  const fetchMessages = useCallback(
    async (id: number) => {
      const ticket = ++threadRequest.current
      try {
        const data = await api.messages(id, signal())
        if (ticket === threadRequest.current) setThread({ status: 'ready', data })
      } catch (e) {
        if (!isAborted(e) && ticket === threadRequest.current) setThread({ status: 'error', failure: describeFailure(e) })
      }
    },
    [api],
  )

  useEffect(() => {
    const controller = new AbortController()
    lifetime.current = controller
    api.me(controller.signal).then(
      (data) => setMe({ status: 'ready', data }),
      (e) => { if (!isAborted(e)) setMe({ status: 'error', failure: describeFailure(e) }) },
    )
    api.conversations(controller.signal).then(
      (data) => setConversations({ status: 'ready', data }),
      (e) => { if (!isAborted(e)) setConversations({ status: 'error', failure: describeFailure(e) }) },
    )
    return () => controller.abort()
  }, [api])

  const reloadConversations = useCallback(() => {
    setConversations({ status: 'loading' })
    void fetchConversations()
  }, [fetchConversations])

  const reloadMe = useCallback(() => {
    setMe({ status: 'loading' })
    void fetchMe()
  }, [fetchMe])

  const openConversation = useCallback(
    (id: number) => {
      setActiveId(id)
      setSendFailure(null)
      setActionFailure(null)
      setThread({ status: 'loading' })
      void fetchMessages(id)
    },
    [fetchMessages],
  )

  const startNewTask = useCallback(() => {
    threadRequest.current++
    setActiveId(null)
    setThread(null)
    setSendFailure(null)
  }, [])

  /** Returns true on success so the composer can clear itself; on failure the draft is kept. */
  const send = useCallback(
    async (message: string) => {
      setSendFailure(null)
      setPendingMessage(message)
      setThread((t) => t ?? { status: 'ready', data: [] }) // show the in-progress turn immediately
      try {
        const reply = await api.chat(message, activeId, signal())
        setActiveId(reply.conversationId)
        await Promise.all([fetchMessages(reply.conversationId), fetchConversations()])
        return true
      } catch (e) {
        if (!isAborted(e)) setSendFailure(describeFailure(e))
        if (activeId === null) setThread(null) // back to the start screen; the draft is kept
        return false
      } finally {
        setPendingMessage(null)
      }
    },
    [api, activeId, fetchMessages, fetchConversations],
  )

  const removeConversation = useCallback(
    async (id: number) => {
      setActionFailure(null)
      try {
        await api.deleteConversation(id)
        if (id === activeId) startNewTask()
        await fetchConversations()
      } catch (e) {
        if (!isAborted(e)) setActionFailure(describeFailure(e))
      }
    },
    [api, activeId, startNewTask, fetchConversations],
  )

  return {
    me, conversations, activeId, thread, pendingMessage, sendFailure, actionFailure,
    reloadConversations, reloadMe, reloadThread: () => activeId !== null && openConversation(activeId),
    openConversation, startNewTask, send, removeConversation,
  }
}
