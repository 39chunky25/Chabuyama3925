// シンプルな「キャッシュ優先＋ネットフォールバック」
const CACHE_NAME = "therapist-app-v1";
const ASSETS = [
  "./",                   // index.html
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png"
  // Tailwind (CDN)など外部はキャッシュ対象に含めない（CORS/更新の都合）
];

// インストール：静的アセットをキャッシュ
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

// 有効化：古いキャッシュを削除
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
});

// フェッチ：キャッシュ優先
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // POSTなどは素通し
  if (request.method !== "GET") return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((res) => {
        // 同一オリジンのみキャッシュに追加（GitHub Pages配下）
        try {
          const url = new URL(request.url);
          const sameOrigin = self.location.origin === url.origin;
          if (sameOrigin && res.ok && (request.destination === "document" || request.destination === "script" || request.destination === "style" || request.destination === "image")) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
        } catch (e) { /* noop */ }
        return res;
      }).catch(() => caches.match("./")); // オフライン時はindex.htmlにフォールバック
    })
  );
});
