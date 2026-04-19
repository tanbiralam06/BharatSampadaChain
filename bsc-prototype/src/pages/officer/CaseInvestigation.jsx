import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts'
import { ArrowLeft, AlertTriangle, TrendingUp, FileText, CheckCircle, ArrowUpRight, Users } from 'lucide-react'
import citizens from '../../data/citizens.json'
import flags from '../../data/anomalyFlags.json'
import FlagBadge from '../../components/FlagBadge'

const fmt = n => n >= 10000000 ? `₹${(n/10000000).toFixed(1)} Cr` : n >= 100000 ? `₹${(n/100000).toFixed(1)} L` : `₹${n}`

export default function CaseInvestigation() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [invRef, setInvRef] = useState('ITINV/2024/0089')
  const [unlocked, setUnlocked] = useState(false)
  const [action, setAction] = useState(null)

  const citizen = citizens.find(c => c.node_id === id)
  const caseFlags = flags.filter(f => f.citizen_node_id === id)
  const primaryFlag = caseFlags.find(f => f.severity === 'RED') || caseFlags[0]

  if (!citizen) return (
    <div className="p-6">
      <button onClick={() => navigate(-1)} className="btn-ghost flex items-center gap-2 mb-4"><ArrowLeft size={14}/>Back</button>
      <p className="text-gray-500">Case not found.</p>
    </div>
  )

  // Build gap analysis chart
  const gapData = citizen.wealth_timeline.map(t => ({
    year: t.year,
    'Cumulative Income': t.year === 2019 ? 840000 : t.year === 2020 ? 1680000 : t.year === 2021 ? 2520000 : t.year === 2022 ? 3360000 : t.year === 2023 ? 4200000 : 4200000,
    'Net Worth': t.net_worth,
    gap: t.net_worth - (t.year <= 2024 ? Math.min(t.year - 2018, 5) * 840000 : 4200000),
  }))

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/officer/flags')} className="flex items-center gap-2 text-gray-500 hover:text-gray-300 text-sm transition-colors">
          <ArrowLeft size={14} /> Active Flags
        </button>
        <span className="text-gray-700">/</span>
        <span className="text-gray-400 text-sm">{citizen.name}</span>
      </div>

      {/* Case header */}
      <div className="card p-5 border-red-500/15 glow-red">
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <FlagBadge status={citizen.anomaly_flag_status} />
              <span className="text-gray-500 text-xs">Case: {primaryFlag?.flag_id}</span>
            </div>
            <h1 className="text-xl font-bold text-white">{citizen.name}</h1>
            <p className="text-gray-500 text-sm">{citizen.position} · {citizen.constituency} · {citizen.party}</p>
          </div>
          <div className="text-right">
            <p className="text-red-400 font-black text-2xl">{citizen.net_worth_display}</p>
            <p className="text-gray-600 text-xs">vs {citizen.income_display}</p>
            <p className="text-red-400 font-bold text-sm mt-1">+{citizen.wealth_growth_3yr_pct}% in 3 years</p>
          </div>
        </div>

        {/* Rules triggered */}
        {primaryFlag && (
          <div className="mt-4 pt-4 border-t border-white/5">
            <p className="text-gray-500 text-xs mb-2">Smart Contract Rules Triggered:</p>
            <div className="flex flex-wrap gap-2">
              {primaryFlag.rules_triggered.map(r => (
                <span key={r} className="badge-red text-xs">{r}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Investigation unlock */}
      {!unlocked ? (
        <div className="card p-5">
          <h3 className="text-white font-semibold mb-3">Enter Investigation Reference to Access Full Profile</h3>
          <div className="flex gap-3">
            <input value={invRef} onChange={e=>setInvRef(e.target.value)}
              placeholder="e.g. ITINV/2024/0089"
              className="flex-1 bg-[#060d1a] border border-white/8 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/40" />
            <button onClick={() => invRef.length > 5 && setUnlocked(true)} className="btn-primary">
              Unlock Case
            </button>
          </div>
          <p className="text-gray-600 text-xs mt-2">Every access is logged to blockchain with your officer ID and this reference number.</p>
        </div>
      ) : (
        <>
          <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 text-xs text-amber-400 flex items-center gap-2">
            <CheckCircle size={12} /> Access granted with ref: {invRef} — this access has been logged to blockchain (Officer: OFC-IT-007)
          </div>

          {/* Gap analysis chart */}
          <div className="card p-5">
            <h3 className="text-white font-semibold mb-1 flex items-center gap-2">
              <AlertTriangle size={16} className="text-red-400" /> Income vs Net Worth Gap Analysis
            </h3>
            <p className="text-gray-500 text-xs mb-4">Cumulative declared income vs actual net worth — gap represents unexplained wealth</p>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={gapData} margin={{left:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="year" tick={{fill:'#4b5563',fontSize:11}} axisLine={false} tickLine={false} />
                <YAxis tick={{fill:'#4b5563',fontSize:10}} axisLine={false} tickLine={false} tickFormatter={fmt} width={60} />
                <Tooltip formatter={fmt} contentStyle={{background:'#0a1628',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'10px'}} labelStyle={{color:'#9ca3af',fontSize:'12px'}} />
                <Bar dataKey="Cumulative Income" fill="#6366f1" radius={[3,3,0,0]} />
                <Bar dataKey="Net Worth" fill="#ef4444" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-6 mt-3 text-xs text-gray-500">
              <div className="flex items-center gap-2"><span className="w-2 h-2 rounded bg-indigo-500"/><span>Declared Income</span></div>
              <div className="flex items-center gap-2"><span className="w-2 h-2 rounded bg-red-500"/><span>Actual Net Worth</span></div>
            </div>
          </div>

          {/* Flags detail */}
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5">
              <h3 className="text-white font-semibold">Case Flags ({caseFlags.length})</h3>
            </div>
            <div className="divide-y divide-white/3">
              {caseFlags.map(f => (
                <div key={f.flag_id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <FlagBadge status={f.severity} />
                        <span className="text-xs text-gray-500">{f.flag_id}</span>
                      </div>
                      <p className="text-white text-sm font-medium">{f.flag_type.replace(/_/g,' ')}</p>
                      <p className="text-gray-400 text-xs mt-1">{f.trigger_summary}</p>
                      {f.resolution_notes && (
                        <p className="text-yellow-400 text-xs mt-1.5 p-2 rounded bg-yellow-500/5 border border-yellow-500/10">Explanation: {f.resolution_notes}</p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-red-400 font-bold text-sm">{f.gap_display}</p>
                      <p className="text-gray-600 text-xs">unexplained</p>
                      <p className={`text-xs mt-2 font-semibold ${f.current_status==='OPEN'?'text-red-400':f.current_status==='ESCALATED'?'text-orange-400':'text-yellow-400'}`}>
                        {f.current_status.replace(/_/g,' ')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action panel */}
          <div className="card p-5">
            <h3 className="text-white font-semibold mb-4">Case Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Request Documents', cls: 'btn-ghost', icon: FileText },
                { label: 'Escalate to ED/CBI', cls: 'btn-danger', icon: ArrowUpRight },
                { label: 'Cross-Family Analysis', cls: 'btn-ghost', icon: Users,
                  action: () => navigate(`/officer/family/${id}`) },
                { label: 'Clear Flag', cls: 'btn-success', icon: CheckCircle },
              ].map(a => (
                <button key={a.label} className={`${a.cls} flex items-center justify-center gap-2`}
                  onClick={() => { if(a.action) a.action(); else setAction(a.label) }}>
                  <a.icon size={14} />{a.label}
                </button>
              ))}
            </div>
            {action && (
              <div className="mt-3 p-3 rounded-lg bg-green-500/5 border border-green-500/20 text-green-400 text-xs">
                Action "{action}" recorded in case log. Reference: {invRef} — {new Date().toLocaleString('en-IN')}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
