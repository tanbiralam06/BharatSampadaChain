import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { formatHash } from '../formatters';

interface HashDisplayProps {
  hash: string;
  full?: boolean; // show full hash (for detail pages) vs truncated (for tables)
}

export function HashDisplay({ hash, full = false }: HashDisplayProps) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <span className="inline-flex items-center gap-1.5 group">
      <span className="font-mono text-xs text-slate-400 select-all">
        {full ? hash : formatHash(hash)}
      </span>
      <button
        onClick={copy}
        title="Copy hash"
        className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-600 hover:text-amber-400"
      >
        {copied
          ? <Check className="h-3 w-3 text-green-400" />
          : <Copy className="h-3 w-3" />
        }
      </button>
    </span>
  );
}
