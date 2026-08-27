(function () {
  "use strict";

  const PAGE_SELECTOR = "#memory-hub-page";
  const runtime = window.LOVE_MEMORY_RUNTIME;
  if (!runtime) return;

  let todayPromise = null;
  let searchPromise = null;
  let graphPromise = null;

  const safeArray = runtime.safeArray || ((value) => (Array.isArray(value) ? value : []));
  const formatDate = runtime.formatDate || ((value) => String(value || ""));
  const renderCoverMarkup = runtime.renderCoverMarkup;

  const loadToday = () => {
    if (!todayPromise) {
      todayPromise = runtime.fetchJson("/memories/today-memory.json", { posts: [] });
    }
    return todayPromise;
  };

  const loadSearchIndex = () => {
    if (!searchPromise) {
      searchPromise = runtime.fetchJson("/memories/search-index.json", {
        itemCount: 0,
        scenes: [],
        types: [],
        years: [],
        items: [],
      });
    }
    return searchPromise;
  };

  const loadGraph = () => {
    if (!graphPromise) {
      graphPromise = runtime.getGraph
        ? runtime.getGraph()
        : Promise.resolve({ pagePresets: {}, scenes: [], recommendations: {} });
    }
    return graphPromise;
  };

  const escapeHtml = (value) =>
    String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const renderSceneCard = (scene, count, graphScene) => `
    <article class="memory-scene-card" style="--memory-accent:${scene.accent};">
      <div class="memory-scene-card-head">
        <span class="memory-scene-card-badge">${scene.badge || scene.label}</span>
        <span class="memory-scene-card-count">${count}</span>
      </div>
      <h3>${scene.label}</h3>
      <p>${scene.desc || "把这一章的照片、时间线和回忆入口放在一起。"}</p>
      ${
        graphScene
          ? `
            <div class="memory-graph-meta">
              <span>${escapeHtml((graphScene.years || []).slice(0, 1).map((item) => `${item.label} 年`).join(" / ") || "长期更新")}</span>
              <span>${escapeHtml((graphScene.moods || []).slice(0, 1).map((item) => item.label).join(" / ") || "继续展开")}</span>
            </div>
          `
          : ""
      }
      <div class="memory-scene-card-actions">
        ${scene.timelineUrl ? `<a href="${scene.timelineUrl}">时间轴</a>` : ""}
        ${scene.galleryUrl ? `<a href="${scene.galleryUrl}">相册</a>` : ""}
        ${scene.photoWallUrl ? `<a href="${scene.photoWallUrl}">照片墙</a>` : ""}
      </div>
    </article>
  `;

  const renderResultCard = (item) => {
    const scene = runtime.getScene(item.scene) || runtime.getScene("daily") || {};
    const memoryId = runtime.getMemoryId ? runtime.getMemoryId(item) : item.id || item.url || "";
    return `
      <article class="memory-search-card${item.cover ? "" : " is-no-cover"}" style="--memory-accent:${scene.accent || "#e29aa9"};">
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
            <span>${item.badge || item.type || "回忆"}</span>
            <time datetime="${item.isoDate || ""}">${formatDate(item.isoDate)}</time>
          </div>
          <h3>${escapeHtml(item.title || "未命名回忆")}</h3>
          <p>${escapeHtml(item.summary || "这段记录已经保存。")}</p>
          <div class="memory-search-actions">
            ${item.url ? `<a href="${item.url}" data-memory-open="${escapeHtml(memoryId)}">打开回忆</a>` : ""}
            ${scene.timelineUrl ? `<a href="${scene.timelineUrl}">同章时间轴</a>` : ""}
          </div>
        </div>
      </article>
    `;
  };

  const init = () => {
    const container = document.querySelector(PAGE_SELECTOR);
    if (!container) return;

    Promise.all([
      runtime.getMeta(),
      runtime.getPerspective(),
      loadToday(),
      loadSearchIndex(),
      loadGraph(),
    ]).then(([meta, perspective, today, searchData, graphData]) => {
      if (!document.body.contains(container)) return;

      const searchIndex = safeArray(searchData.items);
      const graphScenes = safeArray(graphData.scenes).reduce((acc, item) => {
        acc[item.key] = item;
        return acc;
      }, {});
      const sceneCounts = searchIndex.reduce((acc, item) => {
        acc[item.scene] = (acc[item.scene] || 0) + 1;
        return acc;
      }, {});
      const exploration = runtime.getExplorationSummary
        ? runtime.getExplorationSummary(searchIndex)
        : { percent: 0, visitedCount: 0, totalCount: searchIndex.length, achievements: [], unlockedAchievementCount: 0, favoriteCount: 0, recent: [], nextUnvisited: null };
      const nextUnvisited = exploration.nextUnvisited;

      let state = {
        query: "",
        scene: "all",
      };

      container.innerHTML = `
        <section class="memory-page-shell memory-hub-shell">
          <header class="memory-page-hero">
            <div>
              <span class="memory-page-kicker">Memory Hub</span>
          <h2>${(perspective && perspective.hubTitle) || "所有公开记录都在这里"}</h2>
          <p>${(perspective && perspective.hubDesc) || "时间轴、扭蛋机、旅行护照、未来信件和语音明信片集中放在这里。"}</p>
            </div>
            <div class="memory-page-stats">
              <div><strong>${searchData.itemCount || searchIndex.length}</strong><span>可检索回忆</span></div>
              <div><strong>${meta.scenes.length}</strong><span>场景</span></div>
              <div><strong>${safeArray(today.posts).length}</strong><span>今日推荐</span></div>
            </div>
          </header>

          <section class="memory-hub-quick-links">
            <a class="memory-hub-quick-link" href="/search-memory/?scene=${encodeURIComponent((nextUnvisited && nextUnvisited.scene) || "all")}">
              <span>深度检索</span>
              <strong>按年份、类型、场景和情绪找回忆</strong>
              <small>${searchData.itemCount || searchIndex.length} 条可搜索内容</small>
            </a>
            <a class="memory-hub-quick-link" href="/love-timeline/">
              <span>恋爱时间轴</span>
              <strong>按真实时间顺序看相遇、见面和旅行</strong>
              <small>默认展开全部年份</small>
            </a>
            <a class="memory-hub-quick-link" href="${nextUnvisited && nextUnvisited.url ? nextUnvisited.url : "/memory-gacha/"}">
              <span>继续探索</span>
              <strong>${escapeHtml(nextUnvisited ? nextUnvisited.title : "从扭蛋机抽一段新的回忆")}</strong>
              <small>${nextUnvisited ? "从最近未看的记录继续" : "随机打开一段回忆"}</small>
            </a>
          </section>

          <section class="memory-hub-grid">
            <div class="memory-hub-main">
              <section class="memory-panel memory-hub-scenes-panel">
                <div class="memory-panel-head">
                  <div>
                  <span class="memory-panel-kicker">场景入口</span>
                  <h3>按地点和类型查看</h3>
                  </div>
                </div>
                <div class="memory-scene-grid">
                  ${safeArray(meta.scenes)
                    .map((scene) => renderSceneCard(scene, sceneCounts[scene.key] || 0, graphScenes[scene.key]))
                    .join("")}
                </div>
              </section>

              <section class="memory-panel memory-hub-search-panel">
                <div class="memory-panel-head">
                  <div>
                    <span class="memory-panel-kicker">快速检索</span>
                    <h3>搜地点、节日、礼物或者某一个瞬间</h3>
                    <p>完整的多维筛选已经放到“回忆搜索”页，这里保留首页级快速入口。</p>
                  </div>
                  <a href="/search-memory/">打开完整搜索</a>
                </div>
                <div class="memory-search-toolbar">
                  <input type="search" class="memory-search-input" placeholder="试试搜：宁国、爬黄山、心愿牌、福州、礼物..." />
                  <div class="memory-search-filters">
                    <button type="button" class="memory-chip is-active" data-scene-filter="all">全部</button>
                    ${safeArray(meta.scenes)
                      .map(
                        (scene) => `
                          <button type="button" class="memory-chip" data-scene-filter="${scene.key}">
                            ${scene.label}
                          </button>
                        `
                      )
                      .join("")}
                  </div>
                </div>
                <div class="memory-search-results" data-role="results"></div>
              </section>
            </div>

            <aside class="memory-hub-side">
              <section class="memory-panel memory-hub-today-panel">
                <div class="memory-panel-head">
                  <div>
                    <span class="memory-panel-kicker">今日回忆</span>
                    <h3>今天适合翻开的几页</h3>
                  </div>
                  <a href="/memory-gacha/">去扭蛋机</a>
                </div>
                <div class="memory-today-list">
                  ${safeArray(today.posts)
                    .slice(0, 4)
                    .map(
                      (item) => `
                        <a class="memory-today-item" href="${item.url || "/memory-hub/"}">
                          <strong>${escapeHtml(item.title || "未命名回忆")}</strong>
                          <span>${formatDate(item.isoDate)} · ${escapeHtml((runtime.getScene(item.scene) || {}).label || "日常")}</span>
                        </a>
                      `
                    )
                    .join("")}
                </div>
              </section>

            </aside>
          </section>
        </section>
      `;

      runtime.hydrateCoverImages && runtime.hydrateCoverImages(container);

      const results = container.querySelector('[data-role="results"]');
      const input = container.querySelector(".memory-search-input");
      const chips = Array.from(container.querySelectorAll("[data-scene-filter]"));
      const itemById = new Map(
        searchIndex.map((item) => [runtime.getMemoryId ? runtime.getMemoryId(item) : item.id || item.url || "", item])
      );

      const renderResults = () => {
        const query = runtime.normalizeText(state.query);
        const filtered = searchIndex
          .filter((item) => state.scene === "all" || item.scene === state.scene)
          .filter((item) => !query || String(item.searchBlob || "").includes(query))
          .slice(0, 4);

        chips.forEach((chip) => {
          chip.classList.toggle("is-active", chip.getAttribute("data-scene-filter") === state.scene);
        });

        results.innerHTML = filtered.length
          ? filtered.map(renderResultCard).join("")
          : `
              <div class="memory-empty-state">
                <h3>这组关键词暂时还没有匹配到内容</h3>
                <p>可以换个地点、节日或礼物关键词再试一次，或者直接去完整搜索页继续翻。</p>
              </div>
            `;
        runtime.hydrateCoverImages && runtime.hydrateCoverImages(results);
      };

      input.addEventListener("input", (event) => {
        state.query = event.target.value || "";
        renderResults();
      });

      chips.forEach((chip) => {
        chip.addEventListener("click", () => {
          state.scene = chip.getAttribute("data-scene-filter") || "all";
          renderResults();
        });
      });

      results.addEventListener("click", (event) => {
        const link = event.target.closest("[data-memory-open]");
        if (!link || !runtime.markMemoryVisited) return;
        const item = itemById.get(link.getAttribute("data-memory-open") || "");
        if (item) runtime.markMemoryVisited(item);
      });

      renderResults();
    });
  };

  init();
  document.addEventListener("DOMContentLoaded", init);
  document.addEventListener("pjax:complete", init);
})();
