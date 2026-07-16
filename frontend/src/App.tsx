import { Navigate, Route, Routes, BrowserRouter } from 'react-router-dom'
import { Spinner } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { DashboardPage } from '@/pages/DashboardPage'
import LoginPage from '@/pages/LoginPage'
import { ProtectedRoute } from '@/routes/ProtectedRoute'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Spinner label="Preparing your workspace..." />
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Route>

        <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App