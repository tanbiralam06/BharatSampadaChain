import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout }         from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import Login             from './pages/Login';
import ActiveFlags       from './pages/ActiveFlags';
import CaseInvestigation from './pages/CaseInvestigation';
import FamilyAnalysis    from './pages/FamilyAnalysis';
import MyTeam            from './pages/MyTeam';

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
        <Route index                        element={<ActiveFlags />} />
        <Route path="investigate"           element={<CaseInvestigation />} />
        <Route path="investigate/:hash"     element={<CaseInvestigation />} />
        <Route path="family"                element={<FamilyAnalysis />} />
        <Route path="team"                  element={<MyTeam />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
