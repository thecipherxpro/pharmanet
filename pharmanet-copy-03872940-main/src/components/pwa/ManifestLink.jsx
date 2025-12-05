import { useEffect } from 'react';

// Pharmanet PWA Manifest Configuration
const MANIFEST_CONFIG = {
  background_color: "#ffffff",
  dir: "ltr",
  display: "standalone",
  name: "Pharmanet",
  orientation: "any",
  scope: "/",
  short_name: "Pharmanet",
  start_url: "/",
  theme_color: "#00ef81",
  description: "Pharmanet: Your essential mobile app for pharmacy shift management. Instantly post and find pharmacy shifts with dynamic, real-time pricing. Employers get flexible coverage, pharmacists find rewarding opportunities. Seamlessly manage your schedule and applications.",
  icons: [
    {
      src: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fc5eaf1b32d1359be8744a/12c397afb_android-launchericon-512-512.png",
      type: "image/png",
      sizes: "512x512",
      purpose: "any maskable"
    },
    {
      src: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fc5eaf1b32d1359be8744a/6852a121a_android-launchericon-512-512.png",
      type: "image/png",
      sizes: "192x192",
      purpose: "any"
    }
  ],
  categories: ["business", "productivity", "medical"],
  lang: "en-CA",
  prefer_related_applications: false
};

// Service Worker inline code
const SERVICE_WORKER_CODE = `
// Pharmanet Service Worker - Offline Experience
const CACHE_NAME = 'pharmanet-cache-v1';
const OFFLINE_URL = '/offline.html';

// Assets to cache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html'
];

// Install event - cache essential assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching app shell');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - Stale While Revalidate strategy
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) return;
  
  // Skip API calls
  if (event.request.url.includes('/api/')) return;

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            // Cache successful responses
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(() => {
            // Return cached response on network failure
            if (cachedResponse) {
              return cachedResponse;
            }
            // For navigation requests, return cached index
            if (event.request.mode === 'navigate') {
              return cache.match('/');
            }
            return new Response('Offline', { status: 503 });
          });

        // Return cached response immediately, update in background
        return cachedResponse || fetchPromise;
      });
    })
  );
});

// Handle messages from main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-pending-actions') {
    console.log('[SW] Syncing pending actions...');
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body || 'New notification from Pharmanet',
      icon: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fc5eaf1b32d1359be8744a/12c397afb_android-launchericon-512-512.png',
      badge: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fc5eaf1b32d1359be8744a/12c397afb_android-launchericon-512-512.png',
      vibrate: [100, 50, 100],
      data: data.data || {},
      actions: data.actions || []
    };
    event.waitUntil(
      self.registration.showNotification(data.title || 'Pharmanet', options)
    );
  }
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return clients.openWindow('/');
    })
  );
});
`;

/**
 * Dynamically injects PWA manifest and registers service worker
 * This ensures the app is installable as a PWA with offline support
 */
export default function ManifestLink() {
  useEffect(() => {
    console.log('🔗 [PWA] Initializing PWA...');

    // Create and inject manifest as blob URL
    const manifestBlob = new Blob([JSON.stringify(MANIFEST_CONFIG)], { type: 'application/json' });
    const manifestUrl = URL.createObjectURL(manifestBlob);

    // Remove existing manifest link
    const existingManifest = document.querySelector('link[rel="manifest"]');
    if (existingManifest) {
      existingManifest.remove();
    }

    // Add new manifest link
    const manifestLink = document.createElement('link');
    manifestLink.rel = 'manifest';
    manifestLink.href = manifestUrl;
    document.head.appendChild(manifestLink);
    console.log('✅ [PWA] Manifest injected');

    // Register Service Worker
    registerServiceWorker();

    // Add theme-color meta tag
    setMetaTag('theme-color', MANIFEST_CONFIG.theme_color);
    
    // Add description
    setMetaTag('description', MANIFEST_CONFIG.description);

    // iOS specific meta tags
    setMetaTag('apple-mobile-web-app-capable', 'yes');
    setMetaTag('apple-mobile-web-app-status-bar-style', 'black-translucent');
    setMetaTag('apple-mobile-web-app-title', 'Pharmanet');

    // Add apple touch icons
    const iconUrl = MANIFEST_CONFIG.icons[0].src;
    const appleTouchIconSizes = ['180x180', '152x152', '144x144', '120x120'];
    
    appleTouchIconSizes.forEach(size => {
      const selector = `link[rel="apple-touch-icon"][sizes="${size}"]`;
      let appleIcon = document.querySelector(selector);
      
      if (!appleIcon) {
        appleIcon = document.createElement('link');
        appleIcon.rel = 'apple-touch-icon';
        appleIcon.sizes = size;
        appleIcon.href = iconUrl;
        document.head.appendChild(appleIcon);
      }
    });
    console.log('✅ [PWA] Apple touch icons added');

    // Add favicon
    let favicon = document.querySelector('link[rel="icon"]');
    if (!favicon) {
      favicon = document.createElement('link');
      favicon.rel = 'icon';
      favicon.type = 'image/png';
      favicon.href = iconUrl;
      document.head.appendChild(favicon);
    } else {
      favicon.href = iconUrl;
    }
    console.log('✅ [PWA] Favicon added');

    console.log('🎉 [PWA] PWA initialization complete!');

    // Cleanup
    return () => {
      URL.revokeObjectURL(manifestUrl);
    };
  }, []);

  return null;
}

// Helper to set meta tags
function setMetaTag(name, content) {
  let meta = document.querySelector(`meta[name="${name}"]`);
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = name;
    document.head.appendChild(meta);
  }
  meta.content = content;
}

// Register service worker from blob
async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.log('⚠️ [SW] Service workers not supported');
    return;
  }

  try {
    // Create service worker blob
    const swBlob = new Blob([SERVICE_WORKER_CODE], { type: 'application/javascript' });
    const swUrl = URL.createObjectURL(swBlob);

    // Unregister existing service workers first
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      await registration.unregister();
      console.log('🧹 [SW] Unregistered old service worker');
    }

    // Register new service worker
    const registration = await navigator.serviceWorker.register(swUrl, {
      scope: '/'
    });

    console.log('✅ [SW] Service worker registered:', registration.scope);

    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      newWorker?.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          console.log('🔄 [SW] New version available');
          // Optionally prompt user to refresh
          if (window.confirm('New version available! Refresh to update?')) {
            newWorker.postMessage({ type: 'SKIP_WAITING' });
            window.location.reload();
          }
        }
      });
    });

  } catch (error) {
    console.error('❌ [SW] Registration failed:', error);
  }
}