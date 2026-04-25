import { useQuery } from '@tanstack/react-query';
import { getHealth, formatDate } from '@bsc/shared';
import { Card, PageSpinner, ErrorBanner } from '@bsc/shared';
import { Database, Layers, Cpu, RefreshCw } from 'lucide-react';

function ServiceRow({ name, status, icon: Icon }: { name: string; status: 'up' | 'down' | 'connected' | 'disconnected'; icon: React.FC<{ className?: string }> }) {
  const isOk = status === 'up' || status === 'connected';
  return (
    <div className="flex items-center justify-between py-4 border-b border-white/5 last:border-0">
      <div className="flex items-center gap-3">
        <div className={`flex items-center justify-center w-9 h-9 rounded-lg ${isOk ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
          <Icon className={`h-4 w-4 ${isOk ? 'text-green-400' : 'text-red-400'}`} />
        </div>
        <p className="text-sm font-medium text-white">{name}</p>
      </div>
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${isOk ? 'bg-green-400' : 'bg-red-400'}`} />
        <span className={`text-sm font-medium ${isOk ? 'text-green-400' : 'text-red-400'}`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </div>
    </div>
  );
}

export default function SystemHealth() {
  const { data, isLoading, isError, refetch, dataUpdatedAt } = useQuery({
    queryKey:         ['health'],
    queryFn:          getHealth,
    refetchInterval:  30_000,  // auto-refresh every 30 seconds
    staleTime:        15_000,
  });

  const overall = data?.status ?? 'unknown';

  return (
    <div className="p-8 max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">System Health</h1>
          {dataUpdatedAt > 0 && (
            <p className="text-sm text-slate-400 mt-1">Last checked {formatDate(new Date(dataUpdatedAt).toISOString())}</p>
          )}
        </div>
        <button onClick={() => refetch()} className="flex items-center gap-2 rounded-lg bg-white/5 hover:bg-white/10 px-4 py-2 text-sm text-slate-300 transition-colors">
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Overall status banner */}
      {data && (
        <div className={`rounded-xl border px-5 py-4 flex items-center gap-3 ${
          overall === 'healthy'
            ? 'bg-green-500/10 border-green-500/20 text-green-400'
            : 'bg-orange-500/10 border-orange-500/20 text-orange-400'
        }`}>
          <span className={`h-3 w-3 rounded-full ${overall === 'healthy' ? 'bg-green-400' : 'bg-orange-400'}`} />
          <p className="font-semibold">{overall === 'healthy' ? 'All systems operational' : 'Degraded — one or more services down'}</p>
        </div>
      )}

      {isLoading && <PageSpinner />}
      {isError   && <ErrorBanner message="Could not fetch system health." onRetry={refetch} />}

      {data && (
        <Card>
          <h2 className="text-sm font-semibold text-white mb-2">Services</h2>
          <ServiceRow name="PostgreSQL (Off-chain Index)" status={data.services.postgres}  icon={Database} />
          <ServiceRow name="Redis (Session Cache)"        status={data.services.redis}     icon={Layers}   />
          <ServiceRow name="Hyperledger Fabric"           status={data.services.fabric}    icon={Cpu}      />
        </Card>
      )}
    </div>
  );
}
