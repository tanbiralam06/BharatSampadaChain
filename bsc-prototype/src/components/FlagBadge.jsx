import { AlertTriangle, CheckCircle, AlertCircle, Info } from 'lucide-react'

export default function FlagBadge({ status, size = 'sm' }) {
  const cfg = {
    RED:    { cls: 'badge-red',    icon: AlertTriangle, label: 'RED FLAG' },
    ORANGE: { cls: 'badge-orange', icon: AlertCircle,   label: 'ORANGE FLAG' },
    YELLOW: { cls: 'badge-yellow', icon: Info,          label: 'YELLOW FLAG' },
    CLEAR:  { cls: 'badge-green',  icon: CheckCircle,   label: 'CLEAR' },
    UNDER_INVESTIGATION: { cls: 'badge-orange', icon: AlertCircle, label: 'INVESTIGATING' },
  }
  const c = cfg[status] || cfg.CLEAR
  return (
    <span className={c.cls}>
      <c.icon size={10} />
      {c.label}
    </span>
  )
}

export function SeverityDot({ severity }) {
  const colors = { RED: 'bg-red-500', ORANGE: 'bg-orange-500', YELLOW: 'bg-yellow-500', CLEAR: 'bg-green-500' }
  return <span className={`inline-block w-2 h-2 rounded-full ${colors[severity] || 'bg-gray-500'} flex-shrink-0`} />
}
