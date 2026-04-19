import { Wallet, TrendingUp, Shield, CreditCard, PiggyBank, BarChart2, CheckCircle, Clock } from 'lucide-react'
import assets from '../../data/financialAssets.json'
import { useAuth } from '../../context/AuthContext'

const typeIcon = {
  BANK_ACCOUNT: CreditCard,
  FD: PiggyBank,
  MUTUAL_FUND: TrendingUp,
  STOCKS: BarChart2,
  DEMAT: BarChart2,
  PPF: Shield,
  EPF: Shield,
  NPS: Shield,
  INSURANCE: Shield,
  CRYPTO: Wallet,
  FOREIGN_ASSET: Wallet,
}
const typeColor = {
  BANK_ACCOUNT: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  FD:           'text-green-400 bg-green-500/10 border-green-500/20',
  MUTUAL_FUND:  'text-amber-400 bg-amber-500/10 border-amber-500/20',
  STOCKS:       'text-purple-400 bg-purple-500/10 border-purple-500/20',
  EPF:          'text-teal-400 bg-teal-500/10 border-teal-500/20',
  NPS:          'text-teal-400 bg-teal-500/10 border-teal-500/20',
  FOREIGN_ASSET:'text-red-400 bg-red-500/10 border-red-500/20',
  DEFAULT:      'text-gray-400 bg-gray-500/10 border-gray-500/20',
}
const rangeLabel = {
  UNDER_1L:     '< ₹1 L',
  '1L_TO_10L':  '₹1 L – ₹10 L',
  '10L_TO_1CR': '₹10 L – ₹1 Cr',
  '1CR_TO_10CR':'₹1 Cr – ₹10 Cr',
  '10CR_TO_100CR':'₹10 Cr – ₹100 Cr',
  ABOVE_100CR:  '> ₹100 Cr',
}
const verifyCfg = {
  AGENCY_VERIFIED: { cls: 'badge-green',  icon: CheckCircle, label: 'Agency Verified' },
  SELF_DECLARED:   { cls: 'badge-yellow', icon: Clock,       label: 'Self-Declared' },
  AUDITED:         { cls: 'badge-blue',   icon: Shield,      label: 'Audited' },
}

export default function MyFinancial() {
  const { user } = useAuth()
  const myAssets = assets.filter(a => a.owner_node_id === user.id)

  const grouped = myAssets.reduce((acc, a) => {
    const g = a.asset_type
    if (!acc[g]) acc[g] = []
    acc[g].push(a)
    return acc
  }, {})

  const totalApprox = myAssets.reduce((s, a) => s + a.approximate_value, 0)
  const fmt = n => n >= 10000000 ? `₹${(n/10000000).toFixed(2)} Cr` : `₹${(n/100000).toFixed(2)} L`

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Financial Assets</h1>
          <p className="text-gray-500 text-sm mt-1">All financial holdings linked to your BSC identity node</p>
        </div>
        <div className="text-right">
          <p className="text-gray-500 text-xs">Approx. Total</p>
          <p className="text-green-400 font-bold text-xl">{fmt(totalApprox)}</p>
        </div>
      </div>

      {/* Privacy note */}
      <div className="card p-4 flex items-start gap-3 border-blue-500/20 bg-blue-500/3">
        <Shield size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
        <p className="text-blue-300 text-sm">
          <span className="font-semibold">Privacy protected:</span> Exact balances are never stored on BSC — only anonymized ranges. Approximate values shown are midpoints for anomaly calculation only.
        </p>
      </div>

      {myAssets.length === 0 ? (
        <div className="card p-12 text-center">
          <Wallet size={40} className="text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500">No financial assets linked yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([type, assetList]) => {
            const Icon = typeIcon[type] || Wallet
            const color = typeColor[type] || typeColor.DEFAULT
            return (
              <div key={type} className="card overflow-hidden">
                <div className={`px-5 py-3 border-b border-white/5 flex items-center gap-3`}>
                  <div className={`w-7 h-7 rounded-lg border flex items-center justify-center ${color}`}>
                    <Icon size={13} />
                  </div>
                  <span className="text-white font-medium text-sm">{type.replace(/_/g,' ')}</span>
                  <span className="ml-auto text-gray-600 text-xs">{assetList.length} {assetList.length===1?'account':'accounts'}</span>
                </div>
                <div className="divide-y divide-white/3">
                  {assetList.map(a => {
                    const vc = verifyCfg[a.verification_status]
                    return (
                      <div key={a.asset_id} className="px-5 py-4 flex items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium">{a.institution_name}</p>
                          <p className="text-gray-600 text-xs mt-0.5">
                            As of: {new Date(a.as_of_date).toLocaleDateString('en-IN')}
                            {a.is_joint_account && <span className="ml-2 text-yellow-500">Joint Account</span>}
                          </p>
                        </div>
                        <div className="text-center hidden md:block">
                          <span className={vc.cls}><vc.icon size={10}/>{vc.label}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-white text-sm font-semibold">{rangeLabel[a.balance_range] || a.balance_range}</p>
                          <p className="text-gray-600 text-xs mt-0.5">≈ {fmt(a.approximate_value)}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
