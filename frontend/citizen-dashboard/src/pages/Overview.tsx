import { User, Building2, TrendingUp, AlertTriangle } from 'lucide-react';
import { useCitizen } from '../hooks/useCitizen';
import { useFlags } from '../hooks/useFlags';
import {
  Card, Stat, DetailRow, PageSpinner, ErrorBanner, EmptyState,
  CitizenTypeBadge, ScoreBadge, SeverityBadge, StatusBadge,
  formatCrore, formatDate,
} from '@bsc/shared';

export default function Overview() {
  const citizen = useCitizen();
  const flags   = useFlags();

  if (citizen.isLoading) return <PageSpinner />;
  if (citizen.isError)   return (
    <div className="p-8">
      <ErrorBanner message="Could not load your profile." onRetry={citizen.refetch} />
    </div>
  );
  if (!citizen.data)     return <EmptyState title="Profile not found" />;

  const c    = citizen.data;
  const openFlags = (flags.data ?? []).filter((f) => f.status === 'OPEN' || f.status === 'UNDER_INVESTIGATION');
  const assetGrowth = c.prevYearAssets > 0
    ? (((c.totalDeclaredAssets - c.prevYearAssets) / c.prevYearAssets) * 100).toFixed(1)
    : null;

  return (
    <div className="p-8 space-y-8 max-w-5xl">
      {/* Page header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold text-white">{c.name}</h1>
          <CitizenTypeBadge type={c.citizenType} />
        </div>
        <p className="text-sm text-slate-400">{c.aadhaarState} · Last updated {formatDate(c.lastUpdated)}</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <Stat
            label="Total Declared Assets"
            value={formatCrore(c.totalDeclaredAssets)}
            sub={assetGrowth ? `${Number(assetGrowth) >= 0 ? '+' : ''}${assetGrowth}% YoY` : undefined}
          />
        </Card>
        <Card>
          <Stat
            label="5-Year Income"
            value={formatCrore(c.totalIncome5Yr)}
            sub="Declared total"
          />
        </Card>
        <Card>
          <div className="flex items-start justify-between">
            <Stat label="Anomaly Score" value={c.anomalyScore} />
            <ScoreBadge score={c.anomalyScore} />
          </div>
        </Card>
        <Card>
          <Stat
            label="Open Flags"
            value={openFlags.length}
            sub={openFlags.length > 0 ? 'Needs attention' : 'All clear'}
          />
        </Card>
      </div>

      {/* Detail panel */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <User className="h-4 w-4 text-amber-500" />
            <h2 className="text-sm font-semibold text-white">Profile Details</h2>
          </div>
          <DetailRow label="Name"           value={c.name} />
          <DetailRow label="State"          value={c.aadhaarState} />
          <DetailRow label="Date of Birth"  value={formatDate(c.dateOfBirth)} />
          <DetailRow label="Citizen Type"   value={<CitizenTypeBadge type={c.citizenType} />} />
          <DetailRow label="Account Since"  value={formatDate(c.createdAt)} />
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-amber-500" />
            <h2 className="text-sm font-semibold text-white">Wealth Snapshot</h2>
          </div>
          <DetailRow label="Current Assets"   value={formatCrore(c.totalDeclaredAssets)} />
          <DetailRow label="Prev Year Assets" value={formatCrore(c.prevYearAssets)} />
          <DetailRow label="Assets 5 Yrs Ago" value={formatCrore(c.assets5YrAgo)} />
          <DetailRow label="5-Year Income"     value={formatCrore(c.totalIncome5Yr)} />
        </Card>
      </div>

      {/* Recent flags preview */}
      {!flags.isLoading && flags.data && flags.data.length > 0 && (
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <h2 className="text-sm font-semibold text-white">Recent Anomaly Flags</h2>
          </div>
          <div className="space-y-3">
            {flags.data.slice(0, 3).map((flag) => (
              <div key={flag.flagId} className="flex items-start justify-between gap-4 py-2 border-b border-white/5 last:border-0">
                <div>
                  <p className="text-sm text-white">{flag.ruleTriggered.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{flag.description}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <SeverityBadge severity={flag.severity} />
                  <StatusBadge status={flag.status} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {!flags.isLoading && (!flags.data || flags.data.length === 0) && (
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="h-4 w-4 text-green-400" />
            <h2 className="text-sm font-semibold text-white">No Anomaly Flags</h2>
          </div>
          <p className="text-sm text-slate-400">Your account has no anomaly flags on record.</p>
        </Card>
      )}
    </div>
  );
}
