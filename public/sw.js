const CACHE_NAME = 'kaaba-distance-v1';
const CACHE_URLS = [
    './',
    './index.html',
    './app.js',
    './styles.css',
    './manifest.json',
    './Assets/Kaaba-Compass-Icon.svg',
    './Assets/Kaaba-Compass-dark.svg',
    './Assets/rahhal-icon-light.png',
    './Assets/rahhal-icon-dark.png'
];

// Install event - cache the required files
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(CACHE_URLS);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Helper function to check if we're online
const isOnline = () => {
    return navigator.onLine;
};

// Helper function to check if URL should bypass cache
const shouldBypassCache = (url) => {
    // Add any URLs that should always bypass cache
    const bypassList = [
        // Add API endpoints or dynamic content URLs here
    ];
    return bypassList.some(bypass => url.includes(bypass));
};

// Fetch event - with network-first strategy when online
self.addEventListener('fetch', event => {
    event.respondWith(
        (async () => {
            try {
                // Check if we're online and the request isn't in the bypass list
                if (isOnline() && !shouldBypassCache(event.request.url)) {
                    try {
                        // Try network first
                        const networkResponse = await fetch(event.request);
                        const cache = await caches.open(CACHE_NAME);
                        
                        // Clone the response because it can only be used once
                        await cache.put(event.request, networkResponse.clone());
                        
                        // Return the network response
                        return networkResponse;
                    } catch (error) {
                        // If network fails, fall back to cache
                        const cachedResponse = await caches.match(event.request);
                        if (cachedResponse) {
                            return cachedResponse;
                        }
                        throw error;
                    }
                } else {
                    // Offline: Try cache first
                    const cachedResponse = await caches.match(event.request);
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    
                    // If not in cache, try network as last resort
                    return fetch(event.request);
                }
            } catch (error) {
                // If both cache and network fail, return a fallback
                console.error('Fetch failed:', error);
                
                // You could return a custom offline page here
                // return caches.match('./offline.html');
                
                throw error;
            }
        })()
    );
});

// Listen for online/offline events
self.addEventListener('online', () => {
    console.log('App is online - invalidating old cache');
    // You could trigger a cache refresh here
});

self.addEventListener('offline', () => {
    console.log('App is offline - using cache');
}); 