/**
 * Service Worker - 缓存策略
 * 实现离线访问和快速二次加载
 */

const CACHE_NAME = 'love-blog-v1.1';
const RUNTIME_CACHE = 'love-blog-runtime-v1.1';

// 需要缓存的静态资源
const STATIC_ASSETS = [
  '/',
  '/css/custom.css',
  '/js/boot.js',
  '/js/love_config.js',
  '/js/love_timer.js',
  '/js/love_interactions.js',
  '/js/love_components.js',
  '/js/oss_optimize.js'
];

// 安装事件 - 缓存静态资源
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => {
      return self.skipWaiting(); // 立即激活
    })
  );
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim(); // 立即控制所有页面
    })
  );
});

//  fetch事件 - 缓存策略
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 跳过非GET请求
  if (request.method !== 'GET') {
    return;
  }

  // 跳过跨域请求（除非是OSS图片）
  if (url.origin !== location.origin && !url.hostname.includes('aliyuncs.com')) {
    return;
  }

  // 静态资源：Cache First策略
  if (STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // 图片资源：Cache First策略（OSS图片）
  if (url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) || url.hostname.includes('aliyuncs.com')) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        }).catch(() => {
          // 离线时返回占位图
          return new Response('', { status: 404 });
        });
      })
    );
    return;
  }

  // HTML页面：Network First策略
  if (request.headers.get('accept').includes('text/html')) {
    event.respondWith(
      fetch(request).then((response) => {
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      }).catch(() => {
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // 返回离线页面
          return caches.match('/');
        });
      })
    );
    return;
  }

  // 其他资源：Network First策略
  event.respondWith(
    fetch(request).then((response) => {
      if (response.ok) {
        const responseClone = response.clone();
        caches.open(RUNTIME_CACHE).then((cache) => {
          cache.put(request, responseClone);
        });
      }
      return response;
    }).catch(() => {
      return caches.match(request);
    })
  );
});

// 消息处理 - 用于手动更新缓存
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME);
    caches.delete(RUNTIME_CACHE);
  }
});
