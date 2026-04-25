import { FileText } from 'lucide-react';
import { useAccessLog } from '../hooks/useAccessLog';
import {
  Card, PageSpinner, ErrorBanner, EmptyState, RoleBadge, HashDisplay, formatDate,
} from '@bsc/shared';

export default function AccessLog() {
  const { data, isLoading, isError, refetch } = useAccessLog();

  if (isLoading) return <PageSpinner />;
  if (isError)   return <div className="p-8"><ErrorBanner message="Could not load access log." onRetry={refetch} /></div>;

  return (
    <div className="p-8 max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Data Access Log</h1>
        <p className="text-sm text-slate-400 mt-1">
          Every access to your data is recorded permanently on the blockchain.
          {data && data.length > 0 && ` ${data.length} entries.`}
        </p>
      </div>

      {!data || data.length === 0 ? (
        <EmptyState
          title="No access events"
          description="No one has accessed your data yet."
          icon={<FileText className="h-12 w-12" />}
        />
      ) : (
        <Card className="p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-5 py-3.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Date</th>
                <th className="px-5 py-3.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Accessed By</th>
                <th className="px-5 py-3.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Role</th>
                <th className="px-5 py-3.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Access Type</th>
                <th className="px-5 py-3.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Data Fields</th>
                <th className="px-5 py-3.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Purpose</th>
              </tr>
            </thead>
            <tbody>
              {data.map((log, i) => (
                <tr key={log.logId} className={`border-b border-white/5 last:border-0 ${i % 2 === 0 ? '' : 'bg-white/[0.01]'}`}>
                  <td className="px-5 py-3.5 text-slate-300 whitespace-nowrap">{formatDate(log.timestamp)}</td>
                  <td className="px-5 py-3.5"><HashDisplay hash={log.accessorHash} /></td>
                  <td className="px-5 py-3.5"><RoleBadge role={log.accessorRole} /></td>
                  <td className="px-5 py-3.5 text-slate-300">{log.accessType}</td>
                  <td className="px-5 py-3.5 text-slate-400 text-xs">{log.dataTypes.join(', ')}</td>
                  <td className="px-5 py-3.5 text-slate-400 max-w-[180px] truncate">{log.purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
