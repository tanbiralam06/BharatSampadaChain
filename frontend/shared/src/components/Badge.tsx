import React from 'react';
import type { Severity, FlagStatus, CitizenType, AccessorRole } from '../types';

type BadgeVariant = 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'gray' | 'purple' | 'amber';

const styles: Record<BadgeVariant, string> = {
  red:    'bg-red-500/15 text-red-400 border border-red-500/25',
  orange: 'bg-orange-500/15 text-orange-400 border border-orange-500/25',
  yellow: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/25',
  green:  'bg-green-500/15 text-green-400 border border-green-500/25',
  blue:   'bg-blue-500/15 text-blue-400 border border-blue-500/25',
  gray:   'bg-slate-500/15 text-slate-400 border border-slate-500/25',
  purple: 'bg-purple-500/15 text-purple-400 border border-purple-500/25',
  amber:  'bg-amber-500/15 text-amber-400 border border-amber-500/25',
};

interface BadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant, children, className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${styles[variant]} ${className}`}>
      {children}
    </span>
  );
}

// ── Domain-specific convenience badges ───────────────────────────────────────

export function SeverityBadge({ severity }: { severity: Severity }) {
  const map: Record<Severity, BadgeVariant> = { RED: 'red', ORANGE: 'orange', YELLOW: 'yellow' };
  return <Badge variant={map[severity]}>{severity}</Badge>;
}

export function StatusBadge({ status }: { status: FlagStatus }) {
  const map: Record<FlagStatus, BadgeVariant> = {
    OPEN:                'amber',
    UNDER_INVESTIGATION: 'blue',
    CLEARED:             'green',
    ESCALATED:           'red',
  };
  const label: Record<FlagStatus, string> = {
    OPEN:                'Open',
    UNDER_INVESTIGATION: 'Under Investigation',
    CLEARED:             'Cleared',
    ESCALATED:           'Escalated',
  };
  return <Badge variant={map[status]}>{label[status]}</Badge>;
}

export function CitizenTypeBadge({ type }: { type: CitizenType }) {
  const map: Record<CitizenType, BadgeVariant> = {
    politician:          'purple',
    government_official: 'blue',
    civilian:            'gray',
  };
  const label: Record<CitizenType, string> = {
    politician:          'Politician',
    government_official: 'Govt Official',
    civilian:            'Civilian',
  };
  return <Badge variant={map[type]}>{label[type]}</Badge>;
}

export function RoleBadge({ role }: { role: AccessorRole }) {
  const map: Record<AccessorRole, BadgeVariant> = {
    ADMIN:   'red',
    IT_DEPT: 'blue',
    CBI:     'orange',
    ED:      'yellow',
    COURT:   'purple',
    BANK:    'green',
    CITIZEN: 'gray',
    PUBLIC:  'gray',
  };
  return <Badge variant={map[role]}>{role.replace('_', ' ')}</Badge>;
}

export function ScoreBadge({ score }: { score: number }) {
  if (score >= 3) return <Badge variant="red">Score {score} · Critical</Badge>;
  if (score >= 2) return <Badge variant="orange">Score {score} · High</Badge>;
  if (score >= 1) return <Badge variant="yellow">Score {score} · Medium</Badge>;
  return <Badge variant="green">Score {score} · Clean</Badge>;
}
