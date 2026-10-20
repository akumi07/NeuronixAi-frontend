import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/context/AuthContext'
import { AppShell } from '../../dashboard/components/AppShell'
import { AskPanel } from '../components/AskPanel'
import { DocumentList } from '../components/DocumentList'
import { FeatureStatusPanel } from '../components/FeatureStatusPanel'
import { UploadPanel } from '../components/UploadPanel'
import { useKnowledge } from '../hooks/useKnowledge'

/** Rendered with `key={email}` so document state is discarded on account change. */
export default function KnowledgePage({ email }: { email: string }) {
  const { logout } = useAuth()
  const k = useKnowledge(email)
  const [askId, setAskId] = useState<string | null>(null)
  const askDoc = k.docs.find((d) => d.id === askId) ?? null

  return (
    <AppShell email={email} onLogout={logout} active="knowledge" wide>
      <div className="mb-6 max-w-2xl">
        <p className="text-xs font-bold tracking-[0.16em] text-[#14704D]">KNOWLEDGE BASE</p>
        <h1 className="mt-3 text-4xl font-extrabold leading-[1.08] sm:text-5xl">Your documents, kept in one place.</h1>
        <p className="mt-3 text-muted">Knowledge is one capability among many in NeuronixAI. A document is only used for answers once the backend reports it as ready.</p>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="space-y-6">
          <UploadPanel uploading={k.uploading} progress={k.progress} invalid={k.invalid} failure={k.uploadFailure} possibleDuplicate={k.possibleDuplicate} onChoose={k.choose} onConfirmDuplicate={k.confirmDuplicate} onDismissDuplicate={k.dismissDuplicate} />
          <DocumentList k={k} askId={askId} onAsk={(id) => { setAskId(id); k.resetAsk() }} />
          {k.selected.size > 0 && (
            <p className="rounded-2xl border border-line bg-white p-4 text-sm">{k.selected.size} selected. <Link to="/app/workspace" className="font-semibold text-violet underline">Open the workspace</Link> to offer them as context.</p>
          )}
        </div>
        <div className="space-y-6">
          <AskPanel k={k} doc={askDoc} />
          <FeatureStatusPanel />
        </div>
      </div>
    </AppShell>
  )
}
