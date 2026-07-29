(function () {
  "use strict";

  const LOVE_LIST_PROGRESS_KEY = "love_list_progress";
  const ui = window.LOVE_UI_UTILS || {};
  const DAILY_QUOTES = [
    "今天也要记得，世界再吵，你永远是我心里那份安静。",
    "如果生活有等级，那和你在一起就是满级。",
    "所有的日子都值得期待，因为它们都有可能和你有关。",
    "你不用很厉害，做我的小朋友就够啦。",
    "今天的风很温柔，大概是路过你身边的时候学会的。",
    "愿今天的你，嘴角上扬，心里有光。",
    "没关系，累了就来小窝躲一躲，我给你续电。",
    "别怕慢，只要是往我这里走，走多久都算数。",
  ];

  const runLater = (fn, delay = 80) => window.setTimeout(fn, delay);

  const isHomePage = () => {
    const path = ui.getPath ? ui.getPath() : window.location.pathname || "/";
    return path === "/" || path === "/index.html";
  };

  const isAboutPage = () => {
    const path = ui.getPath ? ui.getPath() : window.location.pathname || "/";
    return path === "/about/" || path === "/about/index.html";
  };

  const todayKey = () => {
    const date = new Date();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${date.getFullYear()}-${month}-${day}`;
  };

  const pickDailyQuote = () => {
    const key = "love_daily_quote";
    const today = todayKey();

    const saved = ui.readJsonStorage ? ui.readJsonStorage(key, {}) : {};
    if (saved.date === today && typeof saved.index === "number") {
      return DAILY_QUOTES[saved.index] || DAILY_QUOTES[0];
    }

    const index = Math.floor(Math.random() * DAILY_QUOTES.length);
    ui.writeJsonStorage?.(key, { date: today, index });
    return DAILY_QUOTES[index];
  };

  const initDailyQuote = () => {
    const oldButton = document.getElementById("love-daily-quote-btn");
    if (!isHomePage() && !isAboutPage()) {
      oldButton?.remove();
      return;
    }
    if (oldButton) return;

    const button = document.createElement("button");
    button.id = "love-daily-quote-btn";
    button.type = "button";
    button.textContent = "今日小签";
    button.addEventListener("click", () => ui.showToast?.(pickDailyQuote()));
    document.body.appendChild(button);
  };

  const readLoveListProgress = () => {
    let loveList = window.LOVE_CONFIG && window.LOVE_CONFIG.loveList;
    if (loveList && loveList.total) return loveList;

    loveList = ui.readJsonStorage ? ui.readJsonStorage(LOVE_LIST_PROGRESS_KEY, {}) : null;
    return loveList && loveList.total ? loveList : null;
  };

  const initAboutLoveListSummary = () => {
    if (!isAboutPage()) return;

    const target = document.getElementById("about-love-progress-inline");
    if (!target) return;

    const loveList = readLoveListProgress();
    if (!loveList) return;

    const percent = Math.round((loveList.done / loveList.total) * 100);
    target.textContent = `目前我们已经一起完成了 ${loveList.done} / ${loveList.total} 件小事，小宇宙解锁进度 ${percent}%。`;
  };

  const syncLoveListProgress = () => {
    const scope = document.querySelector(".page[data-type='love-list']") || document.querySelector(".page-love-list");
    if (!scope) return;

    const update = () => {
      const listItems = scope.querySelectorAll('input[type="checkbox"]');
      const checkedItems = scope.querySelectorAll('input[type="checkbox"]:checked');

      window.LOVE_CONFIG = window.LOVE_CONFIG || {};
      window.LOVE_CONFIG.loveList = {
        total: listItems.length,
        done: checkedItems.length,
      };

      ui.writeJsonStorage?.(LOVE_LIST_PROGRESS_KEY, window.LOVE_CONFIG.loveList);
    };

    update();
    if (scope.dataset.loveListProgressBound === "1") return;
    scope.addEventListener("change", update);
    scope.dataset.loveListProgressBound = "1";
  };

  const initVideoInteractions = () => {
    const videos = document.querySelectorAll(".video-card video");
    if (!videos.length) {
      document.getElementById("love-video-now-playing")?.classList.remove("visible");
      return;
    }

    let badge = document.getElementById("love-video-now-playing");
    if (!badge) {
      badge = document.createElement("div");
      badge.id = "love-video-now-playing";
      badge.setAttribute("role", "status");
      badge.setAttribute("aria-live", "polite");
      document.body.appendChild(badge);
    }

    let hideTimer = null;
    const showBadge = (text) => {
      badge.textContent = text;
      badge.classList.add("visible");
      if (hideTimer) window.clearTimeout(hideTimer);
    };
    const scheduleHide = () => {
      if (hideTimer) window.clearTimeout(hideTimer);
      hideTimer = window.setTimeout(() => {
        badge.classList.remove("visible");
      }, 800);
    };

    videos.forEach((video, index) => {
      if (video.dataset.videoInteractionsBound === "1") return;

      const label = video.getAttribute("aria-label") || `第 ${index + 1} 幕`;
      video.addEventListener("play", () => showBadge(`正在播放：${label}`));
      video.addEventListener("pause", scheduleHide);
      video.addEventListener("ended", () => {
        scheduleHide();
        ui.showToast?.("这一幕已经偷偷存进回忆夹啦 🎞️");
      });
      video.dataset.videoInteractionsBound = "1";
    });
  };

  const boot = () => {
    initDailyQuote();
    initAboutLoveListSummary();
    syncLoveListProgress();
    initVideoInteractions();
  };

  boot();
  document.addEventListener("DOMContentLoaded", boot);
  document.addEventListener("pjax:complete", boot);
  window.addEventListener("hexo-blog-decrypt", () => runLater(boot));
})();
