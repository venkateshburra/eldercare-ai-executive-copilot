import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';
import LoadingSpinner from './components/common/LoadingSpinner';

// Pages
import LoginPage from './pages/LoginPage';
import ExecutiveDashboardPage from './pages/ExecutiveDashboardPage';
import KnowledgeSearchPage from './pages/KnowledgeSearchPage';
import ScenarioBuilderPage from './pages/ScenarioBuilderPage';
import BriefingsDecisionsPage from './pages/BriefingsDecisionsPage';
import SourceCitedQAPage from './pages/SourceCitedQAPage';
import SensitivityAnalysisPage from './pages/SensitivityAnalysisPage';
import OutcomeReviewPage from './pages/OutcomeReviewPage';
import ReportsAnalyticsPage from './pages/ReportsAnalyticsPage';
import NotificationsPage from './pages/NotificationsPage';
import UserRoleManagementPage from './pages/UserRoleManagementPage';
import AuditSettingsPage from './pages/AuditSettingsPage';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner fullScreen text="Checking SilverCare session..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function PermissionRoute({ permission, children }) {
  const { hasPermission, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner text="Validating role permissions..." />;
  }

  if (permission && !hasPermission(permission)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading SilverCare portal..." />;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Login Route */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />

        {/* Protected App Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          {/* Executive Overview is accessible to all authenticated roles */}
          <Route index element={<ExecutiveDashboardPage />} />

          {/* AI Knowledge & Chat */}
          <Route
            path="knowledge-search"
            element={
              <PermissionRoute permission="ai.use">
                <KnowledgeSearchPage />
              </PermissionRoute>
            }
          />
          <Route
            path="ai-qa"
            element={
              <PermissionRoute permission="ai.use">
                <SourceCitedQAPage />
              </PermissionRoute>
            }
          />

          {/* Scenarios & Sensitivity Analysis */}
          <Route
            path="scenario-builder"
            element={
              <PermissionRoute permission="scenarios.view">
                <ScenarioBuilderPage />
              </PermissionRoute>
            }
          />
          <Route
            path="sensitivity-analysis"
            element={
              <PermissionRoute permission="scenarios.view">
                <SensitivityAnalysisPage />
              </PermissionRoute>
            }
          />

          {/* Decisions */}
          <Route
            path="decisions"
            element={
              <PermissionRoute permission="decisions.view">
                <BriefingsDecisionsPage />
              </PermissionRoute>
            }
          />

          {/* Model Drift & Outcome Review */}
          <Route
            path="outcome-review"
            element={
              <PermissionRoute permission="ai.review">
                <OutcomeReviewPage />
              </PermissionRoute>
            }
          />

          {/* Operational Reports */}
          <Route
            path="reports"
            element={
              <PermissionRoute permission="reports.view">
                <ReportsAnalyticsPage />
              </PermissionRoute>
            }
          />

          {/* Notifications */}
          <Route path="notifications" element={<NotificationsPage />} />

          {/* Administration - Users & Roles requires users.manage (Executive only) */}
          <Route
            path="users"
            element={
              <PermissionRoute permission="users.manage">
                <UserRoleManagementPage />
              </PermissionRoute>
            }
          />

          {/* Audit Logs & Settings */}
          <Route
            path="settings"
            element={
              <PermissionRoute permission="auditLogs.view">
                <AuditSettingsPage />
              </PermissionRoute>
            }
          />
        </Route>

        {/* Catch-all fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
