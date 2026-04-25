// All monetary values from the API are in paisa (1 rupee = 100 paisa).
// 1 lakh rupees  = 1e5 rupees = 1e7 paisa
// 1 crore rupees = 1e7 rupees = 1e9 paisa

export function formatCrore(paisa: number): string {
  const crore = paisa / 1e9;
  if (crore >= 1)   return `₹${crore.toFixed(1)} Cr`;
  const lakh = paisa / 1e7;
  if (lakh >= 1)    return `₹${lakh.toFixed(1)} L`;
  const rupees = paisa / 100;
  if (rupees >= 1)  return `₹${Math.round(rupees).toLocaleString('en-IN')}`;
  return `${paisa} paisa`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// Truncates a 64-char hash to first 8 … last 6 chars for display.
export function formatHash(hash: string): string {
  if (hash.length <= 16) return hash;
  return `${hash.slice(0, 8)}…${hash.slice(-6)}`;
}

// Days elapsed since an ISO timestamp.
export function daysAgo(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

// Human-readable anomaly score label.
export function scoreLabel(score: number): string {
  if (score >= 3) return 'Critical';
  if (score >= 2) return 'High';
  if (score >= 1) return 'Medium';
  return 'Clean';
}
