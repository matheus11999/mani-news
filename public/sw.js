const CACHE_NAME = 'mani-news-v1.0.0';
const OFFLINE_URL = '/offline.html';
const FALLBACK_IMAGE = '/images/placeholder.jpg';

// Resources to cache on install
const STATIC_CACHE_URLS = [
  '/',
  '/css/output.css',
  '/js/main.js',
  '/offline.html',
  '/images/logo.png',
  '/images/placeholder.jpg',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// URLs that should be cached with Network First strategy
const NETWORK_FIRST_URLS = [
  '/api/',
  '/noticia/',
  '/categoria/',
  '/buscar'
];

// URLs that should be cached with Cache First strategy
const CACHE_FIRST_URLS = [
  '/css/',
  '/js/',
  '/images/',
  '/icons/',
  '/uploads/'
];

// Install Event
self.addEventListener('install', event => {
  console.log('[SW] Install Event');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching static resources');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        console.log('[SW] Skip waiting');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[SW] Cache installation failed:', error);
      })
  );
});

// Activate Event
self.addEventListener('activate', event => {
  console.log('[SW] Activate Event');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Claiming clients');
        return self.clients.claim();
      })
  );
});

// Fetch Event
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Handle different types of requests
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request));
  } else if (isApiRequest(url.pathname)) {
    event.respondWith(networkFirst(request));
  } else if (isPageRequest(request)) {
    event.respondWith(networkFirst(request));
  }
});

// Cache First Strategy (for static assets)
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Cache first failed:', error);
    
    // Return fallback for images
    if (request.destination === 'image') {
      const fallbackResponse = await caches.match(FALLBACK_IMAGE);
      if (fallbackResponse) {
        return fallbackResponse;
      }
    }
    
    throw error;
  }
}

// Network First Strategy (for pages and API)
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Network first failed, trying cache:', error);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const offlineResponse = await caches.match(OFFLINE_URL);
      if (offlineResponse) {
        return offlineResponse;
      }
    }
    
    throw error;
  }
}

// Helper Functions
function isStaticAsset(pathname) {
  return CACHE_FIRST_URLS.some(url => pathname.startsWith(url));
}

function isApiRequest(pathname) {
  return NETWORK_FIRST_URLS.some(url => pathname.startsWith(url));
}

function isPageRequest(request) {
  return request.mode === 'navigate' || 
         (request.method === 'GET' && request.headers.get('accept').includes('text/html'));
}

// Background Sync (for offline actions)
self.addEventListener('sync', event => {
  if (event.tag === 'news-sync') {
    console.log('[SW] Background sync: news-sync');
    event.waitUntil(syncNews());
  }
});

async function syncNews() {
  try {
    // This could fetch latest news when connection is restored
    const response = await fetch('/api/news/latest');
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put('/api/news/latest', response.clone());
      
      // Notify clients about new content
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'NEWS_UPDATED',
            data: 'New content available'
          });
        });
      });
    }
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// Push Notifications
self.addEventListener('push', event => {
  console.log('[SW] Push notification received');
  
  const options = {
    body: 'Nova notícia importante disponível!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    image: '/images/notification-image.jpg',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Ver Notícia',
        icon: '/icons/action-explore.png'
      },
      {
        action: 'close',
        title: 'Fechar',
        icon: '/icons/action-close.png'
      }
    ],
    tag: 'news-notification',
    requireInteraction: true
  };
  
  if (event.data) {
    const payload = event.data.json();
    options.body = payload.body || options.body;
    options.data.url = payload.url || '/';
    options.data.title = payload.title || 'Nova Notícia';
  }
  
  event.waitUntil(
    self.registration.showNotification('Mani News', options)
  );
});

// Notification Click
self.addEventListener('notificationclick', event => {
  console.log('[SW] Notification click received');
  
  event.notification.close();
  
  if (event.action === 'explore') {
    const url = event.notification.data.url || '/';
    event.waitUntil(
      clients.openWindow(url)
    );
  } else if (event.action === 'close') {
    // Notification closed, no action needed
    return;
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.matchAll().then(clientList => {
        for (const client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  }
});

// Periodic Background Sync (if supported)
self.addEventListener('periodicsync', event => {
  if (event.tag === 'news-update') {
    console.log('[SW] Periodic sync: news-update');
    event.waitUntil(syncNews());
  }
});

// Message handling from main thread
self.addEventListener('message', event => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(CACHE_NAME).then(cache => {
        return cache.addAll(event.data.urls);
      })
    );
  }
});

// Error handling
self.addEventListener('error', event => {
  console.error('[SW] Error:', event.error);
});

self.addEventListener('unhandledrejection', event => {
  console.error('[SW] Unhandled promise rejection:', event.reason);
});

// Cache cleanup on storage quota
self.addEventListener('quotaexceeded', event => {
  console.warn('[SW] Storage quota exceeded, cleaning up old caches');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.slice(0, -1).map(cacheName => {
          return caches.delete(cacheName);
        })
      );
    })
  );
});

console.log('[SW] Service Worker loaded successfully');