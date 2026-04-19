import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Clock, TrendingUp, ChevronRight, Filter, Users, Search } from 'lucide-react'
import flags from '../../data/anomalyFlags.json'
import FlagBadge from '../../components/FlagBadge'
import { SeverityDot } from '../../components/FlagBadge'
import StatCard from '../../components/StatCard'

const sev = { RED: 3, ORANGE: 2, YELLOW: 1 }

export default function ActiveFlags() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('ALL')
  const [search, setSearch] = useState('')

  const filtered = [...flags]
    .filter(f => filter === 'ALL' || f.severity === filter)
    .filter(f => !search || f.citizen_name.toLowerCase().includes(search.toLowerCase()) || f.flag_type.toLowerCase().includes(search.toLowerCase()))
    .filter(f => f.current_status !== 'CLEARED')
    .sort((a,b) => sev[b.severity] - sev[a.severity] || b.days_open - a.days_open)

  const red = flags.filter(f => f.severity === 'RED' && f.current_status !== 'CLEARED').length
  const orange = flags.filter(f => f.severity === 'ORANGE' && f.current_status !== 'CLEARED').length
  const mine = flags.filter(f => f.assigned_officer === 'OFC-IT-007').length
  const resolved = flags.filter(f => f.current_status === 'CLEARED').length

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Active Anomaly Flags</h1>
        <p className="text-gray-500 text-sm mt-1">Priority queue sorted by severity and days open</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Open RED Flags" value={red} icon={AlertTriangle} accent="red" sub="Requires immediate action" />
        <StatCard label="Open ORANGE Flags" value={orange} icon={AlertTriangle} accent="orange" />
        <StatCard label="Assigned to Me" value={mine} icon={Users} accent="blue" />
        <StatCard label="Resolved This Month" value={resolved} icon={Filter} accent="green" />
      </div>

      <div className="flex gap-3 flex-col sm:flex-row">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name or flag type..."
            className="w-full bg-[#0a1628] border border-white/8 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/40" />
        </div>
        <div className="flex gap-2">
          {['ALL','RED','ORANGE','YELLOW'].map(s => (
            <button key={s} onClick={()=>setFilter(s)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${filter===s ? 'bg-amber-500 text-black' : 'bg-[#0a1628] border border-white/8 text-gray-400 hover:text-white'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map(f => (
          <div key={f.flag_id}
            onClick={() => navigate(`/officer/case/${f.citizen_node_id}`)}
            className={`card-hover p-5 cursor-pointer ${f.severity==='RED' ? 'glow-red border-red-500/15' : ''}`}>
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                f.severity==='RED' ? 'bg-red-500/10 border border-red-500/20' :
                f.severity==='ORANGE' ? 'bg-orange-500/10 border border-orange-500/20' :
                'bg-yellow-500/10 border border-yellow-500/20'}`}>
                <AlertTriangle size={16} className={f.severity==='RED'?'text-red-400':f.severity==='ORANGE'?'text-orange-400':'text-yellow-400'} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <FlagBadge status={f.severity} />
                  <span className="badge-gray">{f.flag_type.replace(/_/g,' ')}</span>
                  <span className="badge-gray">{f.citizen_type.replace('_',' ')}</span>
                </div>
                <p className="text-white font-semibold text-sm mt-1.5">{f.citizen_name}</p>
                <p className="text-gray-500 text-xs mt-0.5">{f.trigger_summary}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
                  <span>Gap: <span className="text-red-400 font-medium">{f.gap_display}</span></span>
                  <span>Agency: {f.assigned_to_agency}</span>
                  <span>Raised: {new Date(f.flag_raised_at).toLocaleDateString('en-IN')}</span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <span className={`text-sm font-bold ${
                  f.current_status==='OPEN' ? 'text-red-400' :
                  f.current_status==='ESCALATED' ? 'text-orange-400' :
                  f.current_status==='EXPLANATION_RECEIVED' ? 'text-yellow-400' : 'text-green-400'
                }`}>{f.current_status.replace(/_/g,' ')}</span>
                {f.days_open > 0 && (
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <Clock size={10} />
                    <span>{f.days_open}d open</span>
                  </div>
                )}
                <ChevronRight size={14} className="text-gray-600" />
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="card p-12 text-center text-gray-600">No flags match your filter criteria.</div>
        )}
      </div>
    </div>
  )
}
