import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { useAuth } from '../../auth/context/AuthContext'
import { describeFailure, type Failure } from '../../dashboard/api/failures'
import { AppShell } from '../../dashboard/components/AppShell'
import { ErrorNotice } from '../../dashboard/components/StateViews'
import { useConversationList } from '../../workspace/hooks/useConversationList'
import { TaskDetailPanel } from '../components/TaskDetailPanel'
import { TaskListPanel } from '../components/TaskListPanel'

const UNAVAILABLE: Failure = { title: 'This task isn’t available', message: 'It may not exist, or you may not have access to it.' }

/** Rendered with `key={email}` so private state resets on account change. */
export default function TasksPage({ email }: { email: string }) {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const { taskId: raw } = useParams()
  const list = useConversationList()
  const [refreshing, setRefreshing] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const taskId = raw === undefined ? null : /^\d{1,15}$/.test(raw) ? Number(raw) : NaN
  if (Number.isNaN(taskId)) return <Navigate to="/app/tasks" replace />

  const task = taskId !== null && list.state.status === 'ready' ? list.state.data.find((c) => c.id === taskId) ?? null : null

  const refresh = () => {
    setRefreshing(true)
    list.refresh()
    window.setTimeout(() => setRefreshing(false), 600)
  }

  /** Only reports success after the backend confirms; the list is then re-read from the server. */
  const deleteTask = async (id: number) => {
    const result = await list.remove(id)
    if (result.ok) {
      setNotice('Task deleted.')
      navigate('/app/tasks')
      return { ok: true, failure: null }
    }
    return { ok: false, failure: result.failure ?? describeFailure(new Error('delete')) }
  }

  const showDetail = taskId !== null
  return (
    <AppShell email={email} onLogout={logout} active="tasks" wide>
      <div className="mb-6 max-w-2xl">
        <p className="text-xs font-bold tracking-[0.16em] text-violet">TASK HISTORY</p>
        <h1 className="mt-3 text-4xl font-extrabold leading-[1.08] sm:text-5xl">Everything you’ve asked, in one place.</h1>
      </div>
      {notice && (
        <p role="status" className="mb-4 flex items-center gap-2 rounded-2xl border border-mint/50 bg-mint/15 p-3 text-sm font-semibold text-[#14704D]">
          <CheckCircle2 size={16} aria-hidden="true" /> {notice}
          <button type="button" onClick={() => setNotice(null)} className="ml-auto text-xs underline">Dismiss</button>
        </p>
      )}
      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 xl:grid-cols-[400px_minmax(0,1fr)]">
        <div className={showDetail ? 'hidden xl:block' : ''}>
          <TaskListPanel state={list.state} activeId={taskId} refreshing={refreshing} onRefresh={refresh} onRetry={list.retry} />
        </div>
        <div className={showDetail ? '' : 'hidden xl:block'}>
          {!showDetail && (
            <div className="rounded-3xl border border-dashed border-line bg-white/60 p-10 text-center">
              <h2 className="font-display text-xl font-bold">Select a task</h2>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted">Pick a task to see its original goal, final result, and the conversation behind it.</p>
            </div>
          )}
          {showDetail && list.state.status === 'loading' && <div aria-busy="true" className="h-64 animate-pulse rounded-3xl bg-line/60" />}
          {showDetail && list.state.status === 'error' && <ErrorNotice failure={list.state.failure} onRetry={list.retry} />}
          {showDetail && list.state.status === 'ready' && !task && <ErrorNotice failure={UNAVAILABLE} />}
          {showDetail && task && <TaskDetailPanel key={task.id} task={task} onDelete={deleteTask} />}
        </div>
      </div>
    </AppShell>
  )
}
