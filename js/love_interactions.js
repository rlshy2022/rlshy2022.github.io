(function () {
  "use strict";

  const LOVE_CFG = window.LOVE_CONFIG || {};
  const LOVE_LIST_PROGRESS_KEY = "love_list_progress";
  const TODAY_MEMORY_ENDPOINT = "/memories/today-memory.json";
  const LOVE_TIMELINE_ENDPOINT = "/memories/love-timeline.json";
  const featureEnabled = (key, defaultValue = true) => {
    const features = (window.LOVE_CONFIG && window.LOVE_CONFIG.features) || LOVE_CFG.features;
    if (!features || !Object.prototype.hasOwnProperty.call(features, key)) {
      return defaultValue;
    }
    return features[key] !== false;
  };
  const MEMORY_SCENE_ALIASES = {
    jingdezhen: {
      galleryChapter: "景德镇",
      timelineLabel: "景德镇",
      keywords: ["景德镇", "jingdezhen", "陶阳里", "中国陶瓷博物馆", "跨年"],
    },
    suzhou_2026_08: { galleryChapter: "八月苏州", timelineLabel: "八月苏州", keywords: ["八月苏州", "四周年"] },
    suzhou: {
      galleryChapter: "苏州",
      timelineLabel: "苏州",
      keywords: ["苏州", "suzhou", "七里山塘"],
    },
    yangzhou: {
      galleryChapter: "扬州",
      timelineLabel: "扬州",
      keywords: ["扬州", "yangzhou"],
    },
    ningguo_huangshan: {
      galleryChapter: "宁国黄山",
      timelineLabel: "宁国黄山",
      keywords: ["宁国黄山", "ningguo", "nghs", "宁国", "爬黄山", "登黄山", "心愿牌", "红色心愿牌"],
    },
    huangshan: {
      galleryChapter: "黄山",
      timelineLabel: "黄山",
      keywords: ["黄山", "huangshan", "屯溪", "黎阳", "新安江", "清明"],
    },
    fuzhou: {
      galleryChapter: "福州",
      timelineLabel: "福州",
      keywords: ["福州", "fuzhou", "福建师范大学", "福师大", "长乐", "看海"],
    },
    gifts: {
      galleryChapter: "gifts",
      timelineLabel: "礼物",
      keywords: ["礼物", "gift"],
    },
    birthday: {
      galleryChapter: "生日",
      timelineLabel: "生日",
      keywords: ["生日", "birthday"],
    },
    daily: {
      galleryChapter: "日常",
      timelineLabel: "日常",
      keywords: ["日常", "相遇", "yeetalk", "情人节", "情书", "电影", "放映"],
    },
  };
  let todayMemoryDataPromise = null;
  let loveTimelineDataPromise = null;
  let todayMemoryRenderToken = 0;

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

  const safeArray = (value) => (Array.isArray(value) ? value : []);

  const padNumber = (value) => String(value).padStart(2, "0");

  const decodeSafe = (value) => {
    try {
      return decodeURIComponent(String(value || ""));
    } catch (e) {
      return String(value || "");
    }
  };

  const normalizeSearchText = (value) =>
    decodeSafe(value)
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();

  const getQueryParams = () => {
    try {
      return new URL(window.location.href).searchParams;
    } catch (e) {
      return new URLSearchParams(window.location.search || "");
    }
  };

  const formatMonthDay = (month, day) => `${month} 月 ${day} 日`;

  const formatIsoDate = (isoDate) => {
    if (!isoDate) return "";
    const [year, month, day] = String(isoDate).split("-");
    if (!year || !month || !day) return String(isoDate);
    return `${year}.${month}.${day}`;
  };

  const getMonthDayIndex = (month, day) =>
    Math.floor((Date.UTC(2024, month - 1, day) - Date.UTC(2024, 0, 1)) / (1000 * 60 * 60 * 24));

  const getMonthDayDistance = (monthA, dayA, monthB, dayB) => {
    const diff = Math.abs(getMonthDayIndex(monthA, dayA) - getMonthDayIndex(monthB, dayB));
    return Math.min(diff, 366 - diff);
  };

  const isHomePage = () => {
    const path = window.location.pathname || "/";
    return path === "/" || path === "/index.html";
  };

  const isGalleryPage = () => {
    const path = window.location.pathname || "/";
    return path === "/gallery/" || path === "/gallery/index.html";
  };

  const isPhotoWallPage = () => {
    const path = window.location.pathname || "/";
    return path === "/photo-wall/" || path === "/photo-wall/index.html";
  };

  const isLoveTimelinePage = () => {
    const path = window.location.pathname || "/";
    return path === "/love-timeline/" || path === "/love-timeline/index.html";
  };

  const calcLoveDays = () => {
    const loveStart =
      (LOVE_CFG.dates && LOVE_CFG.dates.loveStart) || "2022-08-18T00:00:00";
    const start = new Date(loveStart);
    const now = new Date();
    const diff = now.getTime() - start.getTime();
    return Math.max(1, Math.floor(diff / (1000 * 60 * 60 * 24)) + 1);
  };

  const loadTodayMemoryData = () => {
    if (todayMemoryDataPromise) return todayMemoryDataPromise;

    todayMemoryDataPromise = fetch(TODAY_MEMORY_ENDPOINT, {
      credentials: "same-origin",
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load today memory data: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => safeArray(data && data.posts))
      .catch(() => []);

    return todayMemoryDataPromise;
  };

  const loadLoveTimelineData = () => {
    if (loveTimelineDataPromise) return loveTimelineDataPromise;

    loveTimelineDataPromise = fetch(LOVE_TIMELINE_ENDPOINT, {
      credentials: "same-origin",
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load timeline data: ${response.status}`);
        }
        return response.json();
      })
      .catch(() => ({ events: [] }));

    return loveTimelineDataPromise;
  };

  const inferMemorySceneMeta = (item) => {
    const raw = normalizeSearchText(
      [
        item && item.title,
        item && item.summary,
        item && item.url,
        item && item.cover,
        item && item.location,
        ...safeArray(item && item.categories),
        ...safeArray(item && item.tags),
      ]
        .filter(Boolean)
        .join(" ")
    );

    if (!raw) return null;

    const matchedAlias = Object.keys(MEMORY_SCENE_ALIASES).find((key) =>
      safeArray(MEMORY_SCENE_ALIASES[key] && MEMORY_SCENE_ALIASES[key].keywords).some((keyword) =>
        raw.includes(normalizeSearchText(keyword))
      )
    );

    if (!matchedAlias) return null;

    const scene = getPhotoWallScenes().find((entry) => entry.key === matchedAlias) || {};
    const alias = MEMORY_SCENE_ALIASES[matchedAlias] || {};

    return {
      key: matchedAlias,
      label: scene.label || alias.timelineLabel || matchedAlias,
      badge: scene.badge || alias.timelineLabel || matchedAlias,
      galleryChapter: alias.galleryChapter || matchedAlias,
      galleryUrl: `/gallery/?chapter=${encodeURIComponent(matchedAlias)}`,
      photoWallUrl: `/photo-wall/?scene=${encodeURIComponent(matchedAlias)}`,
      timelineUrl: `/love-timeline/?scene=${encodeURIComponent(matchedAlias)}`,
    };
  };

  const getTodayMemoryEntries = (posts, limit = 3) => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();

    return safeArray(posts)
      .map((item) => {
        const postMonth = Number(item.month);
        const postDay = Number(item.day);
        const timestamp = Number(item.timestamp) || 0;
        const exact = postMonth === month && postDay === day;

        return {
          ...item,
          month: postMonth,
          day: postDay,
          timestamp,
          exact,
          distance: getMonthDayDistance(month, day, postMonth, postDay),
        };
      })
      .filter((item) => item.month && item.day && item.url)
      .sort((a, b) => {
        if (a.exact !== b.exact) return a.exact ? -1 : 1;
        if (a.distance !== b.distance) return a.distance - b.distance;
        return b.timestamp - a.timestamp;
      })
      .slice(0, limit);
  };

  const getTodayMemorySubtitle = (entries) => {
    if (!entries.length) return "今天暂时没有同日期记录。";

    if (entries.some((item) => item.exact)) {
      return "这一天以前也留下过记录。";
    }

    const nearest = entries[0];
    if (nearest && nearest.distance <= 7) {
      return "今天没有碰上同月同日，就先翻翻离今天最近的几页。";
    }

    return "今天没有完全对应的日期，就把最接近今天的回忆先摆到首页。";
  };

  const getTodayMemoryBadge = (item, todayMonth) => {
    if (item.exact) return "同月同日";
    if (item.distance <= 3) return `相差 ${item.distance} 天`;
    if (item.distance <= 7) return "这一周";
    if (item.month === todayMonth) return "这个月";
    return `离今天 ${item.distance} 天`;
  };

  const getTodayMemoryAnniversary = () => {
    const anniversaries = safeArray(LOVE_CFG.anniversaries);
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const exact = anniversaries.find((item) => item.month === month && item.day === day);
    const loveStart = (LOVE_CFG.dates && LOVE_CFG.dates.loveStart) || "";
    const loveStartDate = loveStart ? new Date(loveStart) : null;
    const isLoveStartToday =
      loveStartDate &&
      !Number.isNaN(loveStartDate.getTime()) &&
      loveStartDate.getMonth() + 1 === month &&
      loveStartDate.getDate() === day;

    if (exact) {
      return {
        kicker: "今天的纪念日",
        title: exact.name,
        desc: isLoveStartToday
          ? `已经一起 ${calcLoveDays()} 天了，今天可以再补一条新记录。`
          : "今天是特别日子，可以把新的记录也补进去。",
      };
    }

    const upcoming = getUpcomingAnniversaries(1)[0];
    if (upcoming) {
      return {
        kicker: "下一次纪念日",
        title: upcoming.name,
        desc:
          upcoming.diff === 0
            ? "就是今天，记得留下照片或文字。"
            : `还有 ${upcoming.diff} 天就到了，可以先把计划写下来。`,
      };
    }

    return {
      kicker: "今天的提醒",
      title: "普通的一天也值得纪念",
      desc: "没有临近纪念日的时候，也可以留下一条日常记录。",
    };
  };

  const getUpcomingAnniversaries = (limit = 3) => {
    const anniversaries = (LOVE_CFG.anniversaries || []).slice();
    if (!anniversaries.length) return [];

    const now = new Date();
    const year = now.getFullYear();
    const todayZero = new Date();
    todayZero.setHours(0, 0, 0, 0);

    return anniversaries
      .map((e) => {
        let target = new Date(year, e.month - 1, e.day);
        if (target < todayZero) {
          target = new Date(year + 1, e.month - 1, e.day);
        }
        const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
        return { ...e, target, diff };
      })
      .sort((a, b) => a.target - b.target)
      .slice(0, limit);
  };

  const getHomeMemoryDeck = () => {
    const deck = Array.isArray(LOVE_CFG.memoryDeck) ? LOVE_CFG.memoryDeck.slice() : [];
    if (deck.length) return deck;

    const stories = (LOVE_CFG.map && LOVE_CFG.map.stories) || {};
    const fallback = [];
    Object.keys(stories).forEach((city) => {
      (stories[city] || []).forEach((item) => {
        fallback.push({
          title: item.title || city,
          date: city,
          mood: "回忆",
          image: item.cover || "",
          summary: item.summary || "这是一段已保存的记录。",
          quote: `${city} 这一站，后来还能再翻出来看。`,
          url: item.url || "/archives/",
        });
      });
    });
    return fallback;
  };

  const pickAnotherIndex = (list, currentIndex) => {
    if (!list.length) return 0;
    if (list.length === 1) return 0;

    let next = currentIndex;
    while (next === currentIndex) {
      next = Math.floor(Math.random() * list.length);
    }
    return next;
  };

  const readSiteCounter = (position, fallback) => {
    const selector = `#aside-content .site-data a:nth-child(${position}) .length-num`;
    const text = document.querySelector(selector)?.textContent?.trim();
    return text || fallback;
  };

  const normalizeChapterKey = (text) =>
    (text || "").toLowerCase().replace(/[^\u4e00-\u9fa5a-z0-9]/gi, "");

  const cleanChapterTitle = (text) => {
    const cleaned = (text || "")
      .replace(/[^\u4e00-\u9fa5a-z0-9\s]/gi, "")
      .replace(/\s+/g, " ")
      .trim();
    return cleaned || "未命名相册";
  };

  const getGalleryAccent = (index) => {
    const palette = ["#e39aa9", "#92b7c6", "#d9b57a", "#7fb4a4", "#d89a79", "#b69aca"];
    return palette[index % palette.length];
  };

  const getGalleryChapterMeta = (title, index) => {
    const chapters = LOVE_CFG.galleryChapters || {};
    const key = normalizeChapterKey(title);
    const meta = chapters[key] || chapters[title] || {};
    return {
      badge: meta.badge || "相册分组",
      date: meta.date || "已保存的照片",
      desc: meta.desc || "这一组照片已经整理到相册里。",
      quote: meta.quote || "有些照片不是在记录画面，而是在保存心动。",
      accent: meta.accent || getGalleryAccent(index),
    };
  };

  const getGalleryContentRoot = () => {
    const encrypt = document.getElementById("hexo-blog-encrypt");
    if (
      encrypt &&
      !encrypt.classList.contains("hbe-stage-locked")
    ) {
      const inner =
        Array.from(encrypt.children).find(
          (node) => node.id !== "hbeResetBtn" && node.querySelector?.("h1, h2, .gallery-container, img")
        ) || null;
      if (inner) return inner;
    }

    const article = document.getElementById("article-container");
    if (article && article.querySelector("h1, h2, .gallery-container")) {
      return article;
    }

    return null;
  };

  const getPhotoWallScenes = () => {
    const scenes = Array.isArray(LOVE_CFG.photoWallScenes) ? LOVE_CFG.photoWallScenes : [];
    if (scenes.length) return scenes;
    return [
      {
        key: "jingdezhen",
        label: "景德镇",
        badge: "初见篇章",
        desc: "第一次把喜欢从屏幕两端，走进同一座城市的证据。",
        accent: "#92b7c6",
        keywords: ["jdz_", "景德镇", "jingdezhen"],
      },
      {
        key: "suzhou",
        label: "苏州",
        badge: "旅行胶片",
        desc: "小桥、晚风和慢慢散步的我们，把苏州变成了会反复回味的城市。",
        accent: "#e39aa9",
        keywords: ["sz_", "sz_hz", "suzhou", "苏州"],
      },
      {
        key: "yangzhou",
        label: "扬州",
        badge: "春日远行",
        desc: "扬州这一组有重逢、校园散步、采购和一起煮火锅。",
        accent: "#d89a79",
        keywords: ["yz", "扬州", "yangzhou"],
      },
      {
        key: "ningguo_huangshan",
        label: "宁国黄山",
        badge: "七月登山",
        desc: "先宁国、再爬黄山、再回屯溪黎阳新安江，旧心愿牌也在七月被重新打开。",
        accent: "#7da06f",
        keywords: ["img/nghs/", "/nghs/", "nghs", "宁国", "宁国黄山", "爬黄山", "心愿牌"],
      },
      {
        key: "huangshan",
        label: "黄山",
        badge: "清明出走",
        desc: "老街、江边和春天的暖风，一起把黄山收进新的旅行章节里。",
        accent: "#87a96b",
        keywords: ["img/hs/", "/hs/", "huangshan", "黄山"],
      },
      {
        key: "fuzhou",
        label: "福州",
        badge: "母校与海",
        desc: "福师大的路、西门小吃街和长乐海边，是福州六月的主要记录。",
        accent: "#6fa9b7",
        keywords: ["img/fuzhou/", "/fuzhou/", "fuzhou", "福州", "长乐", "福师大"],
      },
      {
        key: "gifts",
        label: "礼物",
        badge: "心意存档",
        desc: "互相准备过的礼物和拆开惊喜的瞬间，单独放在这里。",
        accent: "#d9879b",
        keywords: ["礼物", "gift", "hh_s_yy", "yy_s_hh"],
      },
      {
        key: "birthday",
        label: "生日",
        badge: "特别日子",
        desc: "蛋糕、烛光和笑脸一起出现的时候，连空气都在庆祝。",
        accent: "#d9b57a",
        keywords: ["dg", "生日", "birthday"],
      },
      {
        key: "daily",
        label: "日常",
        badge: "日常片段",
        desc: "聊天、电影、情书和一些没有出远门的日子，都归到这里。",
        accent: "#7fb4a4",
        keywords: ["bige", "jianshen", "kaifa", "/其他/", "daily"],
      },
    ];
  };
  const inferPhotoWallScene = (src) => {
    let lower = "";
    try {
      lower = decodeURIComponent(src || "").toLowerCase();
    } catch (e) {
      lower = String(src || "").toLowerCase();
    }

    const scenes = getPhotoWallScenes();
    return (
      scenes.find((scene) =>
        (scene.keywords || []).some((keyword) => lower.includes(String(keyword).toLowerCase()))
      ) ||
      scenes[scenes.length - 1] ||
      {
        key: "daily",
        label: "日常",
        badge: "回忆切片",
        desc: "这些平凡小瞬间，也值得被单独收藏。",
        accent: "#64c2a6",
      }
    );
  };

  const showToast = (text) => {
    const toast = document.createElement("div");
    toast.className = "love-toast";
    toast.innerHTML = `<i class="fas fa-heart"></i> ${text}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2600);
  };

  // . 全站下一次纪念日角标
  const initAnniversaryBadge = () => {
    if (!featureEnabled("anniversaryBadge")) {
      document.getElementById("love-anniv-badge")?.remove();
      document.getElementById("love-anniv-panel")?.remove();
      return;
    }

    const upcoming = getUpcomingAnniversaries(3);
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
        <button type="button" class="love-anniv-link" data-href="/love-calendar/">
          去纪念日历 <i class="fas fa-chevron-right"></i>
        </button>
      </div>
      <div class="love-anniv-list">
        ${itemsHtml}
      </div>
    `;

    document.body.appendChild(badge);
    document.body.appendChild(panel);

    const calendarLink = panel.querySelector(".love-anniv-link");
    if (calendarLink && calendarLink.dataset.bound !== "1") {
      calendarLink.addEventListener("click", () => {
        window.location.href =
          calendarLink.getAttribute("data-href") || "/love-calendar/";
      });
      calendarLink.dataset.bound = "1";
    }

    let open = false;
    const toggle = () => {
      open = !open;
      panel.style.display = open ? "block" : "none";
    };
    badge.addEventListener("click", toggle);
  };

  // . 首页封面纪念册
  const initHomeStoryHero = () => {
    if (!isHomePage()) return;

    const recentPosts = document.getElementById("recent-posts");
    if (!recentPosts) return;

    document.querySelectorAll("#site-info > .home-story-hero").forEach((node) => node.remove());
    document
      .querySelectorAll("#content-inner > .home-story-hero")
      .forEach((node) => node.remove());

    if (recentPosts.querySelector(".home-story-hero")) return;

    const upcoming = getUpcomingAnniversaries(1)[0];
    const articleCount = readSiteCounter(1, "11");
    const tagCount = readSiteCounter(2, "19");
    const cityCount = Object.keys((LOVE_CFG.map && LOVE_CFG.map.geoCoordMap) || {}).length || 6;
    const loveDays = calcLoveDays();

    const hero = document.createElement("div");
    hero.className = "home-story-hero";
    hero.innerHTML = `
      <div class="home-story-main">
        <span class="home-story-kicker">
          <i class="fas fa-book-open"></i>
          恋爱纪念册 · ongoing
        </span>
        <h2 class="home-story-title">把喜欢留在日常里，再慢慢翻给未来看</h2>
        <p class="home-story-desc">
          这里装着相遇、旅行、节日、礼物，还有那些一开始看起来普通，
          后来却会反复回想起来的小瞬间。
        </p>
        <div class="home-story-actions">
          <a href="/gallery/" class="home-story-link">
            <i class="fas fa-images"></i>
            翻看相册
          </a>
          <a href="/love-map/" class="home-story-link is-ghost">
            <i class="fas fa-map-marked-alt"></i>
            打开足迹
          </a>
        </div>
      </div>
      <div class="home-story-side">
        <div class="home-story-next">
          <span class="label">下一份期待</span>
          <strong>${upcoming ? upcoming.name : "和你见面的下一天"}</strong>
          <span>${upcoming ? `还有 ${upcoming.diff} 天` : "每一天都值得纪念"}</span>
        </div>
        <div class="home-story-stats">
          <div class="home-story-stat">
            <span class="value">${loveDays}</span>
            <span class="label">相爱天数</span>
          </div>
          <div class="home-story-stat">
            <span class="value">${articleCount}</span>
            <span class="label">小情书</span>
          </div>
          <div class="home-story-stat">
            <span class="value">${cityCount}</span>
            <span class="label">足迹城市</span>
          </div>
          <div class="home-story-stat">
            <span class="value">${tagCount}</span>
            <span class="label">关键词</span>
          </div>
        </div>
      </div>
    `;

    recentPosts.insertBefore(hero, recentPosts.querySelector(".recent-post-items") || null);
  };

  const getLatestHomePostV2 = () => {
    const card = document.querySelector("#recent-posts .recent-post-items .recent-post-item");
    if (!card) {
      return {
        title: "从最新写下的一页开始",
        url: "/archives/",
        date: "",
        category: "恋爱日记",
      };
    }

    const titleLink = card.querySelector(".article-title");
    const date = card.querySelector("time")?.textContent?.trim() || "";
    const category =
      card.querySelector(".article-meta__categories:last-of-type")?.textContent?.trim() ||
      "恋爱日记";

    return {
      title: titleLink?.textContent?.trim() || "从最新写下的一页开始",
      url: titleLink?.getAttribute("href") || "/archives/",
      date,
      category,
    };
  };

  const initHomeChapterShelf = () => {
    if (!isHomePage()) return;

    const recentPosts = document.getElementById("recent-posts");
    if (!recentPosts) return;

    recentPosts
      .querySelectorAll(".home-chapter-shelf")
      .forEach((node) => node.parentElement === recentPosts && node.remove());
    document
      .querySelectorAll("#content-inner > .home-chapter-shelf")
      .forEach((node) => node.remove());

    if (recentPosts.querySelector(".home-chapter-shelf")) return;

    const latest = getLatestHomePostV2();
    const upcoming = getUpcomingAnniversaries(1)[0];
    const cityCount = Object.keys((LOVE_CFG.map && LOVE_CFG.map.geoCoordMap) || {}).length || 6;
    const deckCount = getHomeMemoryDeck().length || 12;

    const cards = [
      {
        featured: true,
        accent: "#e39aa9",
        icon: "fas fa-feather-pointed",
        badge: "最新篇章",
        title: latest.title,
        desc: "从刚刚写下的这一页开始，把最近发生的心动和想念继续往后翻。",
        meta: latest.category || "恋爱日记",
        note: latest.date ? `更新于 ${latest.date}` : "刚刚更新",
        href: latest.url || "/archives/",
      },
      {
        accent: "#8fb3c2",
        icon: "fas fa-images",
        badge: "纪念相册",
        title: "把画面翻成一册",
        desc: `已经收好 ${deckCount} 份回忆片段，适合慢慢翻，也适合突然想念时点开。`,
        meta: "去看相册",
        note: "甜蜜画面",
        href: "/gallery/",
      },
      {
        accent: "#7fb4a4",
        icon: "fas fa-map-marked-alt",
        badge: "足迹地图",
        title: "把城市接成路线",
        desc: `我们已经把 ${cityCount} 座城市写进共同坐标，每一站都还能继续延长。`,
        meta: "打开地图",
        note: "旅行章节",
        href: "/love-map/",
      },
      {
        accent: "#d89a79",
        icon: "fas fa-calendar-alt",
        badge: "纪念日历",
        title: upcoming ? upcoming.name : "把特别的日子留好",
        desc: upcoming
          ? `距离下一次特别的日子还有 ${upcoming.diff} 天，连期待也可以先放进目录里。`
          : "把值得纪念的日子安安静静收好，什么时候翻开都不会过期。",
        meta: "翻看日历",
        note: upcoming ? "继续期待" : "纪念一下",
        href: "/love-calendar/",
      },
      {
        accent: "#9b8bd1",
        icon: "fas fa-clock-rotate-left",
        badge: "恋爱时间轴",
        title: "把相遇和旅行串成一条线",
        desc: "从故事开始、第一次见面，到最近写下来的旅行，都可以顺着时间继续往下翻。",
        meta: "打开时间轴",
        note: "长期更新",
        href: "/love-timeline/",
      },
    ];

    const section = document.createElement("section");
    section.className = "home-chapter-shelf";
    section.innerHTML = `
      <div class="home-chapter-header">
        <div>
          <span class="home-chapter-kicker">章节目录</span>
          <h2 class="home-chapter-title">像翻纪念册目录一样，选一页继续往下走</h2>
        </div>
        <p class="home-chapter-subtitle">
          不只是一串导航，而是把你最想打开的那几页，先摆在首页给你挑。
        </p>
      </div>
      <div class="home-chapter-grid">
        ${cards
          .map(
            (card) => `
          <a
            href="${card.href}"
            class="home-chapter-card${card.featured ? " is-featured" : ""}"
            style="--chapter-accent:${card.accent};"
          >
            <span class="home-chapter-icon">
              <i class="${card.icon}"></i>
            </span>
            <span class="home-chapter-badge">${card.badge}</span>
            <h3 class="home-chapter-card-title">${card.title}</h3>
            <p class="home-chapter-card-desc">${card.desc}</p>
            <div class="home-chapter-meta">
              <span>${card.meta}</span>
              <span>${card.note}</span>
            </div>
          </a>
        `
          )
          .join("")}
      </div>
    `;

    recentPosts.insertBefore(section, recentPosts.querySelector(".recent-post-items") || null);
  };

  const initHomeMemoryShowcaseV2 = () => {
    if (!isHomePage()) return;

    const recentPosts = document.getElementById("recent-posts");
    if (!recentPosts) return;

    recentPosts
      .querySelectorAll(".home-memory-showcase")
      .forEach((node) => node.parentElement === recentPosts && node.remove());
    document
      .querySelectorAll("#content-inner > .home-memory-showcase")
      .forEach((node) => node.remove());

    if (recentPosts.querySelector(".home-memory-showcase")) return;

    const deck = getHomeMemoryDeck();
    if (!deck.length) return;

    const section = document.createElement("section");
    section.className = "home-memory-showcase home-memory-showcase-v2";
    section.innerHTML = `
      <div class="home-memory-header">
        <div>
          <span class="home-memory-kicker">回忆抽卡</span>
          <h2 class="home-memory-title">今天抽一张属于我们的回忆卡</h2>
        </div>
        <p class="home-memory-subtitle">
          先抽一张，再点卡片翻面。它会像纪念册里突然掉出来的某一页，安静但很准。
        </p>
      </div>
      <div class="home-memory-card">
        <div class="home-memory-stage">
          <div class="home-memory-stack" aria-hidden="true">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <button
            type="button"
            class="home-memory-flipcard"
            aria-pressed="false"
            aria-label="翻开今天的回忆卡"
          >
            <span class="home-memory-flip-inner">
              <span class="home-memory-face home-memory-face-front">
                <span class="home-memory-seal">Memory Draw</span>
                <strong class="home-memory-cover-title">今天会抽到哪一页？</strong>
                <span class="home-memory-cover-note">点一下翻面，或者直接重新抽一张新的回忆卡。</span>
                <span class="home-memory-cover-index"></span>
              </span>
              <span class="home-memory-face home-memory-face-back">
                <span class="home-memory-pin">只属于我们</span>
                <img class="home-memory-image" src="" alt="">
                <span class="home-memory-date"></span>
              </span>
            </span>
          </button>
        </div>
        <div class="home-memory-body">
          <span class="home-memory-mood"></span>
          <h3 class="home-memory-card-title"></h3>
          <p class="home-memory-summary"></p>
          <blockquote class="home-memory-quote"></blockquote>
          <div class="home-memory-actions">
            <button type="button" class="home-memory-random">
              <i class="fas fa-dice"></i>
              重新抽一张
            </button>
            <button type="button" class="home-memory-toggle">
              <i class="fas fa-book-open"></i>
              翻开卡片
            </button>
            <a href="/archives/" class="home-memory-link">
              去看原文
              <i class="fas fa-chevron-right"></i>
            </a>
          </div>
        </div>
      </div>
    `;

    recentPosts.insertBefore(section, recentPosts.querySelector(".recent-post-items") || null);

    const image = section.querySelector(".home-memory-image");
    const date = section.querySelector(".home-memory-date");
    const mood = section.querySelector(".home-memory-mood");
    const title = section.querySelector(".home-memory-card-title");
    const summary = section.querySelector(".home-memory-summary");
    const quote = section.querySelector(".home-memory-quote");
    const randomBtn = section.querySelector(".home-memory-random");
    const toggleBtn = section.querySelector(".home-memory-toggle");
    const flipCard = section.querySelector(".home-memory-flipcard");
    const coverIndex = section.querySelector(".home-memory-cover-index");
    const link = section.querySelector(".home-memory-link");

    const syncRevealState = (revealed) => {
      section.classList.toggle("is-revealed", revealed);
      flipCard.setAttribute("aria-pressed", revealed ? "true" : "false");
      flipCard.setAttribute("aria-label", revealed ? "合上这张回忆卡" : "翻开这张回忆卡");
      toggleBtn.innerHTML = revealed
        ? `<i class="fas fa-book"></i> 合上卡片`
        : `<i class="fas fa-book-open"></i> 翻开卡片`;
    };

    const playDrawAnimation = () => {
      section.classList.remove("is-drawing");
      void section.offsetWidth;
      section.classList.add("is-drawing");
      clearTimeout(section.__drawTimer);
      section.__drawTimer = setTimeout(() => {
        section.classList.remove("is-drawing");
      }, 760);
    };

    const updateCard = (index, withToast, reveal) => {
      const item = deck[index];
      if (!item) return;

      section.dataset.currentIndex = String(index);
      image.src = item.image || "";
      image.alt = `${item.title || "这段回忆"} 的照片`;
      date.textContent = item.date || "被认真记住的一天";
      mood.textContent = item.mood || "回忆切片";
      title.textContent = item.title || "这段回忆";
      summary.textContent =
        item.summary || "有些瞬间看起来平凡，但被认真保存以后，就会一直发光。";
      quote.textContent =
        item.quote || "原来被认真留住的日常，也会在很久以后继续发亮。";
      coverIndex.textContent = `CARD ${String(index + 1).padStart(2, "0")} / ${String(
        deck.length
      ).padStart(2, "0")}`;
      link.href = item.url || "/archives/";
      syncRevealState(Boolean(reveal));

      if (withToast) {
        showToast(`抽到了「${item.title || "这一页"}」这张回忆卡`);
      }
    };

    const initialIndex = new Date().getDate() % deck.length;
    updateCard(initialIndex, false, false);

    randomBtn.addEventListener("click", () => {
      const currentIndex = Number(section.dataset.currentIndex || 0);
      playDrawAnimation();
      updateCard(pickAnotherIndex(deck, currentIndex), true, true);
    });

    flipCard.addEventListener("click", () => {
      syncRevealState(!section.classList.contains("is-revealed"));
    });

    toggleBtn.addEventListener("click", () => {
      syncRevealState(!section.classList.contains("is-revealed"));
    });
  };

  const createTodayMemoryItem = (item, todayMonth) => {
    const sceneMeta = inferMemorySceneMeta(item);
    const card = document.createElement("article");
    card.className = "home-today-memory-item";

    const thumb = document.createElement("div");
    thumb.className = "home-today-memory-thumb";

    if (item.cover) {
      const image = document.createElement("img");
      image.src = item.cover;
      image.alt = `${item.title || "这段回忆"} 的封面`;
      image.loading = "lazy";
      thumb.appendChild(image);
    } else {
      thumb.innerHTML = '<span class="home-today-memory-thumb-fallback"><i class="fas fa-image"></i></span>';
    }

    const body = document.createElement("div");
    body.className = "home-today-memory-item-body";

    const meta = document.createElement("div");
    meta.className = "home-today-memory-item-meta";

    const badge = document.createElement("span");
    badge.className = "home-today-memory-item-badge";
    badge.textContent = getTodayMemoryBadge(item, todayMonth);

    const date = document.createElement("time");
    date.className = "home-today-memory-item-date";
    date.dateTime = item.isoDate || "";
    date.textContent = formatIsoDate(item.isoDate);

    meta.appendChild(badge);
    meta.appendChild(date);

    const title = document.createElement("h3");
    title.className = "home-today-memory-item-title";
    title.textContent = item.title || "这段回忆";

    const summary = document.createElement("p");
    summary.className = "home-today-memory-item-summary";
    summary.textContent =
      item.summary || "那一天的心动后来被认真写下来，现在刚好又适合重新翻开。";

    const footer = document.createElement("div");
    footer.className = "home-today-memory-item-footer";

    const tag = document.createElement("span");
    tag.className = "home-today-memory-item-tag";
    tag.textContent =
      safeArray(item.categories)[safeArray(item.categories).length - 1] ||
      safeArray(item.tags)[0] ||
      formatMonthDay(item.month, item.day);

    const action = document.createElement("span");
    action.className = "home-today-memory-item-action";
    action.innerHTML = '去看看 <i class="fas fa-chevron-right"></i>';

    footer.appendChild(tag);
    footer.appendChild(action);

    body.appendChild(meta);
    body.appendChild(title);
    body.appendChild(summary);
    body.appendChild(footer);

    card.appendChild(thumb);
    card.appendChild(body);

    return card;
  };

  const createTodayMemoryItemV2 = (item, todayMonth) => {
    const sceneMeta = inferMemorySceneMeta(item);
    const card = document.createElement("article");
    card.className = "home-today-memory-item";

    const thumb = document.createElement("div");
    thumb.className = "home-today-memory-thumb";

    if (item.cover) {
      const image = document.createElement("img");
      image.src = item.cover;
      image.alt = `${item.title || "这段回忆"} 的封面`;
      image.loading = "lazy";
      thumb.appendChild(image);
    } else {
      thumb.innerHTML =
        '<span class="home-today-memory-thumb-fallback"><i class="fas fa-image"></i></span>';
    }

    const body = document.createElement("div");
    body.className = "home-today-memory-item-body";

    const meta = document.createElement("div");
    meta.className = "home-today-memory-item-meta";

    const badge = document.createElement("span");
    badge.className = "home-today-memory-item-badge";
    badge.textContent = getTodayMemoryBadge(item, todayMonth);

    const date = document.createElement("time");
    date.className = "home-today-memory-item-date";
    date.dateTime = item.isoDate || "";
    date.textContent = formatIsoDate(item.isoDate);

    meta.appendChild(badge);
    meta.appendChild(date);

    const title = document.createElement("h3");
    title.className = "home-today-memory-item-title";
    title.textContent = item.title || "这段回忆";

    const summary = document.createElement("p");
    summary.className = "home-today-memory-item-summary";
    summary.textContent =
      item.summary || "那一天的心动后来被认真写下来，现在刚好又适合重新翻开。";

    const related = document.createElement("div");
    related.className = "home-today-memory-item-related";

    if (sceneMeta) {
      related.innerHTML = `
        <a href="${sceneMeta.galleryUrl}" class="home-today-memory-item-link is-soft">
          <i class="fas fa-images"></i>
          看相册
        </a>
        <a href="${sceneMeta.photoWallUrl}" class="home-today-memory-item-link is-soft">
          <i class="fas fa-film"></i>
          看照片墙
        </a>
      `;
    }

    const footer = document.createElement("div");
    footer.className = "home-today-memory-item-footer";

    const tag = document.createElement("span");
    tag.className = "home-today-memory-item-tag";
    tag.textContent =
      safeArray(item.categories)[safeArray(item.categories).length - 1] ||
      safeArray(item.tags)[0] ||
      formatMonthDay(item.month, item.day);

    const action = document.createElement("a");
    action.className = "home-today-memory-item-action";
    action.href = item.url || "/archives/";
    action.innerHTML = '去看看 <i class="fas fa-chevron-right"></i>';

    footer.appendChild(tag);
    footer.appendChild(action);

    body.appendChild(meta);
    body.appendChild(title);
    body.appendChild(summary);
    if (sceneMeta) body.appendChild(related);
    body.appendChild(footer);

    card.appendChild(thumb);
    card.appendChild(body);

    return card;
  };

  const initHomeTodayMemoryPanel = () => {
    if (!isHomePage()) return;

    const recentPosts = document.getElementById("recent-posts");
    if (!recentPosts) return;

    recentPosts
      .querySelectorAll(".home-today-memory")
      .forEach((node) => node.parentElement === recentPosts && node.remove());
    document
      .querySelectorAll("#content-inner > .home-today-memory")
      .forEach((node) => node.remove());

    const renderToken = String(++todayMemoryRenderToken);
    recentPosts.dataset.todayMemoryToken = renderToken;

    loadTodayMemoryData().then((posts) => {
      if (!document.body.contains(recentPosts)) return;
      if (recentPosts.dataset.todayMemoryToken !== renderToken) return;
      if (recentPosts.querySelector(".home-today-memory")) return;

      const entries = getTodayMemoryEntries(posts, 3);
      if (!entries.length) return;

      const now = new Date();
      const todayMonth = now.getMonth() + 1;
      const todayDay = now.getDate();
      const anniversary = getTodayMemoryAnniversary();

      const section = document.createElement("section");
      section.className = "home-today-memory";
      section.innerHTML = `
        <div class="home-today-memory-header">
          <div>
            <span class="home-today-memory-kicker">今日回忆</span>
            <h2 class="home-today-memory-title">${formatMonthDay(todayMonth, todayDay)}，适合翻开这些页</h2>
          </div>
          <p class="home-today-memory-subtitle">${getTodayMemorySubtitle(entries)}</p>
        </div>
        <div class="home-today-memory-grid">
          <div class="home-today-memory-list"></div>
          <aside class="home-today-memory-side">
            <div class="home-today-memory-side-card">
              <span class="home-today-memory-side-kicker"></span>
              <h3 class="home-today-memory-side-title"></h3>
              <p class="home-today-memory-side-desc"></p>
              <div class="home-today-memory-side-actions">
                <a href="/love-calendar/" class="home-today-memory-side-link">去纪念日历</a>
                <a href="/archives/" class="home-today-memory-side-link is-ghost">翻全部回忆</a>
              </div>
            </div>
          </aside>
        </div>
      `;

      const list = section.querySelector(".home-today-memory-list");
      entries.forEach((item) => {
        list.appendChild(createTodayMemoryItemV2(item, todayMonth));
      });

      section.querySelector(".home-today-memory-side-kicker").textContent = anniversary.kicker;
      section.querySelector(".home-today-memory-side-title").textContent = anniversary.title;
      section.querySelector(".home-today-memory-side-desc").textContent = anniversary.desc;

      const sideActions = section.querySelector(".home-today-memory-side-actions");
      if (sideActions && !sideActions.querySelector('[href="/love-timeline/"]')) {
        const timelineLink = document.createElement("a");
        timelineLink.href = "/love-timeline/";
        timelineLink.className = "home-today-memory-side-link is-ghost";
        timelineLink.textContent = "去时间轴";
        sideActions.insertBefore(timelineLink, sideActions.lastElementChild || null);
      }

      recentPosts.insertBefore(section, recentPosts.querySelector(".recent-post-items") || null);
    });
  };

  // . 首页随机回忆卡
  const initHomeMemoryShowcase = () => {
    if (!isHomePage()) return;

    const recentPosts = document.getElementById("recent-posts");
    if (!recentPosts) return;

    document
      .querySelectorAll("#content-inner > .home-memory-showcase")
      .forEach((node) => node.remove());

    if (recentPosts.querySelector(".home-memory-showcase")) return;

    const deck = getHomeMemoryDeck();
    if (!deck.length) return;

    const section = document.createElement("section");
    section.className = "home-memory-showcase";
    section.innerHTML = `
      <div class="home-memory-header">
        <div>
          <span class="home-memory-kicker">随机回忆</span>
          <h2 class="home-memory-title">今天想重新翻开哪一页？</h2>
        </div>
        <p class="home-memory-subtitle">
          点一下，就随机掉落一段被认真收藏的小故事。
        </p>
      </div>
      <div class="home-memory-card">
        <div class="home-memory-visual">
          <span class="home-memory-pin">只属于我们</span>
          <img class="home-memory-image" src="" alt="">
          <span class="home-memory-date"></span>
        </div>
        <div class="home-memory-body">
          <span class="home-memory-mood"></span>
          <h3 class="home-memory-card-title"></h3>
          <p class="home-memory-summary"></p>
          <blockquote class="home-memory-quote"></blockquote>
          <div class="home-memory-actions">
            <button type="button" class="home-memory-random">
              <i class="fas fa-dice"></i>
              换一段回忆
            </button>
            <a href="/archives/" class="home-memory-link">
              去看看原文
              <i class="fas fa-chevron-right"></i>
            </a>
          </div>
        </div>
      </div>
    `;

    recentPosts.insertBefore(section, recentPosts.querySelector(".recent-post-items") || null);

    const image = section.querySelector(".home-memory-image");
    const date = section.querySelector(".home-memory-date");
    const mood = section.querySelector(".home-memory-mood");
    const title = section.querySelector(".home-memory-card-title");
    const summary = section.querySelector(".home-memory-summary");
    const quote = section.querySelector(".home-memory-quote");
    const randomBtn = section.querySelector(".home-memory-random");
    const link = section.querySelector(".home-memory-link");

    const updateCard = (index, withToast) => {
      const item = deck[index];
      if (!item) return;

      section.dataset.currentIndex = String(index);
      image.src = item.image || "";
      image.alt = `${item.title} 的回忆照片`;
      date.textContent = item.date || "被认真记下的一天";
      mood.textContent = item.mood || "回忆切片";
      title.textContent = item.title || "这段回忆";
      summary.textContent = item.summary || "有些时刻看起来平平无奇，后来却会一直发光。";
      quote.textContent = item.quote || "原来被认真记住的日常，也会闪闪发亮。";
      link.href = item.url || "/archives/";

      if (withToast) {
        showToast(`随机翻到了「${item.title}」这一页`);
      }
    };

    const initialIndex = new Date().getDate() % deck.length;
    updateCard(initialIndex, false);

    randomBtn.addEventListener("click", () => {
      const currentIndex = Number(section.dataset.currentIndex || 0);
      updateCard(pickAnotherIndex(deck, currentIndex), true);
    });
  };

  // . 相册页：解锁后的纪念册体验
  const initGalleryExperience = () => {
    if (!isGalleryPage()) return;

    const scope = getGalleryContentRoot();
    if (!scope || scope.querySelector(".love-gallery-experience")) return;

    const resetButton = scope.querySelector("#hbeResetBtn");
    const children = Array.from(scope.children).filter((node) => node !== resetButton);
    const sectionGroups = [];
    const prefaceNodes = [];
    let currentGroup = null;

    children.forEach((node) => {
      const isHeading = /^H[1-6]$/.test(node.tagName || "");
      if (isHeading) {
        currentGroup = { heading: node, nodes: [node] };
        sectionGroups.push(currentGroup);
        return;
      }

      if (currentGroup) {
        currentGroup.nodes.push(node);
      } else {
        prefaceNodes.push(node);
      }
    });

    if (!sectionGroups.length) return;

    const coverHolder = prefaceNodes.find(
      (node) => node.tagName === "IMG" || node.querySelector?.("img")
    );
    const coverImage =
      (coverHolder &&
        (coverHolder.tagName === "IMG" ? coverHolder : coverHolder.querySelector("img"))) ||
      null;
    const fallbackCover = getHomeMemoryDeck()[0] || {};
    const coverSrc =
      coverImage?.getAttribute("src") ||
      coverImage?.getAttribute("data-lazy-src") ||
      fallbackCover.image ||
      "";
    const coverAlt = coverImage?.getAttribute("alt") || "甜蜜相册封面";
    const upcoming = getUpcomingAnniversaries(1)[0];

    const experience = document.createElement("div");
    experience.className = "love-gallery-experience";

    const nav = document.createElement("nav");
    nav.className = "love-gallery-nav";
    nav.id = "love-gallery-chapters";

    const spotlight = document.createElement("section");
    spotlight.className = "love-gallery-spotlight";
    spotlight.id = "love-gallery-spotlight";
    spotlight.innerHTML = `
      <div class="love-gallery-spotlight-copy">
        <span class="love-gallery-spotlight-kicker">随机掉落</span>
        <h3 class="love-gallery-spotlight-title">这一张，今天也值得重新看一遍</h3>
        <p class="love-gallery-spotlight-desc">
          每次点开，都会随机翻出一张我们认真留下来的证据。
        </p>
        <div class="love-gallery-spotlight-actions">
          <button type="button" class="love-gallery-action is-button" data-gallery-random="1">
            <i class="fas fa-dice"></i>
            换一张照片
          </button>
          <a href="/photo-wall/" class="love-gallery-action is-ghost">
            <i class="fas fa-th-large"></i>
            去照片墙
          </a>
        </div>
      </div>
      <div class="love-gallery-spotlight-card">
        <div class="love-gallery-spotlight-photo-wrap">
          <img class="love-gallery-spotlight-photo" src="" alt="">
          <span class="love-gallery-spotlight-chip"></span>
        </div>
        <div class="love-gallery-spotlight-meta">
          <span class="love-gallery-spotlight-label">来自章节</span>
          <strong class="love-gallery-spotlight-chapter"></strong>
          <p class="love-gallery-spotlight-note"></p>
          <a class="love-gallery-spotlight-link" href="#love-gallery-chapters">
            去看看这段回忆
            <i class="fas fa-chevron-right"></i>
          </a>
        </div>
      </div>
    `;

    const chaptersWrap = document.createElement("div");
    chaptersWrap.className = "love-gallery-chapters";

    const navItems = [];
    const spotlightEntries = [];
    let totalPhotos = 0;

    sectionGroups.forEach((group, index) => {
      const title = cleanChapterTitle(group.heading.textContent);
      const meta = getGalleryChapterMeta(title, index);
      const section = document.createElement("section");
      const sectionId = `gallery-chapter-${normalizeChapterKey(title) || index + 1}`;
      section.className = "love-gallery-chapter";
      section.id = sectionId;
      section.style.setProperty("--chapter-accent", meta.accent);

      const body = document.createElement("div");
      body.className = "love-gallery-chapter-body";
      group.nodes.slice(1).forEach((node) => {
        body.appendChild(node);
      });
      group.heading.remove();

      const chapterPhotos = window.LOVE_GALLERY_STATS
        ? window.LOVE_GALLERY_STATS.collect(body)
        : Array.from(body.querySelectorAll("img"))
            .map((img) => ({ src: img.getAttribute("data-lazy-src") || img.getAttribute("src"), alt: img.getAttribute("alt") || "" }))
            .filter((photo) => photo.src);
      const photoCount = chapterPhotos.length;
      totalPhotos += photoCount;

      const header = document.createElement("div");
      header.className = "love-gallery-chapter-head";
      header.innerHTML = `
        <div class="love-gallery-chapter-copy">
          <span class="love-gallery-chapter-badge">${meta.badge}</span>
          <h2 class="love-gallery-chapter-title">${title}</h2>
          <p class="love-gallery-chapter-desc">${meta.desc}</p>
        </div>
        <div class="love-gallery-chapter-meta">
          <span>${meta.date}</span>
          <span>${photoCount} 张照片</span>
        </div>
      `;

      const quote = document.createElement("blockquote");
      quote.className = "love-gallery-chapter-quote";
      quote.textContent = meta.quote;

      body.querySelectorAll(".gallery-container").forEach((container) => {
        container.classList.add("love-gallery-frame");
      });

      section.appendChild(header);
      section.appendChild(quote);
      section.appendChild(body);
      chaptersWrap.appendChild(section);

      navItems.push(
        `<a href="#${sectionId}" class="love-gallery-nav-link">
          <span>${title}</span>
          <em>${photoCount}</em>
        </a>`
      );

      chapterPhotos.forEach((photo, photoIndex) => {
        spotlightEntries.push({
          src: photo.src,
          alt: photo.alt || `${title} 的照片`,
          title,
          note: meta.desc,
          chip: `第 ${photoIndex + 1} 张`,
          href: `#${sectionId}`,
        });
      });
    });

    const hero = document.createElement("section");
    hero.className = "love-gallery-hero";
    hero.innerHTML = `
      <div class="love-gallery-hero-copy">
        <span class="love-gallery-kicker">
          <i class="fas fa-book-open"></i>
          私人纪念册 · unlocked
        </span>
        <h2 class="love-gallery-title">把见面、旅行和日常都装进同一本胶片册</h2>
        <p class="love-gallery-desc">
          输入密码之后，翻开的不只是照片，而是我们把喜欢认真收纳起来的每一个章节。
          从初见到礼物，从远行到平凡，原来真的都值得被反复喜欢。
        </p>
        <div class="love-gallery-actions">
          <a href="#love-gallery-chapters" class="love-gallery-action">
            <i class="fas fa-images"></i>
            开始翻看
          </a>
          <button type="button" class="love-gallery-action is-button is-soft" data-gallery-random="1">
            <i class="fas fa-shuffle"></i>
            随机掉落一张
          </button>
        </div>
      </div>
      <div class="love-gallery-hero-visual">
        ${
          coverSrc
            ? `<img class="love-gallery-cover" src="${coverSrc}" alt="${coverAlt}">`
            : ""
        }
        <div class="love-gallery-stats">
          <div class="love-gallery-stat">
            <span class="value">${sectionGroups.length}</span>
            <span class="label">故事章节</span>
          </div>
          <div class="love-gallery-stat">
            <span class="value">${totalPhotos}</span>
            <span class="label">照片数量</span>
          </div>
          <div class="love-gallery-stat">
            <span class="value">${calcLoveDays()}</span>
            <span class="label">相爱天数</span>
          </div>
          <div class="love-gallery-stat">
            <span class="value">${upcoming ? upcoming.diff : "∞"}</span>
            <span class="label">${upcoming ? upcoming.name : "每天都值得纪念"}</span>
          </div>
        </div>
      </div>
    `;

    nav.innerHTML = navItems.join("");

    prefaceNodes.forEach((node) => node.remove());
    scope.insertBefore(experience, scope.firstChild);
    experience.appendChild(hero);
    experience.appendChild(nav);
    experience.appendChild(spotlight);
    experience.appendChild(chaptersWrap);

    const tiltValues = ["-2.8deg", "2.2deg", "-1.4deg", "1deg", "0deg", "-0.6deg"];
    chaptersWrap
      .querySelectorAll(".gallery-items .item, .fj-gallery-item")
      .forEach((item, index) => {
        item.style.setProperty("--love-tilt", tiltValues[index % tiltValues.length]);
        item.classList.add("love-gallery-polaroid");
      });

    const standalonePhotos = chaptersWrap.querySelectorAll(".love-gallery-chapter-body p > img");
    standalonePhotos.forEach((img, index) => {
      const wrap = img.parentElement;
      if (!wrap) return;
      wrap.classList.add("love-gallery-inline-photo");
      wrap.style.setProperty("--love-tilt", tiltValues[index % tiltValues.length]);
    });

    if (spotlightEntries.length) {
      const photo = spotlight.querySelector(".love-gallery-spotlight-photo");
      const chip = spotlight.querySelector(".love-gallery-spotlight-chip");
      const chapter = spotlight.querySelector(".love-gallery-spotlight-chapter");
      const note = spotlight.querySelector(".love-gallery-spotlight-note");
      const link = spotlight.querySelector(".love-gallery-spotlight-link");
      let currentIndex = new Date().getDate() % spotlightEntries.length;

      const updateSpotlight = (index, withToast) => {
        const entry = spotlightEntries[index];
        if (!entry || !photo || !chip || !chapter || !note || !link) return;
        currentIndex = index;
        photo.src = entry.src;
        photo.alt = entry.alt;
        chip.textContent = entry.chip;
        chapter.textContent = entry.title;
        note.textContent = entry.note;
        link.href = entry.href;

        if (withToast) {
          showToast(`翻到了「${entry.title}」里的一张心动照片`);
        }
      };

      updateSpotlight(currentIndex, false);

      experience.querySelectorAll("[data-gallery-random='1']").forEach((trigger) => {
        trigger.addEventListener("click", () => {
          updateSpotlight(pickAnotherIndex(spotlightEntries, currentIndex), true);
        });
      });
    } else {
      spotlight.remove();
    }

    const navLinks = Array.from(nav.querySelectorAll(".love-gallery-nav-link"));
    const setActive = (id) => {
      navLinks.forEach((link) => {
        link.classList.toggle("is-active", link.getAttribute("href") === `#${id}`);
      });
    };

    if (navLinks.length) {
      setActive(chaptersWrap.querySelector(".love-gallery-chapter")?.id || "");
    }

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          const visible = entries
            .filter((entry) => entry.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
          if (visible) setActive(visible.target.id);
        },
        {
          rootMargin: "-18% 0px -58% 0px",
          threshold: [0.2, 0.45, 0.7],
        }
      );

      chaptersWrap.querySelectorAll(".love-gallery-chapter").forEach((section) => {
        observer.observe(section);
      });
    }

    const chapterAliases = {};
    chaptersWrap.querySelectorAll(".love-gallery-chapter").forEach((section) => {
      const sectionKey = normalizeChapterKey(section.id.replace(/^gallery-chapter-/, ""));
      const titleKey = normalizeChapterKey(
        section.querySelector(".love-gallery-chapter-title")?.textContent || ""
      );
      if (sectionKey) chapterAliases[sectionKey] = section.id;
      if (titleKey) chapterAliases[titleKey] = section.id;
    });

    Object.keys(MEMORY_SCENE_ALIASES).forEach((key) => {
      const alias = MEMORY_SCENE_ALIASES[key];
      const sectionKey = normalizeChapterKey(alias && alias.galleryChapter);
      if (sectionKey) {
        chapterAliases[normalizeChapterKey(key)] = `gallery-chapter-${sectionKey}`;
      }
    });

    const queryChapter = normalizeChapterKey(getQueryParams().get("chapter") || "");
    const hashTarget = decodeSafe((window.location.hash || "").replace(/^#/, ""));
    const hashChapter = hashTarget.startsWith("gallery-chapter-")
      ? normalizeChapterKey(hashTarget.replace(/^gallery-chapter-/, ""))
      : hashTarget.startsWith("chapter-")
        ? normalizeChapterKey(hashTarget.replace(/^chapter-/, ""))
        : "";
    const targetId =
      chapterAliases[queryChapter] ||
      chapterAliases[hashChapter] ||
      (hashTarget.startsWith("gallery-chapter-") ? hashTarget : "");

    if (targetId) {
      const targetSection = document.getElementById(targetId);
      if (targetSection) {
        setActive(targetId);
        setTimeout(() => {
          targetSection.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 120);
      }
    }
  };

  // . 照片墙：分组网格 / 筛选 / 沉浸式查看
  const initPhotoWallExperience = () => {
    if (!isPhotoWallPage()) return;
    if (window.LOVE_PHOTO_WALL_EXPERIENCE) {
      window.LOVE_PHOTO_WALL_EXPERIENCE();
      return;
    }

    const article = document.getElementById("article-container");
    const wall = document.getElementById("love-photo-wall");
    if (!article || !wall || wall.dataset.enhanced === "true") return;

    wall.dataset.enhanced = "true";
    article.classList.add("love-photo-wall-page");

    const intro = Array.from(article.children).find(
      (node) => node.tagName === "P" && /瀑布流|甜蜜相册/.test(node.textContent || "")
    );
    if (intro) intro.remove();

    const scenes = getPhotoWallScenes();
    const items = Array.from(wall.querySelectorAll(".love-photo-wall-item"));
    if (!items.length) return;

    const tiltValues = ["-2.8deg", "2.4deg", "-1.5deg", "0.8deg", "-0.9deg", "1.6deg"];
    const counts = {};
    const entries = [];

    items.forEach((item, index) => {
      const img = item.querySelector("img");
      if (!img) return;

      const fullSrc = img.getAttribute("data-src") || img.getAttribute("src") || "";
      const thumbSrc = img.getAttribute("src") || fullSrc;
      const scene = inferPhotoWallScene(fullSrc);
      const number = index + 1;

      counts[scene.key] = (counts[scene.key] || 0) + 1;

      item.dataset.scene = scene.key;
      item.dataset.index = String(index);
      item.style.setProperty("--love-tilt", tiltValues[index % tiltValues.length]);
      item.style.setProperty("--photo-accent", scene.accent || getGalleryAccent(index));
      item.classList.add("love-photo-wall-polaroid");
      item.setAttribute("tabindex", "0");
      item.setAttribute("role", "button");
      item.setAttribute("aria-label", `查看${scene.label}的第 ${number} 张照片`);

      const meta = document.createElement("div");
      meta.className = "love-photo-wall-item-meta";
      meta.innerHTML = `
        <span class="love-photo-wall-item-badge">${scene.badge || scene.label}</span>
        <span class="love-photo-wall-item-index">${String(number).padStart(2, "0")}</span>
      `;
      item.appendChild(meta);

      entries.push({
        item,
        img,
        fullSrc,
        thumbSrc,
        alt: img.getAttribute("alt") || `${scene.label} 的回忆照片`,
        scene,
        number,
      });
    });

    const totalPhotos = entries.length;
    const activeSceneList = scenes.filter((scene) => counts[scene.key]);
    const upcoming = getUpcomingAnniversaries(1)[0];

    const shell = document.createElement("div");
    shell.className = "love-photo-wall-shell";
    shell.innerHTML = `
      <section class="love-photo-wall-hero">
        <div class="love-photo-wall-copy">
          <span class="love-photo-wall-kicker">
            <i class="fas fa-film"></i>
            Memory Film Wall
          </span>
          <h2 class="love-photo-wall-title">照片墙</h2>
          <p class="love-photo-wall-desc">
            按地点整理，默认分批展示。先看主要画面，点开照片再看完整细节。
          </p>
          <div class="love-photo-wall-stats">
            <div class="love-photo-wall-stat">
              <span class="value">${totalPhotos}</span>
              <span class="label">照片数量</span>
            </div>
            <div class="love-photo-wall-stat">
              <span class="value">${activeSceneList.length}</span>
              <span class="label">场景章节</span>
            </div>
            <div class="love-photo-wall-stat">
              <span class="value">${calcLoveDays()}</span>
              <span class="label">相爱天数</span>
            </div>
            <div class="love-photo-wall-stat">
              <span class="value">${upcoming ? upcoming.diff : "∞"}</span>
              <span class="label">${upcoming ? upcoming.name : "每天都值得纪念"}</span>
            </div>
          </div>
        </div>
        <div class="love-photo-wall-feature" id="love-photo-wall-feature">
          <div class="love-photo-wall-feature-photo-wrap">
            <img class="love-photo-wall-feature-photo" src="" alt="">
            <span class="love-photo-wall-feature-chip"></span>
          </div>
          <div class="love-photo-wall-feature-body">
            <span class="love-photo-wall-feature-label">今日翻到</span>
            <h3 class="love-photo-wall-feature-title"></h3>
            <p class="love-photo-wall-feature-desc"></p>
            <div class="love-photo-wall-feature-actions">
              <button type="button" class="love-photo-wall-action is-button" data-photo-wall-random="1">
                <i class="fas fa-shuffle"></i>
                随机翻一张
              </button>
              <button type="button" class="love-photo-wall-action is-ghost is-button" data-photo-wall-open="1">
                <i class="fas fa-expand"></i>
                点开放大看
              </button>
            </div>
          </div>
        </div>
      </section>
      <section class="love-photo-wall-toolbar">
        <div class="love-photo-wall-filters"></div>
        <div class="love-photo-wall-status">
          正在展开 <strong>${totalPhotos}</strong> / ${totalPhotos} 张回忆
        </div>
      </section>
      <section class="love-photo-wall-board">
        <div class="love-photo-wall-board-head">
          <div>
            <span class="love-photo-wall-board-kicker">Browse</span>
            <h3 class="love-photo-wall-board-title">照片浏览</h3>
          </div>
          <p class="love-photo-wall-board-note">
            每次只展开一组，浏览节奏更稳；切换地点后会重新从第一组开始。
          </p>
        </div>
      </section>
    `;

    article.insertBefore(shell, wall);
    shell.querySelector(".love-photo-wall-board")?.appendChild(wall);

    const filtersWrap = shell.querySelector(".love-photo-wall-filters");
    const status = shell.querySelector(".love-photo-wall-status");
    const feature = shell.querySelector("#love-photo-wall-feature");
    const featurePhoto = feature?.querySelector(".love-photo-wall-feature-photo");
    const featureChip = feature?.querySelector(".love-photo-wall-feature-chip");
    const featureTitle = feature?.querySelector(".love-photo-wall-feature-title");
    const featureDesc = feature?.querySelector(".love-photo-wall-feature-desc");
    const featureOpenButton = feature?.querySelector("[data-photo-wall-open='1']");

    const filterItems = [
      {
        key: "all",
        label: "全部",
        badge: "全部回忆",
        desc: "把所有被认真留下来的瞬间一起摊开来看。",
        accent: "#ff8aa5",
      },
      ...activeSceneList,
    ];

    let currentFilter = "all";
    let currentFeaturePoolIndex = 0;
    let currentFeatureEntry = entries[0] || null;
    const requestedScene = normalizeSearchText(
      getQueryParams().get("scene") ||
        decodeSafe((window.location.hash || "").replace(/^#scene-/, ""))
    );

    if (filtersWrap) {
      filtersWrap.innerHTML = filterItems
        .map((scene) => {
          const count = scene.key === "all" ? totalPhotos : counts[scene.key] || 0;
          return `
            <button type="button" class="love-photo-wall-filter${
              scene.key === "all" ? " is-active" : ""
            }" data-scene="${scene.key}">
              <span>${scene.label}</span>
              <em>${count}</em>
            </button>
          `;
        })
        .join("");
    }

    const visibleEntries = () =>
      entries.filter((entry) => currentFilter === "all" || entry.scene.key === currentFilter);

    const updateFeature = (poolIndex, withToast) => {
      const pool = visibleEntries();
      if (!pool.length || !featurePhoto || !featureChip || !featureTitle || !featureDesc) return;

      const safeIndex = ((poolIndex % pool.length) + pool.length) % pool.length;
      const entry = pool[safeIndex];
      currentFeaturePoolIndex = safeIndex;
      currentFeatureEntry = entry;

      feature.style.setProperty("--photo-accent", entry.scene.accent || "#ff8aa5");
      featurePhoto.src = entry.thumbSrc || entry.fullSrc;
      featurePhoto.alt = entry.alt;
      featureChip.textContent = `${entry.scene.label} · 第 ${entry.number} 张`;
      featureTitle.textContent = entry.scene.badge || entry.scene.label;
      featureDesc.textContent = entry.scene.desc || "这一张照片，也把那天的心情一起留了下来。";

      if (withToast) {
        showToast(`翻到了「${entry.scene.label}」的一张回忆照片`);
      }
    };

    const applyFilter = (sceneKey) => {
      currentFilter = sceneKey;
      let visibleCount = 0;

      entries.forEach((entry) => {
        const matched = sceneKey === "all" || entry.scene.key === sceneKey;
        entry.item.classList.toggle("is-hidden", !matched);
        if (matched) visibleCount += 1;
      });

      filtersWrap?.querySelectorAll(".love-photo-wall-filter").forEach((button) => {
        button.classList.toggle("is-active", button.getAttribute("data-scene") === sceneKey);
      });

      if (status) {
        status.innerHTML = `正在展开 <strong>${visibleCount}</strong> / ${totalPhotos} 张回忆`;
      }

      updateFeature(0, false);
    };

    let modal = document.getElementById("love-photo-wall-modal");
    if (modal) modal.remove();

    modal = document.createElement("div");
    modal.id = "love-photo-wall-modal";
    modal.className = "love-photo-wall-modal";
    modal.innerHTML = `
      <div class="love-photo-wall-modal-backdrop" data-modal-close="1"></div>
      <div class="love-photo-wall-modal-dialog" role="dialog" aria-modal="true" aria-label="照片查看器">
        <button type="button" class="love-photo-wall-modal-close" data-modal-close="1" aria-label="关闭看图层">
          <i class="fas fa-times"></i>
        </button>
        <button type="button" class="love-photo-wall-modal-nav is-prev" data-modal-step="-1" aria-label="上一张照片">
          <i class="fas fa-chevron-left"></i>
        </button>
        <div class="love-photo-wall-modal-stage">
          <img class="love-photo-wall-modal-image" src="" alt="">
        </div>
        <button type="button" class="love-photo-wall-modal-nav is-next" data-modal-step="1" aria-label="下一张照片">
          <i class="fas fa-chevron-right"></i>
        </button>
        <div class="love-photo-wall-modal-meta">
          <span class="love-photo-wall-modal-chip"></span>
          <strong class="love-photo-wall-modal-title"></strong>
          <p class="love-photo-wall-modal-desc"></p>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    const modalImage = modal.querySelector(".love-photo-wall-modal-image");
    const modalChip = modal.querySelector(".love-photo-wall-modal-chip");
    const modalTitle = modal.querySelector(".love-photo-wall-modal-title");
    const modalDesc = modal.querySelector(".love-photo-wall-modal-desc");
    let currentModalIndex = 0;

    const renderModal = (nextIndex) => {
      if (!modalImage || !modalChip || !modalTitle || !modalDesc) return;
      const count = entries.length;
      if (!count) return;

      currentModalIndex = ((nextIndex % count) + count) % count;
      const entry = entries[currentModalIndex];
      modal.style.setProperty("--photo-accent", entry.scene.accent || "#ff8aa5");
      modalImage.src = entry.fullSrc || entry.thumbSrc;
      modalImage.alt = entry.alt;
      modalChip.textContent = `${entry.scene.label} · 第 ${entry.number} 张`;
      modalTitle.textContent = entry.scene.badge || entry.scene.label;
      modalDesc.textContent = entry.scene.desc || "这一张照片，也把那天的心情一起留了下来。";
    };

    const openModal = (index) => {
      renderModal(index);
      modal.classList.add("is-open");
      document.body.classList.add("love-photo-wall-modal-open");
    };

    const closeModal = () => {
      modal.classList.remove("is-open");
      document.body.classList.remove("love-photo-wall-modal-open");
    };

    modal.querySelectorAll("[data-modal-close='1']").forEach((button) => {
      button.addEventListener("click", closeModal);
    });
    modal.querySelectorAll("[data-modal-step]").forEach((button) => {
      button.addEventListener("click", () => {
        const step = Number(button.getAttribute("data-modal-step") || 0);
        renderModal(currentModalIndex + step);
      });
    });

    if (window.__lovePhotoWallKeyHandler) {
      document.removeEventListener("keydown", window.__lovePhotoWallKeyHandler);
    }
    window.__lovePhotoWallKeyHandler = (event) => {
      if (!modal.classList.contains("is-open")) return;
      if (event.key === "Escape") closeModal();
      if (event.key === "ArrowLeft") renderModal(currentModalIndex - 1);
      if (event.key === "ArrowRight") renderModal(currentModalIndex + 1);
    };
    document.addEventListener("keydown", window.__lovePhotoWallKeyHandler);

    entries.forEach((entry, index) => {
      const open = () => openModal(index);
      entry.item.addEventListener("click", open);
      entry.item.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          open();
        }
      });
    });

    filtersWrap?.querySelectorAll(".love-photo-wall-filter").forEach((button) => {
      button.addEventListener("click", () => {
        applyFilter(button.getAttribute("data-scene") || "all");
      });
    });

    feature?.querySelectorAll("[data-photo-wall-random='1']").forEach((button) => {
      button.addEventListener("click", () => {
        const pool = visibleEntries();
        if (!pool.length) return;
        let nextIndex = currentFeaturePoolIndex;
        while (pool.length > 1 && nextIndex === currentFeaturePoolIndex) {
          nextIndex = Math.floor(Math.random() * pool.length);
        }
        updateFeature(nextIndex, true);
      });
    });

    featureOpenButton?.addEventListener("click", () => {
      if (!currentFeatureEntry) return;
      const index = entries.indexOf(currentFeatureEntry);
      if (index >= 0) openModal(index);
    });

    const initialScene = filterItems.find(
      (scene) => normalizeSearchText(scene.key) === requestedScene
    );
    applyFilter(initialScene ? initialScene.key : "all");
  };

  // . 文章尾部心情打卡组件
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

  // . 首页 / About 的「每日一签」
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
    if (!featureEnabled("dailyQuote")) {
      document.getElementById("love-daily-quote-btn")?.remove();
      return;
    }

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

  // . About 页心情打卡小统计
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
    let loveList = window.LOVE_CONFIG && window.LOVE_CONFIG.loveList;
    if (!loveList || !loveList.total) {
      try {
        const raw = localStorage.getItem(LOVE_LIST_PROGRESS_KEY);
        if (raw) loveList = JSON.parse(raw);
      } catch (e) {}
    }
    if (!loveList || !loveList.total) return;
    const percent = Math.round((loveList.done / loveList.total) * 100);
    el.textContent = `目前我们已经一起完成了 ${loveList.done} / ${loveList.total} 件小事，小宇宙解锁进度 ${percent}%。`;
  };

  // . 视频页交互：正在播放提示 + 结束小弹幕
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

  // . 恋爱清单进度同步（供其他页面统计用）
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

    try {
      localStorage.setItem(
        LOVE_LIST_PROGRESS_KEY,
        JSON.stringify(window.LOVE_CONFIG.loveList)
      );
    } catch (e) {}
  };

  // . 留言板：Twikoo 懒加载占位 + 快捷留言 / 回复高亮 / 纪念日提示
  const initTwikooLazyPlaceholder = () => {
    const path = window.location.pathname || "";
    const isComments =
      path === "/comments/" || path === "/comments/index.html";
    if (!isComments) return;

    const tw =
      document.getElementById("twikoo-wrap") ||
      document.querySelector("#post-comment #twikoo") ||
      document.getElementById("twikoo");
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
      const tw =
        document.getElementById("twikoo-wrap") ||
        document.querySelector("#post-comment #twikoo") ||
        document.getElementById("twikoo");
      if (!tw) return null;
      // Twikoo 常见结构：.tk-input textarea 或通用 textarea
      return (
        tw.querySelector(".tk-input textarea") ||
        tw.querySelector("textarea")
      );
    };

    shortcuts.forEach((btn) => {
      if (btn.dataset.shortcutBound === "1") return;

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

      btn.dataset.shortcutBound = "1";
    });
  };

  const initReplyHighlight = () => {
    const tw =
      document.getElementById("twikoo-wrap") ||
      document.querySelector("#post-comment #twikoo") ||
      document.getElementById("twikoo");
    if (!tw || tw.dataset.replyHighlightBound === "1") return;

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

    tw.dataset.replyHighlightBound = "1";
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
      const tw =
        document.getElementById("twikoo-wrap") ||
        document.querySelector("#post-comment #twikoo") ||
        document.getElementById("twikoo");
      if (!tw) return;
      attachShortcutHandlers();
      initReplyHighlight();
      initCommentsAnniversaryBanner();
    };

    // 先尝试一次
    tryInit();

    // 监听 Twikoo 渲染完成
    const tw =
      document.getElementById("twikoo-wrap") ||
      document.querySelector("#post-comment #twikoo") ||
      document.getElementById("twikoo");
    if (!tw) return;
    if (tw.__loveShortcutObserver) return;
    const observer = new MutationObserver(() => {
      attachShortcutHandlers();
    });
    observer.observe(tw, { childList: true, subtree: true });
    tw.__loveShortcutObserver = observer;
  };

  // . 文章页阅读进度条
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
    initHomeStoryHero();
    initHomeChapterShelf();
    initHomeMemoryShowcaseV2();
    runWhenIdle(initHomeTodayMemoryPanel);
    runWhenIdle(initAnniversaryBadge);
    runWhenIdle(initGalleryExperience);
    runWhenIdle(initPhotoWallExperience);
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

  const start = () => {
    window.setTimeout(bootInteractions, 0);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }

  document.addEventListener("pjax:complete", start);
  window.addEventListener("hexo-blog-decrypt", () => {
    setTimeout(bootInteractions, 80);
  });
})();
