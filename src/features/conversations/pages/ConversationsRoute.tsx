import { useAuth } from '../../auth/context/AuthContext'
import ConversationsPage from './ConversationsPage'

export default function ConversationsRoute() {
  const { email } = useAuth()
  if (!email) return null
  return <ConversationsPage key={email} email={email} />
}
