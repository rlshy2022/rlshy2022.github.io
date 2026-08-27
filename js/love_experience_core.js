(function () {
  "use strict";

  const LOVE_CFG = window.LOVE_CONFIG || {};
  const TODAY_MEMORY_ENDPOINT = "/memories/today-memory.json";
  const LOVE_TIMELINE_ENDPOINT = "/memories/love-timeline.json";
  const MEMORY_SCENE_ALIASES = {
    jingdezhen: {
      galleryChapter: "景德镇",
      timelineLabel: "景德镇",
      keywords: ["景德镇", "jingdezhen", "陶阳里", "中国陶瓷博物馆", "跨年"],
    },
    suzhou_2026_08: {
      galleryChapter: "八月苏州",
      timelineLabel: "八月苏州",
      keywords: ["八月苏州", "四周年", "留园", "寒山寺", "26_8suzhou", "suzhou_2026_08"],
    },
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
        key: "suzhou_2026_08",
        label: "八月苏州",
        badge: "四周年重逢",
        desc: "留园的雨、寒山寺的锦鲤，和四周年那块写着 1462 的蛋糕。",
        accent: "#e39aa9",
        keywords: ["26_8suzhou", "2026.8suzhou", "img/2026.8suzhou/", "八月苏州", "四周年", "留园", "寒山寺"],
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
    const matched = scenes.find((scene) =>
      (scene.keywords || []).some((keyword) => lower.includes(String(keyword).toLowerCase()))
    );
    if (matched) return matched;

    // 兜底：如果链接里只有目录中文（例如“/景德镇/”“/扬州/”）但不含关键词缩写，也能正确归类
    const fallbackByPath = [
      { match: ["/2026.8suzhou/", "26_8suzhou", "八月苏州"], key: "suzhou_2026_08" },
      { match: ["/景德镇/", "jingdezhen"], key: "jingdezhen" },
      { match: ["/苏州/", "suzhou"], key: "suzhou" },
      { match: ["/扬州/", "yangzhou"], key: "yangzhou" },
      { match: ["/宁国黄山/", "/nghs/", "ningguo", "宁国", "爬黄山", "心愿牌"], key: "ningguo_huangshan" },
      { match: ["/黄山/", "/hs/", "huangshan"], key: "huangshan" },
      { match: ["/福州/", "/fuzhou/", "fuzhou", "长乐", "福师大"], key: "fuzhou" },
      { match: ["/礼物/", "gift"], key: "gifts" },
      { match: ["/其他/", "birthday", "dg"], key: "birthday" },
    ];

    const fallback = fallbackByPath.find((item) =>
      item.match.some((token) => lower.includes(String(token).toLowerCase()))
    );
    if (fallback) {
      const scene = scenes.find((entry) => entry.key === fallback.key);
      if (scene) return scene;
    }

    return (
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
    if (window.LOVE_UI_UTILS && typeof window.LOVE_UI_UTILS.showToast === "function") {
      window.LOVE_UI_UTILS.showToast(text);
    }
  };

  // ---------- 1. 首页封面纪念册 ----------

  const getNextTodayMemoryRenderToken = () => String(++todayMemoryRenderToken);

  window.LOVE_EXPERIENCE_CORE = {
    LOVE_CFG,
    MEMORY_SCENE_ALIASES,
    runWhenIdle,
    safeArray,
    padNumber,
    decodeSafe,
    normalizeSearchText,
    getQueryParams,
    formatMonthDay,
    formatIsoDate,
    getMonthDayIndex,
    getMonthDayDistance,
    isHomePage,
    isGalleryPage,
    isPhotoWallPage,
    isLoveTimelinePage,
    calcLoveDays,
    loadTodayMemoryData,
    loadLoveTimelineData,
    inferMemorySceneMeta,
    getTodayMemoryEntries,
    getTodayMemorySubtitle,
    getTodayMemoryBadge,
    getTodayMemoryAnniversary,
    getUpcomingAnniversaries,
    getHomeMemoryDeck,
    pickAnotherIndex,
    readSiteCounter,
    normalizeChapterKey,
    cleanChapterTitle,
    getGalleryAccent,
    getGalleryChapterMeta,
    getGalleryContentRoot,
    getPhotoWallScenes,
    inferPhotoWallScene,
    showToast,
    getNextTodayMemoryRenderToken,
  };
})();
