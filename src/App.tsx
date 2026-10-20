import { Route, Routes } from 'react-router-dom'
import ForgotPasswordPage from './features/auth/pages/ForgotPasswordPage'
import LoginPage from './features/auth/pages/LoginPage'
import RegisterPage from './features/auth/pages/RegisterPage'
import ResetPasswordPage from './features/auth/pages/ResetPasswordPage'
import { RedirectIfAuthenticated, RequireAuth } from './features/auth/routes/RequireAuth'
import WorkspaceRoute from './features/workspace/pages/WorkspaceRoute'
import LandingPage from './features/landing/pages/LandingPage'
import ComingSoonPage from './pages/ComingSoonPage'
import DashboardRoute from './features/dashboard/pages/DashboardRoute'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<RedirectIfAuthenticated><LoginPage /></RedirectIfAuthenticated>} />
      <Route path="/register" element={<RedirectIfAuthenticated><RegisterPage /></RedirectIfAuthenticated>} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/app" element={<RequireAuth><DashboardRoute /></RequireAuth>} />
      <Route path="/app/workspace/:conversationId?" element={<RequireAuth><WorkspaceRoute /></RequireAuth>} />
      <Route path="*" element={<ComingSoonPage title="This page" />} />
    </Routes>
  )
}
