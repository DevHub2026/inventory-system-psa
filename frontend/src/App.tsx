import { Navigate, Route, Routes, BrowserRouter } from 'react-router-dom'
import { Spinner } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { AppLayout } from '@/layouts/AppLayout'
import { AssetPage } from '@/pages/AssetPage'
import { BorrowingPage } from '@/pages/BorrowingPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { InventoryPage } from '@/pages/InventoryPage'
import { MaintenancePage } from '@/pages/MaintenancePage'
import { PermissionsPage } from '@/pages/PermissionsPage'
import { ReportPage } from '@/pages/ReportPage'
import { ReservationPage } from '@/pages/ReservationPage'
import { RolesPage } from '@/pages/RolesPage'
import { SettingsPage } from '@/pages/SettingsPage'
import LoginPage from '@/pages/LoginPage'
import { UsersPage } from '@/pages/UsersPage'
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
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/assets" element={<AssetPage />} />
            <Route path="/reservations" element={<ReservationPage />} />
            <Route path="/borrowings" element={<BorrowingPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/maintenance" element={<MaintenancePage />} />
            <Route path="/reports" element={<ReportPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/roles" element={<RolesPage />} />
            <Route path="/permissions" element={<PermissionsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App