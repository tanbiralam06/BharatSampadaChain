import { useQuery } from '@tanstack/react-query';
import { Blocks, Users, Building2, AlertTriangle, Eye, Activity } from 'lucide-react';
import {
  getExplorerStats, getExplorerActivity,
  Card, Stat, PageSpinner, ErrorBanner, EmptyState,
  Badge, HashDisplay, formatDate, daysAgo,
  type LedgerEventType,
} from '@bsc/shared';

const CHAINCODE_VARIANT: Record<string, 'blue' | 'purple' | 'green' | 'orange'> = {
  anomaly:  'orange',
  property: 'blue',
  access:   'green',
  zkp:      'purple',
};

const EVENT_VARIANT: Record<LedgerEventType, 'orange' | 'blue' | 'green' | 'gray' | 'purple'> = {
  FLAG_RAISED:          'orange',
  PROPERTY_REGISTERED:  'blue',
  CITIZEN_CREATED:      'green',
  ACCESS_LOG:           'gray',
  AUDIT_EVENT:          'purple',
};

const EVENT_LABEL: Record<LedgerEventType, string> = {
  FLAG_RAISED:          'Flag Raised',
  PROPERTY_REGISTERED:  'Property',
  CITIZEN_CREATED:      'Citizen',
  ACCESS_LOG:           'Access',
  AUDIT_EVENT:          'Audit',
};

export default function Explorer() {
  const statsQ    = useQuery({ queryKey: ['explorer-stats'],    queryFn: getExplorerStats,    staleTime: 30_000 });
  const activityQ = useQuery({ queryKey: ['explorer-activity'], queryFn: getExplorerActivity, staleTime: 30_000 });

  const events = activityQ.data ?? [];

  return (
    <div className="p-8 max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Fabric Explorer</h1>
        <p className="text-sm text-slate-400 mt-1">
          Live view of the BSC ledger — citizens, properties, flags, and access events from
          the PostgreSQL mirror of <span className="font-mono text-slate-300">bsc-channel</span>.
        </p>
      </div>

      {/* Stats row */}
      {statsQ.isLoading && <PageSpinner />}
      {statsQ.isError   && <ErrorBanner message="Could not load chain stats." onRetry={statsQ.refetch} />}
      {statsQ.data && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <Users className="h-4 w-4 text-blue-400 mb-2" />
            <Stat label="Citizens"    value={statsQ.data.totalCitizens} />
          </Card>
          <Card>
            <Building2 className="h-4 w-4 text-purple-400 mb-2" />
            <Stat label="Properties"  value={statsQ.data.totalProperties} />
          </Card>
          <Card>
            <AlertTriangle className="h-4 w-4 text-orange-400 mb-2" />
            <Stat label="Total Flags" value={statsQ.data.totalFlags} />
          </Card>
          <Card>
            <AlertTriangle className="h-4 w-4 text-red-400 mb-2" />
            <Stat label="Open Flags"  value={statsQ.data.openFlags} />
          </Card>
          <Card>
            <Eye className="h-4 w-4 text-green-400 mb-2" />
            <Stat label="Access Logs" value={statsQ.data.totalAccessLogs} />
          </Card>
          <Card>
            <Activity className="h-4 w-4 text-amber-400 mb-2" />
            <Stat label="Last 24h"    value={statsQ.data.last24hEvents} />
          </Card>
        </div>
      )}

      {/* Activity timeline */}
      <div>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
          <Blocks className="h-3.5 w-3.5" />
          Recent Ledger Events (last 60)
        </h2>

        {activityQ.isLoading && <PageSpinner />}
        {activityQ.isError   && <ErrorBanner message="Could not load activity." onRetry={activityQ.refetch} />}

        {!activityQ.isLoading && events.length === 0 && (
          <EmptyState
            title="No activity on record"
            description="Once the network is seeded, events will appear here."
            icon={<Blocks className="h-12 w-12" />}
          />
        )}

        {events.length > 0 && (
          <Card className="p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  {['Time', 'Event', 'Chaincode', 'Description', 'Subject', 'Age'].map((h) => (
                    <th key={h} className="px-4 py-3.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={`${event.eventType}-${event.id}`} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                    <td className="px-4 py-3 text-slate-300 whitespace-nowrap text-xs">
                      {formatDate(event.timestamp)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={EVENT_VARIANT[event.eventType]}>
                        {EVENT_LABEL[event.eventType]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={CHAINCODE_VARIANT[event.chaincode] ?? 'gray'}>
                        {event.chaincode}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400 max-w-xs truncate">
                      {event.description}
                    </td>
                    <td className="px-4 py-3">
                      <HashDisplay hash={event.subjectHash} />
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                      {daysAgo(event.timestamp)}d ago
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </div>
  );
}
