/* eslint-disable no-unused-vars, no-undef */
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';

// self.__WB_MANIFEST is injected by vite-plugin-pwa
precacheAndRoute(self.__WB_MANIFEST);

// Clean up old caches
cleanupOutdatedCaches();

// Allow work offline
registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html')));

// Push Notification Handler
self.addEventListener('push', (event) => {
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
        } catch (e) {
            body = event.data.text() || body;
        }
    }

    const options = {
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
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'close') return;

    // Open the app
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            // Check if there is already a window open and focus it
            for (let client of windowClients) {
                if (client.url.includes('/') && 'focus' in client) {
                    return client.focus();
                }
            }
            // Otherwise open a new window
            if (clients.openWindow) {
                return clients.openWindow('/');
            }
        })
    );
});

// Skip waiting to upgrade immediately
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
