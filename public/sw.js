/**
 * SimpleIT Service Worker
 * Version: 1.0.0
 * 
 * Implements basic caching strategies:
 * - Network-first for API calls (always fetch fresh data)
 * - Cache-first for static assets (performance)
 * - Offline fallback page for failed requests
 */

const CACHE_NAME = 'simpleit-v1';
const OFFLINE_URL = '/offline.html';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
  // Icons will be added when they exist
  // '/icons/icon-192x192.png',
  // '/icons/icon-512x512.png',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Install event');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        // Skip waiting to activate immediately
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[ServiceWorker] Cache installation failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activate event');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[ServiceWorker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // Take control of all clients immediately
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Strategy 1: Network-first for API calls
  // Always try to fetch fresh data from the server
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Strategy 2: Cache-first for static assets
  // Serve from cache if available, fallback to network
  event.respondWith(cacheFirst(request));
});

/**
 * Network-first strategy
 * Try network first, fallback to cache if offline
 * Used for API calls to ensure fresh data
 */
async function networkFirst(request) {
  try {
    // Try to fetch from network
    const networkResponse = await fetch(request);
    
    // If successful, update cache and return response
    if (networkResponse && networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Network failed, try cache
    console.log('[ServiceWorker] Network request failed, trying cache:', request.url);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If no cache and it's a navigation request, show offline page
    if (request.mode === 'navigate') {
      return caches.match(OFFLINE_URL);
    }
    
    // For other failed requests, throw error
    throw error;
  }
}

/**
 * Cache-first strategy
 * Serve from cache if available, fallback to network
 * Used for static assets (HTML, CSS, JS, images)
 */
async function cacheFirst(request) {
  // Check cache first
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // Return cached version and update cache in background
    updateCacheInBackground(request);
    return cachedResponse;
  }
  
  // Not in cache, fetch from network
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse && networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[ServiceWorker] Fetch failed:', error);
    
    // If it's a navigation request, show offline page
    if (request.mode === 'navigate') {
      return caches.match(OFFLINE_URL);
    }
    
    throw error;
  }
}

/**
 * Update cache in background (for cache-first strategy)
 * Ensures cached assets are refreshed without blocking response
 */
function updateCacheInBackground(request) {
  fetch(request)
    .then((response) => {
      if (response && response.ok) {
        return caches.open(CACHE_NAME).then((cache) => {
          return cache.put(request, response);
        });
      }
    })
    .catch((error) => {
      // Silently fail - background update is not critical
      console.log('[ServiceWorker] Background cache update failed:', error);
    });
}

// Listen for messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});
