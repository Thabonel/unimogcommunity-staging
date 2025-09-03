// Service Worker for Unimog Community Hub
// Version 2.0.0 - Fixed stale cache issue

const CACHE_NAME = 'unimog-hub-v2';
const DYNAMIC_CACHE_NAME = 'unimog-hub-dynamic-v2';
const MAX_DYNAMIC_CACHE_SIZE = 100;

// Resources to cache immediately
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  // Add your static assets here
];

// Patterns for resources to cache dynamically
const CACHE_PATTERNS = {
  images: /\.(jpg|jpeg|png|gif|webp|svg|ico)$/i,
  styles: /\.(css)$/i,
  scripts: /\.(js)$/i,
  fonts: /\.(woff|woff2|ttf|otf)$/i,
  documents: /\.(pdf)$/i,
};

// API endpoints to cache
const API_CACHE_PATTERNS = [
  /\/api\/profiles/,
  /\/api\/posts/,
  /\/api\/knowledge/,
  /\/api\/vehicles/,
  /\/api\/trips/,
];

// Install event - cache static resources
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching static resources');
      return cache.addAll(STATIC_CACHE_URLS).catch((error) => {
        console.error('[Service Worker] Failed to cache static resources:', error);
      });
    })
  );
  
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName !== CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME;
          })
          .map((cacheName) => {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    })
  );
  
  // Claim any currently available clients
  self.clients.claim();
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other non-http(s) requests
  if (!request.url.startsWith('http')) {
    return;
  }
  
  // Handle API requests
  if (isApiRequest(url)) {
    event.respondWith(handleApiRequest(request));
    return;
  }
  
  // Handle static resources
  event.respondWith(handleStaticRequest(request));
});

// Check if request is an API request
function isApiRequest(url) {
  return API_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname));
}

// Handle API requests with network-first strategy
async function handleApiRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // Clone the response before caching
    if (networkResponse.ok) {
      const responseToCache = networkResponse.clone();
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, responseToCache);
    }
    
    return networkResponse;
  } catch (error) {
    // If network fails, try cache
    console.log('[Service Worker] Network failed, checking cache for:', request.url);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline response for API requests
    return new Response(
      JSON.stringify({
        error: 'offline',
        message: 'You are currently offline. This data will be synced when you reconnect.',
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: new Headers({
          'Content-Type': 'application/json',
        }),
      }
    );
  }
}

// Handle static resources with smart caching strategy
async function handleStaticRequest(request) {
  const url = new URL(request.url);
  
  // Use network-first for HTML documents to prevent stale app (but not PDFs)
  if (!url.pathname.endsWith('.pdf') && (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html') || url.pathname.endsWith('.html') || url.pathname === '/')) {
    return handleHtmlRequest(request);
  }
  
  // Use cache-first for actual static assets (CSS, JS, images, etc.)
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // Return cached version and update cache in background for static assets
    updateCache(request);
    return cachedResponse;
  }
  
  // If not in cache, try network
  try {
    const networkResponse = await fetch(request);
    
    // Cache the response if it's successful
    if (networkResponse.ok && shouldCache(request)) {
      const responseToCache = networkResponse.clone();
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      
      // Limit dynamic cache size
      limitCacheSize(DYNAMIC_CACHE_NAME, MAX_DYNAMIC_CACHE_SIZE);
      
      cache.put(request, responseToCache);
    }
    
    return networkResponse;
  } catch (error) {
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const cache = await caches.open(CACHE_NAME);
      return cache.match('/offline.html');
    }
    
    // Return 503 for other requests
    return new Response('Network error', {
      status: 503,
      statusText: 'Service Unavailable',
    });
  }
}

// Handle HTML requests with network-first strategy to prevent stale app
async function handleHtmlRequest(request) {
  try {
    // Try network first for HTML documents
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache the fresh HTML
      const responseToCache = networkResponse.clone();
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, responseToCache);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[Service Worker] Network failed for HTML, checking cache:', request.url);
    
    // If network fails, try cache
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page as last resort
    if (request.mode === 'navigate') {
      const cache = await caches.open(CACHE_NAME);
      const offlinePage = await cache.match('/offline.html');
      if (offlinePage) {
        return offlinePage;
      }
    }
    
    return new Response('Network error', {
      status: 503,
      statusText: 'Service Unavailable',
    });
  }
}

// Update cache in background
async function updateCache(request) {
  try {
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse);
    }
  } catch (error) {
    // Ignore errors during background update
  }
}

// Check if resource should be cached
function shouldCache(request) {
  const url = new URL(request.url);
  const path = url.pathname;
  
  // Check against cache patterns
  for (const [type, pattern] of Object.entries(CACHE_PATTERNS)) {
    if (pattern.test(path)) {
      return true;
    }
  }
  
  return false;
}

// Limit cache size
async function limitCacheSize(cacheName, maxSize) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  
  if (keys.length > maxSize) {
    // Delete oldest entries
    const keysToDelete = keys.slice(0, keys.length - maxSize);
    await Promise.all(keysToDelete.map(key => cache.delete(key)));
  }
}

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    cacheUrls(event.data.urls);
  }
});

// Cache specific URLs on demand
async function cacheUrls(urls) {
  const cache = await caches.open(DYNAMIC_CACHE_NAME);
  
  for (const url of urls) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        cache.put(url, response);
      }
    } catch (error) {
      console.error('[Service Worker] Failed to cache:', url, error);
    }
  }
}