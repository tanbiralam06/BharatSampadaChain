import { useState, useEffect } from 'react'
import { Activity, Server, Cpu, Database, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import StatCard from '../../components/StatCard'

const nodes = [
  { id: 'Peer Node 1', location: 'Mumbai DC', status: 'UP', latency: 12, blocks: 48721 },
  { id: 'Peer Node 2', location: 'Delhi DC',  status: 'UP', latency: 18, blocks: 48720 },
  { id: 'Peer Node 3', location: 'Bengaluru DC', status: 'UP', latency: 23, blocks: 48719 },
  { id: 'Orderer Node', location: 'Hyderabad DC', status: 'UP', latency: 9, blocks: 48721 },
]

const agencies = [
  { name: 'Income Tax Dept.', freshness: '2h ago', status: 'FRESH', records: '3.2L' },
  { name: 'SEBI (Investments)', freshness: '4h ago', status: 'FRESH', records: '1.8L' },
  { name: 'State Land Registry (MH)', freshness: '6h ago', status: 'FRESH', records: '8.4L' },
  { name: 'State Land Registry (UP)', freshness: '8h ago', status: 'STALE', records: '12.1L' },
  { name: 'MCA21 (Businesses)', freshness: '3h ago', status: 'FRESH', records: '2.2L' },
  { name: 'EPFO', freshness: '12h ago', status: 'STALE', records: '18.7L' },
]

export default function SystemHealth() {
  const [txCount, setTxCount] = useState(48721334)

  useEffect(() => {
    const interval = setInterval(() => {
      setTxCount(n => n + Math.floor(Math.random() * 5) + 1)
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">System Health</h1>
          <p className="text-gray-500 text-sm mt-1">Blockchain node status, throughput, and data freshness</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-full">
          <span className="live-dot" /> All Systems Operational
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Blockchain Transactions" value={txCount.toLocaleString('en-IN')} icon={Activity} accent="amber" sub="Total on-chain" />
        <StatCard label="TX Throughput" value="142/min" icon={Cpu} accent="green" sub="Current write rate" />
        <StatCard label="Smart Contract Queue" value="0" icon={Server} accent="green" sub="Pending executions" />
        <StatCard label="Avg API Response" value="84ms" icon={Clock} accent="blue" sub="Last 5 min" />
      </div>

      {/* Blockchain nodes */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5">
          <h3 className="text-white font-semibold">Blockchain Peer Nodes</h3>
        </div>
        <div className="divide-y divide-white/3">
          {nodes.map(n => (
            <div key={n.id} className="px-5 py-4 flex items-center gap-4">
              <div className="w-9 h-9 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                <Server size={15} className="text-green-400" />
              </div>
              <div className="flex-1">
                <p className="text-white text-sm font-medium">{n.id}</p>
                <p className="text-gray-600 text-xs">{n.location}</p>
              </div>
              <div className="text-right hidden md:block">
                <p className="text-gray-400 text-xs">Latency</p>
                <p className="text-white text-sm font-medium">{n.latency}ms</p>
              </div>
              <div className="text-right hidden md:block">
                <p className="text-gray-400 text-xs">Block Height</p>
                <p className="text-white text-sm font-mono">{n.blocks.toLocaleString()}</p>
              </div>
              <span className="badge-green"><CheckCircle size={10}/>{n.status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Data freshness */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5">
          <h3 className="text-white font-semibold">Data Freshness by Agency</h3>
        </div>
        <div className="divide-y divide-white/3">
          {agencies.map(a => (
            <div key={a.name} className="px-5 py-4 flex items-center gap-4">
              <div className="flex-1">
                <p className="text-white text-sm font-medium">{a.name}</p>
                <p className="text-gray-600 text-xs">Last sync: {a.freshness} · {a.records} records</p>
              </div>
              {a.status === 'FRESH'
                ? <span className="badge-green"><CheckCircle size={10}/>Fresh</span>
                : <span className="badge-yellow"><Clock size={10}/>Stale</span>
              }
            </div>
          ))}
        </div>
      </div>

      {/* Live TX feed */}
      <div className="card p-5">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <span className="live-dot" /> Live Transaction Feed
        </h3>
        <div className="space-y-2 font-mono text-xs">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 text-gray-500 hover:text-gray-400 transition-colors">
              <span className="text-gray-700">{new Date(Date.now()-i*8000).toLocaleTimeString('en-IN')}</span>
              <span className={i===0?'text-amber-400':i===1?'text-green-400':'text-gray-600'}>
                {['PROPERTY_REGISTERED','FLAG_RAISED','IDENTITY_UPDATED','ACCESS_LOGGED','FLAG_CLEARED','ASSET_LINKED'][i]}
              </span>
              <span className="text-gray-700 truncate">0x{Math.random().toString(16).slice(2,14)}...</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
