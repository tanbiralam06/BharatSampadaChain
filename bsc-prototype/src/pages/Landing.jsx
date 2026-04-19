import { useNavigate } from 'react-router-dom'
import { useAuth, ROLES } from '../context/AuthContext'
import { Globe, User, Shield, Settings, ArrowRight, Lock, Eye, BarChart3, CheckCircle } from 'lucide-react'

const roles = [
  {
    role: ROLES.PUBLIC,
    icon: Globe,
    label: 'Public Observer',
    desc: 'View politicians\' wealth growth, compare officials, explore national statistics. No login required.',
    color: 'from-blue-500/20 to-blue-600/5',
    border: 'border-blue-500/20 hover:border-blue-400/40',
    iconColor: 'text-blue-400',
    badge: 'Open Access',
    badgeCls: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  },
  {
    role: ROLES.CITIZEN,
    icon: User,
    label: 'Citizen',
    desc: 'View your complete asset profile, track who accessed your data, and manage your transparency declarations.',
    color: 'from-green-500/20 to-green-600/5',
    border: 'border-green-500/20 hover:border-green-400/40',
    iconColor: 'text-green-400',
    badge: 'Aadhaar Login',
    badgeCls: 'bg-green-500/10 text-green-400 border-green-500/20',
  },
  {
    role: ROLES.OFFICER,
    icon: Shield,
    label: 'IT Officer',
    desc: 'Investigate flagged cases, analyze income vs asset gaps, view cross-family benami risk analysis.',
    color: 'from-amber-500/20 to-amber-600/5',
    border: 'border-amber-500/20 hover:border-amber-400/40',
    iconColor: 'text-amber-400',
    badge: 'Officer Credentials',
    badgeCls: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  },
  {
    role: ROLES.ADMIN,
    icon: Settings,
    label: 'System Admin',
    desc: 'Monitor blockchain node health, manage agency permissions, and review system-wide audit trails.',
    color: 'from-purple-500/20 to-purple-600/5',
    border: 'border-purple-500/20 hover:border-purple-400/40',
    iconColor: 'text-purple-400',
    badge: 'BSC Authority',
    badgeCls: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  },
]

const stats = [
  { label: 'Citizens on Chain', value: '8.47 L' },
  { label: 'Properties Linked', value: '32.4 L' },
  { label: 'Flags Raised', value: '18,472' },
  { label: 'Tax Recovery Est.', value: '₹8,470 Cr' },
]

export default function Landing() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const enter = (role) => {
    login(role)
    navigate('/app')
  }

  return (
    <div className="min-h-screen bg-[#03070f] relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full bg-amber-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[300px] rounded-full bg-blue-500/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[300px] rounded-full bg-green-500/4 blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-16">

        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium mb-8">
            <span className="live-dot" />
            <span>Prototype Demo — April 2024</span>
          </div>

          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <span className="text-black font-black text-xl">BSC</span>
            </div>
          </div>

          <h1 className="text-5xl md:text-6xl font-black text-white mb-4 leading-tight">
            Bharat Sampada{' '}
            <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-300 bg-clip-text text-transparent">
              Chain
            </span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
            India's Unified Blockchain Wealth Transparency System — linking every citizen's property, land, and financial assets to a single tamper-proof ledger.
          </p>

          {/* Mini stats */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-10">
            {stats.map(s => (
              <div key={s.label} className="text-center">
                <div className="text-2xl font-bold text-amber-400">{s.value}</div>
                <div className="text-gray-600 text-xs mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Role cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {roles.map(r => (
            <button
              key={r.role}
              onClick={() => enter(r.role)}
              className={`group relative bg-[#060d1a] border ${r.border} rounded-2xl p-6 text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/40 bg-gradient-to-b ${r.color}`}
            >
              <div className={`w-10 h-10 rounded-xl bg-[#0a1628] border border-white/5 flex items-center justify-center mb-4 ${r.iconColor}`}>
                <r.icon size={20} />
              </div>
              <span className={`inline-block text-xs px-2 py-0.5 rounded-full border ${r.badgeCls} mb-3`}>{r.badge}</span>
              <h3 className="text-white font-bold text-base mb-2">{r.label}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{r.desc}</p>
              <div className={`flex items-center gap-1.5 mt-5 text-sm font-medium ${r.iconColor} group-hover:gap-2.5 transition-all`}>
                <span>Enter Demo</span>
                <ArrowRight size={14} />
              </div>
            </button>
          ))}
        </div>

        {/* Feature strip */}
        <div className="card p-6 flex flex-wrap items-center justify-center gap-8">
          {[
            { icon: Lock,      label: 'ZKP Privacy — verify without revealing' },
            { icon: Eye,       label: 'Full audit trail — citizen always knows who saw their data' },
            { icon: BarChart3, label: 'Smart contract anomaly detection — automatic flagging' },
            { icon: CheckCircle, label: '100% tamper-proof — blockchain-backed' },
          ].map(f => (
            <div key={f.label} className="flex items-center gap-2.5 text-sm text-gray-500">
              <f.icon size={14} className="text-amber-500 flex-shrink-0" />
              <span>{f.label}</span>
            </div>
          ))}
        </div>

        <p className="text-center text-gray-700 text-sm mt-8">
          Built by Citizens, For Citizens — Jai Hind 🇮🇳 &nbsp;|&nbsp; Open Source MIT License
        </p>
      </div>
    </div>
  )
}
