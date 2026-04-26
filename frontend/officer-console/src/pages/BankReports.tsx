import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getCitizen, getCitizenFlags, submitBankFlag,
  formatCrore, formatDate,
} from '@bsc/shared';
import {
  Card, DetailRow, PageSpinner, ErrorBanner, EmptyState,
  CitizenTypeBadge, ScoreBadge, SeverityBadge, StatusBadge,
} from '@bsc/shared';
import { Search, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';

export default function BankReports() {
  const queryClient = useQueryClient();
  const [citizenId,  setCitizenId]  = useState('');
  const [activeHash, setActiveHash] = useState('');
  const [amount,     setAmount]     = useState('');
  const [accountRef, setAccountRef] = useState('');
  const [desc,       setDesc]       = useState('');
  const [msg,        setMsg]        = useState('');
  const [showForm,   setShowForm]   = useState(false);

  const citizenQ = useQuery({
    queryKey: ['citizen', activeHash],
    queryFn:  () => getCitizen(activeHash),
    enabled:  !!activeHash,
  });

  const flagsQ = useQuery({
    queryKey: ['flags', activeHash],
    queryFn:  () => getCitizenFlags(activeHash),
    enabled:  !!activeHash,
  });

  const flagMutation = useMutation({
    mutationFn: () => submitBankFlag(activeHash, {
      discrepancyAmount: Math.round(parseFloat(amount) * 100),
      description: desc,
      accountRef,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flags', activeHash] });
      setAmount(''); setAccountRef(''); setDesc('');
      setShowForm(false);
      setMsg('Discrepancy flag recorded on blockchain.');
      setTimeout(() => setMsg(''), 4000);
    },
  });

  const c = citizenQ.data;
  const bankFlags = flagsQ.data?.filter((f) => f.ruleTriggered === 'BANK_DISCREPANCY') ?? [];
  const canSubmit = amount && accountRef.trim() && desc.trim().length >= 10;

  return (
    <div className="p-8 max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold text-white">Bank Reports</h1>
      <p className="text-sm text-slate-400 -mt-3">
        Report financial discrepancies and query ZKP asset claims for a citizen.
      </p>

      {/* Citizen search */}
      <div className="flex gap-3">
        <input
          type="text" value={citizenId}
          onChange={(e) => setCitizenId(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') setActiveHash(citizenId.trim()); }}
          placeholder="Enter 64-character citizen hash"
          className="flex-1 rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 font-mono text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50"
          spellCheck={false}
        />
        <button
          onClick={() => setActiveHash(citizenId.trim())}
          className="flex items-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-400 px-4 py-2.5 text-sm font-semibold text-[#03070f]"
        >
          <Search className="h-4 w-4" /> Search
        </button>
      </div>

      {!activeHash && <EmptyState title="No citizen selected" description="Enter a citizen hash to view claims and report discrepancies." />}
      {activeHash && citizenQ.isLoading && <PageSpinner />}
      {activeHash && citizenQ.isError   && <ErrorBanner message="Citizen not found or access denied." onRetry={citizenQ.refetch} />}

      {c && (
        <>
          {/* Citizen summary */}
          <Card>
            <div className="flex items-start justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-lg font-bold text-white">{c.name}</h2>
                  <CitizenTypeBadge type={c.citizenType} />
                  <ScoreBadge score={c.anomalyScore} />
                </div>
                <p className="text-sm text-slate-400">{c.aadhaarState}</p>
              </div>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-right shrink-0">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest">Declared Assets</p>
                  <p className="font-bold text-white">{formatCrore(c.totalDeclaredAssets)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest">5-Yr Income</p>
                  <p className="font-bold text-white">{formatCrore(c.totalIncome5Yr)}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Report discrepancy */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">Report Financial Discrepancy</h3>
              <button onClick={() => setShowForm((v) => !v)} className="text-xs text-amber-400 hover:text-amber-300">
                {showForm ? 'Cancel' : 'New Report'}
              </button>
            </div>

            {showForm && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1 uppercase tracking-widest">Discrepancy Amount (₹)</label>
                    <input
                      type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                      placeholder="e.g. 500000"
                      className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50"
                    />
                    <p className="text-xs text-slate-500 mt-0.5">Enter in Rupees — stored in paisa</p>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1 uppercase tracking-widest">Account / Loan Reference</label>
                    <input
                      type="text" value={accountRef} onChange={(e) => setAccountRef(e.target.value)}
                      placeholder="e.g. SBI/CC/2024/001234"
                      className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1 uppercase tracking-widest">Description</label>
                  <textarea
                    value={desc} onChange={(e) => setDesc(e.target.value)}
                    placeholder="Describe the discrepancy (min 10 chars)…"
                    rows={3}
                    className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50 resize-none"
                  />
                </div>
                <button
                  onClick={() => flagMutation.mutate()}
                  disabled={!canSubmit || flagMutation.isPending}
                  className="flex items-center gap-2 rounded-lg bg-orange-600/80 hover:bg-orange-600 disabled:opacity-40 px-4 py-2 text-sm font-semibold text-white"
                >
                  {flagMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <AlertTriangle className="h-3.5 w-3.5" />}
                  Submit Flag
                </button>
                {flagMutation.isError && (
                  <p className="text-sm text-red-400">{(flagMutation.error as Error)?.message ?? 'Submission failed.'}</p>
                )}
              </div>
            )}

            {msg && (
              <div className={`${showForm ? 'mt-4' : ''} flex items-center gap-2 rounded-lg border border-green-500/25 bg-green-500/10 px-4 py-2.5 text-sm text-green-400`}>
                <CheckCircle2 className="h-4 w-4" /> {msg}
              </div>
            )}
          </Card>

          {/* Bank flags history */}
          <Card>
            <h3 className="text-sm font-semibold text-white mb-4">
              Bank Discrepancy History
              {bankFlags.length > 0 && (
                <span className="ml-2 inline-flex items-center rounded-full bg-orange-500/15 text-orange-400 text-xs px-1.5 py-0.5">
                  {bankFlags.length}
                </span>
              )}
            </h3>
            {flagsQ.isLoading ? <PageSpinner /> :
             flagsQ.isError   ? <ErrorBanner message="Could not load flags." /> :
             !bankFlags.length ? <EmptyState title="No bank discrepancy reports on record" /> :
             <div className="space-y-3">
               {bankFlags.map((flag) => (
                 <div key={flag.flagId} className="rounded-lg bg-white/5 px-4 py-3">
                   <div className="flex items-start justify-between gap-4 mb-2">
                     <p className="text-sm text-white">{flag.description}</p>
                     <div className="flex gap-2 shrink-0">
                       <SeverityBadge severity={flag.severity} />
                       <StatusBadge   status={flag.status} />
                     </div>
                   </div>
                   <div className="flex items-center gap-6 text-xs text-slate-400">
                     <span>Gap: <span className="text-orange-400 font-medium">{formatCrore(flag.gapAmount)}</span></span>
                     <span>Raised: {formatDate(flag.raisedAt)}</span>
                   </div>
                 </div>
               ))}
             </div>
            }
          </Card>

          {/* Wealth profile for reference */}
          <Card>
            <h3 className="text-sm font-semibold text-white mb-4">Wealth Profile</h3>
            <div className="grid md:grid-cols-2 gap-1">
              <DetailRow label="Declared Assets"   value={formatCrore(c.totalDeclaredAssets)} />
              <DetailRow label="5-Year Income"      value={formatCrore(c.totalIncome5Yr)} />
              <DetailRow label="Prev Year Assets"   value={formatCrore(c.prevYearAssets)} />
              <DetailRow label="Assets 5 Years Ago" value={formatCrore(c.assets5YrAgo)} />
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
