import { useState } from 'react'
import { Building2, MapPin, Calendar, Hash, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import properties from '../../data/properties.json'
import { useAuth } from '../../context/AuthContext'

const statusCfg = {
  CLEAR:      { cls: 'badge-green',  icon: CheckCircle,  label: 'Clear' },
  MORTGAGED:  { cls: 'badge-yellow', icon: Clock,        label: 'Mortgaged' },
  DISPUTED:   { cls: 'badge-red',    icon: AlertCircle,  label: 'Disputed' },
  COURT_STAY: { cls: 'badge-red',    icon: AlertCircle,  label: 'Court Stay' },
}
const typeColors = {
  RESIDENTIAL: 'text-blue-400',
  COMMERCIAL:  'text-amber-400',
  AGRICULTURAL_LAND: 'text-green-400',
  INDUSTRIAL:  'text-purple-400',
  PLOT:        'text-orange-400',
}

export default function MyProperties() {
  const { user } = useAuth()
  const myProps = properties.filter(p => p.owner_node_id === user.id)
  const [expanded, setExpanded] = useState(null)

  const total = myProps.reduce((s, p) => s + p.declared_value, 0)
  const fmt = (n) => n >= 10000000 ? `₹${(n/10000000).toFixed(2)} Cr` : `₹${(n/100000).toFixed(2)} L`

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">My Properties</h1>
          <p className="text-gray-500 text-sm mt-1">All property records linked to your BSC identity node</p>
        </div>
        <div className="text-right">
          <p className="text-gray-500 text-xs">Total Declared Value</p>
          <p className="text-amber-400 font-bold text-xl">{fmt(total)}</p>
        </div>
      </div>

      {myProps.length === 0 ? (
        <div className="card p-12 text-center">
          <Building2 size={40} className="text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500">No properties linked to your BSC node yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {myProps.map(p => {
            const sc = statusCfg[p.encumbrance_status] || statusCfg.CLEAR
            const isOpen = expanded === p.property_id
            const gap = ((p.market_estimate - p.declared_value) / p.declared_value * 100).toFixed(1)

            return (
              <div key={p.property_id} className={`card overflow-hidden transition-all duration-200 ${isOpen ? 'border-amber-500/20' : ''}`}>
                <div className="p-5 cursor-pointer" onClick={() => setExpanded(isOpen ? null : p.property_id)}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                        <Building2 size={16} className="text-amber-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs font-semibold ${typeColors[p.property_type] || 'text-gray-400'}`}>{p.property_type.replace('_', ' ')}</span>
                          <span className={sc.cls}><sc.icon size={10}/>{sc.label}</span>
                        </div>
                        <p className="text-white font-medium text-sm mt-1 truncate">{p.address}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          <span className="flex items-center gap-1"><MapPin size={10}/>{p.district}, {p.state}</span>
                          <span>{p.area_sqft.toLocaleString('en-IN')} sq.ft</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-white font-bold">{fmt(p.declared_value)}</p>
                      <p className="text-gray-600 text-xs mt-0.5">Declared</p>
                    </div>
                  </div>
                </div>

                {isOpen && (
                  <div className="border-t border-white/5 p-5 bg-white/1 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    {[
                      ['Registration No.', p.registration_number],
                      ['Survey Number', p.survey_number],
                      ['Registration Date', new Date(p.registration_date).toLocaleDateString('en-IN')],
                      ['Declared Value', fmt(p.declared_value)],
                      ['Circle Rate Value', fmt(p.circle_rate_value)],
                      ['Market Estimate', fmt(p.market_estimate)],
                      ['Transfer Type', p.transfer_type.replace('_',' ')],
                      ['Stamp Duty Paid', fmt(p.stamp_duty_paid)],
                      ['Market Premium', `+${gap}% over declared`],
                    ].map(([label, val]) => (
                      <div key={label}>
                        <p className="text-gray-600 text-xs">{label}</p>
                        <p className="text-white mt-0.5 font-medium">{val}</p>
                      </div>
                    ))}
                    <div className="col-span-full">
                      <p className="text-gray-600 text-xs">Blockchain TX Hash</p>
                      <p className="text-gray-400 font-mono text-xs mt-0.5">{p.blockchain_tx_hash}</p>
                    </div>
                    {p.encumbrance_status === 'MORTGAGED' && (
                      <div className="col-span-full p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20 text-xs text-yellow-400">
                        Mortgaged — Outstanding loan: {fmt(p.mortgage_amount)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
