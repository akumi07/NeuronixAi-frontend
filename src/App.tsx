import { Route, Routes } from 'react-router-dom'
import LandingPage from './features/landing/pages/LandingPage'

import ComingSoonPage from './pages/ComingSoonPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<ComingSoonPage title="Login" />} />
      <Route path="/register" element={<ComingSoonPage title="Registration" />} />
      <Route path="*" element={<ComingSoonPage title="This page" />} />
    </Routes>
  )
}
