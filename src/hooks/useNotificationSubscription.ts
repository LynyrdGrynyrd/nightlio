import { useCallback, useEffect, useState } from 'react';
import apiService from '../services/api';
import { useToast } from '../components/ui/ToastProvider';

interface UseNotificationSubscriptionReturn {
  subscribed: boolean;
  subscribing: boolean;
  subscribe: () => Promise<void>;
  sendTest: () => Promise<void>;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function useNotificationSubscription(
  isMockMode: boolean
): UseNotificationSubscriptionReturn {
  const [subscribed, setSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const { show } = useToast();

  const checkSubscription = useCallback(async () => {
    if (isMockMode) {
      setSubscribed(true);
      return;
    }
    try {
      if (!('serviceWorker' in navigator)) {
        setSubscribed(false);
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setSubscribed(Boolean(subscription));
    } catch {
      setSubscribed(false);
    }
  }, [isMockMode]);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  const subscribe = useCallback(async () => {
    if (isMockMode) {
      setSubscribed(true);
      show('Mock mode: notifications enabled.', 'success');
      return;
    }

    setSubscribing(true);
    try {
      if (!('serviceWorker' in navigator)) {
        throw new Error('Service workers are not available on this browser.');
      }

      const [permission, vapid, registration] = await Promise.all([
        Notification.requestPermission(),
        apiService.getPushVapidPublicKey(),
        navigator.serviceWorker.ready,
      ]);

      if (permission !== 'granted') {
        throw new Error('Notification permission was denied.');
      }

      const convertedVapidKey = urlBase64ToUint8Array(vapid.publicKey);
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
      });

      await apiService.subscribePush(subscription);
      setSubscribed(true);
      show('Notifications enabled for this device.', 'success');
    } catch (err) {
      console.error('Subscription failed:', err);
      show(`Failed to enable notifications: ${(err as Error).message}`, 'error');
    } finally {
      setSubscribing(false);
    }
  }, [isMockMode, show]);

  const sendTest = useCallback(async () => {
    try {
      const result = await apiService.sendTestPush();
      if (result?.message) {
        show(result.message, 'success');
      } else {
        show(result?.error || 'Test notification failed.', 'error');
      }
    } catch (err) {
      console.error(err);
      show('Failed to send test notification.', 'error');
    }
  }, [show]);

  return { subscribed, subscribing, subscribe, sendTest };
}
