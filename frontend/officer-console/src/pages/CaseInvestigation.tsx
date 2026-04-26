import { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getCitizen, getCitizenFlags, getCitizenProperties,
  updateFlagStatus, submitManualFlag, runBenamiScan,
  formatCrore, formatDate, daysAgo,
} from '@bsc/shared';
import {
  Card, Stat, DetailRow, PageSpinner, ErrorBanner, EmptyState,
  CitizenTypeBadge, ScoreBadge, SeverityBadge, StatusBadge, HashDisplay,
  type FlagStatus, type Severity, type BenamiScanResult,
} from '@bsc/shared';
import { Search, ChevronRight, CheckCircle2, Loader2, ShieldAlert } from 'lucide-react';

type Tab = 'profile' | 'properties' | 'flags' | 'benami';

function SearchBar({ onSearch }: { onSearch: (hash: string) => void }) {
  const [val, setVal] = useState('');
  return (
    <div className="flex gap-3 mb-8">
      <input
        type="text" value={val} onChange={(e) => setVal(e.target.value)}
        placeholder="Enter 64-character citizen hash"
        onKeyDown={(e) => { if (e.key === 'Enter') onSearch(val.trim()); }}
        className="flex-1 rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 font-mono text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50"
        spellCheck={false}
      />
      <button
        onClick={() => onSearch(val.trim())}
        className="flex items-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-400 px-4 py-2.5 text-sm font-semibold text-[#03070f]"
      >
        <Search className="h-4 w-4" /> Search
      </button>
    </div>
  );
}

export default function CaseInvestigation() {
  const { hash: paramHash } = useParams<{ hash: string }>();
  const [searchParams] = useSearchParams();
  const focusedFlagId  = searchParams.get('flag');
  const queryClient    = useQueryClient();

  const [activeHash,   setActiveHash]   = useState(paramHash ?? '');
  const [tab,          setTab]          = useState<Tab>('profile');
  const [flagStatus,   setFlagStatus]   = useState<FlagStatus>('UNDER_INVESTIGATION');
  const [notes,        setNotes]        = useState('');
  const [manualForm,   setManualForm]   = useState(false);
  const [statusMsg,    setStatusMsg]    = useState('');
  const [benamiResult, setBenamiResult] = useState<BenamiScanResult | null>(null);

  const citizenQ    = useQuery({ queryKey: ['citizen', activeHash],      queryFn: () => getCitizen(activeHash),             enabled: !!activeHash });
  const flagsQ      = useQuery({ queryKey: ['flags', activeHash],        queryFn: () => getCitizenFlags(activeHash),        enabled: !!activeHash });
  const propertiesQ = useQuery({ queryKey: ['properties', activeHash],   queryFn: () => getCitizenProperties(activeHash),  enabled: !!activeHash });

  const updateMutation = useMutation({
    mutationFn: ({ id, status, notes: n }: { id: string; status: FlagStatus; notes: string }) =>
      updateFlagStatus(id, status, n),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flags', activeHash] });
      queryClient.invalidateQueries({ queryKey: ['flags-all'] });
      setStatusMsg('Flag updated successfully.');
      setTimeout(() => setStatusMsg(''), 3000);
    },
  });

  const manualMutation = useMutation({
    mutationFn: submitManualFlag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flags', activeHash] });
      queryClient.invalidateQueries({ queryKey: ['flags-all'] });
      setManualForm(false);
      setStatusMsg('Manual flag submitted.');
      setTimeout(() => setStatusMsg(''), 3000);
    },
  });

  const benamiMutation = useMutation({
    mutationFn: () => runBenamiScan(activeHash),
    onSuccess: (result) => {
      setBenamiResult(result);
      if (result.flagsRaised > 0) {
        queryClient.invalidateQueries({ queryKey: ['flags', activeHash] });
        queryClient.invalidateQueries({ queryKey: ['flags-all'] });
      }
    },
  });

  const c = citizenQ.data;

  return (
    <div className="p-8 max-w-5xl space-y-6">
      <h1 className="text-2xl font-bold text-white">Case Investigation</h1>

      <SearchBar onSearch={(h) => { setActiveHash(h); setTab('profile'); }} />

      {!activeHash && (
        <EmptyState title="No citizen selected" description="Enter a citizen hash above to begin investigation." />
      )}

      {activeHash && citizenQ.isLoading && <PageSpinner />}
      {activeHash && citizenQ.isError   && <ErrorBanner message="Citizen not found or access denied." onRetry={citizenQ.refetch} />}

      {c && (
        <>
          {/* Citizen header card */}
          <Card>
            <div className="flex items-start justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-bold text-white">{c.name}</h2>
                  <CitizenTypeBadge type={c.citizenType} />
                  <ScoreBadge score={c.anomalyScore} />
                </div>
                <HashDisplay hash={c.citizenHash} />
                <p className="text-sm text-slate-400 mt-1">{c.aadhaarState}</p>
              </div>
              <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-right shrink-0">
                <Stat label="Total Assets"  value={formatCrore(c.totalDeclaredAssets)} />
                <Stat label="5-Year Income" value={formatCrore(c.totalIncome5Yr)}      />
              </div>
            </div>
          </Card>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-white/5">
            {(['profile','properties','flags','benami'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-5 py-2.5 text-sm capitalize font-medium transition-colors border-b-2 -mb-px ${
                  tab === t
                    ? 'border-amber-500 text-amber-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                {t === 'benami' ? 'Benami Scan' : t}
                {t === 'flags' && flagsQ.data && (
                  <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-amber-500/15 text-amber-400 text-xs px-1.5 py-0.5">
                    {flagsQ.data.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab: Profile */}
          {tab === 'profile' && (
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <h3 className="text-sm font-semibold text-white mb-4">Citizen Details</h3>
                <DetailRow label="DOB"          value={formatDate(c.dateOfBirth)} />
                <DetailRow label="State"        value={c.aadhaarState} />
                <DetailRow label="Type"         value={<CitizenTypeBadge type={c.citizenType} />} />
                <DetailRow label="Created"      value={formatDate(c.createdAt)} />
                <DetailRow label="Last Updated" value={formatDate(c.lastUpdated)} />
              </Card>
              <Card>
                <h3 className="text-sm font-semibold text-white mb-4">Wealth Profile</h3>
                <DetailRow label="Current Assets"    value={formatCrore(c.totalDeclaredAssets)} />
                <DetailRow label="Prev Year Assets"  value={formatCrore(c.prevYearAssets)} />
                <DetailRow label="Assets 5 Yrs Ago"  value={formatCrore(c.assets5YrAgo)} />
                <DetailRow label="5-Year Income"     value={formatCrore(c.totalIncome5Yr)} />
              </Card>
            </div>
          )}

          {/* Tab: Properties */}
          {tab === 'properties' && (
            propertiesQ.isLoading ? <PageSpinner /> :
            propertiesQ.isError   ? <ErrorBanner message="Could not load properties." /> :
            !propertiesQ.data?.length ? <EmptyState title="No properties" /> :
            <div className="space-y-4">
              {propertiesQ.data.map((p) => (
                <Card key={p.propertyId}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-white">{p.propertyType} · {p.district}, {p.state}</p>
                      <p className="text-xs text-slate-400 mt-1">{p.registrationNo} · Registered {formatDate(p.registrationDate)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-white">{formatCrore(p.declaredValue)}</p>
                      <p className="text-xs text-slate-500">Circle: {formatCrore(p.circleRateValue)}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Tab: Flags + Actions */}
          {tab === 'flags' && (
            <div className="space-y-6">
              {flagsQ.isLoading ? <PageSpinner /> :
               flagsQ.isError   ? <ErrorBanner message="Could not load flags." /> :
               !flagsQ.data?.length ? <EmptyState title="No flags on this citizen" /> :
               flagsQ.data.map((flag) => (
                <Card key={flag.flagId} className={focusedFlagId === flag.flagId ? 'ring-1 ring-amber-500/40' : ''}>
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <p className="font-semibold text-white">{flag.ruleTriggered.replace(/_/g,' ')}</p>
                      <p className="text-sm text-slate-400 mt-0.5">{flag.description}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <SeverityBadge severity={flag.severity} />
                      <StatusBadge   status={flag.status} />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm mb-4 border-t border-white/5 pt-4">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest">Gap</p>
                      <p className="font-bold text-orange-400">{formatCrore(flag.gapAmount)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest">Age</p>
                      <p className="text-white">{daysAgo(flag.raisedAt)} days</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest">Raised</p>
                      <p className="text-white">{formatDate(flag.raisedAt)}</p>
                    </div>
                  </div>

                  {/* Status update action */}
                  <div className="border-t border-white/5 pt-4 space-y-3">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Update Status</p>
                    <div className="flex gap-3">
                      <select
                        value={flagStatus}
                        onChange={(e) => setFlagStatus(e.target.value as FlagStatus)}
                        className="flex-1 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
                      >
                        {(['OPEN','UNDER_INVESTIGATION','CLEARED','ESCALATED'] as FlagStatus[]).map((s) => (
                          <option key={s} value={s} className="bg-[#0a1628]">{s.replace('_',' ')}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => updateMutation.mutate({ id: flag.flagId, status: flagStatus, notes })}
                        disabled={updateMutation.isPending}
                        className="flex items-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 px-4 py-2 text-sm font-semibold text-[#03070f]"
                      >
                        {updateMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ChevronRight className="h-3.5 w-3.5" />}
                        Update
                      </button>
                    </div>
                    <textarea
                      value={notes} onChange={(e) => setNotes(e.target.value)}
                      placeholder="Resolution notes (optional)…"
                      rows={2}
                      className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50 resize-none"
                    />
                  </div>
                </Card>
              ))}

              {/* Status message */}
              {statusMsg && (
                <div className="flex items-center gap-2 rounded-lg border border-green-500/25 bg-green-500/10 px-4 py-3 text-sm text-green-400">
                  <CheckCircle2 className="h-4 w-4" /> {statusMsg}
                </div>
              )}

              {/* Manual flag panel */}
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-white">Submit Manual Flag</h3>
                  <button onClick={() => setManualForm((v) => !v)} className="text-xs text-amber-400 hover:text-amber-300">
                    {manualForm ? 'Cancel' : 'Add Flag'}
                  </button>
                </div>
                {manualForm && <ManualFlagForm citizenHash={c.citizenHash} mutation={manualMutation} />}
              </Card>
            </div>
          )}
          {/* Tab: Benami Scan */}
          {tab === 'benami' && (
            <div className="space-y-6">
              <Card>
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-1">Benami Detection Scan</h3>
                    <p className="text-xs text-slate-400">
                      Evaluates 4 rules: proxy ownership, systematic undervaluation, disproportionate assets, unexplained 5-year surge.
                      Triggered rules are recorded as immutable flags on the blockchain.
                    </p>
                  </div>
                  <button
                    onClick={() => { setBenamiResult(null); benamiMutation.mutate(); }}
                    disabled={benamiMutation.isPending}
                    className="shrink-0 flex items-center gap-2 rounded-lg bg-red-600/80 hover:bg-red-600 disabled:opacity-50 px-4 py-2.5 text-sm font-semibold text-white"
                  >
                    {benamiMutation.isPending
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <ShieldAlert className="h-4 w-4" />}
                    Run Scan
                  </button>
                </div>
              </Card>

              {benamiMutation.isError && (
                <ErrorBanner message="Benami scan failed. Ensure the API is running and the citizen exists." />
              )}

              {benamiResult && (
                <>
                  {/* Summary bar */}
                  <div className={`rounded-xl border px-5 py-4 flex items-center gap-4 ${
                    benamiResult.flagsRaised > 0
                      ? 'border-red-500/30 bg-red-500/10'
                      : 'border-green-500/30 bg-green-500/10'
                  }`}>
                    {benamiResult.flagsRaised > 0
                      ? <ShieldAlert className="h-5 w-5 text-red-400 shrink-0" />
                      : <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0" />}
                    <div>
                      <p className={`font-semibold ${benamiResult.flagsRaised > 0 ? 'text-red-300' : 'text-green-300'}`}>
                        {benamiResult.flagsRaised > 0
                          ? `${benamiResult.flagsRaised} benami flag${benamiResult.flagsRaised > 1 ? 's' : ''} raised and recorded on-chain`
                          : 'No benami patterns detected'}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">{benamiResult.rulesEvaluated} rules evaluated</p>
                    </div>
                  </div>

                  {/* Rule details */}
                  <div className="space-y-3">
                    {benamiResult.ruleDetails.map((rule) => (
                      <Card key={rule.ruleCode}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold ${
                                rule.triggered ? 'bg-red-500/20 text-red-300' : 'bg-green-500/15 text-green-400'
                              }`}>
                                {rule.triggered ? 'TRIGGERED' : 'CLEAR'}
                              </span>
                              {rule.triggered && <SeverityBadge severity={rule.severity} />}
                            </div>
                            <p className="text-sm font-medium text-white">{rule.ruleCode.replace(/_/g, ' ')}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{rule.description}</p>
                          </div>
                          {rule.triggered && rule.gapAmount > 0 && (
                            <div className="text-right shrink-0">
                              <p className="text-[10px] text-slate-500 uppercase tracking-widest">Gap</p>
                              <p className="font-bold text-orange-400">{formatCrore(rule.gapAmount)}</p>
                            </div>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ManualFlagForm({ citizenHash, mutation }: {
  citizenHash: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mutation: any;
}) {
  const [rule,        setRule]        = useState<'BENAMI_SUSPICION' | 'SHELL_COMPANY_LINK' | 'FOREIGN_ASSET_UNDECLARED' | 'LIFESTYLE_MISMATCH'>('BENAMI_SUSPICION');
  const [severity,    setSeverity]    = useState<Severity>('YELLOW');
  const [description, setDescription] = useState('');
  const [assetValue,  setAssetValue]  = useState('');
  const [incomeValue, setIncomeValue] = useState('');
  const [gapAmount,   setGapAmount]   = useState('');

  const submit = () => {
    if (!description.trim()) return;
    mutation.mutate({
      citizenHash,
      ruleTriggered: rule,
      severity,
      description,
      assetValue:  parseInt(assetValue  || '0', 10),
      incomeValue: parseInt(incomeValue || '0', 10),
      gapAmount:   parseInt(gapAmount   || '0', 10),
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-slate-400 mb-1 uppercase tracking-widest">Rule</label>
          <select value={rule} onChange={(e) => setRule(e.target.value as typeof rule)}
            className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50">
            <option value="BENAMI_SUSPICION"         className="bg-[#0a1628]">Benami Suspicion</option>
            <option value="SHELL_COMPANY_LINK"       className="bg-[#0a1628]">Shell Company Link</option>
            <option value="FOREIGN_ASSET_UNDECLARED" className="bg-[#0a1628]">Foreign Asset Undeclared</option>
            <option value="LIFESTYLE_MISMATCH"       className="bg-[#0a1628]">Lifestyle Mismatch</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1 uppercase tracking-widest">Severity</label>
          <select value={severity} onChange={(e) => setSeverity(e.target.value as Severity)}
            className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50">
            {(['YELLOW','ORANGE','RED'] as Severity[]).map((s) => (
              <option key={s} value={s} className="bg-[#0a1628]">{s}</option>
            ))}
          </select>
        </div>
      </div>
      <textarea value={description} onChange={(e) => setDescription(e.target.value)}
        placeholder="Describe the reason for this flag (min 10 chars)…" rows={3}
        className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50 resize-none"
      />
      <div className="grid grid-cols-3 gap-3">
        {[['Asset Value (₹)', assetValue, setAssetValue], ['Income Value (₹)', incomeValue, setIncomeValue], ['Gap Amount (₹)', gapAmount, setGapAmount]].map(([label, val, setter]) => (
          <div key={label as string}>
            <label className="block text-xs text-slate-400 mb-1 uppercase tracking-widest">{label as string}</label>
            <input type="number" value={val as string} onChange={(e) => (setter as (v: string) => void)(e.target.value)}
              placeholder="0"
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50"
            />
          </div>
        ))}
      </div>
      <button onClick={submit} disabled={mutation.isPending || description.length < 10}
        className="flex items-center gap-2 rounded-lg bg-red-500/80 hover:bg-red-500 disabled:opacity-50 px-4 py-2 text-sm font-semibold text-white">
        {mutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        Submit Flag
      </button>
    </div>
  );
}
