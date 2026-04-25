import { useQuery } from '@tanstack/react-query';
import { getStats } from '@bsc/shared';
import { Card, Stat, PageSpinner, ErrorBanner } from '@bsc/shared';
import { Users, Building2, AlertTriangle, Flame } from 'lucide-react';

const AGENCIES = [
  { id: 'IT_DEPT', name: 'Income Tax Department', permissions: ['View Citizen', 'View Properties', 'View Flags', 'Raise Flag', 'Investigate'] },
  { id: 'ED',      name: 'Enforcement Directorate', permissions: ['View Citizen', 'View Flags', 'Raise Flag', 'Escalate'] },
  { id: 'CBI',     name: 'Central Bureau of Investigation', permissions: ['View Citizen', 'View All Flags', 'Raise Flag', 'Escalate', 'Mark Cleared'] },
  { id: 'COURT',   name: 'Court / Judiciary', permissions: ['View Citizen', 'View Properties', 'View Flags (Read-only)'] },
  { id: 'BANK',    name: 'Banking Authority', permissions: ['View Financial Assets (Read-only)'] },
];

export default function AgencyManagement() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['stats'],
    queryFn:  getStats,
    staleTime: 60_000,
  });

  return (
    <div className="p-8 max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Agency Management</h1>
        <p className="text-sm text-slate-400 mt-1">Platform statistics and authorized agency permissions</p>
      </div>

      {/* Stats */}
      {isLoading && <PageSpinner />}
      {isError   && <ErrorBanner message="Could not load statistics." onRetry={refetch} />}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <div className="flex items-center gap-2 mb-3"><Users className="h-4 w-4 text-blue-400" /></div>
            <Stat label="Total Citizens" value={data.totalCitizens.toLocaleString('en-IN')} />
          </Card>
          <Card>
            <div className="flex items-center gap-2 mb-3"><Building2 className="h-4 w-4 text-green-400" /></div>
            <Stat label="Total Properties" value={data.totalProperties.toLocaleString('en-IN')} />
          </Card>
          <Card>
            <div className="flex items-center gap-2 mb-3"><AlertTriangle className="h-4 w-4 text-amber-400" /></div>
            <Stat label="Open Flags" value={data.openFlags.toLocaleString('en-IN')} />
          </Card>
          <Card>
            <div className="flex items-center gap-2 mb-3"><Flame className="h-4 w-4 text-red-400" /></div>
            <Stat label="RED Flags" value={data.redFlags.toLocaleString('en-IN')} sub="Critical" />
          </Card>
        </div>
      )}

      {/* Agency permission table */}
      <div>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4">Authorized Agencies</h2>
        <div className="space-y-3">
          {AGENCIES.map((agency) => (
            <Card key={agency.id}>
              <div className="flex items-start justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-white">{agency.name}</p>
                    <span className="font-mono text-[10px] bg-white/5 text-slate-400 px-2 py-0.5 rounded">{agency.id}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {agency.permissions.map((perm) => (
                      <span key={perm} className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded">
                        {perm}
                      </span>
                    ))}
                  </div>
                </div>
                <span className="shrink-0 h-2 w-2 rounded-full bg-green-400 mt-1.5" title="Active" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
