import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCitizen, listCitizens, formatCrore } from '@bsc/shared';
import { Card, PageSpinner, ErrorBanner, CitizenTypeBadge, ScoreBadge, HashDisplay } from '@bsc/shared';
import { Search, X, Plus } from 'lucide-react';

const MAX = 3;

function CompareColumn({ hash, onRemove }: { hash: string; onRemove: () => void }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['citizen', hash], queryFn: () => getCitizen(hash), enabled: !!hash,
  });

  if (isLoading) return <Card><PageSpinner /></Card>;
  if (isError || !data) return <Card><ErrorBanner message="Load failed." /><button onClick={onRemove} className="mt-2 text-xs text-slate-400">Remove</button></Card>;

  return (
    <Card className="relative">
      <button onClick={onRemove} className="absolute top-4 right-4 text-slate-600 hover:text-slate-300"><X className="h-4 w-4" /></button>
      <div className="mb-4 pr-6">
        <p className="font-semibold text-white">{data.name}</p>
        <p className="text-xs text-slate-400 mt-0.5">{data.aadhaarState}</p>
        <div className="flex flex-wrap gap-1.5 mt-2">
          <CitizenTypeBadge type={data.citizenType} />
          <ScoreBadge score={data.anomalyScore} />
        </div>
        <div className="mt-2"><HashDisplay hash={data.citizenHash} /></div>
      </div>
      <div className="space-y-4 border-t border-white/5 pt-4">
        {[
          ['Declared Assets',   formatCrore(data.totalDeclaredAssets)],
          ['5-Year Income',     formatCrore(data.totalIncome5Yr)],
          ['Prev Year Assets',  formatCrore(data.prevYearAssets)],
          ['Assets 5 Yrs Ago', formatCrore(data.assets5YrAgo)],
          ['Anomaly Score',    String(data.anomalyScore)],
          ['State',             data.aadhaarState],
        ].map(([label, value]) => (
          <div key={label}>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">{label}</p>
            <p className="text-sm font-semibold text-white mt-0.5">{value}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default function CompareOfficials() {
  const [search,   setSearch]   = useState('');
  const [hashes,   setHashes]   = useState<string[]>([]);

  const searchQ = useQuery({
    queryKey: ['citizens-search', search],
    queryFn:  () => listCitizens({ search, limit: 8 }),
    enabled:  search.length >= 2,
    staleTime: 60_000,
  });

  const add    = (hash: string) => { if (!hashes.includes(hash) && hashes.length < MAX) { setHashes((p) => [...p, hash]); setSearch(''); } };
  const remove = (hash: string) => setHashes((p) => p.filter((h) => h !== hash));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Compare Officials</h1>
        <p className="mt-2 text-slate-400">Add up to {MAX} officials for a side-by-side wealth comparison.</p>
      </div>

      {hashes.length < MAX && (
        <div className="relative max-w-md">
          <div className="flex items-center gap-3 rounded-lg bg-white/5 border border-white/10 px-4 py-2.5">
            <Search className="h-4 w-4 text-slate-500 shrink-0" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name…"
              className="flex-1 bg-transparent text-sm text-white placeholder-slate-600 focus:outline-none"
            />
          </div>
          {searchQ.data && searchQ.data.length > 0 && (
            <div className="absolute z-10 top-full mt-1 w-full rounded-xl bg-[#0a1628] border border-white/10 shadow-xl overflow-hidden">
              {searchQ.data.map((c) => (
                <button key={c.citizen_hash} onClick={() => add(c.citizen_hash)}
                  disabled={hashes.includes(c.citizen_hash)}
                  className="flex items-center justify-between w-full px-4 py-3 hover:bg-white/5 disabled:opacity-40 text-left transition-colors">
                  <div>
                    <p className="text-sm font-medium text-white">{c.name}</p>
                    <p className="text-xs text-slate-400">{c.citizen_type.replace('_',' ')} · {c.aadhaar_state}</p>
                  </div>
                  <Plus className="h-4 w-4 text-amber-400" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {hashes.length === 0 && (
        <p className="text-slate-500 text-sm py-12 text-center">Search for officials above to start comparing.</p>
      )}

      {hashes.length > 0 && (
        <div className={`grid gap-6 ${hashes.length === 1 ? 'max-w-sm' : hashes.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
          {hashes.map((hash) => <CompareColumn key={hash} hash={hash} onRemove={() => remove(hash)} />)}
        </div>
      )}
    </div>
  );
}
