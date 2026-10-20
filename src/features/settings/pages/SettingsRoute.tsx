import { useAuth } from '../../auth/context/AuthContext'
import SettingsPage from './SettingsPage'

export default function SettingsRoute() {
  const { email } = useAuth()
  if (!email) return null
  return <SettingsPage key={email} email={email} />
}
