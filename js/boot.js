/**
 * Non-critical scripts are loaded on demand to keep the first screen light.
 */
(function () {
  "use strict";

  const loaded = new Set();
  const loadedStyles = new Set();

  const runWhenIdle = (fn) => {
    if (window.requestIdleCallback) {
      window.requestIdleCallback(fn, { timeout: 1500 });
    } else {
      window.setTimeout(fn, 600);
    }
  };

  const loadScript = (src) =>
    new Promise((resolve, reject) => {
      if (loaded.has(src)) return resolve();
      loaded.add(src);

      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = (error) => reject(error);
      document.body.appendChild(script);
    });

  const loadStyle = (href) => {
    if (loadedStyles.has(href)) return;
    loadedStyles.add(href);

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
  };

  const isHome = () =>
    window.location.pathname === "/" || window.location.pathname === "/index.html";

  const isPath = (target) => {
    const path = window.location.pathname || "/";
    return path === target || path === `${target}index.html`;
  };

  const isGalleryPage = () => isPath("/gallery/");

  const isPhotoWallPage = () => isPath("/photo-wall/");

  const featureEnabled = (key, defaultValue = true) => {
    const features = window.LOVE_CONFIG && window.LOVE_CONFIG.features;
    if (!features || !Object.prototype.hasOwnProperty.call(features, key)) {
      return defaultValue;
    }
    return features[key] !== false;
  };

  const unlockRouteAchievement = () => {
    const runtime = window.LOVE_MEMORY_RUNTIME;
    if (!runtime || typeof runtime.unlockAchievement !== "function") return;

    const path = window.location.pathname || "/";
    const routeMap = [
      [isHome(), "open-home"],
      [path.startsWith("/memory-hub/"), "open-hub"],
      [path.startsWith("/search-memory/"), "use-search"],
      [path.startsWith("/love-timeline/"), "open-timeline"],
      [path.startsWith("/love-map/"), "open-map"],
      [path.startsWith("/memory-gacha/"), "open-gacha"],
    ];

    routeMap.forEach(([matched, badge]) => {
      if (matched) runtime.unlockAchievement(badge);
    });
  };

  const isCoarsePointer =
    (window.matchMedia && window.matchMedia("(pointer: coarse)").matches) ||
    window.innerWidth < 768;

  const boot = () => {
    unlockRouteAchievement();

    // ===== A. Home route resources =====
    if (isHome()) {
      loadStyle("/css/home_experience.css?v=1.0");
      loadStyle("/css/home_today_memory.css?v=1.0");
      if (featureEnabled("loveAlert")) {
        runWhenIdle(() => loadScript("/js/love_alert.js?v=1.0").catch(() => {}));
      }
      if (featureEnabled("homePortal")) {
        runWhenIdle(() => loadScript("/js/home_memory_portal.js?v=1.2").catch(() => {}));
      }
    }

    // ===== B. Shared utility widgets =====
    if (document.getElementById("weather-tips")) {
      runWhenIdle(() => loadScript("/js/love_weather.js").catch(() => {}));
    }

    // ===== C. Media pages and image enhancements =====
    if (isGalleryPage() || document.querySelector(".gallery-items img, .fj-gallery-item img")) {
      loadStyle("/css/gallery_experience.css?v=1.0");
    }

    if (
      document.querySelector(".gallery-items img, .fj-gallery-item img, #article-container img") ||
      document.getElementById("hexo-blog-encrypt")
    ) {
      runWhenIdle(() => loadScript("/js/oss_optimize.js").catch(() => {}));
      runWhenIdle(() => loadScript("/js/love_components.js?v=1.1").catch(() => {}));
    }

    if (isPhotoWallPage()) {
      loadStyle("/css/photo_wall.css?v=1.2");
      loadScript("/js/photo_wall_experience.js?v=1.0").catch(() => {});
    }

    // ===== D. Article and encrypted-page experience =====
    if (document.getElementById("hbePass") || document.getElementById("hbeSubmitBtn")) {
      runWhenIdle(() => loadScript("/js/encrypt_ui.js?v=1.2").catch(() => {}));
    }

    if (document.getElementById("article-container")) {
      loadStyle("/css/article_widgets.css?v=1.0");
      runWhenIdle(() => loadScript("/js/reading_progress.js?v=1.0").catch(() => {}));
      if (featureEnabled("articleReactions")) {
        loadStyle("/css/love_reactions.css?v=1.0");
        runWhenIdle(() => loadScript("/js/love_reactions.js?v=1.0").catch(() => {}));
      }
      runWhenIdle(() => loadScript("/js/love_page_extras.js?v=1.0").catch(() => {}));
    }

    if (
      isHome() ||
      isPath("/about/") ||
      isPath("/love-list/")
    ) {
      if (featureEnabled("dailyQuote")) {
        loadStyle("/css/daily_quote.css?v=1.0");
        runWhenIdle(() => loadScript("/js/love_page_extras.js?v=1.0").catch(() => {}));
      }
    }

    if (isPath("/love-list/")) {
      loadStyle("/css/love_list.css?v=1.0");
    }

    // ===== E. Comments and social modules =====
    if (
      featureEnabled("commentsEnhance") &&
      (document.getElementById("twikoo") || isPath("/comments/"))
    ) {
      runWhenIdle(() => loadScript("/js/comments_enhance.js?v=1.1").catch(() => {}));
    }

    // ===== F. Memory world pages (map/timeline/gacha/hub/search/letters/review) =====
    if (document.getElementById("love-map-container")) {
      loadStyle("/css/love_map_page.css?v=1.1");
      loadScript("/js/love_map.js?v=1.3").catch(() => {});
    }

    if (document.getElementById("love-calendar-container")) {
      loadScript("/js/love_calendar.js?v=1.1").catch(() => {});
    }

    if (document.getElementById("love-timeline-page")) {
      loadStyle("/css/memory_pages.css?v=1.0");
      runWhenIdle(() => loadScript("/js/love_timeline.js?v=2.4").catch(() => {}));
    }

    if (document.getElementById("memory-gacha-page")) {
      loadStyle("/css/memory_pages.css?v=1.0");
      runWhenIdle(() => loadScript("/js/memory_gacha.js?v=2.0").catch(() => {}));
    }

    if (document.getElementById("memory-hub-page")) {
      runWhenIdle(() => loadScript("/js/memory_hub.js?v=1.6").catch(() => {}));
    }

    if (document.getElementById("travel-passport-page")) {
      runWhenIdle(() => loadScript("/js/travel_passport.js?v=1.2").catch(() => {}));
    }

    if (document.getElementById("future-letters-page")) {
      runWhenIdle(() => loadScript("/js/future_letters.js?v=1.4").catch(() => {}));
    }

    if (document.getElementById("memory-search-page")) {
      runWhenIdle(() => loadScript("/js/memory_search.js?v=1.5").catch(() => {}));
    }

    // ===== G. Engagement effects and page bridges =====
    if (featureEnabled("clickPhrases") && (document.querySelector(".click-theme-switcher") || !isCoarsePointer)) {
      runWhenIdle(() =>
        loadScript("/js/click_phrase_themes.js?v=1.0")
          .then(() => loadScript("/js/click_phrases.js?v=1.1"))
          .catch(() => {})
      );
    }

    if (isGalleryPage() || isPhotoWallPage()) {
      runWhenIdle(() => loadScript("/js/memory_story_bridges.js?v=1.0").catch(() => {}));
    }

    if (!isCoarsePointer) {
      if (featureEnabled("sakura")) {
        runWhenIdle(() => loadScript("/js/sakura.js?v=1.0").catch(() => {}));
      }
      if (featureEnabled("cursorTrail")) {
        runWhenIdle(() => loadScript("/js/cursor_trail.js?v=4.1").catch(() => {}));
      }
    }

    // ===== H. Special-day theme and always-on global enhancements =====
    if (featureEnabled("specialDay")) {
      loadStyle("/css/special_day.css?v=1.0");
      runWhenIdle(() => loadScript("/js/love_special_day.js?v=2.0").catch(() => {}));
    }

    runWhenIdle(() => loadScript("/js/love_interactions.js?v=2.3").catch(() => {}));
    runWhenIdle(() => loadScript("/js/memory_explorer.js?v=1.3").catch(() => {}));

    if (featureEnabled("anniversaryBadge")) {
      loadStyle("/css/anniversary_badge.css?v=1.1");
      runWhenIdle(() => loadScript("/js/anniversary_badge.js?v=1.0").catch(() => {}));
    }
  };

  document.addEventListener("DOMContentLoaded", boot);
  document.addEventListener("pjax:complete", boot);
})();
