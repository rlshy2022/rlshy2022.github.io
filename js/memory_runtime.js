(function () {
  "use strict";

  const META_ENDPOINT = "/memories/site-meta.json";
  const GRAPH_ENDPOINT = "/memories/recommendation-graph.json";
  const STORAGE_KEY = "love-memory-perspective";
  const PLAY_STATE_KEY = "love-memory-play-state-v1";
  const MAX_GACHA_HISTORY = 12;
  const listeners = new Set();
  const ACHIEVEMENTS = [
    { key: "open-home", label: "回到首页", desc: "打开小窝首页" },
    { key: "open-hub", label: "回忆馆入口", desc: "打开回忆中心" },
    { key: "use-search", label: "记忆检索员", desc: "使用回忆搜索" },
    { key: "open-timeline", label: "时间线漫游", desc: "查看恋爱时间轴" },
    { key: "open-map", label: "地图旅行家", desc: "打开足迹地图" },
    { key: "open-gacha", label: "扭蛋机启动", desc: "打开回忆扭蛋机" },
    { key: "draw-gacha", label: "抽到一颗回忆", desc: "完成一次回忆抽取" },
    { key: "favorite-memory", label: "收藏这一页", desc: "收藏一段公开回忆" },
  ];

  let metaPromise = null;
  let graphPromise = null;
  let cachedMeta = {
    generatedAt: "",
    scenes: [],
    specialDays: [],
    perspectives: {
      default: "huan",
      items: [],
    },
    voicePostcards: [],
  };
  let cachedGraph = {
    generatedAt: "",
    itemCount: 0,
    scenes: [],
    years: [],
    pagePresets: {},
    recommendations: {},
    items: [],
  };
  let currentPerspectiveKey = "";

  const safeArray = (value) => (Array.isArray(value) ? value : []);

  const normalizeText = (value) =>
    String(value || "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();

  const normalizePath = (value) => {
    let pathValue = String(value || "/").trim() || "/";

    try {
      pathValue = new URL(pathValue, window.location.origin).pathname;
    } catch (error) {
      // keep raw path
    }

    pathValue = pathValue.replace(/index\.html$/i, "");
    if (!pathValue.startsWith("/")) pathValue = `/${pathValue}`;
    pathValue = pathValue.replace(/\/{2,}/g, "/");
    if (pathValue !== "/" && !pathValue.endsWith("/")) {
      pathValue = `${pathValue}/`;
    }
    return pathValue;
  };

  const escapeHtml = (value) =>
    String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const renderCoverMarkup = (options = {}) => {
    const wrapperClass = String(options.wrapperClass || "").trim();
    const imageClass = String(options.imageClass || "").trim();
    const src = String(options.src || "").trim();
    const alt = escapeHtml(options.alt || "");
    const placeholder = escapeHtml(options.placeholder || "回忆封面");
    const overlayHtml = String(options.overlayHtml || "");
    const renderWhenEmpty = options.renderWhenEmpty !== false;

    if (!src && !renderWhenEmpty) {
      return "";
    }

    const classes = [wrapperClass, "memory-card-cover"].filter(Boolean);
    if (!src) {
      classes.push("is-empty");
    }

    return `
      <div class="${classes.join(" ")}" data-placeholder="${placeholder}">
        ${
          src
            ? `<img${imageClass ? ` class="${imageClass}"` : ""} src="${escapeHtml(src)}" alt="${alt}" loading="lazy" data-memory-cover>`
            : ""
        }
        ${overlayHtml}
      </div>
    `;
  };

  const hydrateCoverImages = (root = document) => {
    if (!root || !root.querySelectorAll) return;

    root.querySelectorAll("img[data-memory-cover]").forEach((image) => {
      if (image.dataset.memoryCoverBound === "1") return;
      image.dataset.memoryCoverBound = "1";

      const wrapper = image.closest(".memory-card-cover");
      if (!wrapper) return;

      const markBroken = () => {
        wrapper.classList.add("is-empty");
        if (image.parentNode) {
          image.remove();
        }
      };

      if (image.complete && !image.naturalWidth) {
        markBroken();
        return;
      }

      image.addEventListener("error", markBroken, { once: true });
    });
  };

  const normalizeScene = (scene) => ({
    key: String(scene && scene.key ? scene.key : "").trim(),
    label: String(scene && scene.label ? scene.label : "").trim(),
    badge: String(scene && scene.badge ? scene.badge : scene && scene.label ? scene.label : "").trim(),
    accent: String(scene && scene.accent ? scene.accent : "#e29aa9").trim(),
    chapter: String(scene && scene.chapter ? scene.chapter : scene && scene.label ? scene.label : "").trim(),
    desc: String(scene && scene.desc ? scene.desc : "").trim(),
    quote: String(scene && scene.quote ? scene.quote : "").trim(),
    cover: String(scene && scene.cover ? scene.cover : "").trim(),
    galleryUrl: String(scene && (scene.galleryUrl || scene.gallery_url) ? scene.galleryUrl || scene.gallery_url : "").trim(),
    photoWallUrl: String(scene && (scene.photoWallUrl || scene.photo_wall_url) ? scene.photoWallUrl || scene.photo_wall_url : "").trim(),
    timelineUrl: String(scene && (scene.timelineUrl || scene.timeline_url) ? scene.timelineUrl || scene.timeline_url : "").trim(),
    passport: Boolean(scene && scene.passport),
    passportTitle: String(scene && (scene.passportTitle || scene.passport_title) ? scene.passportTitle || scene.passport_title : "").trim(),
    passportNote: String(scene && (scene.passportNote || scene.passport_note) ? scene.passportNote || scene.passport_note : "").trim(),
    stamp: String(scene && scene.stamp ? scene.stamp : "").trim(),
    keywords: safeArray(scene && scene.keywords)
      .map((item) => String(item || "").trim())
      .filter(Boolean),
  });

  const normalizeSpecialDay = (item) => ({
    key: String(item && item.key ? item.key : "").trim(),
    month: Number(item && item.month),
    day: Number(item && item.day),
    name: String(item && item.name ? item.name : "").trim(),
    badge: String(item && item.badge ? item.badge : "今日限定").trim(),
    heroTitle: String(item && (item.heroTitle || item.hero_title) ? item.heroTitle || item.hero_title : "").trim(),
    heroDesc: String(item && (item.heroDesc || item.hero_desc) ? item.heroDesc || item.hero_desc : "").trim(),
    toast: String(item && item.toast ? item.toast : "").trim(),
    accent: String(item && item.accent ? item.accent : "#e68aa2").trim(),
    themeClass: String(item && (item.themeClass || item.theme_class) ? item.themeClass || item.theme_class : "").trim(),
    featureTitle: String(item && (item.featureTitle || item.feature_title) ? item.featureTitle || item.feature_title : "").trim(),
    featureDesc: String(item && (item.featureDesc || item.feature_desc) ? item.featureDesc || item.feature_desc : "").trim(),
    recommendedScene: String(item && (item.recommendedScene || item.recommended_scene) ? item.recommendedScene || item.recommended_scene : "").trim(),
    recommendedLinks: safeArray(item && (item.recommendedLinks || item.recommended_links))
      .map((link) => ({
        label: String(link && link.label ? link.label : "").trim(),
        url: String(link && link.url ? link.url : "").trim(),
      }))
      .filter((link) => link.label && link.url),
  });

  const normalizePerspective = (item) => ({
    key: String(item && item.key ? item.key : "").trim(),
    label: String(item && item.label ? item.label : "").trim(),
    shortLabel: String(item && (item.shortLabel || item.short_label) ? item.shortLabel || item.short_label : "").trim(),
    heroTitle: String(item && (item.heroTitle || item.hero_title) ? item.heroTitle || item.hero_title : "").trim(),
    heroDesc: String(item && (item.heroDesc || item.hero_desc) ? item.heroDesc || item.hero_desc : "").trim(),
    hubTitle: String(item && (item.hubTitle || item.hub_title) ? item.hubTitle || item.hub_title : "").trim(),
    hubDesc: String(item && (item.hubDesc || item.hub_desc) ? item.hubDesc || item.hub_desc : "").trim(),
    passportNote: String(item && (item.passportNote || item.passport_note) ? item.passportNote || item.passport_note : "").trim(),
    letterNote: String(item && (item.letterNote || item.letter_note) ? item.letterNote || item.letter_note : "").trim(),
  });

  const normalizeVoicePostcard = (item) => ({
    key: String(item && item.key ? item.key : "").trim(),
    title: String(item && item.title ? item.title : "").trim(),
    speaker: String(item && item.speaker ? item.speaker : "").trim(),
    badge: String(item && item.badge ? item.badge : "语音明信片").trim(),
    scene: String(item && item.scene ? item.scene : "daily").trim(),
    summary: String(item && item.summary ? item.summary : "").trim(),
    audio: String(item && item.audio ? item.audio : "").trim(),
    cover: String(item && item.cover ? item.cover : "").trim(),
  });

  const normalizeMeta = (data) => ({
    generatedAt: String(data && data.generatedAt ? data.generatedAt : "").trim(),
    scenes: safeArray(data && data.scenes).map(normalizeScene).filter((scene) => scene.key),
    specialDays: safeArray(data && data.specialDays)
      .map(normalizeSpecialDay)
      .filter((item) => item.key && item.month && item.day),
    perspectives: {
      default: String(data && data.perspectives && data.perspectives.default ? data.perspectives.default : "huan").trim(),
      items: safeArray(data && data.perspectives && data.perspectives.items)
        .map(normalizePerspective)
        .filter((item) => item.key),
    },
    voicePostcards: safeArray(data && data.voicePostcards)
      .map(normalizeVoicePostcard)
      .filter((item) => item.key),
  });

  const normalizeGraph = (data) => ({
    generatedAt: String(data && data.generatedAt ? data.generatedAt : "").trim(),
    itemCount: Number(data && data.itemCount) || 0,
    scenes: safeArray(data && data.scenes),
    years: safeArray(data && data.years),
    pagePresets:
      data && data.pagePresets && typeof data.pagePresets === "object"
        ? data.pagePresets
        : {},
    recommendations:
      data && data.recommendations && typeof data.recommendations === "object"
        ? data.recommendations
        : {},
    items: safeArray(data && data.items),
  });

  const applyMetaToLegacyConfig = (meta) => {
    window.LOVE_CONFIG = window.LOVE_CONFIG || {};

    if (meta.scenes.length) {
      window.LOVE_CONFIG.photoWallScenes = meta.scenes.map((scene) => ({
        key: scene.key,
        label: scene.label,
        badge: scene.badge,
        desc: scene.desc,
        accent: scene.accent,
        keywords: scene.keywords,
      }));
    }

    if (meta.specialDays.length) {
      window.LOVE_CONFIG.specialDays = meta.specialDays;
    }

    if (meta.perspectives.items.length) {
      window.LOVE_CONFIG.perspectives = meta.perspectives;
    }

    if (meta.voicePostcards.length) {
      window.LOVE_CONFIG.voicePostcards = meta.voicePostcards;
    }
  };

  const fetchJson = (url, fallback) =>
    fetch(url, { credentials: "same-origin" })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load ${url}: ${response.status}`);
        }
        return response.json();
      })
      .catch(() => fallback);

  const readStoredPerspective = () => {
    try {
      return window.localStorage.getItem(STORAGE_KEY) || "";
    } catch (error) {
      return "";
    }
  };

  const persistPerspective = (key) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, key);
    } catch (error) {
      // ignore storage failures
    }
  };

  const getSceneList = () => safeArray(cachedMeta.scenes);

  const getScene = (key) => {
    const sceneKey = String(key || "").trim();
    return (
      getSceneList().find((scene) => scene.key === sceneKey) ||
      getSceneList().find((scene) => scene.key === "daily") ||
      null
    );
  };

  const inferScene = (item, fallback = "daily") => {
    if (item && item.scene && getScene(item.scene)) {
      return String(item.scene).trim();
    }

    const raw = normalizeText(
      [
        item && item.title,
        item && item.summary,
        item && item.description,
        item && item.location,
        item && item.url,
        ...(safeArray(item && item.categories)),
        ...(safeArray(item && item.tags)),
      ]
        .filter(Boolean)
        .join(" ")
    );

    if (!raw) return fallback;

    const matched = getSceneList().find((scene) => {
      const keywords = [scene.key, scene.label, ...(scene.keywords || [])];
      return keywords.some((keyword) => normalizeText(keyword) && raw.includes(normalizeText(keyword)));
    });

    return matched ? matched.key : fallback;
  };

  const resolvePerspectiveKey = (desired) => {
    const items = safeArray(cachedMeta.perspectives && cachedMeta.perspectives.items);
    if (!items.length) return "";

    const candidate = String(desired || "").trim();
    if (candidate && items.some((item) => item.key === candidate)) {
      return candidate;
    }

    const stored = String(readStoredPerspective() || "").trim();
    if (stored && items.some((item) => item.key === stored)) {
      return stored;
    }

    const fallback = String(cachedMeta.perspectives && cachedMeta.perspectives.default ? cachedMeta.perspectives.default : "").trim();
    if (fallback && items.some((item) => item.key === fallback)) {
      return fallback;
    }

    return items[0].key;
  };

  const ensurePerspective = () => {
    const nextKey = resolvePerspectiveKey(currentPerspectiveKey);
    if (nextKey && nextKey !== currentPerspectiveKey) {
      currentPerspectiveKey = nextKey;
      persistPerspective(nextKey);
    }
    return currentPerspectiveKey;
  };

  const getPerspectiveSync = () => {
    const key = ensurePerspective();
    return (
      safeArray(cachedMeta.perspectives && cachedMeta.perspectives.items).find((item) => item.key === key) ||
      safeArray(cachedMeta.perspectives && cachedMeta.perspectives.items)[0] ||
      null
    );
  };

  const notifyPerspective = () => {
    const perspective = getPerspectiveSync();
    listeners.forEach((listener) => {
      try {
        listener(currentPerspectiveKey, perspective);
      } catch (error) {
        // keep other listeners alive
      }
    });
  };

  const loadMeta = () => {
    if (metaPromise) return metaPromise;

    metaPromise = fetchJson(META_ENDPOINT, cachedMeta).then((data) => {
      cachedMeta = normalizeMeta(data || {});
      applyMetaToLegacyConfig(cachedMeta);
      ensurePerspective();
      return cachedMeta;
    });

    return metaPromise;
  };

  const loadGraph = () => {
    if (graphPromise) return graphPromise;

    graphPromise = fetchJson(GRAPH_ENDPOINT, cachedGraph).then((data) => {
      cachedGraph = normalizeGraph(data || {});
      return cachedGraph;
    });

    return graphPromise;
  };

  const getPerspective = () =>
    loadMeta().then(() => getPerspectiveSync());

  const setPerspectiveKey = (key) =>
    loadMeta().then(() => {
      const nextKey = resolvePerspectiveKey(key);
      if (!nextKey) return getPerspectiveSync();
      if (nextKey !== currentPerspectiveKey) {
        currentPerspectiveKey = nextKey;
        persistPerspective(nextKey);
        notifyPerspective();
      }
      return getPerspectiveSync();
    });

  const subscribePerspective = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  const createPerspectiveSwitcher = (options = {}) => {
    const root = document.createElement("div");
    root.className = `love-perspective-switch${options.compact ? " is-compact" : ""}`;

    const render = () => {
      const items = safeArray(cachedMeta.perspectives && cachedMeta.perspectives.items);
      if (items.length < 2) {
        root.innerHTML = "";
        return;
      }

      const current = ensurePerspective();
      root.innerHTML = `
        <span class="love-perspective-switch-label">${options.label || "故事视角"}</span>
        <div class="love-perspective-switch-buttons">
          ${items
            .map(
              (item) => `
                <button
                  type="button"
                  class="love-perspective-switch-btn${item.key === current ? " is-active" : ""}"
                  data-perspective-key="${item.key}"
                >
                  ${item.shortLabel || item.label || item.key}
                </button>
              `
            )
            .join("")}
        </div>
      `;

      root.querySelectorAll("[data-perspective-key]").forEach((button) => {
        button.addEventListener("click", () => {
          const key = button.getAttribute("data-perspective-key") || "";
          setPerspectiveKey(key);
        });
      });
    };

    const unsubscribe = subscribePerspective(render);
    root.__cleanupPerspective = unsubscribe;
    loadMeta().then(render);
    return root;
  };

  const getActiveSpecialDay = () => {
    const days = safeArray(cachedMeta.specialDays);
    if (!days.length) return null;

    let params;
    try {
      params = new URL(window.location.href).searchParams;
    } catch (error) {
      params = new URLSearchParams(window.location.search || "");
    }

    const forcedKey = params.get("specialDay");
    if (forcedKey) {
      return days.find((item) => item.key === forcedKey) || null;
    }

    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();

    return days.find((item) => Number(item.month) === month && Number(item.day) === day) || null;
  };

  const formatDate = (value) => {
    if (!value) return "";
    const [year, month, day] = String(value).split("-");
    if (!year || !month || !day) return String(value || "");
    return `${year}.${month}.${day}`;
  };

  const emptyPlayState = () => ({
    visited: {},
    favorites: {},
    gachaHistory: [],
    achievements: {},
    updatedAt: "",
  });

  const readPlayState = () => {
    try {
      const raw = window.localStorage.getItem(PLAY_STATE_KEY);
      if (!raw) return emptyPlayState();

      const parsed = JSON.parse(raw);
      return {
        ...emptyPlayState(),
        ...(parsed && typeof parsed === "object" ? parsed : {}),
        visited: parsed && parsed.visited && typeof parsed.visited === "object" ? parsed.visited : {},
        favorites: parsed && parsed.favorites && typeof parsed.favorites === "object" ? parsed.favorites : {},
        gachaHistory: safeArray(parsed && parsed.gachaHistory),
        achievements: parsed && parsed.achievements && typeof parsed.achievements === "object" ? parsed.achievements : {},
      };
    } catch (error) {
      return emptyPlayState();
    }
  };

  const writePlayState = (state) => {
    const nextState = {
      ...emptyPlayState(),
      ...(state || {}),
      updatedAt: new Date().toISOString(),
    };

    try {
      window.localStorage.setItem(PLAY_STATE_KEY, JSON.stringify(nextState));
    } catch (error) {
      // localStorage can be unavailable in privacy modes; the feature should degrade silently.
    }

    return nextState;
  };

  const getMemoryId = (item) => {
    if (!item) return "";
    const explicit = String(item.id || item.url || "").trim();
    if (explicit) return explicit;

    return normalizeText([item.title, item.isoDate, item.scene, item.type].filter(Boolean).join("::"));
  };

  const normalizeMemoryEntry = (item) => {
    const id = getMemoryId(item);
    if (!id) return null;

    return {
      id,
      title: String(item.title || "未命名回忆").trim(),
      url: String(item.url || "").trim(),
      scene: String(item.scene || inferScene(item)).trim(),
      type: String(item.type || "").trim(),
      badge: String(item.badge || "").trim(),
      isoDate: String(item.isoDate || "").trim(),
      cover: String(item.cover || "").trim(),
      summary: String(item.summary || "").trim(),
    };
  };

  const markMemoryVisited = (item) => {
    const entry = normalizeMemoryEntry(item);
    if (!entry) return readPlayState();

    const state = readPlayState();
    state.visited[entry.id] = {
      ...entry,
      visitedAt: new Date().toISOString(),
    };

    return writePlayState(state);
  };

  const isMemoryFavorite = (itemOrId) => {
    const id = typeof itemOrId === "string" ? itemOrId : getMemoryId(itemOrId);
    if (!id) return false;
    return Boolean(readPlayState().favorites[id]);
  };

  const toggleMemoryFavorite = (item) => {
    const entry = normalizeMemoryEntry(item);
    if (!entry) return { active: false, state: readPlayState() };

    const state = readPlayState();
    if (state.favorites[entry.id]) {
      delete state.favorites[entry.id];
      return { active: false, state: writePlayState(state) };
    }

    state.favorites[entry.id] = {
      ...entry,
      favoritedAt: new Date().toISOString(),
    };
    state.achievements["favorite-memory"] = state.achievements["favorite-memory"] || {
      unlockedAt: new Date().toISOString(),
    };

    return { active: true, state: writePlayState(state) };
  };

  const recordGachaDraw = (item) => {
    const entry = normalizeMemoryEntry(item);
    if (!entry) return readPlayState();

    const state = readPlayState();
    state.gachaHistory = [
      {
        ...entry,
        drawnAt: new Date().toISOString(),
      },
      ...safeArray(state.gachaHistory).filter((historyItem) => historyItem.id !== entry.id),
    ].slice(0, MAX_GACHA_HISTORY);
    state.visited[entry.id] = state.visited[entry.id] || {
      ...entry,
      visitedAt: new Date().toISOString(),
    };
    state.achievements["draw-gacha"] = state.achievements["draw-gacha"] || {
      unlockedAt: new Date().toISOString(),
    };

    return writePlayState(state);
  };

  const unlockAchievement = (key, payload = {}) => {
    const achievementKey = String(key || "").trim();
    if (!achievementKey) return readPlayState();

    const state = readPlayState();
    state.achievements[achievementKey] = state.achievements[achievementKey] || {
      unlockedAt: new Date().toISOString(),
      payload,
    };

    return writePlayState(state);
  };

  const getAchievementStatus = () => {
    const state = readPlayState();
    return ACHIEVEMENTS.map((item) => ({
      ...item,
      unlocked: Boolean(state.achievements[item.key]),
      unlockedAt: state.achievements[item.key] && state.achievements[item.key].unlockedAt,
    }));
  };

  const getExplorationSummary = (items = []) => {
    const state = readPlayState();
    const normalizedItems = safeArray(items).map(normalizeMemoryEntry).filter(Boolean);
    const knownIds = new Set(normalizedItems.map((item) => item.id));
    const visitedIds = new Set(Object.keys(state.visited || {}));
    const visitedCount = normalizedItems.filter((item) => visitedIds.has(item.id)).length;
    const totalCount = normalizedItems.length;

    const enrich = (entry) =>
      normalizedItems.find((item) => item.id === entry.id) || entry;

    const recent = Object.values(state.visited || {})
      .sort((a, b) => String(b.visitedAt || "").localeCompare(String(a.visitedAt || "")))
      .map(enrich)
      .filter((item) => !knownIds.size || knownIds.has(item.id))
      .slice(0, 6);

    const favorites = Object.values(state.favorites || {})
      .sort((a, b) => String(b.favoritedAt || "").localeCompare(String(a.favoritedAt || "")))
      .map(enrich)
      .filter((item) => !knownIds.size || knownIds.has(item.id));

    const nextUnvisited = normalizedItems.find((item) => !visitedIds.has(item.id)) || null;

    return {
      totalCount,
      visitedCount,
      percent: totalCount ? Math.round((visitedCount / totalCount) * 100) : 0,
      favorites,
      favoriteCount: favorites.length,
      recent,
      nextUnvisited,
      gachaHistory: safeArray(state.gachaHistory).slice(0, MAX_GACHA_HISTORY),
      achievements: getAchievementStatus(),
      unlockedAchievementCount: getAchievementStatus().filter((item) => item.unlocked).length,
    };
  };

  window.LOVE_MEMORY_RUNTIME = {
    escapeHtml,
    fetchJson,
    getMeta: loadMeta,
    getMetaSync: () => cachedMeta,
    getGraph: loadGraph,
    getGraphSync: () => cachedGraph,
    renderCoverMarkup,
    hydrateCoverImages,
    loadMeta,
    loadGraph,
    safeArray,
    normalizeText,
    normalizePath,
    getSceneList,
    getScene,
    inferScene,
    formatDate,
    getPlayState: readPlayState,
    getMemoryId,
    markMemoryVisited,
    toggleMemoryFavorite,
    isMemoryFavorite,
    recordGachaDraw,
    unlockAchievement,
    getAchievementStatus,
    getExplorationSummary,
    getPerspective,
    getPerspectiveSync,
    getPerspectiveKey: () => ensurePerspective(),
    setPerspectiveKey,
    subscribePerspective,
    createPerspectiveSwitcher,
    getActiveSpecialDay,
  };

  loadMeta();
})();
