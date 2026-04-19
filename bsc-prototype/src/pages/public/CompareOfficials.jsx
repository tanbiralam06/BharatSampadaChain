import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Plus, X, TrendingUp } from 'lucide-react'
import citizens from '../../data/citizens.json'
import FlagBadge from '../../components/FlagBadge'

const officials = citizens.filter(c => ['POLITICIAN', 'PUBLIC_OFFICIAL'].includes(c.node_type))
const COLORS = ['#f59e0b', '#6366f1', '#10b981']

const fmt = (n) => {
  if (n >= 10000000) return `₹${(n/10000000).toFixed(1)} Cr`
  if (n >= 100000)   return `₹${(n/100000).toFixed(1)} L`
  return `₹${n}`
}

export default function CompareOfficials() {
  const [selected, setSelected] = useState([officials[0], officials[1]])

  const add = (id) => {
    const o = officials.find(x => x.node_id === id)
    if (o && selected.length < 3 && !selected.find(s => s.node_id === id)) {
      setSelected([...selected, o])
    }
  }
  const remove = (id) => setSelected(selected.filter(s => s.node_id !== id))

  const available = officials.filter(o => !selected.find(s => s.node_id === o.node_id))

  // Build comparison timeline data
  const years = [2019, 2020, 2021, 2022, 2023, 2024]
  const timelineData = years.map(yr => {
    const row = { year: yr }
    selected.forEach((o, i) => {
      const point = o.wealth_timeline.find(t => t.year === yr)
      row[`nw_${i}`] = point?.net_worth || 0
    })
    return row
  })

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Compare Officials</h1>
        <p className="text-gray-500 text-sm mt-1">Side-by-side wealth comparison of up to 3 officials</p>
      </div>

      {/* Selection */}
      <div className="flex flex-wrap gap-3 items-center">
        {selected.map((o, i) => (
          <div key={o.node_id} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-[#0a1628] text-sm">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{background: COLORS[i]}} />
            <span className="text-white">{o.name}</span>
            <button onClick={() => remove(o.node_id)} className="text-gray-600 hover:text-red-400 ml-1"><X size={12} /></button>
          </div>
        ))}
        {selected.length < 3 && (
          <select onChange={e => { add(e.target.value); e.target.value = '' }}
            className="bg-[#0a1628] border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-400 focus:outline-none focus:border-amber-500/40">
            <option value="">+ Add official</option>
            {available.map(o => <option key={o.node_id} value={o.node_id}>{o.name}</option>)}
          </select>
        )}
      </div>

      {/* Timeline chart */}
      <div className="card p-5">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><TrendingUp size={16} className="text-amber-400" />Net Worth Growth Comparison</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={timelineData} margin={{left:0}}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="year" tick={{fill:'#4b5563',fontSize:11}} axisLine={false} tickLine={false} />
            <YAxis tick={{fill:'#4b5563',fontSize:10}} axisLine={false} tickLine={false} tickFormatter={fmt} width={62} />
            <Tooltip formatter={fmt} contentStyle={{background:'#0a1628',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'10px'}} labelStyle={{color:'#9ca3af',fontSize:'12px'}} />
            {selected.map((o, i) => (
              <Bar key={i} dataKey={`nw_${i}`} name={o.name.split(' ')[0]} fill={COLORS[i]} radius={[3,3,0,0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Side-by-side stats */}
      <div className={`grid gap-4 ${selected.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
        {selected.map((o, i) => (
          <div key={o.node_id} className="card p-5 space-y-4" style={{borderColor: COLORS[i]+'33'}}>
            <div className="flex items-start justify-between">
              <div>
                <div className="w-3 h-3 rounded-full mb-2" style={{background: COLORS[i]}} />
                <h3 className="text-white font-bold text-sm leading-tight">{o.name}</h3>
                <p className="text-gray-500 text-xs mt-0.5">{o.position}</p>
                <p className="text-gray-600 text-xs">{o.state}</p>
              </div>
              <FlagBadge status={o.anomaly_flag_status} />
            </div>

            <div className="space-y-3 pt-3 border-t border-white/5">
              {[
                ['Net Worth', o.net_worth_display],
                ['5yr Income', o.income_display],
                ['3yr Growth', `+${o.wealth_growth_3yr_pct}%`],
                ['Properties', o.property_count],
                ['Investments', o.investment_count],
                ['Businesses', o.business_count],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">{label}</span>
                  <span className="text-white font-medium">{val}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
