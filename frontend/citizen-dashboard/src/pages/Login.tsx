import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const SEED_CREDENTIALS = [
  { name: 'Arjun Mehta', hash: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2' },
  { name: 'Sunita Rao',  hash: 'b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6b2c3d4' },
  { name: 'Priya Krishnan', hash: 'd4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6d4e5f6a1b2' },
];

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    navigate('/', { replace: true });
    return null;
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      setError('Please enter your Citizen Hash and password.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(identifier.trim(), password);
      navigate('/', { replace: true });
    } catch {
      setError('Invalid credentials. Check your Citizen Hash and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#03070f] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-4">
            <Shield className="h-7 w-7 text-amber-500" />
          </div>
          <h1 className="text-2xl font-bold text-white">Citizen Portal</h1>
          <p className="mt-1 text-sm text-slate-400">Bharat Sampada Chain — Secure Access</p>
        </div>

        {/* Form card */}
        <div className="bg-[#0a1628] border border-white/5 rounded-2xl p-8">
          <form onSubmit={submit} className="space-y-5">
            {/* Identifier */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-widest">
                Citizen Hash
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="64-character hex hash"
                className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3
                  font-mono text-sm text-white placeholder-slate-600
                  focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/25
                  transition-colors"
                autoComplete="username"
                spellCheck={false}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-widest">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 pr-11
                    text-sm text-white placeholder-slate-600
                    focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/25
                    transition-colors"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <p className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2.5 text-sm text-red-400">
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-lg
                bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed
                px-4 py-3 text-sm font-semibold text-[#03070f] transition-colors"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Dev credentials hint */}
        <div className="mt-6 rounded-xl border border-white/5 bg-white/[0.02] p-4">
          <p className="text-xs text-slate-500 mb-3 font-medium uppercase tracking-widest">
            Dev seed accounts — password: <span className="font-mono text-slate-400">password</span>
          </p>
          <div className="space-y-2">
            {SEED_CREDENTIALS.map((c) => (
              <button
                key={c.hash}
                onClick={() => setIdentifier(c.hash)}
                className="w-full text-left rounded-lg px-3 py-2 hover:bg-white/5 transition-colors"
              >
                <p className="text-xs font-medium text-slate-300">{c.name}</p>
                <p className="font-mono text-[10px] text-slate-600 mt-0.5 truncate">{c.hash}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
