/* オフラインでも開けるようにする。
   通信できるときは毎回サーバーから取り直して保存し直す（アップした更新がすぐ反映される）。
   通信できないとき、または WAIT_MS 待っても返事がないときは、保存しておいたものを出す。
   FILES を変えたら CACHE の末尾の番号を上げる（古い保存分が消える）。 */
var CACHE = 'dq8ps2-skill-calc-v3';
/* './index.html' は Cloudflare Pages などで './' へリダイレクトされ、保存したものがオフライン時に使えないので './' で持つ */
var PAGE = './';
var FILES = [PAGE, './manifest.webmanifest', './icon-192.png', './icon-512.png'];
var WAIT_MS = 3000;

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE)
      .then(function(c){ return c.addAll(FILES.map(function(f){ return new Request(f, {cache:'reload'}); })); })
      .then(function(){ return self.skipWaiting(); })
  );
});

/* 同じドメインに別のアプリがあっても消さないよう、このアプリの名前で始まるものだけ消す */
self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys()
      .then(function(keys){
        return Promise.all(keys.filter(function(k){
          return k.indexOf('dq8ps2-skill-calc-') === 0 && k !== CACHE;
        }).map(function(k){ return caches.delete(k); }));
      })
      .then(function(){ return self.clients.claim(); })
  );
});

function fromCache(req){
  return caches.match(req, {ignoreSearch:true}).then(function(hit){
    return hit || (req.mode === 'navigate' ? caches.match(PAGE) : undefined);
  });
}

/* HTTP キャッシュを使わずサーバーから取り直す。
   ナビゲーションは Request の cache だけ差し替えると例外になるので、URL から取り直す。
   リダイレクトはブラウザに任せる（追いかけた結果をページとして返すとブラウザが読み込みエラーにする） */
function fresh(req){
  if (req.mode === 'navigate') {
    return fetch(req.url, {cache:'reload', credentials:req.credentials, redirect:'manual'});
  }
  return fetch(req, {cache:'reload'});
}

self.addEventListener('fetch', function(e){
  var req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  var saving;
  var net = fresh(req).then(function(res){
    if (res.ok) {
      var copy = res.clone();
      saving = caches.open(CACHE).then(function(c){ return c.put(req, copy); });
    }
    return res;
  });
  e.waitUntil(net.then(function(){ return saving; }).catch(function(){}));

  e.respondWith(new Promise(function(resolve, reject){
    var timer = setTimeout(function(){
      fromCache(req).then(function(hit){ if (hit) resolve(hit); }, function(){});
    }, WAIT_MS);
    net.then(function(res){
      clearTimeout(timer);
      resolve(res);
    }, function(err){
      clearTimeout(timer);
      fromCache(req).then(function(hit){ if (hit) resolve(hit); else reject(err); }, function(){ reject(err); });
    });
  }));
});
