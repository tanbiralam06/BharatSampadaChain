import { CheckCircle, AlertTriangle, FileText, Upload } from 'lucide-react'
import FlagBadge from '../../components/FlagBadge'

export default function MyFlags() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">My Anomaly Flags</h1>
        <p className="text-gray-500 text-sm mt-1">Smart contract flags raised against your wealth profile</p>
      </div>

      {/* Clear status */}
      <div className="card p-8 text-center border-green-500/20 bg-green-500/3">
        <CheckCircle size={48} className="text-green-400 mx-auto mb-4" />
        <h2 className="text-white font-bold text-xl mb-2">Your Profile is Clear</h2>
        <p className="text-gray-400 text-sm max-w-md mx-auto">
          All smart contract rules have been run against your asset profile. No anomalies detected. Your declared income is consistent with your asset holdings.
        </p>
        <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          Last checked: 18 Apr 2024, 06:00 AM
        </div>
      </div>

      {/* ZKP verification panel */}
      <div className="card p-5">
        <h3 className="text-white font-semibold mb-1">ZKP Verification Status</h3>
        <p className="text-gray-500 text-sm mb-4">Agencies can verify facts about your wealth without seeing your actual data.</p>
        <div className="space-y-3">
          {[
            { query: 'Does your net worth exceed ₹1 Crore?', result: 'NO', agency: 'HDFC Bank', date: '28 Feb 2024' },
            { query: 'Is declared income consistent with asset holdings?', result: 'CONSISTENT', agency: 'IT Dept.', date: '15 Mar 2024' },
            { query: 'Do you own property in Maharashtra?', result: 'YES', agency: 'IT Dept.', date: '10 Jan 2024' },
          ].map((v, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/2 border border-white/5 text-sm">
              <div>
                <p className="text-gray-300">{v.query}</p>
                <p className="text-gray-600 text-xs mt-0.5">{v.agency} · {v.date}</p>
              </div>
              <span className={`font-bold text-sm px-3 py-1 rounded-full ${v.result === 'YES' || v.result === 'CONSISTENT' ? 'bg-green-500/15 text-green-400' : 'bg-blue-500/15 text-blue-400'}`}>
                {v.result}
              </span>
            </div>
          ))}
        </div>
        <p className="text-gray-700 text-xs mt-3">ZKP responses reveal only YES/NO — your actual balance or asset value is never disclosed to any agency.</p>
      </div>

      {/* What to do panel */}
      <div className="card p-5">
        <h3 className="text-white font-semibold mb-4">What happens if you get flagged?</h3>
        <div className="space-y-4">
          {[
            { step: '1', color: 'bg-yellow-500', label: 'YELLOW Flag', desc: 'Soft flag — minor asset-income gap detected. You will receive a notification and can submit an explanation voluntarily.' },
            { step: '2', color: 'bg-orange-500', label: 'ORANGE Flag', desc: 'Moderate flag — asset anomaly confirmed. IT Department reviews the case and may contact you for documentation.' },
            { step: '3', color: 'bg-red-500',    label: 'RED Flag',    desc: 'Serious flag — significant unexplained wealth. Case is assigned to an investigation officer. Explanation and supporting documents required.' },
          ].map(s => (
            <div key={s.step} className="flex gap-3">
              <div className={`w-6 h-6 rounded-full ${s.color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5`}>{s.step}</div>
              <div>
                <p className="text-white text-sm font-semibold">{s.label}</p>
                <p className="text-gray-500 text-xs mt-0.5">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
