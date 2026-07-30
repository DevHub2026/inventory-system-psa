import { Navigate, Route, Routes, BrowserRouter } from 'react-router-dom'
import { Spinner } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { AppLayout } from '@/layouts/AppLayout'
import { AssetPage } from '@/pages/AssetPage'
import { BorrowingPage } from '@/pages/BorrowingPage'
import BorrowingDetailsPage from '@/pages/BorrowingDetailsPage'
import ExtensionRequestsPage from '@/pages/ExtensionRequestsPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { DocumentTemplatesPage } from '@/pages/DocumentTemplatesPage'
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
import { DevelopersPage } from '@/pages/DevelopersPage'
import { SystemSetupPage } from '@/pages/SystemSetupPage'
<<<<<<< HEAD
import { UserProfilePage } from '@/pages/UserProfilePage'
=======
>>>>>>> 6bc7d60696539327e12f61fa55cb8e57b4e53eb7
import { WorkflowsPage } from '@/pages/WorkflowsPage'
import { QRScannerPage } from '@/pages/QRScannerPage'
import { EmployeeAssetPage } from '@/pages/EmployeeAssetPage'
import { QRScanHistoryPage } from '@/pages/QRScanHistoryPage'
import LoginPage from '@/pages/LoginPage'
import { UsersPage } from '@/pages/UsersPage'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { UserProfilePage } from '@/pages/UserProfilePage'

import { ErrorBoundary } from '@/components/ErrorBoundary'

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
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />

          <Route element={<ProtectedRoute />}>
            {/* Mobile / standalone QR routes (keep available for employees) */}
            <Route path="/qr" element={<QRScannerPage />} />
            <Route path="/qr/:identifier" element={<EmployeeAssetPage />} />

            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/assets" element={<AssetPage />} />
              <Route path="/reservations" element={<ReservationPage />} />
              <Route path="/borrowings" element={<BorrowingPage />} />
              <Route path="/borrowings/:id" element={<BorrowingDetailsPage />} />
              <Route path="/extension-requests" element={<ExtensionRequestsPage />} />
              <Route path="/issued-assets" element={<IssuedAssetsPage />} />
              <Route path="/inventory" element={<InventoryPage />} />
              <Route path="/maintenance" element={<MaintenancePage />} />
              <Route path="/reports" element={<ReportPage />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/users/:id" element={<UserProfilePage />} />
              <Route path="/roles" element={<RolesPage />} />
              <Route path="/permissions" element={<PermissionsPage />} />
              <Route path="/system-setup" element={<SystemSetupPage />} />
              <Route path="/workflows" element={<WorkflowsPage />} />
              <Route path="/qr-scan-history" element={<QRScanHistoryPage />} />
              <Route path="/document-templates" element={<DocumentTemplatesPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/sessions" element={<SessionsPage />} />
              <Route path="/privacy" element={<PrivacyNoticePage />} />
              <Route path="/developers" element={<DevelopersPage />} />

              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
