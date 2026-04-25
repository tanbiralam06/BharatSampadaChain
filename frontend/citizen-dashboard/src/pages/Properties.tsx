import { Building2, MapPin } from 'lucide-react';
import { useProperties } from '../hooks/useProperties';
import {
  Card, PageSpinner, ErrorBanner, EmptyState,
  Badge, formatCrore, formatDate,
  type Encumbrance,
} from '@bsc/shared';

const encumbranceVariant: Record<Encumbrance, 'green' | 'orange' | 'red' | 'yellow'> = {
  CLEAR:      'green',
  MORTGAGED:  'orange',
  DISPUTED:   'red',
  COURT_STAY: 'yellow',
};

export default function Properties() {
  const { data, isLoading, isError, refetch } = useProperties();

  if (isLoading) return <PageSpinner />;
  if (isError)   return <div className="p-8"><ErrorBanner message="Could not load properties." onRetry={refetch} /></div>;

  return (
    <div className="p-8 max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">My Properties</h1>
        <p className="text-sm text-slate-400 mt-1">{data?.length ?? 0} registered properties</p>
      </div>

      {!data || data.length === 0 ? (
        <EmptyState
          title="No properties found"
          description="No property records are linked to your account."
          icon={<Building2 className="h-12 w-12" />}
        />
      ) : (
        <div className="grid gap-4">
          {data.map((p) => (
            <Card key={p.propertyId}>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-white">{p.propertyType}</p>
                    <Badge variant={encumbranceVariant[p.encumbrance]}>{p.encumbrance}</Badge>
                    {!p.isActive && <Badge variant="gray">Inactive</Badge>}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-slate-400">
                    <MapPin className="h-3.5 w-3.5" />
                    {p.district}, {p.state}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-bold text-white">{formatCrore(p.declaredValue)}</p>
                  <p className="text-xs text-slate-500">Declared Value</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3 pt-4 border-t border-white/5">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest">Circle Rate</p>
                  <p className="text-sm text-white mt-0.5">{formatCrore(p.circleRateValue)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest">Area</p>
                  <p className="text-sm text-white mt-0.5">{p.areaSqft.toLocaleString('en-IN')} sqft</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest">Registered</p>
                  <p className="text-sm text-white mt-0.5">{formatDate(p.registrationDate)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest">Reg No.</p>
                  <p className="font-mono text-xs text-slate-300 mt-0.5">{p.registrationNo}</p>
                </div>
                {p.mortgageAmount && p.mortgageAmount > 0 && (
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">Mortgage</p>
                    <p className="text-sm text-orange-400 mt-0.5">{formatCrore(p.mortgageAmount)}</p>
                  </div>
                )}
                {p.transferType && (
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">Transfer Type</p>
                    <p className="text-sm text-white mt-0.5">{p.transferType}</p>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
