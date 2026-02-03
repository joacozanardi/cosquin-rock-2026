const CACHE_NAME = 'cosquin-rock-v1';

// Archivos que se guardarán para uso offline
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './logo.jpg'
];

// 1. Instalación: Guarda los archivos en el caché del teléfono
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Cache abierto, guardando archivos...');
      return cache.addAll(ASSETS);
    })
  );
});

// 2. Activación: Limpia versiones viejas de la app si las hubiera
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
      );
    })
  );
});

// 3. Estrategia de carga: Intenta ir a buscar a internet, si falla, usa el caché
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request).then(response => {
        // Si el archivo está en caché, lo devuelve, sino da error (offline)
        return response || caches.match('./index.html');
      });
    })
  );
});