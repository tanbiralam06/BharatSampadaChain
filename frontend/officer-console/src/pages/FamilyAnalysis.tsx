import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCitizen, listCitizens, formatCrore, formatDate } from '@bsc/shared';
import { Card, Stat, PageSpinner, ErrorBanner, ScoreBadge, CitizenTypeBadge, HashDisplay } from '@bsc/shared';
import { Search, X, Plus } from 'lucide-react';

const MAX_COMPARE = 3;

function CitizenCard({ hash, onRemove }: { hash: string; onRemove: () => void }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['citizen', hash],
    queryFn:  () => getCitizen(hash),
    enabled:  !!hash,
  });

  if (isLoading) return <Card><PageSpinner /></Card>;
  if (isError || !data) return (
    <Card>
      <ErrorBanner message="Could not load citizen." />
      <button onClick={onRemove} className="mt-2 text-xs text-slate-400 hover:text-white">Remove</button>
    </Card>
  );

  return (
    <Card className="relative">
      <button onClick={onRemove} className="absolute top-4 right-4 text-slate-600 hover:text-slate-300">
        <X className="h-4 w-4" />
      </button>
      <div className="mb-4">
        <p className="font-semibold text-white pr-6">{data.name}</p>
        <HashDisplay hash={data.citizenHash} />
        <div className="flex items-center gap-2 mt-2">
          <CitizenTypeBadge type={data.citizenType} />
          <ScoreBadge score={data.anomalyScore} />
        </div>
      </div>
      <div className="space-y-3 border-t border-white/5 pt-4">
        <Stat label="Total Assets"   value={formatCrore(data.totalDeclaredAssets)} />
        <Stat label="5-Year Income"  value={formatCrore(data.totalIncome5Yr)} />
        <Stat label="Prev Yr Assets" value={formatCrore(data.prevYearAssets)} />
        <Stat label="Assets 5Y Ago"  value={formatCrore(data.assets5YrAgo)} />
        <Stat label="State"          value={data.aadhaarState} />
        <Stat label="Last Updated"   value={formatDate(data.lastUpdated)} />
      </div>
    </Card>
  );
}

export default function FamilyAnalysis() {
  const [search,   setSearch]   = useState('');
  const [compared, setCompared] = useState<string[]>([]);

  const searchQuery = useQuery({
    queryKey: ['citizens-search', search],
    queryFn:  () => listCitizens({ search, limit: 10 }),
    enabled:  search.length >= 2,
    staleTime: 60_000,
  });

  const add = (hash: string) => {
    if (compared.includes(hash) || compared.length >= MAX_COMPARE) return;
    setCompared((prev) => [...prev, hash]);
    setSearch('');
  };

  const remove = (hash: string) => setCompared((prev) => prev.filter((h) => h !== hash));

  return (
    <div className="p-8 max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Family / Network Analysis</h1>
        <p className="text-sm text-slate-400 mt-1">Compare up to {MAX_COMPARE} citizens side-by-side</p>
      </div>

      {/* Search + add */}
      {compared.length < MAX_COMPARE && (
        <div className="relative">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or paste hash…"
                className="w-full rounded-lg bg-white/5 border border-white/10 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50"
              />
            </div>
          </div>

          {/* Dropdown results */}
          {searchQuery.data && searchQuery.data.length > 0 && (
            <div className="absolute z-10 top-full mt-1 w-full rounded-xl bg-[#0a1628] border border-white/10 shadow-xl overflow-hidden">
              {searchQuery.data.map((c) => (
                <button
                  key={c.citizen_hash}
                  onClick={() => add(c.citizen_hash)}
                  disabled={compared.includes(c.citizen_hash)}
                  className="flex items-center justify-between w-full px-4 py-3 hover:bg-white/5 disabled:opacity-40 text-left transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{c.name}</p>
                    <p className="text-xs text-slate-400">{c.citizen_type.replace('_',' ')} · {c.aadhaar_state}</p>
                  </div>
                  <Plus className="h-4 w-4 text-amber-400 shrink-0" />
                </button>
              ))}
            </div>
          )}
          {searchQuery.isLoading && <p className="mt-2 text-xs text-slate-500">Searching…</p>}
        </div>
      )}

      {compared.length === 0 && (
        <p className="text-sm text-slate-500 text-center py-12">
          Search for citizens above to add them to the comparison panel.
        </p>
      )}

      {/* Comparison grid */}
      {compared.length > 0 && (
        <div className={`grid gap-6 ${compared.length === 1 ? 'max-w-sm' : compared.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
          {compared.map((hash) => (
            <CitizenCard key={hash} hash={hash} onRemove={() => remove(hash)} />
          ))}
        </div>
      )}
    </div>
  );
}
