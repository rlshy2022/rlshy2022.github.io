(function () {
  "use strict";

  const LOVE_CFG = window.LOVE_CONFIG || {};

  const runWhenIdle = (fn) => {
    if (window.requestIdleCallback) {
      window.requestIdleCallback(fn, { timeout: 1500 });
    } else {
      setTimeout(fn, 500);
    }
  };

  const todayKey = () => {
    const d = new Date();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${m}-${day}`;
  };

  const showToast = (text) => {
    const toast = document.createElement("div");
    toast.className = "love-toast";
    toast.innerHTML = `<i class="fas fa-heart"></i> ${text}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2600);
  };

  // ---------- 1. 全站下一次纪念日角标 ----------
  const initAnniversaryBadge = () => {
    const anniversaries = (LOVE_CFG.anniversaries || []).slice();
    if (!anniversaries.length) return;

    const now = new Date();
    const year = now.getFullYear();
    const todayZero = new Date();
    todayZero.setHours(0, 0, 0, 0);

    const enriched = anniversaries.map((e) => {
      let target = new Date(year, e.month - 1, e.day);
      if (target < todayZero) {
        target = new Date(year + 1, e.month - 1, e.day);
      }
      const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
      return { ...e, target, diff };
    });

    enriched.sort((a, b) => a.target - b.target);
    const upcoming = enriched.slice(0, 3);
    if (!upcoming.length) return;

    if (document.getElementById("love-anniv-badge")) return;

    const badge = document.createElement("div");
    badge.id = "love-anniv-badge";
    const next = upcoming[0];
    badge.innerHTML = `
      <span class="love-anniv-label">下一个纪念日</span>
      <span class="love-anniv-name">${next.name}</span>
      <span class="love-anniv-days">还有 ${next.diff} 天</span>
    `;

    const panel = document.createElement("div");
    panel.id = "love-anniv-panel";
    let itemsHtml = "";
    upcoming.forEach((e) => {
      const m = String(e.month).padStart(2, "0");
      const d = String(e.day).padStart(2, "0");
      itemsHtml += `<div class="love-anniv-item">
        <div class="love-anniv-item-name">${e.name}</div>
        <div class="love-anniv-item-meta">${m}-${d} · 还有 ${e.diff} 天</div>
      </div>`;
    });
    panel.innerHTML = `
      <div class="love-anniv-panel-header">
        <span>接下来要记得的日子</span>
        <button type="button" class="love-anniv-link" onclick="window.location.href='/love-calendar/'">
          去纪念日历 <i class="fas fa-chevron-right"></i>
        </button>
      </div>
      <div class="love-anniv-list">
        ${itemsHtml}
      </div>
    `;

    document.body.appendChild(badge);
    document.body.appendChild(panel);

    let open = false;
    const toggle = () => {
      open = !open;
      panel.style.display = open ? "block" : "none";
    };
    badge.addEventListener("click", toggle);
  };

  // ---------- 2. 文章尾部心情打卡组件 ----------
  const initEmotionReactions = () => {
    const containers = document.querySelectorAll(".emotion-reactions");
    if (!containers.length) return;

    let store = {};
    try {
      const raw = localStorage.getItem("love_emotion_stats");
      if (raw) store = JSON.parse(raw);
    } catch (e) {}

    const save = () => {
      try {
        localStorage.setItem("love_emotion_stats", JSON.stringify(store));
      } catch (e) {}
    };

    const pathKey = window.location.pathname || "default";

    containers.forEach((box) => {
      const buttons = box.querySelectorAll("button[data-emotion]");
      if (!buttons.length) return;

      buttons.forEach((btn) => {
        btn.addEventListener("click", () => {
          const emotion = btn.getAttribute("data-emotion");
          if (!emotion) return;

          if (!store[pathKey]) store[pathKey] = {};
          store[pathKey][emotion] = (store[pathKey][emotion] || 0) + 1;
          save();

          let text = "";
          if (emotion === "love") {
            text = "收到啦，小心脏现在正疯狂打滚中 ❤️";
          } else if (emotion === "warm") {
            text = "我也被你暖到了，谢谢你认真看完这篇小情书 🥹";
          } else if (emotion === "happy") {
            text = "开心被你发现啦，下次我们一起笑更久一点 😆";
          } else {
            text = "你的回应，我都好好收下了 💌";
          }
          showToast(text);
        });
      });
    });
  };

  // ---------- 3. 首页 / About 的「每日一签」 ----------
  const DAILY_QUOTES = [
    "今天也要记得，世界再吵，你永远是我心里那份安静。",
    "如果生活有等级，那和你在一起就是满级。",
    "所有的日子都值得期待，因为它们都有可能和你有关。",
    "你不用很厉害，做我的小朋友就够啦。",
    "今天的风很温柔，大概是路过你身边的时候学会的。",
    "愿今天的你，嘴角上扬，心里有光。",
    "没关系，累了就来小窝躲一躲，我给你续电。",
    "别怕慢，只要是往我这里走，走多久都算数。"
  ];

  const initDailyQuote = () => {
    const path = window.location.pathname || "/";
    const isHome =
      path === "/" || path === "/index.html";
    const isAbout =
      path === "/about/" || path === "/about/index.html";
    if (!isHome && !isAbout) return;

    if (document.getElementById("love-daily-quote-btn")) return;

    const btn = document.createElement("button");
    btn.id = "love-daily-quote-btn";
    btn.type = "button";
    btn.textContent = "今日小签";

    document.body.appendChild(btn);

    const key = "love_daily_quote";
    const today = todayKey();

    const pickQuote = () => {
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const saved = JSON.parse(raw);
          if (saved.date === today && typeof saved.index === "number") {
            return DAILY_QUOTES[saved.index] || DAILY_QUOTES[0];
          }
        }
      } catch (e) {}

      const idx = Math.floor(Math.random() * DAILY_QUOTES.length);
      const q = DAILY_QUOTES[idx];
      try {
        localStorage.setItem(key, JSON.stringify({ date: today, index: idx }));
      } catch (e) {}
      return q;
    };

    btn.addEventListener("click", () => {
      const text = pickQuote();
      showToast(text);
    });
  };

  // ---------- 4. About 页心情打卡小统计 ----------
  const isAboutPage = () => {
    const path = window.location.pathname || "/";
    return path === "/about/" || path === "/about/index.html";
  };

  const buildArticleLabel = (path) => {
    if (!path) return "这篇小情书";
    try {
      const clean = path.replace(/\/+$/, "");
      const parts = clean.split("/");
      const last = parts[parts.length - 1] || parts[parts.length - 2] || "";
      return decodeURIComponent(last) || "这篇小情书";
    } catch (e) {
      return "这篇小情书";
    }
  };

  const initEmotionStatsCard = () => {
    if (!isAboutPage()) return;
    if (document.querySelector(".about-emotion-stats-card")) return;

    let store = {};
    try {
      const raw = localStorage.getItem("love_emotion_stats");
      if (raw) store = JSON.parse(raw);
    } catch (e) {}

    const paths = Object.keys(store || {});
    if (!paths.length) return;

    let totalLove = 0;
    let totalWarm = 0;
    let totalHappy = 0;
    const byArticle = [];

    paths.forEach((p) => {
      const stat = store[p] || {};
      const love = stat.love || 0;
      const warm = stat.warm || 0;
      const happy = stat.happy || 0;
      const sum = love + warm + happy;
      if (!sum) return;
      totalLove += love;
      totalWarm += warm;
      totalHappy += happy;
      byArticle.push({ path: p, sum });
    });

    if (!byArticle.length) return;

    byArticle.sort((a, b) => b.sum - a.sum);
    const top = byArticle.slice(0, 3);

    const container = document.querySelector(".about-container") || document.getElementById("article-container");
    if (!container) return;

    const card = document.createElement("div");
    card.className = "about-emotion-stats-card";

    let topListHtml = "";
    top.forEach((item, index) => {
      const label = buildArticleLabel(item.path);
      topListHtml += `
        <div class="about-emotion-top-item">
          <span class="rank">TOP ${index + 1}</span>
          <span class="title">${label}</span>
          <span class="count">${item.sum} 次心情回应</span>
        </div>
      `;
    });

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

  // About 页面：在天数下方补充恋爱清单进度一句话
  const initAboutLoveListSummary = () => {
    if (!isAboutPage()) return;
    const el = document.getElementById("about-love-progress-inline");
    if (!el) return;
    const loveList = window.LOVE_CONFIG && window.LOVE_CONFIG.loveList;
    if (!loveList || !loveList.total) return;
    const percent = Math.round((loveList.done / loveList.total) * 100);
    el.textContent = `目前我们已经一起完成了 ${loveList.done} / ${loveList.total} 件小事，小宇宙解锁进度 ${percent}%。`;
  };

  // ---------- 5. 视频页交互：正在播放提示 + 结束小弹幕 ----------
  const initVideoInteractions = () => {
    const videos = document.querySelectorAll(".video-card video");
    if (!videos.length) return;

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
      if (hideTimer) clearTimeout(hideTimer);
    };
    const scheduleHide = () => {
      if (hideTimer) clearTimeout(hideTimer);
      hideTimer = setTimeout(() => {
        badge.classList.remove("visible");
      }, 800);
    };

    videos.forEach((video, idx) => {
      const label =
        video.getAttribute("aria-label") || `第 ${idx + 1} 幕`;

      video.addEventListener("play", () => {
        showBadge(`正在播放：${label}`);
      });

      video.addEventListener("pause", () => {
        scheduleHide();
      });

      video.addEventListener("ended", () => {
        scheduleHide();
        showToast("这一幕已经偷偷存进回忆夹啦 🎞️");
      });
    });
  };

  // ---------- 6. 恋爱清单进度同步（供其他页面统计用） ----------
  const collectLoveListProgress = () => {
    const scope = document.querySelector(".page[data-type='love-list']") || document.querySelector(".page-love-list");
    if (!scope) return;

    const listItems = scope.querySelectorAll('input[type="checkbox"]');
    const checkedItems = scope.querySelectorAll('input[type="checkbox"]:checked');

    const total = listItems.length;
    const done = checkedItems.length;

    // 写进全局配置，方便其他页面使用（如日历、统计）
    window.LOVE_CONFIG = window.LOVE_CONFIG || {};
    window.LOVE_CONFIG.loveList = {
      total: total,
      done: done,
    };
  };

  // ---------- 7. 留言板：Twikoo 懒加载占位 + 快捷留言 / 回复高亮 / 纪念日提示 ----------
  const initTwikooLazyPlaceholder = () => {
    const path = window.location.pathname || "";
    const isComments =
      path === "/comments/" || path === "/comments/index.html";
    if (!isComments) return;

    const tw = document.getElementById("twikoo");
    const wrapper = document.querySelector(".comments-card-wrapper");
    const placeholder = document.querySelector(".comments-twikoo-placeholder");
    if (!tw || !wrapper || !placeholder) return;

    // 初始隐藏真正的评论容器
    tw.classList.add("twikoo-hidden");

    if (!("IntersectionObserver" in window)) {
      tw.classList.remove("twikoo-hidden");
      if (placeholder && placeholder.parentNode) {
        placeholder.parentNode.removeChild(placeholder);
      }
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            tw.classList.remove("twikoo-hidden");
            if (placeholder && placeholder.parentNode) {
              placeholder.parentNode.removeChild(placeholder);
            }
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: "100px 0px",
        threshold: 0.1,
      }
    );

    observer.observe(wrapper);
  };
  const isCommentsPage = () => {
    const path = window.location.pathname || "";
    return (
      path === "/comments/" ||
      path === "/comments/index.html"
    );
  };

  const attachShortcutHandlers = () => {
    const shortcuts = document.querySelectorAll(".comment-shortcut");
    if (!shortcuts.length) return;

    const findTextarea = () => {
      const tw = document.getElementById("twikoo");
      if (!tw) return null;
      // Twikoo 常见结构：.tk-input textarea 或通用 textarea
      return (
        tw.querySelector(".tk-input textarea") ||
        tw.querySelector("textarea")
      );
    };

    shortcuts.forEach((btn) => {
      btn.addEventListener("click", () => {
        const text = btn.getAttribute("data-text") || "";
        const textarea = findTextarea();
        if (!textarea) {
          showToast("加载留言框稍微慢了一点，再等一小下～");
          return;
        }
        const current = textarea.value || "";
        textarea.value = current ? `${current}\n${text}` : text;
        textarea.dispatchEvent(new Event("input", { bubbles: true }));
        textarea.focus();
      });
    });
  };

  const initReplyHighlight = () => {
    const tw = document.getElementById("twikoo");
    if (!tw) return;

    tw.addEventListener("click", (e) => {
      const target = e.target;
      if (!target) return;

      // 兼容不同版本的 Twikoo 回复按钮类名
      const isReplyBtn =
        target.classList.contains("tk-reply") ||
        target.closest(".tk-reply");
      if (!isReplyBtn) return;

      const comment = target.closest(".tk-comment");
      if (!comment) return;

      tw.querySelectorAll(".tk-comment.tk-comment-highlight").forEach((el) => {
        el.classList.remove("tk-comment-highlight");
      });
      comment.classList.add("tk-comment-highlight");
    });
  };

  const initCommentsAnniversaryBanner = () => {
    if (!isCommentsPage()) return;
    const anniversaries = LOVE_CFG.anniversaries || [];
    if (!anniversaries.length) return;

    const now = new Date();
    const m = now.getMonth() + 1;
    const d = now.getDate();

    const todayEvents = anniversaries.filter(
      (a) => a.month === m && a.day === d
    );
    if (!todayEvents.length) return;

    const wrapper = document.querySelector(".comments-main-card");
    if (!wrapper || document.querySelector(".comments-anniv-banner")) return;

    const names = todayEvents.map((a) => a.name).join("、");
    const banner = document.createElement("div");
    banner.className = "comments-anniv-banner";
    banner.innerHTML = `
      <i class="fas fa-star-and-crescent"></i>
      今天是 <strong>${names}</strong>，要不要在这里给未来的我们留一句特别的话？💌
    `;
    wrapper.insertBefore(banner, wrapper.firstChild);
  };

  const initCommentsPageEnhance = () => {
    if (!isCommentsPage()) return;

    const tryInit = () => {
      const tw = document.getElementById("twikoo");
      if (!tw) return;
      attachShortcutHandlers();
      initReplyHighlight();
      initCommentsAnniversaryBanner();
    };

    // 先尝试一次
    tryInit();

    // 监听 Twikoo 渲染完成
    const tw = document.getElementById("twikoo");
    if (!tw) return;
    const observer = new MutationObserver(() => {
      attachShortcutHandlers();
    });
    observer.observe(tw, { childList: true, subtree: true });
  };

  // ---------- 8. 文章页阅读进度条 ----------
  const initReadingProgress = () => {
    const article = document.getElementById("article-container");
    if (!article) return;

    let bar = document.getElementById("love-reading-progress");
    if (bar) return;

    bar = document.createElement("div");
    bar.id = "love-reading-progress";
    bar.setAttribute("role", "progressbar");
    bar.setAttribute("aria-label", "阅读进度");
    bar.innerHTML = '<span class="love-reading-progress-inner"></span>';
    document.body.appendChild(bar);

    const inner = bar.querySelector(".love-reading-progress-inner");
    const update = () => {
      const rect = article.getBoundingClientRect();
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) {
        inner.style.width = "0%";
        return;
      }
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const articleTop = article.offsetTop;
      const articleHeight = article.offsetHeight;
      const start = articleTop - window.innerHeight * 0.5;
      const end = articleTop + articleHeight - window.innerHeight * 0.3;
      let pct = 0;
      if (scrollTop <= start) {
        pct = 0;
      } else if (scrollTop >= end) {
        pct = 100;
      } else {
        pct = ((scrollTop - start) / (end - start)) * 100;
      }
      inner.style.width = pct.toFixed(1) + "%";
      bar.setAttribute("aria-valuenow", Math.round(pct));
      bar.setAttribute("aria-valuemin", 0);
      bar.setAttribute("aria-valuemax", 100);
    };

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  };

  const bootInteractions = () => {
    runWhenIdle(initAnniversaryBadge);
    runWhenIdle(initEmotionReactions);
    runWhenIdle(initDailyQuote);
    runWhenIdle(initEmotionStatsCard);
    runWhenIdle(initAboutLoveListSummary);
    runWhenIdle(initVideoInteractions);
    runWhenIdle(collectLoveListProgress);
    runWhenIdle(initTwikooLazyPlaceholder);
    runWhenIdle(initCommentsPageEnhance);
    runWhenIdle(initReadingProgress);
  };

  document.addEventListener("DOMContentLoaded", bootInteractions);
  document.addEventListener("pjax:complete", bootInteractions);
})();


