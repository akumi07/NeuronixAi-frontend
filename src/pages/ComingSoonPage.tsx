import { Link } from 'react-router-dom'
import { BrandLogo } from '../features/landing/components/BrandLogo'

/** Honest placeholder for routes whose screens are not built yet. It has no form and no auth behavior. */
export default function ComingSoonPage({ title }: { title: string }) {
  return (
    <main className="grid min-h-screen place-items-center px-6 text-center">
      <div>
        <BrandLogo className="mb-8" />
        <h1 className="text-3xl font-extrabold">{title} is not available yet</h1>
        <p className="mt-3 text-muted">This screen is still being built.</p>
        <Link to="/" className="mt-6 inline-block font-semibold text-violet hover:underline">Back to home</Link>
      </div>
    </main>
  )
}
