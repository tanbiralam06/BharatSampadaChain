import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { listCitizens, formatCrore } from '@bsc/shared';
import { Card, PageSpinner, ErrorBanner, EmptyState, CitizenTypeBadge, ScoreBadge } from '@bsc/shared';
import type { CitizenType } from '@bsc/shared';
import { Users, ChevronRight, TrendingUp } from 'lucide-react';

const TYPE_OPTIONS: { value: CitizenType | ''; label: string }[] = [
  { value: '',                   label: 'All Types'           },
  { value: 'politician',         label: 'Politicians'         },
  { value: 'government_official', label: 'Govt Officials'    },
  { value: 'civilian',           label: 'Civilians'           },
];

const STATES = ['', 'Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 'Kerala', 'West Bengal', 'Rajasthan', 'Andhra Pradesh', 'Uttar Pradesh'];

export default function BrowseOfficials() {
  const [searchParams] = useSearchParams();
  const initialSearch  = searchParams.get('search') ?? '';

  const [typeFilter,  setTypeFilter]  = useState<CitizenType | ''>('');
  const [stateFilter, setStateFilter] = useState('');
  const [search,      setSearch]      = useState(initialSearch);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['citizens-browse', typeFilter, stateFilter, search],
    queryFn:  () => listCitizens({
      type:   typeFilter  || undefined,
      state:  stateFilter || undefined,
      search: search      || undefined,
      limit:  50,
    }),
    staleTime: 60_000,
  });

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div>
        <h1 className="text-3xl font-bold text-white">Official Wealth Transparency</h1>
        <p className="mt-2 text-slate-400 max-w-xl">
          Publicly declared asset records of politicians and government officials, verified on the Hyperledger Fabric blockchain.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as CitizenType | '')}
          className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50">
          {TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value} className="bg-[#0a1628]">{o.label}</option>)}
        </select>
        <select value={stateFilter} onChange={(e) => setStateFilter(e.target.value)}
          className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50">
          {STATES.map((s) => <option key={s} value={s} className="bg-[#0a1628]">{s || 'All States'}</option>)}
        </select>
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name…"
          className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50"
        />
      </div>

      {/* Results */}
      {isLoading && <PageSpinner />}
      {isError   && <ErrorBanner message="Could not load data." onRetry={refetch} />}

      {!isLoading && data?.length === 0 && (
        <EmptyState title="No officials found" description="Try adjusting your filters." icon={<Users className="h-12 w-12" />} />
      )}

      {data && data.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((c) => (
            <Link key={c.citizen_hash} to={`/official/${c.citizen_hash}`}>
              <Card className="group hover:border-amber-500/30 transition-all duration-150 cursor-pointer h-full">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-white group-hover:text-amber-400 transition-colors">{c.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{c.aadhaar_state}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-amber-400 transition-colors mt-0.5 shrink-0" />
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <CitizenTypeBadge type={c.citizen_type} />
                  <ScoreBadge score={c.anomaly_score} />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/5">
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">Declared Assets</p>
                    <div className="flex items-center gap-1 mt-1">
                      <TrendingUp className="h-3 w-3 text-amber-500" />
                      <p className="text-sm font-bold text-white">{formatCrore(c.total_declared_assets)}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">5-Year Income</p>
                    <p className="text-sm font-bold text-white mt-1">{formatCrore(c.total_income_5yr)}</p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
