import { Link, NavLink, Outlet } from 'react-router-dom';
import { Shield, Search } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function Layout() {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) navigate(`/?search=${encodeURIComponent(search.trim())}`);
  };

  return (
    <div className="min-h-screen bg-[#03070f]">
      {/* Top navigation bar */}
      <header className="sticky top-0 z-10 border-b border-white/5 bg-[#03070f]/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <Shield className="h-5 w-5 text-amber-500" />
            <span className="text-sm font-bold text-white">Bharat Sampada Chain</span>
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search officials by name…"
                className="w-full rounded-lg bg-white/5 border border-white/5 pl-9 pr-4 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/30"
              />
            </div>
          </form>

          {/* Nav links */}
          <nav className="flex items-center gap-1">
            {[{ to: '/', label: 'Browse' }, { to: '/compare', label: 'Compare' }].map(({ to, label }) => (
              <NavLink key={to} to={to} end
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    isActive ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-white/5 mt-16 py-8">
        <p className="text-center text-xs text-slate-600">
          Bharat Sampada Chain — Built by Citizens, For Citizens. Jai Hind. · Data sourced from public blockchain ledger.
        </p>
      </footer>
    </div>
  );
}
