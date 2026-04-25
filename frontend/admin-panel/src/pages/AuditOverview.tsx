import { useQuery } from '@tanstack/react-query';
import { getAllFlags, getStats, formatCrore, formatDate, daysAgo } from '@bsc/shared';
import { Card, Stat, PageSpinner, ErrorBanner, EmptyState, SeverityBadge, StatusBadge, HashDisplay } from '@bsc/shared';
import { ClipboardList } from 'lucide-react';

export default function AuditOverview() {
  const flagsQ = useQuery({ queryKey: ['flags-all'], queryFn: getAllFlags,  staleTime: 30_000 });
  const statsQ = useQuery({ queryKey: ['stats'],     queryFn: getStats,     staleTime: 60_000 });

  const flags = flagsQ.data ?? [];
  const recentFlags = [...flags].sort((a, b) => new Date(b.raisedAt).getTime() - new Date(a.raisedAt).getTime()).slice(0, 20);

  return (
    <div className="p-8 max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Audit Overview</h1>
        <p className="text-sm text-slate-400 mt-1">System-wide flag activity and compliance audit trail</p>
      </div>

      {/* Quick stats */}
      {statsQ.data && (
        <div className="grid grid-cols-4 gap-4">
          <Card><Stat label="Total Flags"         value={flags.length} /></Card>
          <Card><Stat label="Open"                value={flags.filter((f) => f.status === 'OPEN').length} /></Card>
          <Card><Stat label="Under Investigation" value={flags.filter((f) => f.status === 'UNDER_INVESTIGATION').length} /></Card>
          <Card><Stat label="Cleared"             value={flags.filter((f) => f.status === 'CLEARED').length} /></Card>
        </div>
      )}

      {/* Loading / error states */}
      {flagsQ.isLoading && <PageSpinner />}
      {flagsQ.isError   && <ErrorBanner message="Could not load flags." onRetry={flagsQ.refetch} />}

      {/* Recent flags table */}
      {recentFlags.length === 0 && !flagsQ.isLoading && (
        <EmptyState title="No flags on record" icon={<ClipboardList className="h-12 w-12" />} />
      )}

      {recentFlags.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
            Recent Flags (last {recentFlags.length})
          </h2>
          <Card className="p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  {['Date','Citizen','Rule','Gap','Severity','Status','Age'].map((h) => (
                    <th key={h} className="px-4 py-3.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentFlags.map((flag) => (
                  <tr key={flag.flagId} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                    <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{formatDate(flag.raisedAt)}</td>
                    <td className="px-4 py-3"><HashDisplay hash={flag.citizenHash} /></td>
                    <td className="px-4 py-3 text-xs text-slate-400">{flag.ruleTriggered.replace(/_/g,' ')}</td>
                    <td className="px-4 py-3 font-semibold text-orange-400">{formatCrore(flag.gapAmount)}</td>
                    <td className="px-4 py-3"><SeverityBadge severity={flag.severity} /></td>
                    <td className="px-4 py-3"><StatusBadge   status={flag.status}   /></td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{daysAgo(flag.raisedAt)}d</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}
    </div>
  );
}
