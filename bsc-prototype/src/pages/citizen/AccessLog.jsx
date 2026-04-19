import { Eye, User, Building, Scale, CreditCard, Shield, AlertCircle } from 'lucide-react'
import logs from '../../data/accessLogs.json'

const agencyIcon = {
  IT_DEPT:      { icon: Shield,    cls: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  ED:           { icon: Shield,    cls: 'text-red-400 bg-red-500/10 border-red-500/20' },
  CBI:          { icon: Shield,    cls: 'text-red-400 bg-red-500/10 border-red-500/20' },
  COURT:        { icon: Scale,     cls: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  BANK:         { icon: CreditCard,cls: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  CITIZEN_SELF: { icon: User,      cls: 'text-green-400 bg-green-500/10 border-green-500/20' },
  ADMIN:        { icon: Building,  cls: 'text-gray-400 bg-gray-500/10 border-gray-500/20' },
}

const accessTypeLabel = {
  VIEW:          { label: 'Viewed', cls: 'badge-blue' },
  EXPORT:        { label: 'Exported', cls: 'badge-orange' },
  FLAG_RAISED:   { label: 'Flag Raised', cls: 'badge-red' },
  FLAG_CLEARED:  { label: 'Flag Cleared', cls: 'badge-green' },
  FULL_DISCLOSURE:{label: 'Full Disclosure', cls: 'badge-red' },
}

export default function AccessLog() {
  const citizenLogs = [...logs].sort((a,b) => new Date(b.accessed_at)-new Date(a.accessed_at))
  const selfCount = citizenLogs.filter(l => l.accessing_agency === 'CITIZEN_SELF').length
  const govtCount = citizenLogs.filter(l => l.accessing_agency !== 'CITIZEN_SELF').length

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Data Access Log</h1>
        <p className="text-gray-500 text-sm mt-1">Every time your data was accessed — tamper-proof, recorded on blockchain</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-white">{citizenLogs.length}</p>
          <p className="text-gray-500 text-xs mt-1">Total Accesses</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-amber-400">{govtCount}</p>
          <p className="text-gray-500 text-xs mt-1">Government Access</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-green-400">{selfCount}</p>
          <p className="text-gray-500 text-xs mt-1">Self Access</p>
        </div>
      </div>

      {/* Info banner */}
      <div className="card p-4 flex items-start gap-3 border-green-500/20 bg-green-500/3">
        <Eye size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-green-300 text-sm font-semibold">Right to Know — Guaranteed by BSC</p>
          <p className="text-gray-500 text-xs mt-0.5">You are notified within 1 hour of any government access to your data. Every access is immutably recorded on blockchain. You can report suspicious access below.</p>
        </div>
      </div>

      {/* Log list */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-white/5 flex items-center justify-between">
          <span className="text-white font-semibold text-sm">Access History</span>
          <span className="text-gray-600 text-xs">Newest first</span>
        </div>
        <div className="divide-y divide-white/3">
          {citizenLogs.map(log => {
            const ag = agencyIcon[log.accessing_agency] || agencyIcon.ADMIN
            const at = accessTypeLabel[log.access_type] || { label: log.access_type, cls: 'badge-gray' }
            return (
              <div key={log.log_id} className="px-5 py-4 flex items-start gap-4 hover:bg-white/2 transition-colors">
                <div className={`w-9 h-9 rounded-xl border flex items-center justify-center flex-shrink-0 mt-0.5 ${ag.cls}`}>
                  <ag.icon size={15} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white text-sm font-medium">{log.accessed_by_name}</span>
                    <span className={at.cls}>{at.label}</span>
                  </div>
                  <p className="text-gray-500 text-xs mt-1">{log.purpose}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-700">
                    <span>Ref: {log.authorization_ref}</span>
                    <span>Fields: {log.data_fields_accessed.join(', ')}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-gray-400 text-xs">{new Date(log.accessed_at).toLocaleDateString('en-IN')}</p>
                  <p className="text-gray-600 text-xs mt-0.5">{new Date(log.accessed_at).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}</p>
                  {log.accessing_agency !== 'CITIZEN_SELF' && log.accessing_agency !== 'ADMIN' && (
                    <button className="mt-2 text-xs text-red-500/60 hover:text-red-400 transition-colors flex items-center gap-1 ml-auto">
                      <AlertCircle size={10} /> Report
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
