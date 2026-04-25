import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getAllFlags, formatCrore, formatDate, daysAgo } from '@bsc/shared';
import { SeverityBadge, StatusBadge, Card, Stat, PageSpinner, ErrorBanner, EmptyState, HashDisplay } from '@bsc/shared';
import type { Severity, FlagStatus } from '@bsc/shared';
import { AlertTriangle, Filter } from 'lucide-react';

export default function ActiveFlags() {
  const navigate = useNavigate();
  const [severityFilter, setSeverityFilter] = useState<Severity | 'ALL'>('ALL');
  const [statusFilter,   setStatusFilter]   = useState<FlagStatus | 'ALL'>('ALL');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey:  ['flags-all'],
    queryFn:   () => getAllFlags(),
    staleTime: 20_000,
  });

  if (isLoading) return <PageSpinner />;
  if (isError)   return <div className="p-8"><ErrorBanner message="Could not load flags." onRetry={refetch} /></div>;

  const flags = (data ?? []).filter((f) => {
    if (severityFilter !== 'ALL' && f.severity !== severityFilter) return false;
    if (statusFilter   !== 'ALL' && f.status   !== statusFilter)   return false;
    return true;
  });

  const counts = { RED: 0, ORANGE: 0, YELLOW: 0 };
  (data ?? []).forEach((f) => { if (f.severity in counts) counts[f.severity as Severity]++; });

  return (
    <div className="p-8 max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Active Flags</h1>
        <p className="text-sm text-slate-400 mt-1">{data?.length ?? 0} total · showing {flags.length}</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card><Stat label="RED — Critical"  value={counts.RED}    sub="Immediate action required" /></Card>
        <Card><Stat label="ORANGE — High"   value={counts.ORANGE} sub="Investigation warranted"   /></Card>
        <Card><Stat label="YELLOW — Medium" value={counts.YELLOW} sub="Under review"               /></Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Filter className="h-4 w-4 text-slate-500 shrink-0" />
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value as Severity | 'ALL')}
          className="rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-sm text-white focus:outline-none focus:border-amber-500/50"
        >
          <option value="ALL" className="bg-[#0a1628]">All Severities</option>
          {(['RED','ORANGE','YELLOW'] as Severity[]).map((s) => (
            <option key={s} value={s} className="bg-[#0a1628]">{s}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as FlagStatus | 'ALL')}
          className="rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-sm text-white focus:outline-none focus:border-amber-500/50"
        >
          <option value="ALL" className="bg-[#0a1628]">All Statuses</option>
          {(['OPEN','UNDER_INVESTIGATION','ESCALATED','CLEARED'] as FlagStatus[]).map((s) => (
            <option key={s} value={s} className="bg-[#0a1628]">{s.replace('_',' ')}</option>
          ))}
        </select>
      </div>

      {/* Flags table */}
      {flags.length === 0 ? (
        <EmptyState title="No matching flags" description="Adjust the filters to see results." icon={<AlertTriangle className="h-12 w-12" />} />
      ) : (
        <Card className="p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                {['Severity','Citizen','Rule','Gap Amount','Status','Age','Action'].map((h) => (
                  <th key={h} className="px-4 py-3.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {flags.map((flag) => (
                <tr
                  key={flag.flagId}
                  className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-4 py-3"><SeverityBadge severity={flag.severity} /></td>
                  <td className="px-4 py-3"><HashDisplay hash={flag.citizenHash} /></td>
                  <td className="px-4 py-3 text-slate-300 text-xs">{flag.ruleTriggered.replace(/_/g,' ')}</td>
                  <td className="px-4 py-3 font-semibold text-orange-400">{formatCrore(flag.gapAmount)}</td>
                  <td className="px-4 py-3"><StatusBadge status={flag.status} /></td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{daysAgo(flag.raisedAt)}d</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => navigate(`/investigate/${flag.citizenHash}?flag=${flag.flagId}`)}
                      className="text-xs text-amber-400 hover:text-amber-300 underline underline-offset-2"
                    >
                      Investigate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
