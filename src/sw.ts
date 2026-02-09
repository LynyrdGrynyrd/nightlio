/// <reference lib="webworker" />
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';

declare const self: ServiceWorkerGlobalScope;

// self.__WB_MANIFEST is injected by vite-plugin-pwa
precacheAndRoute(self.__WB_MANIFEST);

// Clean up old caches
cleanupOutdatedCaches();

// Allow work offline
registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html')));

// Push Notification Handler
self.addEventListener('push', (event: PushEvent) => {
    let title = 'Twilightio';
    let body = 'Time to log your mood!';
    let icon = '/logo.png';

    if (event.data) {
        // If text only
        try {
            const data = event.data.text();
            // Check if JSON
            if (data.startsWith('{')) {
                const json = JSON.parse(data);
                title = json.title || title;
                body = json.body || body;
                icon = json.icon || icon;
            } else {
                body = data;
            }
        } catch {
            body = event.data?.text() || body;
        }
    }

    const options: NotificationOptions = {
        body,
        icon,
        badge: icon,
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            { action: 'log', title: 'Log Mood' },
            { action: 'close', title: 'Close' },
        ]
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

// Notification Click Handler
self.addEventListener('notificationclick', (event: NotificationEvent) => {
    event.notification.close();

    if (event.action === 'close') return;

    // Open the app
    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            // Check if there is already a window open and focus it
            for (const client of windowClients) {
                if (client.url.includes('/') && 'focus' in client) {
                    return (client as WindowClient).focus();
                }
            }
            // Otherwise open a new window
            if (self.clients.openWindow) {
                return self.clients.openWindow('/');
            }
        })
    );
});

// Skip waiting to upgrade immediately
self.addEventListener('message', (event: ExtendableMessageEvent) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
