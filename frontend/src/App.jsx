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
    return <LoadingSpinner fullScreen label="Checking SilverCare session..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner fullScreen label="Loading SilverCare portal..." />;
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
          <Route index element={<ExecutiveDashboardPage />} />
          <Route path="knowledge-search" element={<KnowledgeSearchPage />} />
          <Route path="scenario-builder" element={<ScenarioBuilderPage />} />
          <Route path="decisions" element={<BriefingsDecisionsPage />} />
          <Route path="ai-qa" element={<SourceCitedQAPage />} />
          <Route path="sensitivity-analysis" element={<SensitivityAnalysisPage />} />
          <Route path="outcome-review" element={<OutcomeReviewPage />} />
          <Route path="reports" element={<ReportsAnalyticsPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="users" element={<UserRoleManagementPage />} />
          <Route path="settings" element={<AuditSettingsPage />} />
        </Route>

        {/* Catch-all fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
