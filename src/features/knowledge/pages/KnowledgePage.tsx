import { useAuth } from '../../auth/context/AuthContext'
import { AppShell } from '../../dashboard/components/AppShell'
import { DocumentList } from '../components/DocumentList'
import { RetrievalNotes } from '../components/RetrievalNotes'
import { UploadPanel } from '../components/UploadPanel'
import { useDocumentUploads } from '../hooks/useDocumentUploads'

/** Rendered with `key={email}` so uploaded-document state is discarded on account change. */
export default function KnowledgePage({ email }: { email: string }) {
  const { logout } = useAuth()
  const up = useDocumentUploads()
  return (
    <AppShell email={email} onLogout={logout} active="knowledge" wide>
      <div className="mb-6 max-w-2xl">
        <p className="text-xs font-bold tracking-[0.16em] text-[#14704D]">KNOWLEDGE BASE</p>
        <h1 className="mt-3 text-4xl font-extrabold leading-[1.08] sm:text-5xl">Your documents, kept in one place.</h1>
        <p className="mt-3 text-muted">Knowledge is one capability among many in NeuronixAI. You can upload PDFs today; using them in answers isn’t connected yet.</p>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <UploadPanel uploading={up.uploading} invalid={up.invalid} failure={up.failure} possibleDuplicate={up.possibleDuplicate} onChoose={up.choose} onConfirmDuplicate={up.confirmDuplicate} onDismissDuplicate={up.dismissDuplicate} />
          <DocumentList docs={up.docs} />
        </div>
        <RetrievalNotes />
      </div>
    </AppShell>
  )
}
