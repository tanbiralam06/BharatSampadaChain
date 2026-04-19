import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { Building2, Wallet, TrendingUp, Eye, CheckCircle, Shield, AlertTriangle } from 'lucide-react'
import citizens from '../../data/citizens.json'
import { useAuth } from '../../context/AuthContext'
import FlagBadge from '../../components/FlagBadge'
import StatCard from '../../components/StatCard'

const fmt = (n) => {
  if (n >= 10000000) return `₹${(n/10000000).toFixed(1)} Cr`
  if (n >= 100000)   return `₹${(n/100000).toFixed(1)} L`
  return `₹${(n/1000).toFixed(0)} K`
}

export default function CitizenOverview() {
  const { user } = useAuth()
  const citizen = citizens.find(c => c.node_id === user.id) || citizens.find(c => c.node_type === 'CITIZEN')

  return (
    <div className="p-6 space-y-6">
      {/* Welcome */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Welcome, {citizen.name.split(' ')[0]}</h1>
          <p className="text-gray-500 text-sm mt-1">Your complete wealth profile on BSC — last verified {citizen.last_updated}</p>
        </div>
        <FlagBadge status={citizen.anomaly_flag_status} />
      </div>

      {/* Wallet ID */}
      <div className="card p-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <Shield size={18} className="text-amber-400" />
        </div>
        <div>
          <p className="text-gray-500 text-xs">BSC Wallet Address</p>
          <p className="text-white font-mono text-sm mt-0.5">{citizen.wallet_address}</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-full">
          <CheckCircle size={10} /> KYC Level {citizen.kyc_level}
        </div>
      </div>

      {/* Key stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Estimated Net Worth" value={citizen.net_worth_display} icon={TrendingUp} accent="amber" />
        <StatCard label="Properties" value={citizen.property_count} icon={Building2} accent="blue" />
        <StatCard label="Financial Assets" value={citizen.investment_count + citizen.bank_accounts} icon={Wallet} accent="green" />
        <StatCard label="Data Accesses" value="8" sub="Last 12 months" icon={Eye} accent={citizen.anomaly_flag_status === 'CLEAR' ? 'green' : 'orange'} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Asset breakdown donut */}
        <div className="card p-5">
          <h3 className="text-white font-semibold mb-4">Asset Breakdown</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={citizen.asset_breakdown} dataKey="value" cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={2}>
                {citizen.asset_breakdown.map((e,i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip formatter={v=>`${v}%`} contentStyle={{background:'#0a1628',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'10px'}} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {citizen.asset_breakdown.filter(a=>a.value>0).map(a => (
              <div key={a.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{background:a.color}} />
                  <span className="text-gray-400">{a.name}</span>
                </div>
                <span className="text-white font-medium">{a.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Wealth timeline */}
        <div className="card p-5 lg:col-span-2">
          <h3 className="text-white font-semibold mb-4">Wealth Growth (6 Years)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={citizen.wealth_timeline} margin={{left:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="year" tick={{fill:'#4b5563',fontSize:11}} axisLine={false} tickLine={false} />
              <YAxis tick={{fill:'#4b5563',fontSize:10}} axisLine={false} tickLine={false} tickFormatter={fmt} width={55} />
              <Tooltip formatter={fmt} contentStyle={{background:'#0a1628',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'10px'}} labelStyle={{color:'#9ca3af',fontSize:'12px'}} />
              <Bar dataKey="property_value" name="Property" stackId="a" fill="#f59e0b" />
              <Bar dataKey="financial_assets" name="Financial" stackId="a" fill="#6366f1" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Flag status panel */}
      <div className={`card p-5 border ${citizen.anomaly_flag_status === 'CLEAR' ? 'border-green-500/20 bg-green-500/3' : 'border-yellow-500/20 bg-yellow-500/3'}`}>
        <div className="flex items-center gap-3">
          {citizen.anomaly_flag_status === 'CLEAR'
            ? <CheckCircle size={20} className="text-green-400" />
            : <AlertTriangle size={20} className="text-yellow-400" />
          }
          <div>
            <p className="text-white font-semibold">
              {citizen.anomaly_flag_status === 'CLEAR' ? 'Your profile is clear' : 'You have a pending flag'}
            </p>
            <p className="text-gray-500 text-sm mt-0.5">
              {citizen.anomaly_flag_status === 'CLEAR'
                ? 'No anomalies detected. All declared assets are consistent with your income records.'
                : 'A smart contract has flagged a potential anomaly. Check the Flags tab for details.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
