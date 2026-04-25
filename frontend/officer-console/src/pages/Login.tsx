import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Siren, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { AccessorRole } from '@bsc/shared';

const OFFICER_ROLES: { value: AccessorRole; label: string }[] = [
  { value: 'IT_DEPT', label: 'IT Department' },
  { value: 'ED',      label: 'Enforcement Directorate' },
  { value: 'CBI',     label: 'Central Bureau of Investigation' },
];

const SEED_ACCOUNTS = [
  { name: 'Rajesh Kumar (IT Dept)', loginId: 'rajesh.kumar@itdept.bsc.gov', role: 'IT_DEPT' as AccessorRole },
  { name: 'Priya Sharma (CBI)',     loginId: 'priya.sharma@cbi.gov.in',     role: 'CBI'     as AccessorRole },
];

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword]     = useState('');
  const [role, setRole]             = useState<AccessorRole>('IT_DEPT');
  const [showPassword, setShowPass] = useState(false);
  const [error, setError]           = useState('');
  const [loading, setLoading]       = useState(false);

  if (isAuthenticated) { navigate('/', { replace: true }); return null; }

  const fill = (loginId: string, r: AccessorRole) => { setIdentifier(loginId); setRole(r); };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) { setError('All fields required.'); return; }
    setError(''); setLoading(true);
    try {
      await login(identifier.trim(), password, role);
      navigate('/', { replace: true });
    } catch {
      setError('Invalid credentials or insufficient role permissions.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#03070f] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-4">
            <Siren className="h-7 w-7 text-amber-500" />
          </div>
          <h1 className="text-2xl font-bold text-white">Officer Console</h1>
          <p className="mt-1 text-sm text-slate-400">Restricted — Department Credentials Only</p>
        </div>

        <div className="bg-[#0a1628] border border-white/5 rounded-2xl p-8">
          <form onSubmit={submit} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-widest">Government Email</label>
              <input
                type="email" value={identifier} onChange={(e) => setIdentifier(e.target.value)}
                placeholder="officer@dept.gov.in"
                className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/25 transition-colors"
                autoComplete="email"
                spellCheck={false}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-widest">Department / Role</label>
              <select
                value={role} onChange={(e) => setRole(e.target.value as AccessorRole)}
                className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/25 transition-colors"
              >
                {OFFICER_ROLES.map((r) => (
                  <option key={r.value} value={r.value} className="bg-[#0a1628]">{r.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-widest">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'} value={password}
                  onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 pr-11 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/25 transition-colors"
                />
                <button type="button" onClick={() => setShowPass((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && <p className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2.5 text-sm text-red-400">{error}</p>}

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 px-4 py-3 text-sm font-semibold text-[#03070f] transition-colors">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>

        <div className="mt-6 rounded-xl border border-white/5 bg-white/[0.02] p-4">
          <p className="text-xs text-slate-500 mb-3 font-medium uppercase tracking-widest">
            Dev accounts — password: <span className="font-mono text-slate-400">password</span>
          </p>
          {SEED_ACCOUNTS.map((a) => (
            <button key={a.loginId} onClick={() => fill(a.loginId, a.role)}
              className="w-full text-left rounded-lg px-3 py-2 hover:bg-white/5 transition-colors">
              <p className="text-xs font-medium text-slate-300">{a.name}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">{a.loginId}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
