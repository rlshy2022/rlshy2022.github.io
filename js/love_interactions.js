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

  // ---------- 4. 留言板：快捷留言 / 回复高亮 / 纪念日提示 ----------
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

  const bootInteractions = () => {
    runWhenIdle(initAnniversaryBadge);
    runWhenIdle(initEmotionReactions);
    runWhenIdle(initDailyQuote);
    runWhenIdle(initCommentsPageEnhance);
  };

  document.addEventListener("DOMContentLoaded", bootInteractions);
  document.addEventListener("pjax:complete", bootInteractions);
})();


