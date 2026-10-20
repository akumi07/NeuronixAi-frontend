import { Route, Routes } from 'react-router-dom'
import ForgotPasswordPage from './features/auth/pages/ForgotPasswordPage'
import LoginPage from './features/auth/pages/LoginPage'
import RegisterPage from './features/auth/pages/RegisterPage'
import ResetPasswordPage from './features/auth/pages/ResetPasswordPage'
import { RedirectIfAuthenticated, RequireAuth } from './features/auth/routes/RequireAuth'
import WorkspaceRoute from './features/workspace/pages/WorkspaceRoute'
import AgentDetailPage from './features/agents/pages/AgentDetailPage'
import AgentDirectoryPage from './features/agents/pages/AgentDirectoryPage'
import AgentsRoute from './features/agents/pages/AgentsRoute'
import TasksRoute from './features/tasks/pages/TasksRoute'
import ConversationsRoute from './features/conversations/pages/ConversationsRoute'
import KnowledgeRoute from './features/knowledge/pages/KnowledgeRoute'
import SettingsRoute from './features/settings/pages/SettingsRoute'
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
      <Route path="/app/tasks/:taskId?" element={<RequireAuth><TasksRoute /></RequireAuth>} />
      <Route path="/app/conversations/:conversationId?" element={<RequireAuth><ConversationsRoute /></RequireAuth>} />
      <Route path="/app/knowledge" element={<RequireAuth><KnowledgeRoute /></RequireAuth>} />
      <Route path="/app/settings" element={<RequireAuth><SettingsRoute /></RequireAuth>} />
      <Route path="/app/agents" element={<RequireAuth><AgentsRoute><AgentDirectoryPage /></AgentsRoute></RequireAuth>} />
      <Route path="/app/agents/:agentId" element={<RequireAuth><AgentsRoute><AgentDetailPage /></AgentsRoute></RequireAuth>} />
      <Route path="*" element={<ComingSoonPage title="This page" />} />
    </Routes>
  )
}
