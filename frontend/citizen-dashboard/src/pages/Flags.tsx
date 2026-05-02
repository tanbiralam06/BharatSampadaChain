import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, MessageSquare, Clock, CheckCircle2, Loader2 } from 'lucide-react';
import { useFlags } from '../hooks/useFlags';
import { useAuth } from '../context/AuthContext';
import {
  Card, PageSpinner, ErrorBanner, EmptyState,
  SeverityBadge, StatusBadge, DetailRow, Badge,
  formatCrore, formatDate, daysAgo, disputeFlag,
} from '@bsc/shared';

function DisputePanel({ flagId, citizenHash, onSuccess }: {
  flagId: string; citizenHash: string; onSuccess: () => void;
}) {
  const [reason, setReason] = useState('');
  const mutation = useMutation({
    mutationFn: () => disputeFlag(citizenHash, flagId, reason),
    onSuccess,
  });

  return (
    <div className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 space-y-3">
      <p className="text-xs font-semibold text-amber-400">Submit a Dispute</p>
      <p className="text-xs text-slate-400">
        Explain why you believe this flag is incorrect. The flag stays on record — an officer will review your explanation.
      </p>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Describe the inaccuracy (min 20 characters)…"
        rows={3}
        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-600 outline-none focus:border-amber-500/50 resize-none"
      />
      {mutation.isError && (
        <p className="text-xs text-red-400">
          {(mutation.error as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Submission failed.'}
        </p>
      )}
      <div className="flex items-center gap-2">
        <button
          onClick={() => mutation.mutate()}
          disabled={reason.length < 20 || mutation.isPending}
          className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-black hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {mutation.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
          Submit Dispute
        </button>
        <span className="text-xs text-slate-500">{reason.length}/20 min</span>
      </div>
    </div>
  );
}

export default function Flags() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch } = useFlags();
  const [openDisputeId, setOpenDisputeId] = useState<string | null>(null);

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
          {sorted.map((flag) => {
            const canDispute = flag.status !== 'CLEARED' && !flag.disputeStatus;
            const isDisputeOpen = openDisputeId === flag.flagId;

            return (
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
                  <DetailRow label="Gap Amount"  value={<span className="text-orange-400 font-semibold">{formatCrore(flag.gapAmount)}</span>} />
                  <DetailRow label="Assets Used" value={formatCrore(flag.assetValueUsed)} />
                  <DetailRow label="Income Used" value={formatCrore(flag.incomeValueUsed)} />
                  <DetailRow label="Raised"      value={`${formatDate(flag.raisedAt)} · ${daysAgo(flag.raisedAt)} days ago`} />
                  {flag.resolvedAt && (
                    <DetailRow label="Resolved"  value={formatDate(flag.resolvedAt)} />
                  )}
                  {flag.resolutionNotes && (
                    <DetailRow label="Resolution" value={flag.resolutionNotes} />
                  )}
                </div>

                {/* Dispute status — if already submitted */}
                {flag.disputeStatus && (
                  <div className={`mt-4 flex items-start gap-2 rounded-lg border p-3 ${
                    flag.disputeStatus === 'PENDING'
                      ? 'border-amber-500/20 bg-amber-500/5'
                      : 'border-green-500/20 bg-green-500/5'
                  }`}>
                    {flag.disputeStatus === 'PENDING'
                      ? <Clock className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                      : <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={flag.disputeStatus === 'PENDING' ? 'amber' : 'green'}>
                          Dispute {flag.disputeStatus === 'PENDING' ? 'Pending Review' : 'Reviewed'}
                        </Badge>
                        {flag.disputedAt && (
                          <span className="text-[10px] text-slate-500">{formatDate(flag.disputedAt)}</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">{flag.disputeReason}</p>
                    </div>
                  </div>
                )}

                {/* Dispute button or form */}
                {canDispute && (
                  <div className="mt-4">
                    {!isDisputeOpen ? (
                      <button
                        onClick={() => setOpenDisputeId(flag.flagId)}
                        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-400 transition-colors"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        Dispute this flag
                      </button>
                    ) : (
                      <DisputePanel
                        flagId={flag.flagId}
                        citizenHash={user!.sub}
                        onSuccess={() => {
                          setOpenDisputeId(null);
                          qc.invalidateQueries({ queryKey: ['flags', user?.sub] });
                        }}
                      />
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
