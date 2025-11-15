const CACHE_NAME = 'stanley-cafeteria-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/index.tsx',
  '/App.tsx',
  '/types.ts',
  '/metadata.json',
  '/services/geminiService.ts',
  '/utils/audio.ts',
  '/utils/image.ts',
  '/components/ChatInterface.tsx',
  '/components/AdminPanel.tsx',
  '/components/AdminSidebar.tsx',
  '/components/HomePage.tsx',
  '/components/Header.tsx',
  '/components/MessageInput.tsx',
  '/components/ChatMessage.tsx',
  '/components/Menu.tsx',
  '/components/icons.tsx',
  '/icon-192.png',
  '/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});
