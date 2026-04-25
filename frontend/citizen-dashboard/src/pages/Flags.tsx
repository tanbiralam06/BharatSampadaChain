import { AlertTriangle } from 'lucide-react';
import { useFlags } from '../hooks/useFlags';
import {
  Card, PageSpinner, ErrorBanner, EmptyState,
  SeverityBadge, StatusBadge, DetailRow, formatCrore, formatDate, daysAgo,
} from '@bsc/shared';

export default function Flags() {
  const { data, isLoading, isError, refetch } = useFlags();

  if (isLoading) return <PageSpinner />;
  if (isError)   return <div className="p-8"><ErrorBanner message="Could not load flags." onRetry={refetch} /></div>;

  const sorted = [...(data ?? [])].sort(
    (a, b) => new Date(b.raisedAt).getTime() - new Date(a.raisedAt).getTime()
  );

  return (
    <div className="p-8 max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">My Anomaly Flags</h1>
        <p className="text-sm text-slate-400 mt-1">
          Flags are raised automatically by the smart contract or manually by a reviewing officer.
          {sorted.length > 0 && ` ${sorted.length} total.`}
        </p>
      </div>

      {sorted.length === 0 ? (
        <EmptyState
          title="No flags"
          description="Your account has no anomaly flags on record. All clear."
          icon={<AlertTriangle className="h-12 w-12" />}
        />
      ) : (
        <div className="space-y-4">
          {sorted.map((flag) => (
            <Card key={flag.flagId}>
              {/* Header row */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <p className="text-sm font-semibold text-white mb-1">
                    {flag.ruleTriggered.replace(/_/g, ' ')}
                  </p>
                  <p className="text-sm text-slate-400">{flag.description}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <SeverityBadge severity={flag.severity} />
                  <StatusBadge status={flag.status} />
                </div>
              </div>

              {/* Detail grid */}
              <div className="border-t border-white/5 pt-4 space-y-0">
                <DetailRow label="Gap Amount"       value={<span className="text-orange-400 font-semibold">{formatCrore(flag.gapAmount)}</span>} />
                <DetailRow label="Assets Used"      value={formatCrore(flag.assetValueUsed)} />
                <DetailRow label="Income Used"      value={formatCrore(flag.incomeValueUsed)} />
                <DetailRow label="Raised"           value={`${formatDate(flag.raisedAt)} · ${daysAgo(flag.raisedAt)} days ago`} />
                {flag.resolvedAt && (
                  <DetailRow label="Resolved"       value={formatDate(flag.resolvedAt)} />
                )}
                {flag.resolutionNotes && (
                  <DetailRow label="Resolution"     value={flag.resolutionNotes} />
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
