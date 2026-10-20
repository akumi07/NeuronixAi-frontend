import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { MotionConfig } from 'motion/react'
import App from './App'
import { ErrorBoundary } from './components/ErrorBoundary'
import { AuthProvider } from './features/auth/context/AuthContext'
import { applyPreferences, usePreferences } from './features/settings/preferences'
import './styles/index.css'

applyPreferences()

function Root() {
  const prefs = usePreferences()
  return (
    <MotionConfig reducedMotion={prefs.motion === 'reduce' ? 'always' : 'user'}>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </MotionConfig>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <Root />
    </ErrorBoundary>
  </StrictMode>,
)
