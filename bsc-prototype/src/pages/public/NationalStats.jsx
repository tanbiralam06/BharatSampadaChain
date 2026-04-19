import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, CartesianGrid } from 'recharts'
import { TrendingUp, Shield, AlertTriangle, CheckCircle, Globe, Database, Activity } from 'lucide-react'
import stats from '../../data/nationalStats.json'
import StatCard from '../../components/StatCard'

const fmt = n => n >= 1e9 ? `₹${(n/1e9).toFixed(0)}K Cr` : n >= 1e7 ? `₹${(n/1e7).toFixed(0)} Cr` : n >= 1e5 ? `₹${(n/1e5).toFixed(1)} L` : n.toLocaleString('en-IN')

export default function NationalStats() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">National Statistics</h1>
        <p className="text-gray-500 text-sm mt-1">Aggregate data — no individual information. Last synced: {new Date(stats.last_sync).toLocaleString('en-IN')}</p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Citizens on BSC" value={stats.total_registered_nodes.toLocaleString('en-IN')} icon={Shield} accent="green" sub="Verified identity nodes" />
        <StatCard label="Properties Linked" value={stats.total_properties_on_chain.toLocaleString('en-IN')} icon={Globe} accent="blue" sub="Across 28 states" />
        <StatCard label="Total Flags Raised" value={stats.total_flagged_cases.toLocaleString('en-IN')} icon={AlertTriangle} accent="orange" sub={`${stats.total_red_flags.toLocaleString()} RED · ${stats.total_orange_flags.toLocaleString()} ORANGE`} />
        <StatCard label="Estimated Recovery" value={stats.tax_recovery_display} icon={TrendingUp} accent="amber" sub="Potential tax revenue" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Resolved Cases" value={stats.total_resolved_cases.toLocaleString('en-IN')} icon={CheckCircle} accent="green" />
        <StatCard label="Active Investigations" value={stats.active_investigations.toLocaleString('en-IN')} icon={Activity} accent="orange" />
        <StatCard label="Agencies Connected" value={stats.agencies_connected} icon={Database} accent="blue" />
        <StatCard label="Blockchain Txns" value={(stats.blockchain_transactions_total/1e6).toFixed(1)+'M'} icon={Activity} accent="purple" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monthly trend */}
        <div className="card p-5">
          <h3 className="text-white font-semibold mb-4">Monthly Flags Raised vs Resolved</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={stats.monthly_stats} margin={{left:0}}>
              <defs>
                <linearGradient id="flagRaised" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="flagResolved" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{fill:'#4b5563',fontSize:10}} axisLine={false} tickLine={false} />
              <YAxis tick={{fill:'#4b5563',fontSize:10}} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{background:'#0a1628',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'10px'}} labelStyle={{color:'#9ca3af',fontSize:'12px'}} />
              <Area type="monotone" dataKey="flags_raised" name="Flags Raised" stroke="#f59e0b" fill="url(#flagRaised)" strokeWidth={2} />
              <Area type="monotone" dataKey="flags_resolved" name="Resolved" stroke="#10b981" fill="url(#flagResolved)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Flags by type */}
        <div className="card p-5">
          <h3 className="text-white font-semibold mb-4">Flags by Anomaly Type</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={stats.flags_by_type} dataKey="value" cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3}>
                {stats.flags_by_type.map((e,i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip formatter={v=>v.toLocaleString('en-IN')} contentStyle={{background:'#0a1628',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'10px'}} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {stats.flags_by_type.map(f => (
              <div key={f.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{background:f.color}} />
                  <span className="text-gray-400">{f.name}</span>
                </div>
                <span className="text-white font-medium">{f.value.toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top flagged states */}
      <div className="card p-5">
        <h3 className="text-white font-semibold mb-4">Top States by Flagged Cases</h3>
        <div className="space-y-3">
          {stats.top_flagged_states.map(s => (
            <div key={s.state} className="flex items-center gap-3">
              <span className="text-gray-400 text-sm w-36">{s.state}</span>
              <div className="flex-1 bg-[#0d1b2a] rounded-full h-2 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-700" style={{width:`${s.pct*4}%`}} />
              </div>
              <span className="text-white text-sm font-medium w-16 text-right">{s.flags.toLocaleString('en-IN')}</span>
              <span className="text-gray-600 text-xs w-10 text-right">{s.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
