import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-[#0a1628] border border-white/5 rounded-xl p-6 ${className}`}>
      {children}
    </div>
  );
}

export function CardHover({ children, className = '', onClick }: CardProps & { onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`bg-[#0a1628] border border-white/5 rounded-xl p-6 transition-all duration-150
        hover:border-amber-500/30 hover:bg-[#0d1e38] ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

// A labelled stat inside a card — label on top, value large below.
interface StatProps {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
}

export function Stat({ label, value, sub }: StatProps) {
  return (
    <div>
      <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// A row inside a detail table (label : value).
interface DetailRowProps {
  label: string;
  value: React.ReactNode;
}

export function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="flex items-start justify-between py-3 border-b border-white/5 last:border-0">
      <span className="text-sm text-slate-400 shrink-0 mr-6">{label}</span>
      <span className="text-sm text-white text-right">{value}</span>
    </div>
  );
}
