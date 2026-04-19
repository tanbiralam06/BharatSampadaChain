import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from 'recharts'
import { FileText, Eye, AlertTriangle, Download } from 'lucide-react'
import StatCard from '../../components/StatCard'

const agencyData = [
  { name: 'IT_DEPT', accesses: 4218, color: '#f59e0b' },
  { name: 'Banks',   accesses: 3841, color: '#6366f1' },
  { name: 'Citizen', accesses: 2220, color: '#10b981' },
  { name: 'ED',      accesses: 342,  color: '#ef4444' },
  { name: 'CBI',     accesses: 184,  color: '#f97316' },
  { name: 'Courts',  accesses: 112,  color: '#8b5cf6' },
]

const weeklyData = [
  { day: 'Mon', total: 1820, govt: 640, bank: 820, citizen: 360 },
  { day: 'Tue', total: 2140, govt: 740, bank: 980, citizen: 420 },
  { day: 'Wed', total: 1980, govt: 680, bank: 910, citizen: 390 },
  { day: 'Thu', total: 2420, govt: 820, bank: 1100, citizen: 500 },
  { day: 'Fri', total: 2880, govt: 980, bank: 1280, citizen: 620 },
  { day: 'Sat', total: 1440, govt: 420, bank: 720, citizen: 300 },
  { day: 'Sun', total: 1120, govt: 380, bank: 540, citizen: 200 },
]

const recentAlerts = [
  { id: 'ALT-001', type: 'Unusual Volume', desc: 'HDFC Bank accessed 340+ records in 1 hour', severity: 'YELLOW', time: '2h ago' },
  { id: 'ALT-002', type: 'Off-Hours Access', desc: 'ED accessed 12 citizen profiles at 2:34 AM', severity: 'ORANGE', time: '8h ago' },
  { id: 'ALT-003', type: 'Full Disclosure', desc: 'Court order COURT/2024/0112 triggered full disclosure for BSC-POL-001', severity: 'BLUE', time: '1d ago' },
]

export default function AuditOverview() {
  const total = agencyData.reduce((s,a)=>s+a.accesses,0)
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Audit Overview</h1>
          <p className="text-gray-500 text-sm mt-1">All data access events — tamper-proof, immutable, blockchain-backed</p>
        </div>
        <button className="btn-ghost flex items-center gap-2"><Download size={14}/>Export Report</button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Accesses Today" value="10,917" icon={Eye} accent="blue" />
        <StatCard label="This Week" value="13,800" icon={FileText} accent="amber" />
        <StatCard label="Suspicious Alerts" value="2" icon={AlertTriangle} accent="orange" sub="Requires review" />
        <StatCard label="Unique Citizens Accessed" value="4,218" icon={Eye} accent="green" />
      </div>

      {/* Weekly chart */}
      <div className="card p-5">
        <h3 className="text-white font-semibold mb-4">Weekly Access Pattern</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={weeklyData} margin={{left:0}}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="day" tick={{fill:'#4b5563',fontSize:11}} axisLine={false} tickLine={false} />
            <YAxis tick={{fill:'#4b5563',fontSize:10}} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{background:'#0a1628',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'10px'}} labelStyle={{color:'#9ca3af',fontSize:'12px'}} />
            <Bar dataKey="govt" name="Govt" stackId="a" fill="#f59e0b" />
            <Bar dataKey="bank" name="Banks" stackId="a" fill="#6366f1" />
            <Bar dataKey="citizen" name="Citizens" stackId="a" fill="#10b981" radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Access by agency */}
        <div className="card p-5">
          <h3 className="text-white font-semibold mb-4">Access by Agency (This Week)</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={agencyData} dataKey="accesses" cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3}>
                {agencyData.map((e,i)=><Cell key={i} fill={e.color}/>)}
              </Pie>
              <Tooltip formatter={v=>v.toLocaleString('en-IN')} contentStyle={{background:'#0a1628',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'10px'}} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-3">
            {agencyData.map(a=>(
              <div key={a.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{background:a.color}}/><span className="text-gray-400">{a.name}</span></div>
                <span className="text-white font-medium">{a.accesses.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Suspicious alerts */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5">
            <h3 className="text-white font-semibold">Suspicious Access Alerts</h3>
          </div>
          <div className="divide-y divide-white/3">
            {recentAlerts.map(a=>(
              <div key={a.id} className="px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={a.severity==='ORANGE'?'badge-orange':a.severity==='YELLOW'?'badge-yellow':'badge-blue'}>{a.type}</span>
                    </div>
                    <p className="text-gray-400 text-xs">{a.desc}</p>
                  </div>
                  <span className="text-gray-600 text-xs flex-shrink-0">{a.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
