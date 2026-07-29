/**
 * Service Worker 注册脚本
 * - 生产环境注册根目录 Service Worker，确保能接管整站页面
 * - 本地预览时主动注销，避免缓存干扰调试
 */

(function () {
  "use strict";

  if (!("serviceWorker" in navigator)) return;
  if (window.LOVE_CONFIG && window.LOVE_CONFIG.features && window.LOVE_CONFIG.features.pwa === false) return;

  const isLocalPreview =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  window.addEventListener("load", async () => {
    if (isLocalPreview) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));
      } catch (e) {}
      return;
    }

    try {
      await navigator.serviceWorker.register("/service-worker.js");
    } catch (e) {
      return;
    }

    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  });
})();
