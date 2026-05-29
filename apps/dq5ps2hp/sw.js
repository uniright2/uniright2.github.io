const CACHE_NAME = 'dq5-hp-calc-v1';
// キャッシュするファイル一覧
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg'
];

// インストール時にファイルをキャッシュ
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// オフライン時はキャッシュからページを返す
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
