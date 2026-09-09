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
import { DocumentationPage } from '@/pages/DocumentationPage'
import { HistoryPage } from '@/pages/HistoryPage'
import { AuditLogsPage } from '@/pages/AuditLogsPage'
import { InventoryPage } from '@/pages/InventoryPage'
import { IssuedAssetsPage } from '@/pages/IssuedAssetsPage'
import { MaintenancePage } from '@/pages/MaintenancePage'
import { PermissionsPage } from '@/pages/PermissionsPage'
import { PrivacyNoticePage } from '@/pages/PrivacyNoticePage'
import { ReportPage } from '@/pages/ReportPage'
import { ReservationPage } from '@/pages/ReservationPage'
import { MakeRequestPage } from '@/pages/MakeRequestPage'
import { RolesPage } from '@/pages/RolesPage'
import { SessionsPage } from '@/pages/SessionsPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { DevelopersPage } from '@/pages/DevelopersPage'
import { SystemSetupPage } from '@/pages/SystemSetupPage'
import { WorkflowsPage } from '@/pages/WorkflowsPage'
import { QRScannerPage } from '@/pages/QRScannerPage'
import { EmployeeAssetPage } from '@/pages/EmployeeAssetPage'
import { QRScanHistoryPage } from '@/pages/QRScanHistoryPage'
import LoginPage from '@/pages/LoginPage'
import { UsersPage } from '@/pages/UsersPage'
import { FaqManagementPage } from '@/pages/FaqManagementPage'
import { UnauthorizedPage } from '@/pages/UnauthorizedPage'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { RequirePermission } from '@/routes/RequirePermission'
import { UserProfilePage } from '@/pages/UserProfilePage'

import { SupplyRequestListPage } from '@/pages/SupplyRequests/SupplyRequestListPage'
import { SupplyRequestDetailPage } from '@/pages/SupplyRequests/SupplyRequestDetailPage'
import { CreateSupplyRequestPage } from '@/pages/SupplyRequests/CreateSupplyRequestPage'

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
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          <Route element={<ProtectedRoute />}>
            {/* Mobile / standalone QR routes (open to all authenticated users) */}
            <Route path="/qr" element={<QRScannerPage />} />
            <Route path="/qr/:identifier" element={<EmployeeAssetPage />} />

            <Route element={<AppLayout />}>
              {/* -- All authenticated users -- */}
              
              <Route path="/supply-requests" element={
                <RequirePermission permission="nav.supply_requests">
                  <SupplyRequestListPage />
                </RequirePermission>
              } />
              <Route path="/supply-requests/new" element={
                <RequirePermission permission="nav.supply_requests">
                  <CreateSupplyRequestPage />
                </RequirePermission>
              } />
              <Route path="/supply-requests/:id" element={
                <RequirePermission permission="nav.supply_requests">
                  <SupplyRequestDetailPage />
                </RequirePermission>
              } />

              <Route path="/dashboard" element={
                <RequirePermission permission="nav.dashboard">
                  <DashboardPage />
                </RequirePermission>
              } />

              {/* -- Assets & Borrowing (Employee + Staff + Admin) -- */}
              <Route path="/assets" element={
                <RequirePermission permission="nav.assets">
                  <AssetPage />
                </RequirePermission>
              } />
              <Route path="/make-request" element={
                  <RequirePermission permission={['nav.reservations', 'nav.supply_requests']}>
                    <MakeRequestPage />
                  </RequirePermission>
                } />
                <Route path="/reservations" element={
                <RequirePermission permission="nav.reservations">
                  <ReservationPage />
                </RequirePermission>
              } />
              <Route path="/borrowings" element={
                <RequirePermission permission="nav.borrowings">
                  <BorrowingPage />
                </RequirePermission>
              } />
              <Route path="/borrowings/:id" element={
                <RequirePermission permission="nav.borrowings">
                  <BorrowingDetailsPage />
                </RequirePermission>
              } />
              <Route path="/issued-assets" element={
                <RequirePermission permission="nav.issued_assets">
                  <IssuedAssetsPage />
                </RequirePermission>
              } />

              {/* -- Staff + Admin operations -- */}
              <Route path="/extension-requests" element={
                <RequirePermission permission="nav.extension_requests">
                  <ExtensionRequestsPage />
                </RequirePermission>
              } />
              <Route path="/inventory" element={
                <RequirePermission permission="nav.inventory">
                  <InventoryPage />
                </RequirePermission>
              } />
              <Route path="/maintenance" element={
                <RequirePermission permission="nav.maintenance">
                  <MaintenancePage />
                </RequirePermission>
              } />
              <Route path="/reports/*" element={
                <RequirePermission permission="nav.reports">
                  <ReportPage />
                </RequirePermission>
              } />
              <Route path="/history" element={
                <RequirePermission permission="nav.history">
                  <HistoryPage />
                </RequirePermission>
              } />
              <Route path="/qr-scan-history" element={
                <RequirePermission permission="nav.qr_scan_history">
                  <QRScanHistoryPage />
                </RequirePermission>
              } />

              {/* Legacy redirect aliases */}
              <Route path="/damage-reports" element={<Navigate to="/reports/damage" replace />} />
              <Route path="/lost-asset-reports" element={<Navigate to="/reports/lost-assets" replace />} />

              {/* -- Admin-only -- */}
              <Route path="/audit-logs" element={
                <RequirePermission permission="nav.audit_logs">
                  <AuditLogsPage />
                </RequirePermission>
              } />
              <Route path="/users" element={
                <RequirePermission permission="nav.users">
                  <UsersPage />
                </RequirePermission>
              } />
              {/*
                /users/:id: guarded by nav.users for listing; backend policy also
                allows self-view (user.id === model.id), which the backend enforces.
                We guard with nav.users so non-admin users cannot enumerate profiles.
              */}
              <Route path="/users/:id" element={
                <RequirePermission permission="nav.users">
                  <UserProfilePage />
                </RequirePermission>
              } />
              <Route path="/roles" element={
                <RequirePermission permission="nav.roles">
                  <RolesPage />
                </RequirePermission>
              } />
              {/*
                /permissions: backend guards this with role:Super Administrator.
                No nav.* permission exists for it, so we check the role directly.
              */}
              <Route path="/permissions" element={
                <RequirePermission role="Super Administrator">
                  <PermissionsPage />
                </RequirePermission>
              } />
              <Route path="/faqs" element={
                <RequirePermission permission="nav.faqs">
                  <FaqManagementPage />
                </RequirePermission>
              } />
              <Route path="/system-setup" element={
                <RequirePermission permission="nav.system_setup">
                  <SystemSetupPage />
                </RequirePermission>
              } />
              <Route path="/workflows" element={
                <RequirePermission permission="nav.workflows">
                  <WorkflowsPage />
                </RequirePermission>
              } />
              <Route path="/document-templates" element={
                <RequirePermission permission="nav.system_setup">
                  <DocumentTemplatesPage />
                </RequirePermission>
              } />

              {/* -- Open to all authenticated users (no RBAC guard) -- */}
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/sessions" element={<SessionsPage />} />
              <Route path="/privacy" element={<PrivacyNoticePage />} />
              <Route path="/developers" element={<DevelopersPage />} />
              <Route path="/documentation" element={<DocumentationPage />} />

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


