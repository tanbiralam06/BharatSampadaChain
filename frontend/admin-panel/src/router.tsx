import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout }            from './components/Layout';
import { ProtectedRoute }    from './components/ProtectedRoute';
import Login                 from './pages/Login';
import SystemHealth          from './pages/SystemHealth';
import AgencyManagement      from './pages/AgencyManagement';
import OfficerManagement     from './pages/OfficerManagement';
import AuditOverview         from './pages/AuditOverview';
import Security              from './pages/Security';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index             element={<SystemHealth />} />
        <Route path="agencies"   element={<AgencyManagement />} />
        <Route path="officers"   element={<OfficerManagement />} />
        <Route path="audit"      element={<AuditOverview />} />
        <Route path="security"   element={<Security />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
