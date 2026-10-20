import { useCallback, useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { ApiError } from '../../auth/api/httpClient'
import { useAuth } from '../../auth/context/AuthContext'
import { Row, SettingsSection, StatusDot, Unavailable } from './SettingsParts'
import { settingsApi } from '../api/settingsApi'

type Check = { state: 'checking' } | { state: 'up' } | { state: 'problem' } | { state: 'unreachable' }

export function ConnectionsSection() {
  const { authedRequest } = useAuth()
  const [api, setApi] = useState<Check>({ state: 'checking' })
  const [session, setSession] = useState<Check>({ state: 'checking' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    settingsApi.health(controller.signal).then(
      (h) => setApi({ state: h?.status === 'UP' ? 'up' : 'problem' }),
      (e) => { if (!(e instanceof ApiError && e.kind === 'aborted')) setApi({ state: e instanceof ApiError && e.kind === 'http' ? 'problem' : 'unreachable' }) },
    )
    authedRequest<unknown>('GET', '/api/v1/users/me', { signal: controller.signal }).then(
      () => setSession({ state: 'up' }),
      (e) => { if (!(e instanceof ApiError && e.kind === 'aborted')) setSession({ state: e instanceof ApiError && e.kind === 'http' ? 'problem' : 'unreachable' }) },
    )
    return () => controller.abort()
  }, [authedRequest, attempt])

  const recheck = useCallback(() => { setApi({ state: 'checking' }); setSession({ state: 'checking' }); setAttempt((n) => n + 1) }, [])

  const label = (c: Check, ok: string, problem: string) =>
    c.state === 'checking' ? 'Checking…' : c.state === 'up' ? ok : c.state === 'problem' ? problem : 'Can’t reach the server'
  const tone = (c: Check) => (c.state === 'up' ? 'ok' : c.state === 'checking' ? 'unknown' : 'bad') as 'ok' | 'bad' | 'unknown'

  return (
    <SettingsSection id="connections" title="Connections" description="Status of your connection to NeuronixAI and the integrations available to you.">
      <dl className="space-y-4">
        <Row label="NeuronixAI service"><span className="inline-flex items-center gap-2"><StatusDot tone={tone(api)} />{label(api, 'Healthy', 'Reported a problem')}</span></Row>
        <Row label="Your session"><span className="inline-flex items-center gap-2"><StatusDot tone={tone(session)} />{label(session, 'Signed in and verified', 'Couldn’t be verified')}</span></Row>
      </dl>
      <button type="button" onClick={recheck} className="inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm font-semibold hover:border-violet/40 hover:text-violet">
        <RefreshCw size={15} className={api.state === 'checking' ? 'animate-spin' : ''} aria-hidden="true" /> Check again
      </button>
      <Unavailable><strong>No integrations are available.</strong> NeuronixAI doesn’t currently offer connections to other services (such as Google or GitHub), API keys, or per-user AI provider settings.</Unavailable>
    </SettingsSection>
  )
}
