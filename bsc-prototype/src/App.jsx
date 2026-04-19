import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth, ROLES } from './context/AuthContext'
import Layout from './components/Layout'

import Landing from './pages/Landing'

import BrowseOfficials   from './pages/public/BrowseOfficials'
import OfficialProfile   from './pages/public/OfficialProfile'
import CompareOfficials  from './pages/public/CompareOfficials'
import NationalStats     from './pages/public/NationalStats'

import CitizenOverview   from './pages/citizen/Overview'
import MyProperties      from './pages/citizen/Properties'
import MyFinancial       from './pages/citizen/Financial'
import AccessLog         from './pages/citizen/AccessLog'
import MyFlags           from './pages/citizen/Flags'

import ActiveFlags       from './pages/officer/ActiveFlags'
import CaseInvestigation from './pages/officer/CaseInvestigation'
import FamilyAnalysis    from './pages/officer/FamilyAnalysis'

import SystemHealth      from './pages/admin/SystemHealth'
import AgencyManagement  from './pages/admin/AgencyManagement'
import AuditOverview     from './pages/admin/AuditOverview'

function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/" replace />
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />
  return <Layout>{children}</Layout>
}

function DefaultRedirect() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/" replace />
  const defaults = {
    [ROLES.PUBLIC]:  '/public/officials',
    [ROLES.CITIZEN]: '/citizen/overview',
    [ROLES.OFFICER]: '/officer/flags',
    [ROLES.ADMIN]:   '/admin/health',
  }
  return <Navigate to={defaults[user.role] || '/'} replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/app" element={<DefaultRedirect />} />

      <Route path="/public/officials"    element={<ProtectedRoute allowedRoles={[ROLES.PUBLIC]}><BrowseOfficials /></ProtectedRoute>} />
      <Route path="/public/official/:id" element={<ProtectedRoute allowedRoles={[ROLES.PUBLIC]}><OfficialProfile /></ProtectedRoute>} />
      <Route path="/public/compare"      element={<ProtectedRoute allowedRoles={[ROLES.PUBLIC]}><CompareOfficials /></ProtectedRoute>} />
      <Route path="/public/stats"        element={<ProtectedRoute allowedRoles={[ROLES.PUBLIC]}><NationalStats /></ProtectedRoute>} />

      <Route path="/citizen/overview"    element={<ProtectedRoute allowedRoles={[ROLES.CITIZEN]}><CitizenOverview /></ProtectedRoute>} />
      <Route path="/citizen/properties"  element={<ProtectedRoute allowedRoles={[ROLES.CITIZEN]}><MyProperties /></ProtectedRoute>} />
      <Route path="/citizen/financial"   element={<ProtectedRoute allowedRoles={[ROLES.CITIZEN]}><MyFinancial /></ProtectedRoute>} />
      <Route path="/citizen/access-log"  element={<ProtectedRoute allowedRoles={[ROLES.CITIZEN]}><AccessLog /></ProtectedRoute>} />
      <Route path="/citizen/flags"       element={<ProtectedRoute allowedRoles={[ROLES.CITIZEN]}><MyFlags /></ProtectedRoute>} />

      <Route path="/officer/flags"       element={<ProtectedRoute allowedRoles={[ROLES.OFFICER]}><ActiveFlags /></ProtectedRoute>} />
      <Route path="/officer/case/:id"    element={<ProtectedRoute allowedRoles={[ROLES.OFFICER]}><CaseInvestigation /></ProtectedRoute>} />
      <Route path="/officer/family/:id"  element={<ProtectedRoute allowedRoles={[ROLES.OFFICER]}><FamilyAnalysis /></ProtectedRoute>} />

      <Route path="/admin/health"    element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]}><SystemHealth /></ProtectedRoute>} />
      <Route path="/admin/agencies"  element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]}><AgencyManagement /></ProtectedRoute>} />
      <Route path="/admin/audit"     element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]}><AuditOverview /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
