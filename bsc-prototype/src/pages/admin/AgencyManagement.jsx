import { useState } from 'react'
import { Shield, CheckCircle, XCircle, Key, Eye } from 'lucide-react'

const initialAgencies = [
  { id: 'AG-001', name: 'Income Tax Department', code: 'IT_DEPT', permissions: ['VIEW_INCOME', 'VIEW_ASSETS', 'RAISE_FLAG', 'VIEW_PROPERTY'], enabled: true, accesses_today: 142, last_access: '10 min ago' },
  { id: 'AG-002', name: 'Enforcement Directorate', code: 'ED', permissions: ['VIEW_INCOME', 'VIEW_ASSETS', 'FULL_DISCLOSURE'], enabled: true, accesses_today: 34, last_access: '2h ago' },
  { id: 'AG-003', name: 'Central Bureau of Investigation', code: 'CBI', permissions: ['FULL_DISCLOSURE', 'RAISE_FLAG'], enabled: true, accesses_today: 18, last_access: '4h ago' },
  { id: 'AG-004', name: 'Supreme Court / High Court', code: 'COURT', permissions: ['FULL_DISCLOSURE'], enabled: true, accesses_today: 7, last_access: '6h ago' },
  { id: 'AG-005', name: 'HDFC Bank', code: 'BANK_HDFC', permissions: ['CREDIT_SCORE'], enabled: true, accesses_today: 892, last_access: '5 min ago' },
  { id: 'AG-006', name: 'SBI', code: 'BANK_SBI', permissions: ['CREDIT_SCORE'], enabled: true, accesses_today: 1240, last_access: '2 min ago' },
  { id: 'AG-007', name: 'Lokpal', code: 'LOKPAL', permissions: ['VIEW_OFFICIALS', 'VIEW_ASSETS', 'RAISE_FLAG'], enabled: false, accesses_today: 0, last_access: 'Disabled' },
  { id: 'AG-008', name: 'Election Commission of India', code: 'ECI', permissions: ['VIEW_OFFICIALS'], enabled: true, accesses_today: 22, last_access: '1d ago' },
]

export default function AgencyManagement() {
  const [agencies, setAgencies] = useState(initialAgencies)
  const toggle = (id) => setAgencies(a => a.map(ag => ag.id===id ? {...ag, enabled:!ag.enabled} : ag))

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Agency Management</h1>
        <p className="text-gray-500 text-sm mt-1">Manage authorized agencies and their data access permissions</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-white">{agencies.filter(a=>a.enabled).length}</p>
          <p className="text-gray-500 text-xs mt-1">Active Agencies</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-amber-400">{agencies.reduce((s,a)=>s+a.accesses_today,0).toLocaleString()}</p>
          <p className="text-gray-500 text-xs mt-1">Accesses Today</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-red-400">{agencies.filter(a=>!a.enabled).length}</p>
          <p className="text-gray-500 text-xs mt-1">Disabled</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left px-5 py-3.5 text-xs text-gray-500 uppercase">Agency</th>
              <th className="text-left px-4 py-3.5 text-xs text-gray-500 uppercase hidden lg:table-cell">Permissions</th>
              <th className="text-right px-4 py-3.5 text-xs text-gray-500 uppercase hidden md:table-cell">Today</th>
              <th className="text-right px-4 py-3.5 text-xs text-gray-500 uppercase hidden md:table-cell">Last Access</th>
              <th className="text-center px-4 py-3.5 text-xs text-gray-500 uppercase">Status</th>
              <th className="text-center px-4 py-3.5 text-xs text-gray-500 uppercase">Toggle</th>
            </tr>
          </thead>
          <tbody>
            {agencies.map(ag => (
              <tr key={ag.id} className="border-b border-white/3 hover:bg-white/2 transition-colors">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                      <Shield size={13} className="text-amber-400" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{ag.name}</p>
                      <p className="text-gray-600 text-xs font-mono">{ag.code}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 hidden lg:table-cell">
                  <div className="flex flex-wrap gap-1">
                    {ag.permissions.slice(0,3).map(p => (
                      <span key={p} className="badge-gray text-xs">{p.replace(/_/g,' ')}</span>
                    ))}
                    {ag.permissions.length > 3 && <span className="badge-gray text-xs">+{ag.permissions.length-3}</span>}
                  </div>
                </td>
                <td className="px-4 py-4 text-right hidden md:table-cell">
                  <span className="text-white text-sm">{ag.accesses_today.toLocaleString()}</span>
                </td>
                <td className="px-4 py-4 text-right hidden md:table-cell">
                  <span className="text-gray-500 text-sm">{ag.last_access}</span>
                </td>
                <td className="px-4 py-4 text-center">
                  {ag.enabled
                    ? <span className="badge-green"><CheckCircle size={10}/>Active</span>
                    : <span className="badge-red"><XCircle size={10}/>Disabled</span>
                  }
                </td>
                <td className="px-4 py-4 text-center">
                  <button onClick={() => toggle(ag.id)}
                    className={`relative w-10 h-5 rounded-full transition-all duration-200 ${ag.enabled ? 'bg-green-500' : 'bg-gray-700'}`}>
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${ag.enabled ? 'left-5.5' : 'left-0.5'}`} style={{left: ag.enabled ? '22px' : '2px'}} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
