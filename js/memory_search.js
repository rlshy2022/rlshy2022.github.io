(function () {
  "use strict";

  const PAGE_SELECTOR = "#memory-search-page";
  const SEARCH_HISTORY_KEY = "love-memory-search-history-v1";
  const runtime = window.LOVE_MEMORY_RUNTIME;
  if (!runtime) return;

  let searchPromise = null;
  let graphPromise = null;
  let perspectiveBound = false;

  const safeArray = runtime.safeArray || ((value) => (Array.isArray(value) ? value : []));
  const formatDate = runtime.formatDate || ((value) => String(value || ""));
  const renderCoverMarkup = runtime.renderCoverMarkup;
  const normalizePath = runtime.normalizePath || ((value) => String(value || "/"));

  const TYPE_LABELS = {
    all: "全部类型",
    milestone: "纪念节点",
    travel: "旅行",
    post: "文章",
    letter: "心动片段",
    gift: "礼物",
    festival: "节日",
    site: "站点章节",
  };

  const loadSearchIndex = () => {
    if (!searchPromise) {
      searchPromise = runtime.fetchJson("/memories/search-index.json", {
        itemCount: 0,
        scenes: [],
        types: [],
        years: [],
        seasons: [],
        moods: [],
        items: [],
      });
    }
    return searchPromise;
  };

  const loadGraph = () => {
    if (!graphPromise) {
      graphPromise = runtime.getGraph
        ? runtime.getGraph()
        : Promise.resolve({ pagePresets: {} });
    }
    return graphPromise;
  };

  const escapeHtml = (value) =>
    String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const escapeRegExp = (value) => String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const highlightText = (value, query) => {
    const raw = String(value || "");
    const cleanQuery = String(query || "").trim();
    if (!cleanQuery) return escapeHtml(raw);

    const pattern = new RegExp(`(${escapeRegExp(cleanQuery)})`, "ig");
    return escapeHtml(raw).replace(pattern, "<mark>$1</mark>");
  };

  const readSearchHistory = () => {
    try {
      const parsed = JSON.parse(window.localStorage.getItem(SEARCH_HISTORY_KEY) || "[]");
      return Array.isArray(parsed) ? parsed.filter(Boolean).slice(0, 6) : [];
    } catch (error) {
      return [];
    }
  };

  const saveSearchQuery = (query) => {
    const clean = String(query || "").trim();
    if (clean.length < 2) return;

    try {
      const next = [clean, ...readSearchHistory().filter((item) => item !== clean)].slice(0, 6);
      window.localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(next));
    } catch (error) {
      // ignore storage failures
    }
  };

  const getParams = () => {
    try {
      return new URL(window.location.href).searchParams;
    } catch (error) {
      return new URLSearchParams(window.location.search || "");
    }
  };

  const createButtons = (items, activeValue, type) =>
    items
      .map(
        (item) => `
          <button
            type="button"
            class="memory-chip${item.value === activeValue ? " is-active" : ""}"
            data-filter-type="${type}"
            data-filter-value="${item.value}"
          >
            ${item.label}
          </button>
        `
      )
      .join("");

  const renderResultCard = (item, query, explorationMap) => {
    const scene = runtime.getScene(item.scene) || runtime.getScene("daily") || {};
    const memoryId = runtime.getMemoryId ? runtime.getMemoryId(item) : item.id || item.url || "";
    const visited = Boolean(explorationMap && explorationMap[memoryId]);
    const favorite = runtime.isMemoryFavorite ? runtime.isMemoryFavorite(memoryId) : false;
    return `
      <article class="memory-search-card${item.cover ? "" : " is-no-cover"}${visited ? " is-visited" : ""}" style="--memory-accent:${scene.accent || "#e29aa9"};">
        ${renderCoverMarkup({
          wrapperClass: "memory-search-cover",
          src: item.cover,
          alt: item.title,
          placeholder: "回忆封面",
          renderWhenEmpty: false,
        })}
        <div class="memory-search-content">
          <div class="memory-search-meta">
            <span>${scene.label || "日常"}</span>
            <span>${item.badge || TYPE_LABELS[item.type] || "回忆"}</span>
            ${visited ? '<span>已看过</span>' : ""}
            ${favorite ? '<span>已收藏</span>' : ""}
            <time datetime="${item.isoDate || ""}">${formatDate(item.isoDate)}</time>
          </div>
          <h3>${highlightText(item.title || "未命名回忆", query)}</h3>
          <p>${highlightText(item.summary || "这一页适合被重新翻开。", query)}</p>
          <div class="memory-search-actions">
            ${item.url ? `<a href="${item.url}" data-memory-open="${escapeHtml(memoryId)}">打开回忆</a>` : ""}
            <button type="button" class="memory-action-btn" data-memory-favorite="${escapeHtml(memoryId)}">${favorite ? "取消收藏" : "收藏这页"}</button>
            ${scene.timelineUrl ? `<a href="${scene.timelineUrl}">同章时间轴</a>` : ""}
            ${scene.galleryUrl ? `<a href="${scene.galleryUrl}">同章相册</a>` : ""}
          </div>
        </div>
      </article>
    `;
  };

  const renderStory = (item, label) => `
    <a class="memory-graph-story" href="${escapeHtml(item.url || "/search-memory/")}">
      <span class="memory-graph-story-badge">${escapeHtml(label || "推荐入口")}</span>
      <strong>${escapeHtml(item.title || "打开下一页")}</strong>
      <p>${escapeHtml(item.summary || "先从这里进入，再继续细筛。")}</p>
      <small>${escapeHtml(formatDate(item.isoDate || ""))}</small>
    </a>
  `;

  const init = () => {
    const container = document.querySelector(PAGE_SELECTOR);
    if (!container) return;

    Promise.all([runtime.getMeta(), runtime.getPerspective(), loadSearchIndex(), loadGraph()]).then(
      ([meta, perspective, searchData, graphData]) => {
        if (!document.body.contains(container)) return;

        const params = getParams();
        const sceneOptions = [
          { value: "all", label: "全部场景" },
          ...safeArray(meta.scenes).map((scene) => ({ value: scene.key, label: scene.label })),
        ];
        const typeOptions = [
          { value: "all", label: "全部类型" },
          ...safeArray(searchData.types).map((item) => ({
            value: item.key,
            label: TYPE_LABELS[item.key] || item.label || item.key,
          })),
        ];
        const yearOptions = [
          { value: "all", label: "全部年份" },
          ...safeArray(searchData.years).map((item) => ({
            value: String(item.key),
            label: `${item.key} 年`,
          })),
        ];
        const seasonOptions = [
          { value: "all", label: "全部季节" },
          ...safeArray(searchData.seasons).map((item) => ({
            value: item.key,
            label: item.label || item.key,
          })),
        ];
        const moodOptions = [
          { value: "all", label: "全部气氛" },
          ...safeArray(searchData.moods).map((item) => ({
            value: item.key,
            label: item.label || item.key,
          })),
        ];
        const itemMap = safeArray(searchData.items).reduce((acc, item) => {
          acc[normalizePath(item && item.url)] = item;
          return acc;
        }, {});
        const preset = (graphData.pagePresets && graphData.pagePresets["/search-memory/"]) || {
          nextStops: [],
        };
        const featuredStories = safeArray(preset.nextStops)
          .map((url) => itemMap[normalizePath(url)])
          .filter(Boolean)
          .slice(0, 3);

        let state = {
          query: params.get("q") || "",
          scene: sceneOptions.some((item) => item.value === params.get("scene")) ? params.get("scene") : "all",
          type: typeOptions.some((item) => item.value === params.get("type")) ? params.get("type") : "all",
          year: yearOptions.some((item) => item.value === params.get("year")) ? params.get("year") : "all",
          season: seasonOptions.some((item) => item.value === params.get("season")) ? params.get("season") : "all",
          mood: moodOptions.some((item) => item.value === params.get("mood")) ? params.get("mood") : "all",
        };
        const searchHistory = readSearchHistory();

        container.innerHTML = `
          <section class="memory-page-shell memory-search-shell">
            <header class="memory-page-hero">
              <div>
                <span class="memory-page-kicker">Memory Search</span>
                <h2>搜索地点、节日、礼物和某个阶段</h2>
                <p>先输入关键词，再用年份、场景、类型、季节和气氛缩小范围。</p>
              </div>
              <div class="memory-page-stats">
                <div><strong>${searchData.itemCount || 0}</strong><span>检索条目</span></div>
                <div><strong>${safeArray(searchData.years).length}</strong><span>年份跨度</span></div>
                <div><strong>${safeArray(searchData.scenes).length}</strong><span>场景维度</span></div>
              </div>
            </header>

            <div class="memory-page-switcher" data-role="switcher"></div>

            <section class="memory-panel">
              <div class="memory-panel-head">
                <div>
                  <span class="memory-panel-kicker">多维筛选</span>
                  <h3>搜索与筛选</h3>
                </div>
                <a href="/memory-hub/">回忆中心</a>
              </div>
              <div class="memory-search-toolbar is-deep-search">
                <input type="search" class="memory-search-input" placeholder="搜索宁国、爬黄山、心愿牌、福州、礼物、旅行..." value="${escapeHtml(state.query)}" />
                ${
                  searchHistory.length
                    ? `
                      <div class="memory-search-history">
                        <span>最近搜索</span>
                        ${searchHistory
                          .map(
                            (item) => `
                              <button type="button" class="memory-chip" data-search-history="${escapeHtml(item)}">
                                ${escapeHtml(item)}
                              </button>
                            `
                          )
                          .join("")}
                      </div>
                    `
                    : ""
                }
                <div class="memory-search-filter-block">
                  <strong>场景</strong>
                  <div class="memory-search-filters">${createButtons(sceneOptions, state.scene, "scene")}</div>
                </div>
                <div class="memory-search-filter-block">
                  <strong>类型</strong>
                  <div class="memory-search-filters">${createButtons(typeOptions, state.type, "type")}</div>
                </div>
                <div class="memory-search-filter-block">
                  <strong>年份</strong>
                  <div class="memory-search-filters">${createButtons(yearOptions, state.year, "year")}</div>
                </div>
                <div class="memory-search-filter-block">
                  <strong>季节</strong>
                  <div class="memory-search-filters">${createButtons(seasonOptions, state.season, "season")}</div>
                </div>
                <div class="memory-search-filter-block">
                  <strong>气氛</strong>
                  <div class="memory-search-filters">${createButtons(moodOptions, state.mood, "mood")}</div>
                </div>
              </div>
              <div class="memory-search-summary" data-role="summary"></div>
              <div class="memory-search-results" data-role="results"></div>
            </section>

            <section class="memory-hub-journey-board search-journey-board">
              <section class="memory-hub-quest-card">
                <span class="memory-hub-continue-kicker">推荐入口</span>
                <strong>还没想好搜什么时，从这些页继续</strong>
                <p>推荐入口放在搜索结果之后，避免阻挡首屏检索任务。</p>
              </section>
              <div class="passport-story-loop">
                ${featuredStories.map((item) => renderStory(item, "推荐入口")).join("")}
              </div>
            </section>
          </section>
        `;

        container.querySelector('[data-role="switcher"]').appendChild(
          runtime.createPerspectiveSwitcher({ compact: true, label: "切换视角" })
        );
        runtime.hydrateCoverImages && runtime.hydrateCoverImages(container);

        const input = container.querySelector(".memory-search-input");
        const summary = container.querySelector('[data-role="summary"]');
        const results = container.querySelector('[data-role="results"]');
        const buttons = Array.from(container.querySelectorAll("[data-filter-type]"));
        const allItems = safeArray(searchData.items);
        const itemById = new Map(
          allItems.map((item) => [runtime.getMemoryId ? runtime.getMemoryId(item) : item.id || item.url || "", item])
        );
        if (runtime.unlockAchievement) runtime.unlockAchievement("use-search");

        const renderResults = () => {
          const query = runtime.normalizeText(state.query);
          const exploration = runtime.getExplorationSummary
            ? runtime.getExplorationSummary(allItems)
            : { recent: [] };
          const visitedMap = safeArray(exploration.recent).reduce((acc, item) => {
            const id = runtime.getMemoryId ? runtime.getMemoryId(item) : item.id || item.url || "";
            if (id) acc[id] = true;
            return acc;
          }, {});

          const filtered = allItems
            .filter((item) => state.scene === "all" || item.scene === state.scene)
            .filter((item) => state.type === "all" || item.type === state.type)
            .filter((item) => state.year === "all" || String(item.year) === String(state.year))
            .filter((item) => state.season === "all" || item.season === state.season)
            .filter((item) => state.mood === "all" || item.mood === state.mood)
            .filter((item) => !query || String(item.searchBlob || "").includes(query));

          buttons.forEach((button) => {
            const type = button.getAttribute("data-filter-type");
            const value = button.getAttribute("data-filter-value");
            button.classList.toggle("is-active", state[type] === value);
          });

          summary.innerHTML = `
            <div class="memory-search-summary-card">
              <strong>${filtered.length}</strong>
              <small>当前筛选：${state.year === "all" ? "全部年份" : `${state.year} 年`} / ${state.scene === "all" ? "全部场景" : (runtime.getScene(state.scene) || {}).label || state.scene} / ${state.type === "all" ? "全部类型" : TYPE_LABELS[state.type] || state.type} / ${state.season === "all" ? "全部季节" : (seasonOptions.find((item) => item.value === state.season) || {}).label || state.season} / ${state.mood === "all" ? "全部气氛" : (moodOptions.find((item) => item.value === state.mood) || {}).label || state.mood}</small>
            </div>
          `;

          results.innerHTML = filtered.length
            ? filtered.slice(0, 24).map((item) => renderResultCard(item, state.query, visitedMap)).join("")
            : `
                <div class="memory-empty-state">
                  <h3>没有找到匹配的回忆</h3>
                  <p>可以放宽年份、季节或气氛，或者换一个更具体的地点、礼物、节日关键词再试。</p>
                </div>
              `;
          runtime.hydrateCoverImages && runtime.hydrateCoverImages(results);
        };

        input.addEventListener("input", (event) => {
          state.query = event.target.value || "";
          renderResults();
        });

        input.addEventListener("change", () => {
          saveSearchQuery(state.query);
        });

        input.addEventListener("keydown", (event) => {
          if (event.key === "Enter") saveSearchQuery(state.query);
        });

        container.querySelectorAll("[data-search-history]").forEach((button) => {
          button.addEventListener("click", () => {
            state.query = button.getAttribute("data-search-history") || "";
            input.value = state.query;
            renderResults();
          });
        });

        buttons.forEach((button) => {
          button.addEventListener("click", () => {
            const type = button.getAttribute("data-filter-type");
            const value = button.getAttribute("data-filter-value") || "all";
            state = {
              ...state,
              [type]: value,
            };
            renderResults();
          });
        });

        results.addEventListener("click", (event) => {
          const openLink = event.target.closest("[data-memory-open]");
          if (openLink && runtime.markMemoryVisited) {
            const item = itemById.get(openLink.getAttribute("data-memory-open") || "");
            if (item) runtime.markMemoryVisited(item);
            return;
          }

          const favoriteBtn = event.target.closest("[data-memory-favorite]");
          if (favoriteBtn && runtime.toggleMemoryFavorite) {
            const item = itemById.get(favoriteBtn.getAttribute("data-memory-favorite") || "");
            if (item) {
              runtime.toggleMemoryFavorite(item);
              renderResults();
            }
          }
        });

        renderResults();
      }
    );

    if (!perspectiveBound) {
      perspectiveBound = true;
      runtime.subscribePerspective(() => {
        window.setTimeout(init, 30);
      });
    }
  };

  init();
  document.addEventListener("DOMContentLoaded", init);
  document.addEventListener("pjax:complete", init);
})();
