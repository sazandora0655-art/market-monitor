/* MarketEye service worker — 2026-09-22 17:04
   ・HTML（アプリ本体）は必ずネットワークを先に見る。
     キャッシュ優先にすると、直した版が永久に届かない（2026-09-22に実際にそうなった）。
   ・アイコン等の動かないファイルだけキャッシュ優先。
   ・オフラインのときだけキャッシュのHTMLを返す。 */
const CACHE = 'marketeye-20260922-1704';
const ASSETS = ['./', './index.html', './manifest.webmanifest',
                './icon-192.png', './icon-512.png', './icon-512-maskable.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const ks = await caches.keys();
    const old = ks.filter(k => k !== CACHE && k.indexOf('marketeye-') === 0);
    await Promise.all(old.map(k => caches.delete(k)));
    await self.clients.claim();
    /* 前の版があった＝更新。開きっぱなしの画面を作り直して、確実に新しい版にする。
       ページ側のコードに頼らないので、古い版で固まっているタブも復帰できる */
    if (old.length) {
      const cs = await self.clients.matchAll({type: 'window'});
      for (const c of cs) { try { await c.navigate(c.url); } catch (err) {} }
    }
  })());
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  const isDoc = e.request.mode === 'navigate' ||
                (e.request.headers.get('accept') || '').includes('text/html');
  if (isDoc) {
    e.respondWith(
      fetch(e.request).then(res => {
        if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
        return res;
      }).catch(() => caches.match(e.request, {ignoreSearch: true})
                       .then(hit => hit || caches.match('./index.html'))));
    return;
  }
  e.respondWith(
    caches.match(e.request, {ignoreSearch: true}).then(hit => hit ||
      fetch(e.request).then(res => {
        if (res && res.ok && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return res;
      })));
});
