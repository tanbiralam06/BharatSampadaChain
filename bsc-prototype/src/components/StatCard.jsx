import { TrendingUp, TrendingDown } from 'lucide-react'

export default function StatCard({ label, value, sub, trend, trendUp, icon: Icon, accent = 'amber', className = '' }) {
  const accents = {
    amber:  'text-amber-400',
    red:    'text-red-400',
    green:  'text-green-400',
    blue:   'text-blue-400',
    purple: 'text-purple-400',
    orange: 'text-orange-400',
  }
  return (
    <div className={`card p-5 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">{label}</p>
          <p className={`text-2xl font-bold mt-1.5 ${accents[accent] || accents.amber}`}>{value}</p>
          {sub && <p className="text-gray-600 text-xs mt-1">{sub}</p>}
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-xs ${trendUp ? 'text-red-400' : 'text-green-400'}`}>
              {trendUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              <span>{trend}</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={`w-9 h-9 rounded-lg bg-white/3 border border-white/5 flex items-center justify-center ${accents[accent]}`}>
            <Icon size={16} />
          </div>
        )}
      </div>
    </div>
  )
}
