(function () {
  "use strict";

  const runtime = window.LOVE_MEMORY_RUNTIME;
  if (!runtime) return;

  const SEARCH_ENDPOINT = "/memories/search-index.json";
  const PASSPORT_ENDPOINT = "/memories/travel-passport.json";
  const EXPLORER_STATE_KEY = "love-memory-explorer-state-v3";
  const FLOAT_DISMISS_KEY = "love-memory-next-stop-dismissed";
  const REWARD_LEVELS = [
    { count: 1, badge: "今日点亮", desc: "今天已经打开一条记录。" },
    { count: 3, badge: "连续三日", desc: "已经连续三天在这座小站里继续往前走。" },
    { count: 7, badge: "连续一周", desc: "连续一周都有浏览记录。" },
    { count: 14, badge: "稳定回访", desc: "已经形成稳定的回看记录。" },
  ];
  const STATIC_PAGE_MAP = {
    "/memory-hub/": { pageType: "hub", title: "回忆中心" },
    "/search-memory/": { pageType: "search", title: "回忆搜索" },
    "/love-timeline/": { pageType: "timeline", title: "恋爱时间轴" },
    "/memory-gacha/": { pageType: "gacha", title: "回忆扭蛋机" },
    "/travel-passport/": { pageType: "route", title: "旅行护照" },
    "/gallery/": { pageType: "gallery", title: "甜蜜相册" },
    "/photo-wall/": { pageType: "photo-wall", title: "照片墙" },
    "/future-letters/": { pageType: "letters", title: "未来信件" },
    "/year-review/": { pageType: "year-review", title: "年度回顾" },
    "/love-map/": { pageType: "map", title: "足迹地图" },
    "/love-calendar/": { pageType: "calendar", title: "纪念日历" },
  };

  const safeArray = runtime.safeArray || ((value) => (Array.isArray(value) ? value : []));
  const escapeHtml = runtime.escapeHtml;
  const normalizeText = runtime.normalizeText;
  const formatDate = runtime.formatDate;
  const normalizePath = runtime.normalizePath || ((value) => String(value || "/"));

  let searchPromise = null;
  let passportPromise = null;
  let graphPromise = null;
  let homeRetryTimer = 0;
  let articleFloatBound = false;
  let floatShownPath = "";
  let lastTrackedPath = "";

  const getQueryParams = () => {
    try {
      return new URL(window.location.href).searchParams;
    } catch (error) {
      return new URLSearchParams(window.location.search || "");
    }
  };

  const isSilentMode = () => getQueryParams().get("visual-check") === "1";
  const getCurrentPath = () => normalizePath(window.location.pathname || "/");

  const buildDayKey = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getPrevDayKey = (dayKey) => {
    const date = new Date(`${dayKey}T12:00:00`);
    date.setDate(date.getDate() - 1);
    return buildDayKey(date);
  };

  const getDefaultState = () => ({
    version: 3,
    streakCount: 0,
    lastVisitDate: "",
    visitedDays: [],
    visitedEntries: {},
    unlockedRewards: [],
  });

  const readExplorerState = () => {
    try {
      const raw = window.localStorage.getItem(EXPLORER_STATE_KEY);
      if (!raw) return getDefaultState();
      const parsed = JSON.parse(raw);
      if (!parsed || Number(parsed.version) !== 3) return getDefaultState();
      return {
        ...getDefaultState(),
        ...parsed,
        visitedDays: safeArray(parsed.visitedDays),
        visitedEntries:
          parsed.visitedEntries && typeof parsed.visitedEntries === "object"
            ? parsed.visitedEntries
            : {},
        unlockedRewards: safeArray(parsed.unlockedRewards).map((item) => String(item)),
      };
    } catch (error) {
      return getDefaultState();
    }
  };

  const writeExplorerState = (state) => {
    try {
      window.localStorage.setItem(EXPLORER_STATE_KEY, JSON.stringify(state));
    } catch (error) {
      // ignore storage failures
    }
  };

  const loadSearchIndex = () => {
    if (!searchPromise) {
      searchPromise = runtime.fetchJson(SEARCH_ENDPOINT, {
        itemCount: 0,
        items: [],
      });
    }
    return searchPromise;
  };

  const loadPassport = () => {
    if (!passportPromise) {
      passportPromise = runtime.fetchJson(PASSPORT_ENDPOINT, {
        routeCount: 0,
        routes: [],
      });
    }
    return passportPromise;
  };

  const loadGraph = () => {
    if (!graphPromise) {
      graphPromise = runtime.getGraph
        ? runtime.getGraph()
        : Promise.resolve({
            itemCount: 0,
            pagePresets: {},
            recommendations: {},
            scenes: [],
            years: [],
          });
    }
    return graphPromise;
  };

  const uniqueByPath = (items, limit) => {
    const seen = new Set();
    const output = [];
    safeArray(items).forEach((item) => {
      const path = normalizePath(item && item.url);
      if (!path || seen.has(path)) return;
      seen.add(path);
      output.push(item);
    });
    return typeof limit === "number" ? output.slice(0, limit) : output;
  };

  const buildItemMap = (items) =>
    safeArray(items).reduce((acc, item) => {
      acc[normalizePath(item && item.url)] = item;
      return acc;
    }, {});

  const resolveUrls = (urls, itemMap, limit) =>
    uniqueByPath(
      safeArray(urls)
        .map((url) => itemMap[normalizePath(url)])
        .filter(Boolean),
      limit
    );

  const findEntriesByPath = (items, path) =>
    safeArray(items).filter((item) => normalizePath(item && item.url) === path);

  const resolveCurrentEntry = (searchData) => {
    const path = getCurrentPath();
    const matches = findEntriesByPath(searchData && searchData.items, path);
    if (!matches.length) return null;
    return (
      matches.find((item) => item.source === "post") ||
      matches.find((item) => item.type !== "milestone") ||
      matches[0]
    );
  };

  const inferSceneFromCurrentPage = (searchData) => {
    const current = resolveCurrentEntry(searchData);
    if (current && current.scene) return current.scene;

    const params = getQueryParams();
    const candidates = [params.get("scene"), params.get("chapter")]
      .map((item) => String(item || "").trim())
      .filter(Boolean);
    const matched = candidates.find((item) => runtime.getScene(item));
    return matched || "";
  };

  const buildVisitContext = (searchData) => {
    const path = getCurrentPath();
    const current = resolveCurrentEntry(searchData);
    if (current) {
      return {
        eligible: true,
        url: path,
        title: current.title || document.title || "回忆页",
        pageType: "story",
        scene: current.scene || "",
        year: current.year || "",
      };
    }

    if (STATIC_PAGE_MAP[path]) {
      return {
        eligible: true,
        url: path,
        title: STATIC_PAGE_MAP[path].title,
        pageType: STATIC_PAGE_MAP[path].pageType,
        scene: inferSceneFromCurrentPage(searchData),
        year: "",
      };
    }

    return {
      eligible: false,
      url: path,
      title: "",
      pageType: "",
      scene: "",
      year: "",
    };
  };

  const trackVisit = (context) => {
    if (!context || !context.eligible) {
      return { state: readExplorerState(), reward: null, firstVisitToday: false };
    }

    const state = readExplorerState();
    const today = buildDayKey();
    const firstVisitToday = !safeArray(state.visitedDays).some((item) => item && item.date === today);

    if (firstVisitToday) {
      if (state.lastVisitDate === getPrevDayKey(today)) {
        state.streakCount = Number(state.streakCount || 0) + 1;
      } else if (state.lastVisitDate === today && Number(state.streakCount || 0) > 0) {
        state.streakCount = Number(state.streakCount || 0);
      } else {
        state.streakCount = 1;
      }

      state.lastVisitDate = today;
      state.visitedDays = [
        {
          date: today,
          url: context.url,
          title: context.title,
          scene: context.scene || "",
          pageType: context.pageType,
        },
        ...safeArray(state.visitedDays).filter((item) => item && item.date !== today),
      ].slice(0, 45);
    }

    const existing = state.visitedEntries[context.url] || {};
    state.visitedEntries[context.url] = {
      count: Number(existing.count || 0) + 1,
      lastVisited: today,
      title: context.title,
      scene: context.scene || existing.scene || "",
      pageType: context.pageType || existing.pageType || "",
      year: context.year || existing.year || "",
    };

    const reward =
      firstVisitToday &&
      REWARD_LEVELS.find(
        (item) =>
          item.count === Number(state.streakCount || 0) &&
          !safeArray(state.unlockedRewards).includes(String(item.count))
      );

    if (reward) {
      state.unlockedRewards = [...safeArray(state.unlockedRewards), String(reward.count)];
    }

    writeExplorerState(state);
    return { state, reward: reward || null, firstVisitToday };
  };

  const showRewardToast = (reward, streakCount) => {
    if (!reward || isSilentMode()) return;
    const message = `探索奖励解锁：${reward.badge} · 已连续 ${streakCount} 天`;
    if (
      typeof window.btf !== "undefined" &&
      typeof window.btf.snackbarShow === "function" &&
      window.GLOBAL_CONFIG &&
      window.GLOBAL_CONFIG.Snackbar
    ) {
      window.btf.snackbarShow(message);
      return;
    }

    const toast = document.createElement("div");
    toast.className = "love-special-day-toast is-visible";
    toast.innerHTML = `
      <i class="fas fa-compass"></i>
      <span>${escapeHtml(message)}</span>
    `;
    document.body.appendChild(toast);
    window.setTimeout(() => {
      toast.classList.remove("is-visible");
      window.setTimeout(() => toast.remove(), 220);
    }, 2600);
  };

  const rankCandidates = (items, current, visitedEntries) => {
    const currentTime = current && current.timestamp ? Number(current.timestamp) : 0;
    return uniqueByPath(items)
      .filter((item) => normalizePath(item && item.url) !== getCurrentPath())
      .sort((left, right) => {
        const leftPath = normalizePath(left && left.url);
        const rightPath = normalizePath(right && right.url);
        const leftVisited = Boolean(visitedEntries[leftPath]);
        const rightVisited = Boolean(visitedEntries[rightPath]);
        if (leftVisited !== rightVisited) return leftVisited ? 1 : -1;

        const leftDistance = Math.abs(Number(left.timestamp || 0) - currentTime);
        const rightDistance = Math.abs(Number(right.timestamp || 0) - currentTime);
        if (leftDistance !== rightDistance) return leftDistance - rightDistance;

        return Number(right.timestamp || 0) - Number(left.timestamp || 0);
      });
  };

  const pickNextStop = (items, current, route, visitedEntries) => {
    const sceneMatches = rankCandidates(
      safeArray(items).filter((item) => item.scene === current.scene),
      current,
      visitedEntries
    );
    if (sceneMatches.length) return sceneMatches[0];

    const routeMatches = rankCandidates(
      safeArray(route && route.highlights)
        .map((item) => ({
          ...item,
          scene: current.scene,
          timestamp: Date.parse(item.isoDate || "") || 0,
          year: Number(String(item.isoDate || "").slice(0, 4)) || current.year || 0,
          summary: item.summary || route.note || "",
          location: route.label || current.location || "",
        })),
      current,
      visitedEntries
    );
    if (routeMatches.length) return routeMatches[0];

    const yearMatches = rankCandidates(
      safeArray(items).filter((item) => Number(item.year) === Number(current.year)),
      current,
      visitedEntries
    );
    if (yearMatches.length) return yearMatches[0];

    const unseen = rankCandidates(items, current, visitedEntries);
    return unseen[0] || null;
  };

  const getGraphPreset = (graphData, path) =>
    (graphData && graphData.pagePresets && graphData.pagePresets[path]) || {
      nextStops: [],
      sceneKeys: [],
    };

  const getGraphRecommendation = (graphData, path) =>
    (graphData && graphData.recommendations && graphData.recommendations[path]) || {
      nextStop: "",
      sameScene: [],
      sameLocation: [],
      sameYear: [],
      sameSeason: [],
      sameMood: [],
      sameRoute: [],
      relatedScenes: [],
    };

  const renderStoryCard = (item, label) => {
    const scene = runtime.getScene(item && item.scene) || runtime.getScene("daily") || {};
    return `
      <a class="article-journey-card" href="${escapeHtml(item.url || "/archives/")}">
        <div class="article-journey-card-meta">
          <span class="article-journey-card-badge">${escapeHtml(label || scene.label || "相关回忆")}</span>
          <span>${escapeHtml(formatDate(item.isoDate || ""))}</span>
        </div>
        <strong>${escapeHtml(item.title || "继续往下翻")}</strong>
        <p>${escapeHtml(item.summary || scene.desc || "这一页和刚才读完的内容有关。")}</p>
        <div class="article-journey-card-foot">
          <span>${escapeHtml(item.location || scene.label || "回忆")}</span>
          <span>打开下一页<i class="fas fa-arrow-right"></i></span>
        </div>
      </a>
    `;
  };

  const renderLane = (title, desc, items, labelBuilder) => {
    const cards = safeArray(items);
    if (!cards.length) return "";

    return `
      <section class="article-journey-lane">
        <div class="article-journey-lane-head">
          <h3>${escapeHtml(title)}</h3>
          <p>${escapeHtml(desc)}</p>
        </div>
        <div class="article-journey-card-list">
          ${cards
            .map((item, index) =>
              renderStoryCard(
                item,
                typeof labelBuilder === "function" ? labelBuilder(item, index) : title
              )
            )
            .join("")}
        </div>
      </section>
    `;
  };

  const renderScenePills = (graphData, sceneKeys) => {
    const sceneIndex = safeArray(graphData && graphData.scenes).reduce((acc, item) => {
      acc[item.key] = item;
      return acc;
    }, {});

    const pills = safeArray(sceneKeys)
      .map((item) => sceneIndex[item.key] || sceneIndex[item])
      .filter(Boolean)
      .slice(0, 4);

    if (!pills.length) return "";

    return `
      <div class="article-journey-scene-pills">
        ${pills
          .map(
            (scene) => `
              <a href="${escapeHtml((scene.entryLinks && scene.entryLinks[0]) || `/love-timeline/?scene=${encodeURIComponent(scene.key)}`)}"
                 class="article-journey-scene-pill"
                 style="--story-accent:${escapeHtml(scene.accent || "#e29aa9")};">
                <span>${escapeHtml(scene.label || scene.key)}</span>
                <small>${escapeHtml(scene.count || 0)} 页</small>
              </a>
            `
          )
          .join("")}
      </div>
    `;
  };

  const pickNextUnvisited = (urls, itemMap, visitedEntries) =>
    safeArray(urls)
      .map((url) => itemMap[normalizePath(url)])
      .find((item) => item && !visitedEntries[normalizePath(item.url)]) || null;

  const buildHomeJourneyMarkup = (searchData, graphData, meta, state) => {
    const visitedEntries = state && state.visitedEntries ? state.visitedEntries : {};
    const visitedPaths = Object.keys(visitedEntries);
    const itemMap = buildItemMap(searchData && searchData.items);
    const visitedItems = uniqueByPath(
      safeArray(searchData && searchData.items).filter((item) =>
        visitedPaths.includes(normalizePath(item && item.url))
      )
    );
    const visitedSceneKeys = Array.from(new Set(visitedItems.map((item) => item.scene).filter(Boolean)));
    const activeDay = runtime.getActiveSpecialDay ? runtime.getActiveSpecialDay() : null;
    const nextReward = REWARD_LEVELS.find((item) => item.count > Number(state.streakCount || 0)) || null;
    const preset = getGraphPreset(graphData, "/memory-hub/");
    const nextStop =
      pickNextUnvisited(preset.nextStops, itemMap, visitedEntries) ||
      uniqueByPath(safeArray(searchData && searchData.items))
        .sort((left, right) => Number(right.timestamp || 0) - Number(left.timestamp || 0))
        .find((item) => !visitedEntries[normalizePath(item && item.url)]) ||
      null;
    const progressPercent =
      Number(searchData && searchData.itemCount)
        ? Math.min(100, Math.round((visitedItems.length / Number(searchData.itemCount || 1)) * 100))
        : 0;
    const sceneProgress = safeArray(meta && meta.scenes).length
      ? `${visitedSceneKeys.length}/${safeArray(meta && meta.scenes).length}`
      : "0/0";
    const rewardCopy = activeDay
      ? activeDay.featureDesc || "今天的推荐入口已经排好。"
      : nextReward
        ? `再连续 ${Math.max(nextReward.count - Number(state.streakCount || 0), 1)} 天，就会解锁「${nextReward.badge}」。`
        : "探索奖励已经全部点亮，接下来继续查看内容。";
    const links = activeDay && safeArray(activeDay.recommendedLinks).length
      ? safeArray(activeDay.recommendedLinks).slice(0, 3)
      : [
          nextStop ? { label: "自动推荐下一站", url: nextStop.url } : null,
          { label: "去时间轴", url: "/love-timeline/" },
          { label: "看旅行路线", url: "/travel-passport/" },
        ].filter(Boolean);

    return `
      <section class="home-memory-journey-strip">
        <div class="home-memory-journey-main">
          <span class="home-memory-journey-kicker">${escapeHtml(
            activeDay ? activeDay.badge || "今日限定" : "探索进度"
          )}</span>
          <h3 class="home-memory-journey-title">已经连续探索 ${escapeHtml(
            state.streakCount || 0
          )} 天，点亮 ${escapeHtml(visitedItems.length)}/${escapeHtml(
            searchData.itemCount || 0
          )} 页回忆</h3>
          <p class="home-memory-journey-desc">${escapeHtml(rewardCopy)}</p>
          <div class="home-memory-journey-progress">
            <span style="width:${progressPercent}%;"></span>
          </div>
          ${renderScenePills(graphData, preset.sceneKeys)}
        </div>
        <div class="home-memory-journey-stats">
          <div>
            <strong>${escapeHtml(progressPercent)}%</strong>
            <span>内容探索</span>
          </div>
          <div>
            <strong>${escapeHtml(sceneProgress)}</strong>
            <span>场景解锁</span>
          </div>
          <div>
            <strong>${escapeHtml(
              activeDay ? activeDay.name || "今日限定" : nextReward ? nextReward.badge : "已完成"
            )}</strong>
            <span>${escapeHtml(activeDay ? "今日路线" : nextReward ? "下一奖励" : "奖励状态")}</span>
          </div>
        </div>
        <div class="home-memory-journey-links">
          ${links
            .map(
              (item, index) => `
                <a href="${escapeHtml(item.url)}" class="home-memory-journey-link${
                  index === 0 ? "" : " is-ghost"
                }">
                  <span>${escapeHtml(item.label)}</span>
                  <i class="fas fa-arrow-right"></i>
                </a>
              `
            )
            .join("")}
        </div>
      </section>
    `;
  };

  const decorateHomePortal = (searchData, graphData, meta, state) => {
    const portal = document.querySelector(".home-memory-portal");
    if (!portal) return false;

    portal.querySelectorAll(".home-memory-journey-strip").forEach((node) => node.remove());
    portal.insertAdjacentHTML("beforeend", buildHomeJourneyMarkup(searchData, graphData, meta, state));

    const visitedEntries = state && state.visitedEntries ? state.visitedEntries : {};
    portal.querySelectorAll(".home-memory-portal-card").forEach((card) => {
      const path = normalizePath(card.getAttribute("href") || "");
      const explored = Boolean(visitedEntries[path]);
      card.classList.toggle("is-visited", explored);
      if (explored) {
        card.setAttribute("data-explored", "已探索");
      } else {
        card.removeAttribute("data-explored");
      }
    });

    const todaySide = document.querySelector(".home-today-memory-side-card");
    if (todaySide && !todaySide.querySelector(".home-memory-side-streak")) {
      const badge = document.createElement("div");
      badge.className = "home-memory-side-streak";
      badge.innerHTML = `
        <span class="label">连续探索</span>
        <strong>${escapeHtml(state.streakCount || 0)} 天</strong>
      `;
      todaySide.appendChild(badge);
    }

    return true;
  };

  const initHomeJourney = () => {
    if (getCurrentPath() !== "/") return;

    Promise.all([runtime.getMeta(), loadSearchIndex(), loadGraph()]).then(
      ([meta, searchData, graphData]) => {
        const state = readExplorerState();
        if (decorateHomePortal(searchData, graphData, meta, state)) return;

        window.clearTimeout(homeRetryTimer);
        homeRetryTimer = window.setTimeout(initHomeJourney, 260);
      }
    );
  };

  const buildArticleJourneyMarkup = (searchData, graphData, passportData, current, state) => {
    const items = safeArray(searchData && searchData.items);
    const itemMap = buildItemMap(items);
    const currentPath = normalizePath(current && current.url);
    const visitedEntries = state && state.visitedEntries ? state.visitedEntries : {};
    const graphEntry = getGraphRecommendation(graphData, currentPath);
    const locationKey = normalizeText(current && current.location);

    const samePlace =
      resolveUrls(graphEntry.sameLocation, itemMap, 3) ||
      rankCandidates(
        locationKey
          ? items.filter(
              (item) =>
                normalizeText(item && item.location) === locationKey &&
                normalizePath(item && item.url) !== currentPath
            )
          : [],
        current,
        visitedEntries
      ).slice(0, 3);
    const sameScene = resolveUrls(graphEntry.sameScene, itemMap, 3);
    const sameYear = resolveUrls(graphEntry.sameYear, itemMap, 3);
    const sameMood = resolveUrls(graphEntry.sameMood, itemMap, 3);
    const sameSeason = resolveUrls(graphEntry.sameSeason, itemMap, 3);
    const sameRoute = resolveUrls(graphEntry.sameRoute, itemMap, 3);
    const currentRoute =
      safeArray(passportData && passportData.routes).find((route) => route.key === current.scene) || null;
    const nextStop =
      (graphEntry.nextStop && itemMap[normalizePath(graphEntry.nextStop)]) ||
      pickNextStop(items, current, currentRoute, visitedEntries);
    const scene = runtime.getScene(current.scene) || runtime.getScene("daily") || {};
    const activeDay = runtime.getActiveSpecialDay ? runtime.getActiveSpecialDay() : null;

    const routeMarkup =
      currentRoute || sameRoute.length || (activeDay && safeArray(activeDay.recommendedLinks).length)
        ? `
          <section class="article-journey-route${currentRoute ? "" : " is-quest"}">
            <div class="article-journey-route-head">
              <span class="article-journey-route-kicker">${
                currentRoute ? "相关旅行路线" : escapeHtml(activeDay.badge || "今日限定")
              }</span>
              <h3>${
                currentRoute
                  ? escapeHtml(currentRoute.title || scene.label || "旅行路线")
                  : escapeHtml(activeDay.featureTitle || activeDay.name || "今天的推荐入口")
              }</h3>
              <p>${
                currentRoute
                  ? escapeHtml(
                      currentRoute.note || scene.desc || "顺着这条路线继续往下翻，故事会更完整。"
                    )
                  : escapeHtml(
                      activeDay.featureDesc || activeDay.heroDesc || "今天的相关入口已经排好。"
                    )
              }</p>
            </div>
            <div class="article-journey-route-actions">
              ${
                currentRoute
                  ? [
                      currentRoute.timelineUrl
                        ? `<a href="${escapeHtml(currentRoute.timelineUrl)}">时间轴</a>`
                        : "",
                      currentRoute.galleryUrl
                        ? `<a href="${escapeHtml(currentRoute.galleryUrl)}">相册</a>`
                        : "",
                      currentRoute.photoWallUrl
                        ? `<a href="${escapeHtml(currentRoute.photoWallUrl)}">照片墙</a>`
                        : "",
                    ].join("")
                  : safeArray(activeDay.recommendedLinks)
                      .slice(0, 3)
                      .map((item) => `<a href="${escapeHtml(item.url)}">${escapeHtml(item.label)}</a>`)
                      .join("")
              }
            </div>
            ${
              sameRoute.length
                ? `<div class="article-journey-route-list">${sameRoute
                    .map((item) => renderStoryCard(item, "同路线"))
                    .join("")}</div>`
                : ""
            }
          </section>
        `
        : "";

    const laneMarkup = [
      renderLane(
        "同地点再看几页",
        current.location
          ? `围绕 ${current.location} 这条线，再往前后各翻几页。`
          : "把这一页所在的位置线索继续串起来。",
        samePlace,
        () => "同地点"
      ),
      renderLane(
        "同年份回到这一年",
        current.year ? `${current.year} 年里，还有这些页和它互相照应。` : "这一年里，还有这些回忆和它彼此呼应。",
        sameYear,
        () => "同年份"
      ),
      renderLane(
        "同场景继续延伸",
        scene.label ? `顺着「${scene.label}」这条主线继续往下翻。` : "沿着同一条故事场景继续往下走。",
        sameScene,
        () => "同场景"
      ),
      renderLane(
        sameMood.length ? "同气氛继续" : "同季节回看",
        sameMood.length
          ? "把相似的情绪、语气和氛围继续连成一串。"
          : "换一个入口，但还停留在同一个季节里。",
        sameMood.length ? sameMood : sameSeason,
        () => (sameMood.length ? "同气氛" : "同季节")
      ),
    ]
      .filter(Boolean)
      .join("");

    const nextStopMarkup = nextStop
      ? `
        <a class="article-journey-next" href="${escapeHtml(nextStop.url || "/archives/")}">
          <span class="article-journey-next-kicker">读完自动推荐下一站</span>
          <strong>${escapeHtml(nextStop.title || "继续往下翻")}</strong>
          <p>${escapeHtml(
            nextStop.summary || scene.desc || "这一页已经替你挑好了，点开就能继续沿着刚才的情绪往下走。"
          )}</p>
          <div class="article-journey-next-meta">
            <span>${escapeHtml(formatDate(nextStop.isoDate || ""))}</span>
            <span>${escapeHtml(nextStop.location || (runtime.getScene(nextStop.scene) || {}).label || "下一站")}</span>
          </div>
          <div class="article-journey-next-link">
            <span>去下一站</span>
            <i class="fas fa-arrow-right"></i>
          </div>
        </a>
      `
      : "";

    if (!nextStopMarkup && !laneMarkup && !routeMarkup) return { html: "", nextStop: null };

    const summaryParts = [
      current.location ? `这篇属于 ${current.location}` : "",
      current.year ? `${current.year} 年` : "",
      scene.label ? `场景：${scene.label}` : "",
    ].filter(Boolean);

    return {
      nextStop,
      html: `
        <section class="article-journey" data-journey-root="1">
          <div class="article-journey-head">
            <div>
              <span class="article-journey-kicker">Story Loop</span>
              <h2 class="article-journey-title">继续查看相关内容</h2>
              <p class="article-journey-subtitle">${escapeHtml(
                summaryParts.join(" · ") || "从这一页继续查看同地点、同年份或同场景内容。"
              )}</p>
              ${renderScenePills(graphData, graphEntry.relatedScenes)}
            </div>
          </div>
          <div class="article-journey-hero">
            ${nextStopMarkup}
            ${routeMarkup}
          </div>
          <div class="article-journey-grid">
            ${laneMarkup}
          </div>
        </section>
      `,
    };
  };

  const ensureArticleFloat = (nextStop) => {
    if (!nextStop || isSilentMode()) return;
    if (floatShownPath === getCurrentPath()) return;

    const article = document.getElementById("article-container");
    if (!article) return;

    let float = document.querySelector(".article-next-stop-float");
    if (float) float.remove();

    float = document.createElement("div");
    float.className = "article-next-stop-float";
    float.innerHTML = `
      <button type="button" class="article-next-stop-close" aria-label="关闭下一站推荐">
        <i class="fas fa-times"></i>
      </button>
      <span class="article-next-stop-kicker">下一站已就绪</span>
      <strong>${escapeHtml(nextStop.title || "继续往下翻")}</strong>
      <p>${escapeHtml(nextStop.summary || "继续打开下一页，故事会更完整。")}</p>
      <a href="${escapeHtml(nextStop.url || "/archives/")}" class="article-next-stop-link">
        继续下一站<i class="fas fa-arrow-right"></i>
      </a>
    `;
    document.body.appendChild(float);

    const dismissKey = `${getCurrentPath()}::${normalizePath(nextStop.url || "")}`;
    try {
      if (window.sessionStorage.getItem(FLOAT_DISMISS_KEY) === dismissKey) return;
    } catch (error) {
      // ignore storage failures
    }

    const close = () => {
      float.classList.remove("is-visible");
      try {
        window.sessionStorage.setItem(FLOAT_DISMISS_KEY, dismissKey);
      } catch (error) {
        // ignore storage failures
      }
    };

    const update = () => {
      const rect = article.getBoundingClientRect();
      const articleHeight = Math.max(article.offsetHeight, 1);
      const visibleOffset = Math.max(window.innerHeight - rect.top, 0);
      const progress = visibleOffset / articleHeight;
      if (progress >= 0.72) {
        float.classList.add("is-visible");
        floatShownPath = getCurrentPath();
      }
    };

    if (articleFloatBound) {
      window.removeEventListener("scroll", window.__articleNextStopScrollHandler);
      window.removeEventListener("resize", window.__articleNextStopResizeHandler);
      articleFloatBound = false;
    }

    window.__articleNextStopScrollHandler = update;
    window.__articleNextStopResizeHandler = update;
    articleFloatBound = true;
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    const closeButton = float.querySelector(".article-next-stop-close");
    if (closeButton) {
      closeButton.addEventListener("click", close);
    }

    update();
  };

  const initArticleJourney = () => {
    const article = document.getElementById("article-container");
    if (!article) return;

    if (document.getElementById("hbePass") || document.getElementById("hbeSubmitBtn")) {
      return;
    }

    Promise.all([loadSearchIndex(), loadGraph(), loadPassport()]).then(
      ([searchData, graphData, passportData]) => {
        const current = resolveCurrentEntry(searchData);
        if (!current) return;

        const state = readExplorerState();
        const result = buildArticleJourneyMarkup(searchData, graphData, passportData, current, state);
        if (!result.html) return;

        article.querySelectorAll("[data-journey-root='1']").forEach((node) => node.remove());
        article.insertAdjacentHTML("beforeend", result.html);
        ensureArticleFloat(result.nextStop);
      }
    );
  };

  const init = () => {
    Promise.all([loadSearchIndex()]).then(([searchData]) => {
      if (lastTrackedPath !== getCurrentPath()) {
        const visit = trackVisit(buildVisitContext(searchData));
        lastTrackedPath = getCurrentPath();
        if (visit && visit.reward) {
          showRewardToast(visit.reward, visit.state && visit.state.streakCount);
        }
      }
      initHomeJourney();
      initArticleJourney();
    });
  };

  init();
  document.addEventListener("DOMContentLoaded", init);
  document.addEventListener("pjax:complete", init);
  window.addEventListener("hexo-blog-decrypt", () => {
    window.setTimeout(initArticleJourney, 120);
  });
})();
