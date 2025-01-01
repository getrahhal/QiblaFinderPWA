const CACHE_NAME = 'qibla-finder-v1';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './modern-styles.css',
    './app.js',
    './theme-manager.js',
    './manifest.json',
    './Assets/Kaaba-Compass-Icon.svg',
    './Assets/Kaaba-Compass-dark.svg',
    './Assets/rahhal-icon-light.png',
    './Assets/rahhal-icon-dark.png',
    './Assets/favicon.ico'
];

// Install Service Worker
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Caching app assets');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate Service Worker - This event fires when a new service worker takes control
self.addEventListener('activate', (event) => {
    // waitUntil() ensures the service worker won't be activated until the promise chain resolves
    event.waitUntil(
        // Get all cache storage keys
        caches.keys()
            .then((cacheNames) => {
                // Map over all existing caches and create an array of promises
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        // If this isn't our current cache version, delete it
                        if (cacheName !== CACHE_NAME) {
                            console.log('Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('Service Worker activated');
                // clients.claim() lets the service worker take control of all open pages immediately
                // without requiring a reload
                return self.clients.claim();
            })
    );
});

// Fetch Event - Cache First, then Network
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return cached version if found
                if (response) {
                    return response;
                }

                // Clone the request
                const fetchRequest = event.request.clone();

                // Make network request and cache the response
                return fetch(fetchRequest)
                    .then((response) => {
                        // Check if we received a valid response
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // Clone the response
                        const responseToCache = response.clone();

                        // Add the response to cache
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    })
                    .catch((error) => {
                        // If both cache and network fail, return offline page
                        console.log('Fetch failed; returning offline content instead.', error);
                        return caches.match('./index.html');
                    });
            })
    );
});

// Handle offline functionality
// This event listener handles messages sent to the Service Worker
// When it receives a 'skipWaiting' message, it calls skipWaiting() 
// which allows a new service worker to take over from an existing one
// This is typically used during app updates to ensure the new service worker
// activates immediately rather than waiting for all tabs to close
self.addEventListener('message', (event) => {
    if (event.data === 'skipWaiting') {
        self.skipWaiting();
    }
});

// Background Sync for offline actions
self.addEventListener('sync', (event) => {
    if (event.tag === 'syncQiblaData') {
        event.waitUntil(
            // Handle background sync when back online
            Promise.resolve()
        );
    }
});

// Handle Push Notifications
self.addEventListener('push', (event) => {
    if (event.data) {
        const options = {
            body: event.data.text(),
            icon: './Assets/Kaaba-Compass-Icon.svg',
            badge: './Assets/Kaaba-Compass-Icon.svg',
            vibrate: [100, 50, 100],
            data: {
                dateOfArrival: Date.now(),
                primaryKey: 1
            }
        };

        event.waitUntil(
            self.registration.showNotification('Qibla Finder', options)
        );
    }
});

// Handle Notification Clicks
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow('/')
    );
}); 