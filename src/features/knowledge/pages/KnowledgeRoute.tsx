import { useAuth } from '../../auth/context/AuthContext'
import KnowledgePage from './KnowledgePage'

export default function KnowledgeRoute() {
  const { email } = useAuth()
  if (!email) return null
  return <KnowledgePage key={email} email={email} />
}
