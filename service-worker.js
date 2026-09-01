/**
 * Service Worker - 站点根作用域缓存策略
 * 让首页、文章页和静态资源都能被整站接管，而不是只作用于 /js/。
 */

const STATIC_CACHE = "love-blog-static-v3.0";
const PAGE_CACHE = "love-blog-pages-v3.0";
const IMAGE_CACHE = "love-blog-images-v3.0";
const CACHE_WHITELIST = [STATIC_CACHE, PAGE_CACHE, IMAGE_CACHE];
const MAX_PAGE_ENTRIES = 40;
const MAX_IMAGE_ENTRIES = 120;

const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/css/critical.css",
  "/css/custom.css",
  "/css/love_timer_music.css",
  "/css/love_themes.css",
  "/css/site_footer.css",
  "/css/memory_upgrade.css",
  "/css/site_upgrade.css",
  "/css/home_experience.css",
  "/css/home_today_memory.css",
  "/css/memory_pages.css",
  "/css/article_widgets.css",
  "/css/love_reactions.css",
  "/css/love_map_page.css",
  "/css/photo_wall.css",
  "/css/polish.css",
  "/js/boot.js",
  "/js/love_config.js",
  "/js/photo_wall_experience.js",
  "/js/gallery_photo_stats.js",
  "/js/love_timer.js",
  "/js/memory_runtime.js",
  "/js/love_ui_utils.js",
  "/js/home_memory_portal.js",
  "/js/memory_hub.js",
  "/js/memory_search.js",
  "/js/memory_gacha.js",
  "/js/love_timeline.js",
  "/js/click_phrase_themes.js",
  "/js/click_phrases.js",
  "/js/encrypt_ui.js",
  "/lib/hbe.js",
  "/css/hbe.style.css",
];

const isHtmlRequest = (request) =>
  request.mode === "navigate" ||
  (request.headers.get("accept") || "").includes("text/html");

const isImageRequest = (request, url) =>
  request.destination === "image" ||
  /\.(avif|bmp|gif|ico|jpe?g|png|svg|webp)$/i.test(url.pathname) ||
  url.hostname.includes("aliyuncs.com");

const isStaticAssetRequest = (request, url) =>
  url.origin === self.location.origin &&
  (STATIC_ASSETS.includes(url.pathname) ||
    request.destination === "script" ||
    request.destination === "style" ||
    request.destination === "font" ||
    request.destination === "manifest");

async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  const overflow = keys.length - maxEntries;

  if (overflow <= 0) return;

  await Promise.all(keys.slice(0, overflow).map((key) => cache.delete(key)));
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((cacheName) => !CACHE_WHITELIST.includes(cacheName))
            .map((cacheName) => caches.delete(cacheName))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const isSameOrigin = url.origin === self.location.origin;
  const isAliyunImage = url.hostname.includes("aliyuncs.com");

  if (!isSameOrigin && !isAliyunImage) return;

  if (isHtmlRequest(request) && isSameOrigin) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(PAGE_CACHE).then((cache) => {
              cache.put(request, responseClone);
              trimCache(PAGE_CACHE, MAX_PAGE_ENTRIES);
            });
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached || caches.match("/");
        })
    );
    return;
  }

  if (isImageRequest(request, url)) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request)
          .then((response) => {
            if (response.ok) {
              const responseClone = response.clone();
              caches.open(IMAGE_CACHE).then((cache) => {
                cache.put(request, responseClone);
                trimCache(IMAGE_CACHE, MAX_IMAGE_ENTRIES);
              });
            }
            return response;
          })
          .catch(() => new Response("", { status: 504, statusText: "Image unavailable" }));
      })
    );
    return;
  }

  if (isStaticAssetRequest(request, url)) {
    const cacheKey = url.pathname;

    event.respondWith(
      caches.match(cacheKey, { ignoreSearch: true }).then((cachedResponse) => {
        const networkRequest = fetch(request)
          .then((response) => {
            if (response.ok) {
              const responseClone = response.clone();
              caches.open(STATIC_CACHE).then((cache) => {
                cache.put(cacheKey, responseClone);
              });
            }
            return response;
          })
          .catch(() => null);

        return (
          cachedResponse ||
          networkRequest.then(
            (response) =>
              response ||
              new Response("", { status: 503, statusText: "Asset unavailable" })
          )
        );
      })
    );
    return;
  }

  event.respondWith(fetch(request).catch(() => caches.match(request)));
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
  if (event.data && event.data.type === "CLEAR_CACHE") {
    event.waitUntil(Promise.all(CACHE_WHITELIST.map((cacheName) => caches.delete(cacheName))));
  }
});
