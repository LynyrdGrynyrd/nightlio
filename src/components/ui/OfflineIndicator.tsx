import { useOfflineSync } from '../../hooks/useOfflineSync';
import { WifiOff, RefreshCw, Cloud } from 'lucide-react';
import { cn } from '@/lib/utils';

const OfflineIndicator = () => {
  const { isOnline, isSyncing, pendingCount } = useOfflineSync();

  const baseClasses = "fixed bottom-4 left-4 z-50 flex items-center gap-2 px-3 py-2 rounded-full shadow-lg text-sm font-medium animate-in slide-in-from-bottom-5 border";

  if (isSyncing) {
    return (
      <div className={cn(
        baseClasses,
        "bg-primary/10 text-primary border-primary/20"
      )}>
        <RefreshCw size={14} className="animate-spin" />
        <span>Syncing{pendingCount > 0 ? ` ${pendingCount} entries` : ''}...</span>
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div className={cn(
        baseClasses,
        "bg-muted text-foreground border-border"
      )}>
        <WifiOff size={14} />
        <span>You're offline{pendingCount > 0 ? ` • ${pendingCount} pending` : ''}</span>
      </div>
    );
  }

  if (pendingCount > 0) {
    return (
      <div className={cn(
        baseClasses,
        "bg-[color-mix(in_oklab,var(--mood-2)_15%,transparent)] text-[var(--mood-2)] border-[color-mix(in_oklab,var(--mood-2)_30%,transparent)]"
      )}>
        <Cloud size={14} />
        <span>{pendingCount} pending</span>
      </div>
    );
  }

  return null;
};

export default OfflineIndicator;
