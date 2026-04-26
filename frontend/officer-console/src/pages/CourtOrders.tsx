import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getProperty, getPropertyCourtOrders, freezeProperty, unfreezeProperty,
  formatCrore, formatDate,
} from '@bsc/shared';
import { Card, DetailRow, PageSpinner, ErrorBanner, EmptyState } from '@bsc/shared';
import { Search, Lock, LockOpen, CheckCircle2, Loader2 } from 'lucide-react';
import type { PropertyRecord, CourtOrder } from '@bsc/shared';

function EncumbranceBadge({ value }: { value: string }) {
  const colours: Record<string, string> = {
    CLEAR:       'bg-green-500/15 text-green-400',
    MORTGAGED:   'bg-yellow-500/15 text-yellow-400',
    DISPUTED:    'bg-orange-500/15 text-orange-400',
    COURT_STAY:  'bg-red-500/20 text-red-300',
  };
  return (
    <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold ${colours[value] ?? 'bg-white/10 text-slate-300'}`}>
      {value.replace('_', ' ')}
    </span>
  );
}

export default function CourtOrders() {
  const queryClient = useQueryClient();
  const [propertyId, setPropertyId] = useState('');
  const [activeId,   setActiveId]   = useState('');
  const [orderRef,   setOrderRef]   = useState('');
  const [reason,     setReason]     = useState('');
  const [msg,        setMsg]        = useState('');

  const propertyQ = useQuery<PropertyRecord>({
    queryKey: ['property', activeId],
    queryFn:  () => getProperty(activeId),
    enabled:  !!activeId,
  });

  const ordersQ = useQuery<CourtOrder[]>({
    queryKey: ['court-orders', activeId],
    queryFn:  () => getPropertyCourtOrders(activeId),
    enabled:  !!activeId,
  });

  const onSuccess = (action: string) => {
    queryClient.invalidateQueries({ queryKey: ['property', activeId] });
    queryClient.invalidateQueries({ queryKey: ['court-orders', activeId] });
    setOrderRef('');
    setReason('');
    setMsg(`${action} order recorded on blockchain.`);
    setTimeout(() => setMsg(''), 4000);
  };

  const freezeMutation = useMutation({
    mutationFn: () => freezeProperty(activeId, { orderRef, reason }),
    onSuccess:  () => onSuccess('Freeze'),
  });

  const unfreezeMutation = useMutation({
    mutationFn: () => unfreezeProperty(activeId, { orderRef, reason }),
    onSuccess:  () => onSuccess('Unfreeze'),
  });

  const prop = propertyQ.data;
  const isFrozen = prop?.encumbrance === 'COURT_STAY';
  const canSubmit = orderRef.trim().length > 0 && reason.trim().length >= 5;
  const isPending = freezeMutation.isPending || unfreezeMutation.isPending;

  return (
    <div className="p-8 max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold text-white">Court Orders</h1>

      {/* Property search */}
      <div className="flex gap-3">
        <input
          type="text" value={propertyId}
          onChange={(e) => setPropertyId(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') setActiveId(propertyId.trim()); }}
          placeholder="Enter property ID (e.g. PROP-MH-2024-001)"
          className="flex-1 rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50"
          spellCheck={false}
        />
        <button
          onClick={() => setActiveId(propertyId.trim())}
          className="flex items-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-400 px-4 py-2.5 text-sm font-semibold text-[#03070f]"
        >
          <Search className="h-4 w-4" /> Search
        </button>
      </div>

      {!activeId && <EmptyState title="No property selected" description="Enter a property ID to issue or view court orders." />}
      {activeId && propertyQ.isLoading && <PageSpinner />}
      {activeId && propertyQ.isError   && <ErrorBanner message="Property not found or inaccessible." onRetry={propertyQ.refetch} />}

      {prop && (
        <>
          {/* Property summary */}
          <Card>
            <div className="flex items-start justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-lg font-bold text-white">{prop.propertyId}</h2>
                  <EncumbranceBadge value={prop.encumbrance} />
                </div>
                <p className="text-sm text-slate-400">{prop.propertyType} · {prop.district}, {prop.state}</p>
                <p className="text-xs text-slate-500 mt-0.5">{prop.registrationNo}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-white">{formatCrore(prop.declaredValue)}</p>
                <p className="text-xs text-slate-500">Circle: {formatCrore(prop.circleRateValue)}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-1 mt-4 pt-4 border-t border-white/5">
              <DetailRow label="Owner Hash"  value={<span className="font-mono text-xs">{prop.ownerHash.slice(0, 16)}…</span>} />
              <DetailRow label="Registered"  value={formatDate(prop.registrationDate)} />
              <DetailRow label="Stamp Duty"  value={formatCrore(prop.stampDutyPaid)} />
              <DetailRow label="Last Updated" value={formatDate(prop.lastUpdated)} />
            </div>
          </Card>

          {/* Issue order form */}
          <Card>
            <h3 className="text-sm font-semibold text-white mb-4">Issue Court Order</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1 uppercase tracking-widest">Court Order / Case Ref</label>
                  <input
                    type="text" value={orderRef} onChange={(e) => setOrderRef(e.target.value)}
                    placeholder="e.g. HC/2024/CR-1234"
                    className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1 uppercase tracking-widest">Action</label>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => freezeMutation.mutate()}
                      disabled={!canSubmit || isPending || isFrozen}
                      className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-red-600/80 hover:bg-red-600 disabled:opacity-40 px-3 py-2 text-sm font-semibold text-white"
                    >
                      {freezeMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Lock className="h-3.5 w-3.5" />}
                      Freeze
                    </button>
                    <button
                      onClick={() => unfreezeMutation.mutate()}
                      disabled={!canSubmit || isPending || !isFrozen}
                      className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-green-600/80 hover:bg-green-600 disabled:opacity-40 px-3 py-2 text-sm font-semibold text-white"
                    >
                      {unfreezeMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LockOpen className="h-3.5 w-3.5" />}
                      Unfreeze
                    </button>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1 uppercase tracking-widest">Reason</label>
                <textarea
                  value={reason} onChange={(e) => setReason(e.target.value)}
                  placeholder="State the legal basis for this order (min 5 chars)…"
                  rows={2}
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50 resize-none"
                />
              </div>
            </div>

            {(freezeMutation.isError || unfreezeMutation.isError) && (
              <p className="mt-3 text-sm text-red-400">
                {((freezeMutation.error || unfreezeMutation.error) as Error)?.message ?? 'Request failed.'}
              </p>
            )}

            {msg && (
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-green-500/25 bg-green-500/10 px-4 py-2.5 text-sm text-green-400">
                <CheckCircle2 className="h-4 w-4" /> {msg}
              </div>
            )}
          </Card>

          {/* Order history */}
          <Card>
            <h3 className="text-sm font-semibold text-white mb-4">Order History</h3>
            {ordersQ.isLoading ? <PageSpinner /> :
             ordersQ.isError   ? <ErrorBanner message="Could not load court orders." /> :
             !ordersQ.data?.length ? <EmptyState title="No court orders on record" /> :
             <div className="space-y-3">
               {ordersQ.data.map((order) => (
                 <div key={order.orderId} className="flex items-start gap-4 rounded-lg bg-white/5 px-4 py-3">
                   <div className={`mt-0.5 rounded p-1.5 ${order.orderType === 'FREEZE' ? 'bg-red-500/20' : 'bg-green-500/15'}`}>
                     {order.orderType === 'FREEZE'
                       ? <Lock    className="h-3.5 w-3.5 text-red-400" />
                       : <LockOpen className="h-3.5 w-3.5 text-green-400" />}
                   </div>
                   <div className="flex-1 min-w-0">
                     <div className="flex items-center gap-2">
                       <span className={`text-xs font-semibold ${order.orderType === 'FREEZE' ? 'text-red-400' : 'text-green-400'}`}>
                         {order.orderType}
                       </span>
                       <span className="text-xs text-slate-400 font-mono">{order.orderRef}</span>
                     </div>
                     <p className="text-sm text-white mt-0.5">{order.reason}</p>
                     <p className="text-xs text-slate-500 mt-0.5">{formatDate(order.timestamp)}</p>
                   </div>
                 </div>
               ))}
             </div>
            }
          </Card>
        </>
      )}
    </div>
  );
}
