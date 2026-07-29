(function () {
  "use strict";

  const runtime = window.LOVE_MEMORY_RUNTIME;
  const TOAST_KEY = "love_special_day_toast";
  const BANNER_ID = "love-special-day-banner";
  const SPOTLIGHT_ID = "love-special-day-spotlight";
  const ACTIVE_CLASS = "love-special-day-active";
  const THEME_CLASSES = ["is-special-anniversary", "is-special-birthday", "is-special-valentine"];

  const safeArray = runtime && runtime.safeArray ? runtime.safeArray : (value) => (Array.isArray(value) ? value : []);

  const createToast = (text) => {
    if (!text) return;

    const toast = document.createElement("div");
    toast.className = "love-special-day-toast";
    toast.innerHTML = `<i class="fas fa-heart"></i><span>${text}</span>`;
    document.body.appendChild(toast);

    window.setTimeout(() => {
      toast.classList.add("is-visible");
    }, 20);

    window.setTimeout(() => {
      toast.classList.remove("is-visible");
      window.setTimeout(() => toast.remove(), 240);
    }, 2600);
  };

  const restoreOriginalText = () => {
    document.querySelectorAll("[data-special-day-original]").forEach((node) => {
      node.textContent = node.getAttribute("data-special-day-original") || "";
      node.removeAttribute("data-special-day-original");
      node.removeAttribute("data-special-day-bound");
    });
  };

  const resetSpecialDayState = () => {
    const banner = document.getElementById(BANNER_ID);
    if (banner) banner.remove();

    const spotlight = document.getElementById(SPOTLIGHT_ID);
    if (spotlight) spotlight.remove();

    document.body.classList.remove(ACTIVE_CLASS);
    THEME_CLASSES.forEach((className) => document.body.classList.remove(className));
    delete document.body.dataset.specialDay;
    document.documentElement.style.removeProperty("--love-special-day-accent");
    restoreOriginalText();
  };

  const injectBanner = (activeDay) => {
    const bodyWrap = document.getElementById("body-wrap");
    if (!bodyWrap) return;

    const banner = document.createElement("div");
    banner.id = BANNER_ID;
    banner.className = "love-special-day-banner";
    banner.innerHTML = `
      <div class="love-special-day-banner-inner">
        <div class="love-special-day-banner-copy">
          <span class="love-special-day-badge">${activeDay.badge || "今日限定"}</span>
          <strong>${activeDay.name || "特别日子"}</strong>
          <span>${activeDay.heroDesc || "今天整座小站都在替我们记得。"}</span>
        </div>
        <div class="love-special-day-banner-links">
          ${safeArray(activeDay.recommendedLinks)
            .map((item) => `<a href="${item.url}">${item.label}</a>`)
            .join("")}
        </div>
      </div>
    `;

    bodyWrap.insertBefore(banner, bodyWrap.firstChild || null);
  };

  const decorateHero = (selector, activeDay) => {
    const hero = document.querySelector(selector);
    if (!hero || hero.dataset.specialDayBound === activeDay.key) return;

    hero.dataset.specialDayBound = activeDay.key;
    hero.classList.add("is-special-day");

    if (!hero.querySelector(".love-special-day-chip")) {
      const chip = document.createElement("span");
      chip.className = "love-special-day-chip";
      chip.textContent = activeDay.badge || "今日限定";
      hero.prepend(chip);
    }

    const title = hero.querySelector("h2, .home-story-title, .love-timeline-title, .memory-gacha-title");
    if (title && activeDay.heroTitle && !title.hasAttribute("data-special-day-original")) {
      title.setAttribute("data-special-day-original", title.textContent || "");
      title.textContent = activeDay.heroTitle;
    }

    const desc = hero.querySelector("p, .home-story-desc, .love-timeline-desc, .memory-gacha-desc");
    if (desc && activeDay.heroDesc && !desc.hasAttribute("data-special-day-original")) {
      desc.setAttribute("data-special-day-original", desc.textContent || "");
      desc.textContent = activeDay.heroDesc;
    }
  };

  const decorateTodayMemory = (activeDay) => {
    const kicker = document.querySelector(".home-today-memory-kicker");
    const subtitle = document.querySelector(".home-today-memory-subtitle");
    if (kicker && !kicker.hasAttribute("data-special-day-original")) {
      kicker.setAttribute("data-special-day-original", kicker.textContent || "");
      kicker.textContent = activeDay.badge || "今日限定";
    }
    if (subtitle && activeDay.heroDesc && !subtitle.hasAttribute("data-special-day-original")) {
      subtitle.setAttribute("data-special-day-original", subtitle.textContent || "");
      subtitle.textContent = activeDay.heroDesc;
    }
  };

  const decorateMusic = (activeDay) => {
    const title = document.querySelector(".music-title");
    if (title && !title.hasAttribute("data-special-day-original")) {
      title.setAttribute("data-special-day-original", title.textContent || "");
      title.textContent = `${activeDay.name || "今日限定"} · Our Love Song`;
    }
  };

  const injectSpotlight = (activeDay) => {
    const recentPosts = document.getElementById("recent-posts");
    if (!recentPosts) return;

    const spotlight = document.createElement("section");
    spotlight.id = SPOTLIGHT_ID;
    spotlight.className = "love-special-day-spotlight";
    spotlight.innerHTML = `
      <div class="love-special-day-spotlight-head">
        <div>
          <span class="love-special-day-spotlight-kicker">${activeDay.badge || "今日限定"}</span>
          <h2>${activeDay.featureTitle || activeDay.heroTitle || "今天适合把故事翻到最亮的那几页"}</h2>
          <p>${activeDay.featureDesc || activeDay.heroDesc || "把适合今天打开的入口排在最前面，像整站都在认真陪我们过这个日子。"}</p>
        </div>
      </div>
      <div class="love-special-day-spotlight-links">
        ${safeArray(activeDay.recommendedLinks)
          .map(
            (item) => `
              <a href="${item.url}" class="love-special-day-spotlight-link">
                <span>${item.label}</span>
                <i class="fas fa-arrow-right"></i>
              </a>
            `
          )
          .join("")}
      </div>
    `;

    const portal = recentPosts.querySelector(".home-memory-portal");
    if (portal) {
      recentPosts.insertBefore(spotlight, portal);
      return;
    }

    const hero = recentPosts.querySelector(".home-story-hero");
    if (hero && hero.nextSibling) {
      recentPosts.insertBefore(spotlight, hero.nextSibling);
    } else if (hero) {
      recentPosts.appendChild(spotlight);
    } else {
      recentPosts.insertBefore(spotlight, recentPosts.firstChild || null);
    }
  };

  const ensureToast = (activeDay) => {
    const now = new Date();
    const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const key = `${todayKey}:${activeDay.key}`;

    try {
      if (window.sessionStorage.getItem(TOAST_KEY) === key) return;
      window.sessionStorage.setItem(TOAST_KEY, key);
    } catch (error) {
      // ignore storage failures
    }

    createToast(activeDay.toast || `${activeDay.name || "特别日子"}快乐，今天整座小站都在发光。`);
  };

  const applySpecialDay = () => {
    const ready = runtime && runtime.getMeta ? runtime.getMeta() : Promise.resolve();

    ready.then(() => {
      resetSpecialDayState();

      const activeDay = runtime && runtime.getActiveSpecialDay ? runtime.getActiveSpecialDay() : null;
      if (!activeDay) return;

      document.body.classList.add(ACTIVE_CLASS);
      document.body.dataset.specialDay = activeDay.key || "special";
      if (activeDay.themeClass) {
        document.body.classList.add(activeDay.themeClass);
      }
      if (activeDay.accent) {
        document.documentElement.style.setProperty("--love-special-day-accent", activeDay.accent);
      }

      injectBanner(activeDay);
      injectSpotlight(activeDay);
      decorateHero(".home-story-hero .home-story-main", activeDay);
      decorateHero(".love-timeline-hero", activeDay);
      decorateHero(".memory-gacha-hero", activeDay);
      decorateTodayMemory(activeDay);
      decorateMusic(activeDay);
      ensureToast(activeDay);
    });
  };

  applySpecialDay();
  document.addEventListener("DOMContentLoaded", applySpecialDay);
  document.addEventListener("pjax:complete", applySpecialDay);
  window.addEventListener("hexo-blog-decrypt", () => {
    window.setTimeout(applySpecialDay, 120);
  });
})();
