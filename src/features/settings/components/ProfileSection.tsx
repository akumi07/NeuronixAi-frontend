import { formatDay } from '../../dashboard/data/formatDate'
import { ErrorNotice, Skeleton } from '../../dashboard/components/StateViews'
import { useCurrentUser } from '../../dashboard/hooks/useCurrentUser'
import { Row, SettingsSection, Unavailable } from './SettingsParts'

export function ProfileSection() {
  const { me, retry } = useCurrentUser()
  return (
    <SettingsSection id="profile" title="Profile" description="Your account details, as stored by NeuronixAI.">
      {me.status === 'loading' && <div aria-busy="true" className="space-y-3"><Skeleton className="h-6" /><Skeleton className="h-6" /></div>}
      {me.status === 'error' && <ErrorNotice failure={me.failure} onRetry={retry} />}
      {me.status === 'ready' && (
        <dl className="space-y-4">
          <Row label="Email">{me.data.email}</Row>
          <Row label="Member since">{formatDay(me.data.createdAt) || 'Unknown'}</Row>
        </dl>
      )}
      <Unavailable>Profile editing isn’t available: the backend exposes no endpoint for changing your email or other details.</Unavailable>
    </SettingsSection>
  )
}
