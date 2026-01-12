import { useEffect, useState, useCallback } from 'react';
import { offlineStorage } from '../services/offlineStorage';
import apiService from '../services/api';
import { useToast } from '../components/ui/ToastProvider';

// Helper functions moved outside component to be stable
const processCreateEntry = async (payload) => {
    // payload: { mood, date, time, content, selected_options, photos?, audio? }
    const { photos, audio, ...entryData } = payload;

    // 1. Create Entry
    const response = await apiService.createMoodEntry(entryData);
    const entryId = response.entry.id;

    // 2. Upload Media
    if (photos && photos.length > 0) {
        await Promise.all(photos.map(blob => {
            const file = new File([blob], "offline_photo.jpg", { type: blob.type || 'image/jpeg' });
            return apiService.uploadMedia(entryId, file);
        }));
    }

    if (audio && audio.length > 0) {
        await Promise.all(audio.map(blob => {
            const file = new File([blob], "offline_audio.webm", { type: blob.type || 'audio/webm' });
            return apiService.uploadMedia(entryId, file);
        }));
    }
};

const processUpdateEntry = async (payload) => {
    const { id, updates, photos, audio } = payload;

    // 1. Update Entry
    await apiService.updateMoodEntry(id, updates);

    // 2. Upload New Media
    if (photos && photos.length > 0) {
        await Promise.all(photos.map(blob => {
            const file = new File([blob], "offline_photo.jpg", { type: blob.type || 'image/jpeg' });
            return apiService.uploadMedia(id, file);
        }));
    }

    if (audio && audio.length > 0) {
        await Promise.all(audio.map(blob => {
            const file = new File([blob], "offline_audio.webm", { type: blob.type || 'audio/webm' });
            return apiService.uploadMedia(id, file);
        }));
    }
};

export const useOfflineSync = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [isSyncing, setIsSyncing] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);
    const { show } = useToast();

    // Refresh pending count from IndexedDB
    const refreshPendingCount = useCallback(async () => {
        try {
            const queue = await offlineStorage.getQueue();
            setPendingCount(queue.length);
        } catch (err) {
            console.error('Failed to get pending count:', err);
        }
    }, []);

    const processQueue = useCallback(async () => {
        if (isSyncing) return;
        setIsSyncing(true);

        try {
            const queue = await offlineStorage.getQueue();
            if (queue.length === 0) {
                setIsSyncing(false);
                return;
            }

            show(`Syncing ${queue.length} offline changes...`, 'info');

            for (const item of queue) {
                try {
                    // Process based on type
                    if (item.type === 'CREATE_ENTRY') {
                        await processCreateEntry(item.payload);
                    } else if (item.type === 'UPDATE_ENTRY') {
                        await processUpdateEntry(item.payload);
                    }

                    // If successful, remove from queue
                    await offlineStorage.removeFromQueue(item.id);
                } catch (error) {
                    console.error("Sync item failed:", error);
                    break;
                }
            }

            show('Offline sync complete!', 'success');
            window.dispatchEvent(new Event('nightlio-synced'));

        } catch (err) {
            console.error("Sync process error", err);
        } finally {
            setIsSyncing(false);
            refreshPendingCount();
        }
    }, [isSyncing, show, refreshPendingCount]);

    useEffect(() => {
        // Check pending count on mount
        refreshPendingCount();

        const handleOnline = () => {
            setIsOnline(true);
            processQueue();
        };
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Initial sync check
        if (navigator.onLine) {
            processQueue();
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [refreshPendingCount, processQueue]);

    return { isOnline, isSyncing, pendingCount, refreshPendingCount };
};
