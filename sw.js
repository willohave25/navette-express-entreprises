/**
 * Service Worker — Navette Express Espace Entreprise
 * Cache offline et performance optimisée
 * W2K-Digital 2025
 */

const CACHE_NAME = 'navette-entreprise-v1.0.0';
const OFFLINE_URL = '/erreur.html';

/* Ressources à mettre en cache au premier chargement */
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/connexion.html',
  '/inscription.html',
  '/dashboard.html',
  '/corridors.html',
  '/creer-corridor.html',
  '/employes.html',
  '/import-excel.html',
  '/suivi-transport.html',
  '/facturation.html',
  '/detail-facture.html',
  '/profil.html',
  '/notifications.html',
  '/erreur.html',
  '/css/app.css',
  '/js/app.js',
  '/js/supabase-config.js',
  '/js/fineopay-config.js',
  '/manifest.json',
  '/images/logo/logo-jaebets.png',
  '/images/logo/logo-jaebets.webp'
];

/* Installation du Service Worker */
self.addEventListener('install', (event) => {
  console.log('[SW] Installation en cours...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Mise en cache des ressources statiques');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        console.log('[SW] Installation terminée');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Erreur installation:', error);
      })
  );
});

/* Activation et nettoyage des anciens caches */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activation en cours...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => {
              console.log('[SW] Suppression ancien cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[SW] Activation terminée');
        return self.clients.claim();
      })
  );
});

/* Stratégie de cache : Network First avec fallback Cache */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  /* Ignorer les requêtes non-HTTP (extensions, etc.) */
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  /* Ignorer les requêtes API Supabase et FineoPay (toujours réseau) */
  if (url.hostname.includes('supabase') || url.hostname.includes('fineopay')) {
    return;
  }
  
  /* Stratégie pour les pages HTML : Network First */
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          /* Mettre en cache la réponse fraîche */
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          /* Fallback sur le cache puis page erreur */
          return caches.match(request)
            .then((cachedResponse) => {
              return cachedResponse || caches.match(OFFLINE_URL);
            });
        })
    );
    return;
  }
  
  /* Stratégie pour les assets statiques : Cache First */
  if (
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'image' ||
    request.destination === 'font'
  ) {
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            /* Actualiser le cache en arrière-plan */
            fetch(request).then((response) => {
              if (response.ok) {
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(request, response);
                });
              }
            }).catch(() => {});
            
            return cachedResponse;
          }
          
          /* Pas en cache, récupérer du réseau */
          return fetch(request)
            .then((response) => {
              if (response.ok) {
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(request, responseClone);
                });
              }
              return response;
            });
        })
    );
    return;
  }
  
  /* Stratégie par défaut : Network First */
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(request);
      })
  );
});

/* Gestion des messages depuis l'app */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME).then(() => {
      console.log('[SW] Cache vidé sur demande');
    });
  }
});

/* Notification push (placeholder pour futur) */
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body || 'Nouvelle notification Navette Express',
    icon: '/images/icons/icon-192x192.png',
    badge: '/images/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/notifications.html'
    },
    actions: [
      { action: 'open', title: 'Ouvrir' },
      { action: 'close', title: 'Fermer' }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Navette Express', options)
  );
});

/* Clic sur notification */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'close') return;
  
  const urlToOpen = event.notification.data?.url || '/dashboard.html';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        /* Chercher une fenêtre existante */
        for (const client of clientList) {
          if (client.url.includes('navette') && 'focus' in client) {
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        /* Ouvrir nouvelle fenêtre */
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

/* Sync en arrière-plan (placeholder pour futur) */
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-corridors') {
    console.log('[SW] Synchronisation corridors en arrière-plan');
    /* Logique de sync à implémenter avec Supabase */
  }
  
  if (event.tag === 'sync-employes') {
    console.log('[SW] Synchronisation employés en arrière-plan');
    /* Logique de sync à implémenter avec Supabase */
  }
});

console.log('[SW] Service Worker Navette Express Entreprise chargé');
