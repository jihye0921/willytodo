const CACHE_NAME = 'seoan-todo-v3';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];

// 설치 시 캐시 저장
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('SW: 캐시 생성 중');
        return Promise.all(
          urlsToCache.map(url =>
            cache.add(url).catch(err => console.log('캐시 실패:', url, err))
          )
        );
      })
  );
  self.skipWaiting();
});

// 네트워크 우선 전략 - 항상 최신 코드를 먼저 시도
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        // 네트워크 성공 시 캐시 업데이트
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // 네트워크 실패 시에만 캐시 사용 (오프라인)
        return caches.match(event.request).then(response => {
          return response || caches.match('./index.html');
        });
      })
  );
});

// 오래된 캐시 모두 삭제
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => {
            console.log('SW: 오래된 캐시 삭제:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});
