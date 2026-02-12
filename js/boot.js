/**
 * 非关键脚本统一按需/延后加载（首屏提速）
 * - 只在需要的页面加载对应脚本
 * - 优先使用 requestIdleCallback，其次退化为 setTimeout
 */
(function () {
  "use strict";

  const loaded = new Set();

  const runWhenIdle = (fn) => {
    if (window.requestIdleCallback) {
      window.requestIdleCallback(fn, { timeout: 1500 });
    } else {
      setTimeout(fn, 600);
    }
  };

  const loadScript = (src) =>
    new Promise((resolve, reject) => {
      if (loaded.has(src)) return resolve();
      loaded.add(src);
      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = (e) => reject(e);
      document.body.appendChild(s);
    });

  const isHome = () =>
    window.location.pathname === "/" || window.location.pathname === "/index.html";

  const isCoarsePointer =
    (window.matchMedia && window.matchMedia("(pointer: coarse)").matches) ||
    window.innerWidth < 768;

  const boot = () => {
    // 首页欢迎弹窗：延后加载，减少首屏阻塞
    if (isHome()) {
      runWhenIdle(() => loadScript("/js/love_alert.js?v=1.0").catch(() => {}));
    }

    // 天气卡片：只有侧边栏存在对应 DOM 才加载
    if (document.getElementById("weather-tips")) {
      runWhenIdle(() => loadScript("/js/love_weather.js").catch(() => {}));
    }

    // 图片 OSS 自动限宽：正文/相册存在图片时再加载
    if (
      document.querySelector(".gallery-items img, .fj-gallery-item img, #article-container img")
    ) {
      runWhenIdle(() => loadScript("/js/image_responsive.js?v=1.0").catch(() => {}));
      runWhenIdle(() => loadScript("/js/oss_optimize.js").catch(() => {}));
      runWhenIdle(() => loadScript("/js/love_components.js?v=1.0").catch(() => {}));
    }

    // 加密输入框增强：只有出现加密输入框才加载
    if (document.getElementById("hbePass") || document.getElementById("hbeSubmitBtn")) {
      runWhenIdle(() => loadScript("/js/encrypt_ui.js?v=1.0").catch(() => {}));
    }

    // 地图页：需要时再加载（内部会自行拉取 echarts）
    if (document.getElementById("love-map-container")) {
      loadScript("/js/love_map.js?v=1.0").catch(() => {});
    }

    // 日历页：需要时再加载
    if (document.getElementById("love-calendar-container")) {
      loadScript("/js/love_calendar.js").catch(() => {});
    }

    // 非关键特效：桌面端延后加载
    if (!isCoarsePointer) {
      runWhenIdle(() => loadScript("/js/sakura.js?v=1.0").catch(() => {}));
      runWhenIdle(() => loadScript("/js/cursor_trail.js?v=4.1").catch(() => {}));
      runWhenIdle(() => loadScript("/js/click_phrases.js").catch(() => {}));
    }

    // 全站交互增强：纪念日角标、心情打卡、每日一签
    runWhenIdle(() => loadScript("/js/love_interactions.js?v=1.1").catch(() => {}));
  };

  document.addEventListener("DOMContentLoaded", boot);
  document.addEventListener("pjax:complete", boot);
})();


