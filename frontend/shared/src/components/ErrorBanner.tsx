import { AlertTriangle } from 'lucide-react';

interface ErrorBannerProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorBanner({ message = 'Something went wrong.', onRetry }: ErrorBannerProps) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-red-500/25 bg-red-500/10 px-5 py-4">
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
      <div className="flex-1">
        <p className="text-sm text-red-300">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 text-xs text-red-400 underline underline-offset-2 hover:text-red-300"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  );
}
