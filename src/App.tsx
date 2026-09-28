import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { PrivateRoute } from './routes/PrivateRoute';
import { RoleRoute } from './routes/RoleRoute';

import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';
import ActivateAccountPage from './pages/ActivateAccountPage';
import Dashboard from './pages/Dashboard';
import ProfilePage from './pages/ProfilePage';
import NotificationsPage from './pages/NotificationsPage';
import OrganizationsPage from './pages/admin/OrganizationsPage';
import UsersPage from './pages/admin/UsersPage';
import PlatformsPage from './pages/admin/PlatformsPage';
import AccessGrantsPage from './pages/admin/AccessGrantsPage';
import DemosPage from './pages/admin/DemosPage';
import DocumentsPage from './pages/admin/DocumentsPage';
import AuditLogPage from './pages/admin/AuditLogPage';
import AiAssistantPage from './pages/AiAssistantPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/callback" element={<AuthCallback />} />
          <Route path="/activation" element={<ActivateAccountPage />} />

          <Route element={<PrivateRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profil" element={<ProfilePage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/ai-assistant" element={<AiAssistantPage />} />

            <Route element={<RoleRoute roles={['super_admin']} />}>
              <Route path="/organizations" element={<OrganizationsPage />} />
            </Route>

            <Route element={<RoleRoute roles={['super_admin', 'org_admin']} />}>
              <Route path="/users" element={<UsersPage />} />
              <Route path="/access-grants" element={<AccessGrantsPage />} />
              <Route path="/demos" element={<DemosPage />} />
            </Route>

            <Route element={<RoleRoute roles={['super_admin', 'internal_user', 'support']} />}>
              <Route path="/platforms" element={<PlatformsPage />} />
              <Route path="/documents" element={<DocumentsPage />} />
              <Route path="/audit-logs" element={<AuditLogPage />} />
            </Route>
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
