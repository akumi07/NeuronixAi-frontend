import { useAuth } from '../../auth/context/AuthContext'
import TasksPage from './TasksPage'

export default function TasksRoute() {
  const { email } = useAuth()
  if (!email) return null
  return <TasksPage key={email} email={email} />
}
