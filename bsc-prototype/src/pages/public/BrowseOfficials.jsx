import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, TrendingUp, TrendingDown, Minus, Filter, ChevronRight, Users } from 'lucide-react'
import citizens from '../../data/citizens.json'
import FlagBadge from '../../components/FlagBadge'
import StatCard from '../../components/StatCard'

const officials = citizens.filter(c => ['POLITICIAN', 'PUBLIC_OFFICIAL'].includes(c.node_type))

function trendIcon(pct) {
  if (pct > 100) return <TrendingUp size={14} className="text-red-400" />
  if (pct > 30)  return <TrendingUp size={14} className="text-orange-400" />
  if (pct > 0)   return <TrendingUp size={14} className="text-yellow-400" />
  return <Minus size={14} className="text-gray-500" />
}

export default function BrowseOfficials() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filterFlag, setFilterFlag] = useState('ALL')
  const [sortBy, setSortBy] = useState('wealth')

  const filtered = officials
    .filter(o => {
      const matchSearch = o.name.toLowerCase().includes(search.toLowerCase()) ||
        o.constituency.toLowerCase().includes(search.toLowerCase()) ||
        o.state.toLowerCase().includes(search.toLowerCase())
      const matchFlag = filterFlag === 'ALL' || o.anomaly_flag_status === filterFlag
      return matchSearch && matchFlag
    })
    .sort((a, b) => {
      if (sortBy === 'wealth') return b.estimated_net_worth - a.estimated_net_worth
      if (sortBy === 'growth') return b.wealth_growth_3yr_pct - a.wealth_growth_3yr_pct
      if (sortBy === 'flags')  return (b.anomaly_flag_status === 'RED' ? 3 : b.anomaly_flag_status === 'ORANGE' ? 2 : 1) - (a.anomaly_flag_status === 'RED' ? 3 : a.anomaly_flag_status === 'ORANGE' ? 2 : 1)
      return 0
    })

  const redCount = officials.filter(o => o.anomaly_flag_status === 'RED').length
  const orangeCount = officials.filter(o => o.anomaly_flag_status === 'ORANGE').length

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Public Officials Transparency</h1>
        <p className="text-gray-500 text-sm mt-1">Declared wealth of politicians and public officials — sourced from Election Commission affidavits and BSC registry</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Officials Registered" value={officials.length} icon={Users} accent="blue" />
        <StatCard label="RED Flags" value={redCount} icon={Filter} accent="red" sub="Serious anomalies" />
        <StatCard label="ORANGE Flags" value={orangeCount} icon={Filter} accent="orange" sub="Under review" />
        <StatCard label="Avg Wealth Growth" value="194%" sub="3-year average" accent="amber" />
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, constituency, state..."
            className="w-full bg-[#0a1628] border border-white/8 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/40 transition-colors"
          />
        </div>
        <select value={filterFlag} onChange={e => setFilterFlag(e.target.value)}
          className="bg-[#0a1628] border border-white/8 rounded-lg px-3 py-2.5 text-sm text-gray-400 focus:outline-none focus:border-amber-500/40">
          <option value="ALL">All Status</option>
          <option value="RED">RED Flag</option>
          <option value="ORANGE">ORANGE Flag</option>
          <option value="YELLOW">YELLOW Flag</option>
          <option value="CLEAR">Clear</option>
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)}
          className="bg-[#0a1628] border border-white/8 rounded-lg px-3 py-2.5 text-sm text-gray-400 focus:outline-none focus:border-amber-500/40">
          <option value="wealth">Sort: Highest Wealth</option>
          <option value="growth">Sort: Highest Growth</option>
          <option value="flags">Sort: Flag Severity</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Official</th>
              <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Position / State</th>
              <th className="text-right px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Declared Wealth</th>
              <th className="text-right px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">3yr Growth</th>
              <th className="text-center px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3.5 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((o, i) => (
              <tr
                key={o.node_id}
                onClick={() => navigate(`/public/official/${o.node_id}`)}
                className="border-b border-white/3 hover:bg-white/2 cursor-pointer transition-colors group"
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 border border-white/10 flex items-center justify-center text-xs font-bold text-gray-300 flex-shrink-0">
                      {o.name.split(' ').slice(0,2).map(n=>n[0]).join('')}
                    </div>
                    <div>
                      <div className="text-white text-sm font-medium">{o.name}</div>
                      <div className="text-gray-600 text-xs">{o.party || 'Govt. Service'}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 hidden md:table-cell">
                  <div className="text-gray-400 text-sm">{o.position}</div>
                  <div className="text-gray-600 text-xs">{o.state}</div>
                </td>
                <td className="px-4 py-4 text-right">
                  <div className="text-white font-semibold text-sm">{o.net_worth_display}</div>
                  <div className="text-gray-600 text-xs">{o.property_count} properties</div>
                </td>
                <td className="px-4 py-4 text-right hidden lg:table-cell">
                  <div className="flex items-center justify-end gap-1.5">
                    {trendIcon(o.wealth_growth_3yr_pct)}
                    <span className={`text-sm font-semibold ${o.wealth_growth_3yr_pct > 100 ? 'text-red-400' : o.wealth_growth_3yr_pct > 30 ? 'text-orange-400' : 'text-gray-400'}`}>
                      +{o.wealth_growth_3yr_pct}%
                    </span>
                  </div>
                </td>
                <td className="px-4 py-4 text-center">
                  <FlagBadge status={o.anomaly_flag_status} />
                </td>
                <td className="px-4 py-4">
                  <ChevronRight size={14} className="text-gray-700 group-hover:text-gray-400 transition-colors" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-600">No officials match your search criteria.</div>
        )}
      </div>
    </div>
  )
}
