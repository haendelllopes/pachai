// Service Worker para PWA Pachai
const CACHE_NAME = 'pachai-v1'
const urlsToCache = [
  '/',
  '/manifest.json',
  '/image/favicon.jpeg',
  '/image/app-icon.jpeg',
  '/image/hero-icon.jpeg',
  '/image/background-icon.jpeg',
  '/image/divisor-icon.jpeg',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache)
    })
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      )
    })
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request)
    })
  )
})

