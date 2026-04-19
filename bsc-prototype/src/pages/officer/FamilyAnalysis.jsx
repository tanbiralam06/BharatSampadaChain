import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Users, Building2, AlertTriangle, TrendingUp } from 'lucide-react'
import citizens from '../../data/citizens.json'
import FlagBadge from '../../components/FlagBadge'

const fmt = n => n >= 10000000 ? `₹${(n/10000000).toFixed(1)} Cr` : n >= 100000 ? `₹${(n/100000).toFixed(1)} L` : `₹${n}`

const familyNetwork = {
  'BSC-POL-002': {
    primary: 'BSC-POL-002',
    members: [
      { id: 'FAMILY-001', name: 'Sunita Singh', relation: 'Spouse', income_display: '₹1.2L/yr', property_count: 3, anomaly_flag_status: 'ORANGE', net_worth_display: '₹12 Cr', node_type: 'CITIZEN' },
      { id: 'FAMILY-002', name: 'Prashant Singh', relation: 'Son', income_display: '₹0 (student)', property_count: 2, anomaly_flag_status: 'ORANGE', net_worth_display: '₹8 Cr', node_type: 'CITIZEN' },
      { id: 'FAMILY-003', name: 'Kamla Devi', relation: 'Mother', income_display: '₹0 (retired)', property_count: 3, anomaly_flag_status: 'YELLOW', net_worth_display: '₹6 Cr', node_type: 'CITIZEN' },
    ],
    benami_risk: 87,
    combined_income: 5800000 + 120000,
    combined_property_value: 480000000,
    combined_properties: 22,
    note: 'Family members hold 8 properties. Combined family income ₹59.2L vs combined property value ₹48Cr. Benami risk score: HIGH.'
  }
}

export default function FamilyAnalysis() {
  const { id } = useParams()
  const navigate = useNavigate()
  const primary = citizens.find(c => c.node_id === id)
  const family = familyNetwork[id] || familyNetwork['BSC-POL-002']
  const allMembers = primary ? [primary, ...family.members] : family.members

  return (
    <div className="p-6 space-y-6">
      <button onClick={() => navigate(`/officer/case/${id}`)} className="flex items-center gap-2 text-gray-500 hover:text-gray-300 text-sm transition-colors">
        <ArrowLeft size={14} /> Back to Case
      </button>

      <div>
        <h1 className="text-2xl font-bold text-white">Cross-Family Analysis</h1>
        <p className="text-gray-500 text-sm mt-1">Wealth network analysis across family members for benami detection</p>
      </div>

      {/* Benami risk score */}
      <div className="card p-5 border-red-500/20 glow-red">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Benami Risk Score</p>
            <div className="flex items-end gap-3">
              <span className="text-5xl font-black text-red-400">{family.benami_risk}</span>
              <span className="text-gray-500 text-lg mb-1">/100</span>
            </div>
            <p className="text-red-400 text-sm font-semibold mt-1">HIGH RISK — Requires Investigation</p>
          </div>
          <div className="text-right">
            <p className="text-gray-500 text-xs">Combined Family Properties</p>
            <p className="text-amber-400 font-bold text-xl">{family.combined_properties}</p>
            <p className="text-gray-500 text-xs mt-2">Combined Property Value</p>
            <p className="text-amber-400 font-bold">{fmt(family.combined_property_value)}</p>
            <p className="text-gray-500 text-xs mt-2">Combined Family Income</p>
            <p className="text-green-400 font-bold">{fmt(family.combined_income)}</p>
          </div>
        </div>
        <p className="text-gray-400 text-sm mt-4 p-3 rounded-lg bg-red-500/5 border border-red-500/15">{family.note}</p>
      </div>

      {/* Network graph — visual representation */}
      <div className="card p-6">
        <h3 className="text-white font-semibold mb-6 flex items-center gap-2"><Users size={16} className="text-amber-400" />Family Wealth Network</h3>

        <div className="relative">
          {/* Center node */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              {primary && (
                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500/20 to-red-600/5 border-2 border-red-500/40 flex items-center justify-center text-2xl font-black text-red-300 glow-red">
                    {primary.name.split(' ').slice(0,2).map(n=>n[0]).join('')}
                  </div>
                  <div className="mt-2 text-center">
                    <p className="text-white font-semibold text-sm">{primary.name}</p>
                    <p className="text-gray-500 text-xs">{primary.position}</p>
                    <FlagBadge status={primary.anomaly_flag_status} />
                  </div>
                  <div className="mt-1 text-amber-400 font-bold text-sm">{primary.net_worth_display}</div>
                </div>
              )}

              {/* Connection lines (decorative SVG) */}
              <div className="absolute left-1/2 top-full w-px h-8 bg-gradient-to-b from-red-500/50 to-transparent" />
            </div>
          </div>

          {/* Family member nodes */}
          <div className="flex justify-center">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-2xl">
              {family.members.map(m => (
                <div key={m.id} className="flex flex-col items-center">
                  <div className="w-px h-8 bg-gradient-to-b from-transparent to-amber-500/30 mb-2" />
                  <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-lg font-bold border-2
                    ${m.anomaly_flag_status==='ORANGE' ? 'bg-orange-500/10 border-orange-500/30 text-orange-300' : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300'}`}>
                    {m.name.split(' ').slice(0,2).map(n=>n[0]).join('')}
                  </div>
                  <div className="mt-2 text-center">
                    <p className="text-white text-sm font-medium">{m.name}</p>
                    <p className="text-gray-500 text-xs">{m.relation}</p>
                    <FlagBadge status={m.anomaly_flag_status} />
                  </div>
                  <div className="mt-2 space-y-1 text-xs text-center">
                    <div className="text-amber-400 font-semibold">{m.net_worth_display}</div>
                    <div className="text-gray-600">{m.property_count} properties</div>
                    <div className="text-gray-600">Income: {m.income_display}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Summary table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5">
          <h3 className="text-white font-semibold">Family Wealth Summary</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left px-5 py-3 text-xs text-gray-500 uppercase">Name</th>
              <th className="text-left px-4 py-3 text-xs text-gray-500 uppercase hidden md:table-cell">Relation</th>
              <th className="text-right px-4 py-3 text-xs text-gray-500 uppercase">Net Worth</th>
              <th className="text-right px-4 py-3 text-xs text-gray-500 uppercase hidden md:table-cell">Properties</th>
              <th className="text-center px-4 py-3 text-xs text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody>
            {allMembers.map((m, i) => (
              <tr key={m.id || m.node_id} className="border-b border-white/3 hover:bg-white/2 transition-colors">
                <td className="px-5 py-3">
                  <p className="text-white text-sm font-medium">{m.name}</p>
                  {i===0 && <span className="text-xs text-red-400">Primary Subject</span>}
                </td>
                <td className="px-4 py-3 hidden md:table-cell text-gray-500 text-sm">{m.relation || 'Self'}</td>
                <td className="px-4 py-3 text-right text-amber-400 font-semibold text-sm">{m.net_worth_display}</td>
                <td className="px-4 py-3 text-right text-gray-400 text-sm hidden md:table-cell">{m.property_count}</td>
                <td className="px-4 py-3 text-center"><FlagBadge status={m.anomaly_flag_status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
