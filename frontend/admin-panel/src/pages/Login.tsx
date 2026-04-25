import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ADMIN_HASH = 'admin001hashabcdef0123456789abcdef0123456789abcdef0123456789abc';

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [password,   setPassword]   = useState('');
  const [showPass,   setShowPass]   = useState(false);
  const [error,      setError]      = useState('');
  const [loading,    setLoading]    = useState(false);

  if (isAuthenticated) { navigate('/', { replace: true }); return null; }

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) { setError('All fields required.'); return; }
    setError(''); setLoading(true);
    try {
      await login(identifier.trim(), password);
      navigate('/', { replace: true });
    } catch {
      setError('Invalid credentials. ADMIN role required.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#03070f] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-4">
            <Settings2 className="h-7 w-7 text-amber-500" />
          </div>
          <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
          <p className="mt-1 text-sm text-slate-400">BSC Authority — Restricted Access</p>
        </div>

        <div className="bg-[#0a1628] border border-white/5 rounded-2xl p-8">
          <form onSubmit={submit} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-widest">Admin Hash</label>
              <input type="text" value={identifier} onChange={(e) => setIdentifier(e.target.value)}
                placeholder="64-character hex hash"
                className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 font-mono text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/25 transition-colors"
                spellCheck={false}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-widest">Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 pr-11 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/25 transition-colors"
                />
                <button type="button" onClick={() => setShowPass((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
          <p className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-widest">
            Dev account — password: <span className="font-mono text-slate-400">password</span>
          </p>
          <button onClick={() => setIdentifier(ADMIN_HASH)}
            className="w-full text-left rounded-lg px-3 py-2 hover:bg-white/5 transition-colors">
            <p className="text-xs font-medium text-slate-300">BSC System Admin</p>
            <p className="font-mono text-[10px] text-slate-600 mt-0.5 truncate">{ADMIN_HASH}</p>
          </button>
        </div>
      </div>
    </div>
  );
}
