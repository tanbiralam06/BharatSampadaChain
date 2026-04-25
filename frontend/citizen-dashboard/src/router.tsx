import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout }         from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import Login     from './pages/Login';
import Overview  from './pages/Overview';
import Properties  from './pages/Properties';
import Financial   from './pages/Financial';
import AccessLog   from './pages/AccessLog';
import Flags       from './pages/Flags';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Overview />} />
        <Route path="properties"  element={<Properties />} />
        <Route path="financial"   element={<Financial />} />
        <Route path="access-log"  element={<AccessLog />} />
        <Route path="flags"       element={<Flags />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
