import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth, ROLES } from '../context/AuthContext'
import {
  LayoutDashboard, Building2, Wallet, FileText, AlertTriangle,
  Users, Search, BarChart3, Shield, Activity, LogOut, Menu, X,
  ChevronRight, Eye, Settings, Bell, HelpCircle, Globe
} from 'lucide-react'

const NAV = {
  [ROLES.PUBLIC]: [
    { label: 'Browse Officials', icon: Users,          path: '/public/officials' },
    { label: 'Compare Officials',icon: BarChart3,       path: '/public/compare' },
    { label: 'National Stats',   icon: Globe,           path: '/public/stats' },
  ],
  [ROLES.CITIZEN]: [
    { label: 'Wealth Overview',  icon: LayoutDashboard, path: '/citizen/overview' },
    { label: 'My Properties',    icon: Building2,        path: '/citizen/properties' },
    { label: 'Financial Assets', icon: Wallet,           path: '/citizen/financial' },
    { label: 'Data Access Log',  icon: Eye,              path: '/citizen/access-log' },
    { label: 'My Flags',         icon: AlertTriangle,    path: '/citizen/flags' },
  ],
  [ROLES.OFFICER]: [
    { label: 'Active Flags',     icon: AlertTriangle,   path: '/officer/flags' },
    { label: 'Case Investigation',icon: Search,          path: '/officer/case/BSC-POL-001' },
    { label: 'Family Analysis',  icon: Users,            path: '/officer/family/BSC-POL-002' },
  ],
  [ROLES.ADMIN]: [
    { label: 'System Health',    icon: Activity,        path: '/admin/health' },
    { label: 'Agency Management',icon: Shield,           path: '/admin/agencies' },
    { label: 'Audit Overview',   icon: FileText,         path: '/admin/audit' },
  ],
}

const ROLE_META = {
  [ROLES.PUBLIC]:  { label: 'Public Observer', color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/20' },
  [ROLES.CITIZEN]: { label: 'Citizen Portal',  color: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/20' },
  [ROLES.OFFICER]: { label: 'IT Officer',      color: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/20' },
  [ROLES.ADMIN]:   { label: 'Admin Panel',     color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
}

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const nav = NAV[user?.role] || []
  const meta = ROLE_META[user?.role] || {}

  const handleLogout = () => { logout(); navigate('/') }

  return (
    <div className="flex h-screen overflow-hidden bg-[#03070f]">

      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-60' : 'w-16'} flex-shrink-0 flex flex-col bg-[#060d1a] border-r border-white/5 transition-all duration-300 overflow-hidden`}>

        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-white/5 min-h-[64px]">
          <div className="w-8 h-8 flex-shrink-0 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <span className="text-black font-bold text-xs">BSC</span>
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <div className="text-white font-bold text-sm leading-tight whitespace-nowrap">Bharat Sampada</div>
              <div className="text-gray-500 text-xs whitespace-nowrap">Chain</div>
            </div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="ml-auto text-gray-600 hover:text-gray-400 flex-shrink-0">
            {sidebarOpen ? <X size={14} /> : <Menu size={14} />}
          </button>
        </div>

        {/* Role badge */}
        {sidebarOpen && (
          <div className={`mx-3 mt-3 px-3 py-2 rounded-lg ${meta.bg} border ${meta.border}`}>
            <div className={`text-xs font-semibold ${meta.color}`}>{meta.label}</div>
            <div className="text-gray-500 text-xs mt-0.5 truncate">{user?.name}</div>
          </div>
        )}

        {/* Nav items */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {nav.map(item => {
            const active = location.pathname === item.path || location.pathname.startsWith(item.path.replace(/\/[^/]+$/, ''))
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full ${active ? 'sidebar-item-active' : 'sidebar-item'} ${!sidebarOpen ? 'justify-center px-2' : ''}`}
                title={!sidebarOpen ? item.label : ''}
              >
                <item.icon size={16} className="flex-shrink-0" />
                {sidebarOpen && <span className="truncate">{item.label}</span>}
                {sidebarOpen && active && <ChevronRight size={12} className="ml-auto opacity-50" />}
              </button>
            )
          })}
        </nav>

        {/* Bottom */}
        <div className="px-2 py-3 border-t border-white/5 space-y-0.5">
          <button onClick={handleLogout} className={`w-full sidebar-item text-red-500/70 hover:text-red-400 hover:bg-red-500/5 ${!sidebarOpen ? 'justify-center px-2' : ''}`}>
            <LogOut size={16} className="flex-shrink-0" />
            {sidebarOpen && <span>Exit / Switch Role</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-16 flex-shrink-0 flex items-center justify-between px-6 border-b border-white/5 bg-[#060d1a]">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="text-gray-600">BSC</span>
            <ChevronRight size={12} />
            <span className="text-gray-400">{meta.label}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-full">
              <span className="live-dot" />
              <span>Live</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 text-xs font-bold">
              {user?.avatar}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="page-enter">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
