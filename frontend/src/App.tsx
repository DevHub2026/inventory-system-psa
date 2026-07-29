import { Navigate, Route, Routes, BrowserRouter } from 'react-router-dom'
import { Spinner } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { AppLayout } from '@/layouts/AppLayout'
import { AssetPage } from '@/pages/AssetPage'
import { BorrowingPage } from '@/pages/BorrowingPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { InventoryPage } from '@/pages/InventoryPage'
import { IssuedAssetsPage } from '@/pages/IssuedAssetsPage'
import { MaintenancePage } from '@/pages/MaintenancePage'
import { PermissionsPage } from '@/pages/PermissionsPage'
import { PrivacyNoticePage } from '@/pages/PrivacyNoticePage'
import { ReportPage } from '@/pages/ReportPage'
import { ReservationPage } from '@/pages/ReservationPage'
import { RolesPage } from '@/pages/RolesPage'
import { SessionsPage } from '@/pages/SessionsPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { SystemSetupPage } from '@/pages/SystemSetupPage'
import { UserProfilePage } from '@/pages/UserProfilePage'
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
            <Route path="/issued-assets" element={<IssuedAssetsPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/maintenance" element={<MaintenancePage />} />
            <Route path="/reports" element={<ReportPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/users/:id" element={<UserProfilePage />} />
            <Route path="/roles" element={<RolesPage />} />
            <Route path="/permissions" element={<PermissionsPage />} />
            <Route path="/system-setup" element={<SystemSetupPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/sessions" element={<SessionsPage />} />
            <Route path="/privacy" element={<PrivacyNoticePage />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
