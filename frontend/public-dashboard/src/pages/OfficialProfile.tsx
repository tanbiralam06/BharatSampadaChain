import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getCitizen, getCitizenFlags, getCitizenProperties, formatCrore, formatDate } from '@bsc/shared';
import { Card, Stat, DetailRow, PageSpinner, ErrorBanner, EmptyState, CitizenTypeBadge, ScoreBadge, SeverityBadge, HashDisplay } from '@bsc/shared';
import { ArrowLeft, Building2, AlertTriangle } from 'lucide-react';

export default function OfficialProfile() {
  const { hash } = useParams<{ hash: string }>();

  const citizenQ    = useQuery({ queryKey: ['citizen', hash],     queryFn: () => getCitizen(hash!),             enabled: !!hash });
  const flagsQ      = useQuery({ queryKey: ['flags', hash],       queryFn: () => getCitizenFlags(hash!),        enabled: !!hash });
  const propertiesQ = useQuery({ queryKey: ['properties', hash],  queryFn: () => getCitizenProperties(hash!),   enabled: !!hash });

  if (!hash)            return null;
  if (citizenQ.isLoading) return <PageSpinner />;
  if (citizenQ.isError)   return <ErrorBanner message="Official not found or data unavailable." />;
  if (!citizenQ.data)     return <EmptyState title="Profile not found" />;

  const c = citizenQ.data;
  // Show only severity distribution — no flag descriptions for public view
  const flagsBySeverity = (flagsQ.data ?? []).reduce<Record<string, number>>(
    (acc, f) => { acc[f.severity] = (acc[f.severity] ?? 0) + 1; return acc; },
    {}
  );

  return (
    <div className="max-w-4xl space-y-8">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Browse
      </Link>

      {/* Hero */}
      <div className="flex items-start justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-white">{c.name}</h1>
            <CitizenTypeBadge type={c.citizenType} />
          </div>
          <p className="text-slate-400">{c.aadhaarState}</p>
          <div className="mt-2"><ScoreBadge score={c.anomalyScore} /></div>
        </div>
      </div>

      {/* Wealth summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><Stat label="Declared Assets"  value={formatCrore(c.totalDeclaredAssets)} /></Card>
        <Card><Stat label="5-Year Income"    value={formatCrore(c.totalIncome5Yr)} /></Card>
        <Card><Stat label="Prev Year Assets" value={formatCrore(c.prevYearAssets)} /></Card>
        <Card><Stat label="Anomaly Score"    value={c.anomalyScore} sub={c.anomalyScore >= 2 ? 'Under scrutiny' : 'Low risk'} /></Card>
      </div>

      {/* Public detail — no PAN hash, no DOB */}
      <Card>
        <h2 className="text-sm font-semibold text-white mb-4">Profile Details</h2>
        <DetailRow label="State"        value={c.aadhaarState} />
        <DetailRow label="Citizen Type" value={<CitizenTypeBadge type={c.citizenType} />} />
        <DetailRow label="Record ID"    value={<HashDisplay hash={c.citizenHash} />} />
        <DetailRow label="Last Updated" value={formatDate(c.lastUpdated)} />
      </Card>

      {/* Flag summary (severity counts only — no details) */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <h2 className="text-sm font-semibold text-white">Anomaly Flag Summary</h2>
        </div>
        {flagsQ.isLoading ? <p className="text-sm text-slate-400">Loading…</p> :
         Object.keys(flagsBySeverity).length === 0
           ? <p className="text-sm text-slate-400">No anomaly flags on record.</p>
           : (
             <div className="flex gap-4">
               {(['RED','ORANGE','YELLOW'] as const).map((s) => flagsBySeverity[s] && (
                 <div key={s} className="flex items-center gap-2">
                   <SeverityBadge severity={s} />
                   <span className="text-sm text-white">{flagsBySeverity[s]}</span>
                 </div>
               ))}
             </div>
           )
        }
      </Card>

      {/* Properties (public — value and location only) */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="h-4 w-4 text-amber-500" />
          <h2 className="text-sm font-semibold text-white">Registered Properties</h2>
        </div>
        {propertiesQ.isLoading ? <p className="text-sm text-slate-400">Loading…</p> :
         !propertiesQ.data?.length
           ? <p className="text-sm text-slate-400">No registered properties.</p>
           : (
             <div className="space-y-3">
               {propertiesQ.data.map((p) => (
                 <div key={p.propertyId} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                   <div>
                     <p className="text-sm text-white">{p.propertyType} · {p.district}, {p.state}</p>
                     <p className="text-xs text-slate-400 mt-0.5">{formatDate(p.registrationDate)}</p>
                   </div>
                   <p className="text-sm font-bold text-white">{formatCrore(p.declaredValue)}</p>
                 </div>
               ))}
             </div>
           )
        }
      </Card>
    </div>
  );
}
