import { NavLink, Outlet } from 'react-router-dom';
import { HeartPulse, Building, ClipboardList, LogOut, Settings2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { to: '/',         icon: HeartPulse,   label: 'System Health'      },
  { to: '/agencies', icon: Building,     label: 'Agency Management'  },
  { to: '/audit',    icon: ClipboardList, label: 'Audit Overview'    },
];

export function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="flex h-screen overflow-hidden bg-[#03070f]">
      <aside className="flex w-60 shrink-0 flex-col bg-[#0a1628] border-r border-white/5">
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-white/5">
          <Settings2 className="h-6 w-6 text-amber-500" />
          <div>
            <p className="text-sm font-bold text-white leading-none">BSC</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Admin Panel</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  isActive ? 'bg-amber-500/10 text-amber-400 font-medium' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <Icon className="h-4 w-4 shrink-0" />{label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/5 px-4 py-4">
          {user && <p className="text-sm font-medium text-white truncate mb-2">{user.name}</p>}
          <button onClick={logout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-white/5 hover:text-white transition-colors">
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto"><Outlet /></main>
    </div>
  );
}
