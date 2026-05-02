import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, Loader2, CheckCircle2, XCircle, Info } from 'lucide-react';
import {
  Card, PageSpinner, ErrorBanner, EmptyState,
  Badge, formatDate, proveAssetThreshold, getVerifiedClaims,
  type ZKPProveResult, type ZKPProof,
} from '@bsc/shared';
import { useAuth } from '../context/AuthContext';

const PRESET_THRESHOLDS = [
  { label: '₹10 Lakh',  paisa: 10_00_000 * 100 },
  { label: '₹50 Lakh',  paisa: 50_00_000 * 100 },
  { label: '₹1 Crore',  paisa: 1_00_00_000 * 100 },
  { label: '₹5 Crore',  paisa: 5_00_00_000 * 100 },
];

export default function ZKP() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [thresholdPaisa, setThresholdPaisa] = useState<number>(PRESET_THRESHOLDS[0].paisa);
  const [customCrore, setCustomCrore] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [lastResult, setLastResult] = useState<ZKPProveResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const claimsQ = useQuery<ZKPProof[]>({
    queryKey: ['zkp-claims', user?.sub],
    queryFn:  () => getVerifiedClaims(user!.sub),
    enabled:  !!user?.sub,
    staleTime: 30_000,
  });

  const proveMutation = useMutation({
    mutationFn: () => {
      const threshold = useCustom
        ? Math.round(parseFloat(customCrore) * 1_00_00_000 * 100) // crore → paisa
        : thresholdPaisa;
      return proveAssetThreshold(user!.sub, threshold);
    },
    onSuccess: (data) => {
      setLastResult(data);
      setErrorMsg(null);
      qc.invalidateQueries({ queryKey: ['zkp-claims', user?.sub] });
    },
    onError: (err: { response?: { data?: { error?: string }; status?: number } }) => {
      const msg = err?.response?.data?.error ?? 'Proof generation failed.';
      const status = err?.response?.status;
      if (status === 422) {
        setErrorMsg('Your declared assets do not meet this threshold — proof cannot be generated.');
      } else if (status === 503) {
        setErrorMsg('ZKP keys are not set up on the server. Run: docker compose run --rm zkp-setup');
      } else {
        setErrorMsg(msg);
      }
      setLastResult(null);
    },
  });

  const activeClaims = (claimsQ.data ?? []).filter(
    (c) => new Date(c.expiresAt) > new Date()
  );

  return (
    <div className="p-8 max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Zero-Knowledge Proofs</h1>
        <p className="text-sm text-slate-400 mt-1">
          Prove your total assets exceed a threshold — without revealing the actual amount.
        </p>
      </div>

      {/* Explainer */}
      <Card>
        <div className="flex gap-3">
          <Info className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-sm text-slate-400 leading-relaxed">
            A ZKP (zero-knowledge proof) lets you cryptographically prove a statement is true without
            disclosing the underlying data. Here, you prove <em className="text-slate-300">your assets are at least X</em> —
            the exact figure stays private. The proof is recorded on the Fabric ledger and expires in 30 days.
          </p>
        </div>
      </Card>

      {/* Generate proof */}
      <Card>
        <h2 className="text-sm font-semibold text-white mb-4">Generate New Proof</h2>

        <div className="space-y-4">
          {/* Preset buttons */}
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Select Threshold</p>
            <div className="flex flex-wrap gap-2">
              {PRESET_THRESHOLDS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => { setThresholdPaisa(p.paisa); setUseCustom(false); }}
                  className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                    !useCustom && thresholdPaisa === p.paisa
                      ? 'border-amber-500/50 bg-amber-500/10 text-amber-400'
                      : 'border-white/10 text-slate-400 hover:border-white/20 hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              ))}
              <button
                onClick={() => setUseCustom(true)}
                className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                  useCustom
                    ? 'border-amber-500/50 bg-amber-500/10 text-amber-400'
                    : 'border-white/10 text-slate-400 hover:border-white/20 hover:text-white'
                }`}
              >
                Custom
              </button>
            </div>
          </div>

          {/* Custom amount */}
          {useCustom && (
            <div>
              <label className="text-[10px] text-slate-500 uppercase tracking-widest mb-1.5 block">
                Amount (in Crore ₹)
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="e.g. 2.5"
                value={customCrore}
                onChange={(e) => setCustomCrore(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-600 outline-none focus:border-amber-500/50"
              />
            </div>
          )}

          {/* Error / result feedback */}
          {errorMsg && (
            <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3">
              <XCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-xs text-red-300">{errorMsg}</p>
            </div>
          )}

          {lastResult && (
            <div className="flex items-start gap-2 rounded-lg border border-green-500/20 bg-green-500/10 p-3">
              <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />
              <div className="text-xs text-green-300 space-y-0.5">
                <p className="font-semibold">Proof generated and recorded on-chain</p>
                <p className="text-green-400/70">Proof ID: <span className="font-mono">{lastResult.proofId}</span></p>
                <p className="text-green-400/70">Expires: {formatDate(lastResult.expiresAt)}</p>
              </div>
            </div>
          )}

          <button
            onClick={() => proveMutation.mutate()}
            disabled={proveMutation.isPending || (useCustom && !customCrore)}
            className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {proveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Generate Proof
          </button>
        </div>
      </Card>

      {/* Existing claims */}
      <div>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
          Active Verified Claims
        </h2>

        {claimsQ.isLoading && <PageSpinner />}
        {claimsQ.isError && <ErrorBanner message="Could not load claims." onRetry={claimsQ.refetch} />}

        {!claimsQ.isLoading && activeClaims.length === 0 && (
          <EmptyState
            title="No active claims"
            description="Generate a proof above to create a verifiable on-chain claim."
            icon={<ShieldCheck className="h-12 w-12" />}
          />
        )}

        {activeClaims.length > 0 && (
          <div className="space-y-3">
            {activeClaims.map((claim) => (
              <Card key={claim.proofId}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-white">
                        {claim.queryType.replace(/_/g, ' ')}
                      </p>
                      <Badge variant={claim.isVerified ? 'green' : 'red'}>
                        {claim.isVerified ? 'Verified' : 'Unverified'}
                      </Badge>
                    </div>
                    <p className="font-mono text-[10px] text-slate-500">{claim.proofId}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-slate-400">Expires</p>
                    <p className="text-sm text-white">{formatDate(claim.expiresAt)}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
