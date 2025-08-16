/**
 * @file Service Worker for the Hospital Booking System PWA.
 *
 * This service worker handles caching of the application shell to enable
 * offline functionality and improve performance.
 */

const CACHE_NAME = 'medibook-cache-v1';
const APP_SHELL_URLS = [
    '/',
    'index.html',
    'styles.css',
    'manifest.webmanifest',
    'js/main.js',
    'js/ui.js',
    'js/db.js',
    'js/models.js',
    'js/calendar.js',
    'js/booking.js',
    'js/admin.js'
    // Note: Data files (doctors.json, slots.json) are not cached as the data is loaded into IndexedDB.
    // The CDN for Tailwind and Pravatar images will not be cached by this service worker,
    // meaning the app will require an internet connection for full styling and images on first load.
];

/**
 * Install Event:
 * Fired when the service worker is first installed.
 * Opens a cache and adds the application shell files to it.
 */
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: Caching App Shell...');
                return cache.addAll(APP_SHELL_URLS);
            })
            .catch(error => {
                console.error('Failed to cache app shell:', error);
            })
    );
});

/**
 * Activate Event:
 * Fired when the service worker becomes active.
 * It's a good place to clean up old, unused caches.
 */
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    // If a cache's name is not the current one, delete it.
                    if (cacheName !== CACHE_NAME) {
                        console.log('Service Worker: Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    // Take control of all clients immediately.
    return self.clients.claim();
});

/**
 * Fetch Event:
 * Fired for every network request made by the page.
 * Implements a "Cache, falling back to network" strategy.
 */
self.addEventListener('fetch', (event) => {
    // We only want to cache GET requests.
    if (event.request.method !== 'GET') {
        return;
    }

    // For requests to external resources (like the CDN), use the network.
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                // If a cached response is found, return it.
                if (cachedResponse) {
                    return cachedResponse;
                }
                // Otherwise, fetch from the network.
                return fetch(event.request).then(networkResponse => {
                    // Optionally, you could cache dynamic requests here, but we are focusing on the app shell.
                    return networkResponse;
                });
            })
    );
});
