import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, ShieldOff, ShieldAlert, Copy, Check, Loader2 } from 'lucide-react';
import { totpSetup, totpVerifySetup, totpDisable, totpStatus, Card, ErrorBanner, PageSpinner } from '@bsc/shared';

type SetupPhase = 'idle' | 'scanning' | 'confirming';

export default function Security() {
  const qc = useQueryClient();

  const { data: status, isLoading, isError, refetch } = useQuery({
    queryKey: ['totp-status'],
    queryFn:  totpStatus,
  });

  // ── enroll flow ──────────────────────────────────────────────────────────────
  const [setupPhase,  setSetupPhase]  = useState<SetupPhase>('idle');
  const [setupData,   setSetupData]   = useState<{ uri: string; qrCode: string } | null>(null);
  const [setupCode,   setSetupCode]   = useState('');
  const [setupError,  setSetupError]  = useState('');
  const [uriCopied,   setUriCopied]   = useState(false);

  const setupMut = useMutation({
    mutationFn: totpSetup,
    onSuccess: (data) => {
      setSetupData(data);
      setSetupPhase('scanning');
      setSetupCode('');
      setSetupError('');
    },
  });

  const verifyMut = useMutation({
    mutationFn: () => totpVerifySetup(setupCode.replace(/\s/g, '')),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['totp-status'] });
      setSetupPhase('idle');
      setSetupData(null);
      setSetupCode('');
      setSetupError('');
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      setSetupError(err.response?.data?.error ?? 'Code incorrect. Try the next code from your app.');
      setSetupCode('');
    },
  });

  const copyUri = () => {
    if (!setupData) return;
    navigator.clipboard.writeText(setupData.uri);
    setUriCopied(true);
    setTimeout(() => setUriCopied(false), 2000);
  };

  // ── disable flow ─────────────────────────────────────────────────────────────
  const [showDisable, setShowDisable] = useState(false);
  const [disableCode, setDisableCode] = useState('');
  const [disableError, setDisableError] = useState('');

  const disableMut = useMutation({
    mutationFn: () => totpDisable(disableCode.replace(/\s/g, '')),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['totp-status'] });
      setShowDisable(false);
      setDisableCode('');
      setDisableError('');
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      setDisableError(err.response?.data?.error ?? 'Code incorrect.');
      setDisableCode('');
    },
  });

  if (isLoading) return <PageSpinner />;
  if (isError)   return <div className="p-8"><ErrorBanner message="Could not load 2FA status." onRetry={refetch} /></div>;

  const enabled = status?.enabled ?? false;

  return (
    <div className="p-8 max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Security</h1>
        <p className="text-sm text-slate-400 mt-1">Two-factor authentication for the ADMIN account</p>
      </div>

      {/* Status card */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {enabled
              ? <ShieldCheck className="h-8 w-8 text-green-400" />
              : <ShieldAlert  className="h-8 w-8 text-amber-400" />
            }
            <div>
              <p className="text-sm font-semibold text-white">
                {enabled ? '2FA is enabled' : '2FA is not enabled'}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {enabled
                  ? 'Every login requires a code from your authenticator app.'
                  : 'Enable to protect this account with a time-based one-time password.'}
              </p>
            </div>
          </div>
          {enabled
            ? (
              <button
                onClick={() => { setShowDisable(true); setDisableCode(''); setDisableError(''); }}
                className="flex items-center gap-2 rounded-lg border border-red-500/30 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <ShieldOff className="h-4 w-4" /> Disable 2FA
              </button>
            ) : (
              <button
                onClick={() => setupMut.mutate()}
                disabled={setupMut.isPending || setupPhase !== 'idle'}
                className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-black hover:bg-amber-400 disabled:opacity-50 transition-colors"
              >
                {setupMut.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Set up 2FA
              </button>
            )
          }
        </div>
      </Card>

      {/* Setup flow — scanning step */}
      {setupPhase === 'scanning' && setupData && (
        <Card>
          <h2 className="text-sm font-semibold text-white mb-4">Step 1 — Scan the QR code</h2>
          <p className="text-xs text-slate-400 mb-5">
            Open Google Authenticator, Authy, or any TOTP app and scan the QR code below.
            If you can't scan, use the manual key.
          </p>

          {/* QR code */}
          <div className="flex justify-center mb-5">
            <div className="rounded-xl border border-white/10 p-3 bg-white inline-block">
              <img src={setupData.qrCode} alt="TOTP QR Code" className="w-48 h-48 block" />
            </div>
          </div>

          {/* Manual URI */}
          <div className="mb-6">
            <p className="text-xs font-medium text-slate-400 mb-2 uppercase tracking-widest">Manual setup key</p>
            <div className="flex items-start gap-2">
              <code className="flex-1 break-all rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-[11px] text-slate-300 font-mono leading-relaxed">
                {setupData.uri}
              </code>
              <button
                onClick={copyUri}
                className="shrink-0 rounded-lg border border-white/10 p-2 text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                title="Copy URI"
              >
                {uriCopied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            onClick={() => setSetupPhase('confirming')}
            className="w-full rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-medium text-black hover:bg-amber-400 transition-colors"
          >
            I've scanned it — continue
          </button>
        </Card>
      )}

      {/* Setup flow — confirm step */}
      {setupPhase === 'confirming' && (
        <Card>
          <h2 className="text-sm font-semibold text-white mb-2">Step 2 — Verify the code</h2>
          <p className="text-xs text-slate-400 mb-5">
            Enter the 6-digit code your authenticator app is currently showing to confirm the setup.
          </p>

          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={setupCode}
            onChange={(e) => setSetupCode(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder="000000"
            autoFocus
            className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-center text-2xl font-mono tracking-[0.4em] text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50 mb-4"
          />

          {setupError && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-4">{setupError}</p>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setSetupPhase('scanning')}
              className="flex-1 rounded-lg border border-white/10 px-4 py-2.5 text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              Back
            </button>
            <button
              onClick={() => verifyMut.mutate()}
              disabled={setupCode.length !== 6 || verifyMut.isPending}
              className="flex-1 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-medium text-black hover:bg-amber-400 disabled:opacity-50 transition-colors"
            >
              {verifyMut.isPending ? 'Verifying…' : 'Enable 2FA'}
            </button>
          </div>
        </Card>
      )}

      {/* Disable modal */}
      {showDisable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl bg-[#0a1628] border border-white/10 p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-1">Disable 2FA</h2>
            <p className="text-xs text-slate-400 mb-5">
              Enter a live code from your authenticator app to confirm.
            </p>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={disableCode}
              onChange={(e) => setDisableCode(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="000000"
              autoFocus
              className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-center text-2xl font-mono tracking-[0.4em] text-white placeholder-slate-600 focus:outline-none focus:border-red-500/50 mb-3"
            />
            {disableError && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-3">{disableError}</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => { setShowDisable(false); setDisableCode(''); setDisableError(''); }}
                className="flex-1 rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => disableMut.mutate()}
                disabled={disableCode.length !== 6 || disableMut.isPending}
                className="flex-1 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-400 disabled:opacity-50 transition-colors"
              >
                {disableMut.isPending ? 'Disabling…' : 'Disable 2FA'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
