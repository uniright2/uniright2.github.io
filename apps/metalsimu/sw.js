const CACHE_NAME = 'dq-rta-v14';
const ASSETS = [
  './index.html',
  './manifest.json'
];

// インストール時にファイルをキャッシュ
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

// オフライン時にキャッシュから表示
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// 追加した部分
// インストール後、すぐに新しいService Workerを有効化する
self.addEventListener('install', (event) => {
    event.waitUntil(self.skipWaiting());
});

// 有効化されたら、即座に制御を開始する
self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});