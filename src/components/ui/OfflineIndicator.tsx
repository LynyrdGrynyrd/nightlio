import { useOfflineSync } from '../../hooks/useOfflineSync';
import { WifiOff, RefreshCw, Cloud } from 'lucide-react';
import './OfflineIndicator.css';

const OfflineIndicator = () => {
  const { isOnline, isSyncing, pendingCount } = useOfflineSync();

  if (isSyncing) {
    return (
      <div className="offline-indicator offline-indicator--syncing">
        <RefreshCw size={16} className="spin" />
        <span>Syncing{pendingCount > 0 ? ` ${pendingCount} entries` : ''}...</span>
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div className="offline-indicator offline-indicator--offline">
        <WifiOff size={16} />
        <span>You're offline{pendingCount > 0 ? ` • ${pendingCount} pending` : ''}</span>
      </div>
    );
  }

  if (pendingCount > 0) {
    return (
      <div className="offline-indicator offline-indicator--pending">
        <Cloud size={16} />
        <span>{pendingCount} pending</span>
      </div>
    );
  }

  return null;
};

export default OfflineIndicator;
