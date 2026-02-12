/**
 * Service Worker 注册脚本
 * 在页面加载时注册Service Worker
 */

(function() {
  'use strict';

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/js/service-worker.js')
        .then((registration) => {
          console.log('[SW] Registered:', registration.scope);

          // 检查更新
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // 新版本可用，提示用户刷新
                console.log('[SW] New version available');
                // 可以在这里显示更新提示
              }
            });
          });
        })
        .catch((error) => {
          console.log('[SW] Registration failed:', error);
        });

      // 监听Service Worker控制权变更
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    });
  }
})();
