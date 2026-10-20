import { Component, type ReactNode } from 'react'

/**
 * Last-resort boundary. It renders a generic message only: no error text, stack, or component data is shown,
 * and and componentDidCatch is deliberately not implemented, so nothing is logged or sent anywhere (it could contain private conversation content).
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    if (!this.state.failed) return this.props.children
    return (
      <main className="grid min-h-screen place-items-center px-6 text-center">
        <div>
          <h1 className="text-3xl font-extrabold">Something went wrong</h1>
          <p className="mt-3 text-muted">The page hit an unexpected problem. Reloading will sign you out because your session is kept in memory only.</p>
          <button type="button" onClick={() => window.location.assign('/')} className="mt-6 rounded-xl bg-gradient-to-br from-violet to-indigo px-5 py-3 font-semibold text-white">Back to home</button>
        </div>
      </main>
    )
  }
}
