import { useParams, useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from 'recharts'
import { ArrowLeft, Building2, Wallet, AlertTriangle, TrendingUp, Calendar, MapPin, Users } from 'lucide-react'
import citizens from '../../data/citizens.json'
import flags from '../../data/anomalyFlags.json'
import FlagBadge from '../../components/FlagBadge'
import StatCard from '../../components/StatCard'

const fmt = (n) => {
  if (n >= 10000000)  return `₹${(n/10000000).toFixed(1)} Cr`
  if (n >= 100000)    return `₹${(n/100000).toFixed(1)} L`
  return `₹${(n/1000).toFixed(0)} K`
}

export default function OfficialProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const official = citizens.find(c => c.node_id === id)
  const officialFlags = flags.filter(f => f.citizen_node_id === id)

  if (!official) return (
    <div className="p-6">
      <button onClick={() => navigate(-1)} className="btn-ghost flex items-center gap-2 mb-4"><ArrowLeft size={14} />Back</button>
      <p className="text-gray-500">Official not found.</p>
    </div>
  )

  const avgSalary = 9600000 // avg MP/MLA salary over 5 yrs
  const salaryMultiple = (official.estimated_net_worth / avgSalary).toFixed(1)

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-[#0a1628] border border-white/10 rounded-xl p-3 text-xs space-y-1.5">
        <p className="text-gray-400 font-medium">{label}</p>
        {payload.map(p => (
          <div key={p.name} className="flex justify-between gap-4">
            <span style={{color: p.color}}>{p.name}</span>
            <span className="text-white font-semibold">{fmt(p.value)}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Back */}
      <button onClick={() => navigate('/public/officials')} className="flex items-center gap-2 text-gray-500 hover:text-gray-300 text-sm transition-colors">
        <ArrowLeft size={14} /> Back to Officials
      </button>

      {/* Profile header */}
      <div className="card p-6">
        <div className="flex flex-col md:flex-row md:items-start gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-700 to-gray-800 border border-white/10 flex items-center justify-center text-xl font-black text-gray-300 flex-shrink-0">
            {official.name.split(' ').slice(0,2).map(n=>n[0]).join('')}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-start gap-3">
              <div>
                <h1 className="text-2xl font-bold text-white">{official.name}</h1>
                <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm text-gray-500">
                  <span className="flex items-center gap-1"><Users size={12} />{official.position}</span>
                  <span className="flex items-center gap-1"><MapPin size={12} />{official.constituency}</span>
                  <span className="flex items-center gap-1"><Calendar size={12} />{official.years_in_office} years in office</span>
                </div>
              </div>
              <div className="ml-auto flex flex-col items-end gap-2">
                <FlagBadge status={official.anomaly_flag_status} />
                {official.party && <span className="badge-gray">{official.party}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/5">
          <div>
            <p className="text-gray-600 text-xs uppercase tracking-wider">Total Net Worth</p>
            <p className="text-amber-400 font-bold text-xl mt-1">{official.net_worth_display}</p>
          </div>
          <div>
            <p className="text-gray-600 text-xs uppercase tracking-wider">5yr Declared Income</p>
            <p className="text-blue-400 font-bold text-xl mt-1">{official.income_display}</p>
          </div>
          <div>
            <p className="text-gray-600 text-xs uppercase tracking-wider">3yr Wealth Growth</p>
            <p className={`font-bold text-xl mt-1 ${official.wealth_growth_3yr_pct > 100 ? 'text-red-400' : 'text-orange-400'}`}>+{official.wealth_growth_3yr_pct}%</p>
          </div>
          <div>
            <p className="text-gray-600 text-xs uppercase tracking-wider">vs Avg MP Salary</p>
            <p className="text-white font-bold text-xl mt-1">{salaryMultiple}×</p>
          </div>
        </div>

        {/* Source note */}
        <div className="mt-4 p-3 rounded-lg bg-blue-500/5 border border-blue-500/15 text-xs text-blue-400">
          Data sourced from: Election Commission affidavits · BSC Property Registry · BSC Financial Layer · ITR filings
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Wealth timeline */}
        <div className="card p-5 lg:col-span-2">
          <h3 className="text-white font-semibold mb-4">Wealth Growth Timeline</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={official.wealth_timeline} margin={{left: 0, right: 0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="year" tick={{fill:'#4b5563',fontSize:11}} axisLine={false} tickLine={false} />
              <YAxis tick={{fill:'#4b5563',fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v => fmt(v)} width={55} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="property_value" name="Property" stackId="a" fill="#f59e0b" radius={[0,0,0,0]} />
              <Bar dataKey="financial_assets" name="Financial" stackId="a" fill="#6366f1" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Asset breakdown */}
        <div className="card p-5">
          <h3 className="text-white font-semibold mb-4">Asset Breakdown</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={official.asset_breakdown} dataKey="value" cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={2}>
                {official.asset_breakdown.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(v) => `${v}%`} contentStyle={{background:'#0a1628',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'10px'}} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {official.asset_breakdown.map(a => (
              <div key={a.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{background:a.color}} />
                  <span className="text-gray-400">{a.name}</span>
                </div>
                <span className="text-white font-medium">{a.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Properties" value={official.property_count} icon={Building2} accent="amber" />
        <StatCard label="Bank Accounts" value={official.bank_accounts} icon={Wallet} accent="blue" />
        <StatCard label="Investments" value={official.investment_count} icon={TrendingUp} accent="green" />
        <StatCard label="Total Flags" value={officialFlags.length} icon={AlertTriangle} accent={officialFlags.length > 0 ? 'red' : 'green'} />
      </div>

      {/* Flag history */}
      {officialFlags.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5">
            <h3 className="text-white font-semibold">Anomaly Flag History</h3>
          </div>
          <div className="divide-y divide-white/3">
            {officialFlags.map(f => (
              <div key={f.flag_id} className="px-5 py-4 flex flex-col md:flex-row md:items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <FlagBadge status={f.severity} />
                    <span className="text-xs text-gray-500">{f.flag_id}</span>
                  </div>
                  <p className="text-white text-sm">{f.trigger_summary}</p>
                  <p className="text-gray-600 text-xs mt-1">Raised: {new Date(f.flag_raised_at).toLocaleDateString('en-IN')} · Agency: {f.assigned_to_agency}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`text-sm font-bold ${f.current_status === 'OPEN' ? 'text-red-400' : f.current_status === 'CLEARED' ? 'text-green-400' : 'text-orange-400'}`}>
                    {f.current_status.replace('_', ' ')}
                  </span>
                  <span className="text-gray-500 text-xs">Gap: {f.gap_display}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
