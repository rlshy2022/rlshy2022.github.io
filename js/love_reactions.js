(function () {
  "use strict";

  const STORAGE_KEY = "love_emotion_stats";
  const ui = window.LOVE_UI_UTILS || {};

  const readStore = () => {
    if (typeof ui.readJsonStorage === "function") {
      return ui.readJsonStorage(STORAGE_KEY, {});
    }
    return {};
  };

  const writeStore = (store) => {
    if (typeof ui.writeJsonStorage === "function") {
      ui.writeJsonStorage(STORAGE_KEY, store);
    }
  };

  const getEmotionMessage = (emotion) => {
    if (emotion === "love") return "收到啦，小心脏现在正疯狂打滚中 ❤️";
    if (emotion === "warm") return "我也被你暖到了，谢谢你认真看完这篇小情书 🥹";
    if (emotion === "happy") return "开心被你发现啦，下次我们一起笑更久一点 😆";
    return "你的回应，我都好好收下了 💌";
  };

  const initEmotionReactions = () => {
    const containers = document.querySelectorAll(".emotion-reactions");
    if (!containers.length) return;

    const store = readStore();
    const pathKey = window.location.pathname || "default";

    containers.forEach((box) => {
      if (box.dataset.loveReactionsBound === "1") return;
      box.dataset.loveReactionsBound = "1";

      box.querySelectorAll("button[data-emotion]").forEach((button) => {
        button.addEventListener("click", () => {
          const emotion = button.getAttribute("data-emotion");
          if (!emotion) return;

          if (!store[pathKey]) store[pathKey] = {};
          store[pathKey][emotion] = (store[pathKey][emotion] || 0) + 1;
          writeStore(store);
          ui.showToast?.(getEmotionMessage(emotion), { icon: false, showClass: "love-toast-show", duration: 2400 });
        });
      });
    });
  };

  const isAboutPage = () => {
    const path = window.location.pathname || "/";
    return path === "/about/" || path === "/about/index.html";
  };

  const buildArticleLabel = (path) => {
    if (!path) return "这篇小情书";
    try {
      const clean = String(path).replace(/\/+$/, "");
      const parts = clean.split("/");
      const last = parts[parts.length - 1] || parts[parts.length - 2] || "";
      return decodeURIComponent(last) || "这篇小情书";
    } catch (error) {
      return "这篇小情书";
    }
  };

  const initEmotionStatsCard = () => {
    if (!isAboutPage()) return;
    if (document.querySelector(".about-emotion-stats-card")) return;

    const store = readStore();
    const byArticle = [];
    let totalLove = 0;
    let totalWarm = 0;
    let totalHappy = 0;

    Object.keys(store || {}).forEach((path) => {
      const stat = store[path] || {};
      const love = Number(stat.love || 0);
      const warm = Number(stat.warm || 0);
      const happy = Number(stat.happy || 0);
      const sum = love + warm + happy;
      if (!sum) return;

      totalLove += love;
      totalWarm += warm;
      totalHappy += happy;
      byArticle.push({ path, sum });
    });

    if (!byArticle.length) return;

    byArticle.sort((a, b) => b.sum - a.sum);
    const topListHtml = byArticle
      .slice(0, 3)
      .map(
        (item, index) => `
          <div class="about-emotion-top-item">
            <span class="rank">TOP ${index + 1}</span>
            <span class="title">${ui.escapeHtml ? ui.escapeHtml(buildArticleLabel(item.path)) : buildArticleLabel(item.path)}</span>
            <span class="count">${item.sum} 次心情回应</span>
          </div>
        `
      )
      .join("");

    const container = document.querySelector(".about-container") || document.getElementById("article-container");
    if (!container) return;

    const card = document.createElement("div");
    card.className = "about-emotion-stats-card";
    card.innerHTML = `
      <div class="about-emotion-title">
        <i class="fas fa-chart-line"></i>
        最近的小情书心情记录
      </div>
      <div class="about-emotion-grid">
        <div class="about-emotion-stat">
          <div class="label">好甜</div>
          <div class="value">${totalLove}</div>
        </div>
        <div class="about-emotion-stat">
          <div class="label">被感动</div>
          <div class="value">${totalWarm}</div>
        </div>
        <div class="about-emotion-stat">
          <div class="label">好开心</div>
          <div class="value">${totalHappy}</div>
        </div>
      </div>
      <div class="about-emotion-toplist">
        ${topListHtml}
      </div>
    `;

    container.appendChild(card);
  };

  const boot = () => {
    initEmotionReactions();
    initEmotionStatsCard();
  };

  boot();
  document.addEventListener("DOMContentLoaded", boot);
  document.addEventListener("pjax:complete", boot);
  window.addEventListener("hexo-blog-decrypt", () => window.setTimeout(boot, 80));
})();
