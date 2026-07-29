(function () {
  "use strict";

  const PAGE_SELECTOR = "#memory-hub-page";
  const EXPLORER_STATE_KEY = "love-memory-explorer-state-v3";
  const REWARD_LEVELS = [
    { count: 1, badge: "今日点亮" },
    { count: 3, badge: "连续三日" },
    { count: 7, badge: "故事巡游" },
    { count: 14, badge: "常驻居民" },
  ];
  const runtime = window.LOVE_MEMORY_RUNTIME;
  if (!runtime) return;

  let todayPromise = null;
  let searchPromise = null;
  let lettersPromise = null;
  let yearReviewPromise = null;
  let graphPromise = null;
  let perspectiveBound = false;

  const safeArray = runtime.safeArray || ((value) => (Array.isArray(value) ? value : []));
  const formatDate = runtime.formatDate || ((value) => String(value || ""));
  const renderCoverMarkup = runtime.renderCoverMarkup;
  const normalizePath = runtime.normalizePath || ((value) => String(value || "/"));

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

  const loadLetters = () => {
    if (!lettersPromise) {
      lettersPromise = runtime.fetchJson("/memories/future-letters.json", {
        unlockedCount: 0,
        pendingCount: 0,
        letters: [],
      });
    }
    return lettersPromise;
  };

  const loadYearReview = () => {
    if (!yearReviewPromise) {
      yearReviewPromise = runtime.fetchJson("/memories/year-review.json", {
        yearCount: 0,
        currentYear: "",
        years: [],
      });
    }
    return yearReviewPromise;
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

  const readExplorerState = () => {
    try {
      const raw = window.localStorage.getItem(EXPLORER_STATE_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      return parsed && typeof parsed === "object" ? parsed : { streakCount: 0, visitedEntries: {} };
    } catch (error) {
      return { streakCount: 0, visitedEntries: {} };
    }
  };

  const buildItemMap = (items) =>
    safeArray(items).reduce((acc, item) => {
      acc[normalizePath(item && item.url)] = item;
      return acc;
    }, {});

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

  const renderVoiceCard = (item) => {
    const scene = runtime.getScene(item.scene) || {};
    return `
      <article class="memory-voice-card" style="--memory-accent:${scene.accent || "#d9879b"};">
        ${renderCoverMarkup({
          wrapperClass: "memory-voice-cover",
          src: item.cover,
          alt: item.title,
          placeholder: "语音明信片",
        })}
        <div class="memory-voice-card-body">
          <span class="memory-voice-badge">${item.badge || "语音明信片"}</span>
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.summary || "")}</p>
          <div class="memory-voice-meta">${escapeHtml(item.speaker || "")}${scene.label ? ` · ${escapeHtml(scene.label)}` : ""}</div>
          <audio controls preload="none" src="${item.audio}"></audio>
        </div>
      </article>
    `;
  };

  const renderGraphStory = (item, label) => {
    const scene = runtime.getScene(item.scene) || runtime.getScene("daily") || {};
    return `
      <a class="memory-graph-story" href="${escapeHtml(item.url || "/memory-hub/")}">
        <span class="memory-graph-story-badge">${escapeHtml(label || scene.label || "继续探索")}</span>
        <strong>${escapeHtml(item.title || "打开下一页")}</strong>
        <p>${escapeHtml(item.summary || scene.desc || "继续查看相关内容。")}</p>
        <small>${escapeHtml(formatDate(item.isoDate || ""))}</small>
      </a>
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
      loadLetters(),
      loadYearReview(),
      loadGraph(),
    ]).then(([meta, perspective, today, searchData, letters, yearReview, graphData]) => {
      if (!document.body.contains(container)) return;

      const searchIndex = safeArray(searchData.items);
      const itemMap = buildItemMap(searchIndex);
      const graphScenes = safeArray(graphData.scenes).reduce((acc, item) => {
        acc[item.key] = item;
        return acc;
      }, {});
      const sceneCounts = searchIndex.reduce((acc, item) => {
        acc[item.scene] = (acc[item.scene] || 0) + 1;
        return acc;
      }, {});
      const latestYear = safeArray(yearReview.years)[0] || null;
      const explorerState = readExplorerState();
      const visitedEntries =
        explorerState && explorerState.visitedEntries && typeof explorerState.visitedEntries === "object"
          ? explorerState.visitedEntries
          : {};
      const preset = (graphData.pagePresets && graphData.pagePresets["/memory-hub/"]) || {
        nextStops: [],
        sceneKeys: [],
      };
      const continueStory =
        safeArray(preset.nextStops)
          .map((url) => itemMap[normalizePath(url)])
          .find((item) => item && !visitedEntries[normalizePath(item.url)]) ||
        safeArray(preset.nextStops)
          .map((url) => itemMap[normalizePath(url)])
          .find(Boolean) ||
        searchIndex[0] ||
        null;
      const nextReward = REWARD_LEVELS.find(
        (item) => item.count > Number(explorerState.streakCount || 0)
      );
      if (runtime.unlockAchievement) runtime.unlockAchievement("open-hub");
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
              <div><strong>${yearReview.yearCount || 0}</strong><span>年份</span></div>
              <div><strong>${exploration.percent}%</strong><span>本地探索</span></div>
            </div>
          </header>

          <div class="memory-page-switcher" data-role="switcher"></div>

          <section class="memory-hub-quick-links">
            <a class="memory-hub-quick-link" href="/search-memory/?scene=${encodeURIComponent((nextUnvisited && nextUnvisited.scene) || "all")}">
              <span>深度检索</span>
              <strong>按年份、类型、场景和情绪找回忆</strong>
              <small>${searchData.itemCount || searchIndex.length} 条可搜索内容</small>
            </a>
            <a class="memory-hub-quick-link" href="/year-review/${latestYear ? `?year=${encodeURIComponent(latestYear.year)}` : ""}">
              <span>年度回看</span>
              <strong>${latestYear ? `${latestYear.year} 年回顾` : "按年份查看"}</strong>
              <small>${latestYear ? `${latestYear.totalCount} 条记录` : "按年份整理高光和旅行记录"}</small>
            </a>
            <a class="memory-hub-quick-link" href="${nextUnvisited && nextUnvisited.url ? nextUnvisited.url : "/memory-gacha/"}">
              <span>继续探索</span>
              <strong>${escapeHtml(nextUnvisited ? nextUnvisited.title : "从扭蛋机抽一段新的回忆")}</strong>
              <small>${exploration.visitedCount}/${exploration.totalCount || 0} 已看 · ${exploration.favoriteCount || 0} 条收藏</small>
            </a>
          </section>

          <section class="memory-hub-journey-board">
            ${
              continueStory
                ? `
                  <a class="memory-hub-continue-card" href="${escapeHtml(continueStory.url)}">
                    <span class="memory-hub-continue-kicker">继续探索</span>
                    <strong>${escapeHtml(continueStory.title || "打开下一页")}</strong>
                    <p>${escapeHtml(continueStory.summary || "这一页会把刚才的情绪继续接下去。")}</p>
                    <div class="memory-hub-continue-meta">
                      <span>${escapeHtml(formatDate(continueStory.isoDate || ""))}</span>
                      <span>${escapeHtml(continueStory.location || (runtime.getScene(continueStory.scene) || {}).label || "下一站")}</span>
                    </div>
                  </a>
                `
                : ""
            }
            <section class="memory-hub-quest-card">
              <span class="memory-hub-continue-kicker">探索任务</span>
              <strong>连续探索 ${escapeHtml(explorerState.streakCount || 0)} 天</strong>
              <p>${
                nextReward
                  ? `再坚持 ${nextReward.count - Number(explorerState.streakCount || 0)} 天，就会点亮「${escapeHtml(nextReward.badge)}」。`
                  : "所有连续探索奖励都已经点亮，接下来只管继续翻。"
              }</p>
              <div class="memory-hub-quest-stats">
                <span>${Object.keys(visitedEntries).length} 页已探索</span>
                <span>${safeArray(preset.sceneKeys).length} 条推荐主线</span>
              </div>
            </section>
          </section>

          <section class="memory-hub-grid">
            <div class="memory-hub-main">
              <section class="memory-panel">
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

              <section class="memory-panel">
                <div class="memory-panel-head">
                  <div>
                    <span class="memory-panel-kicker">关联内容</span>
                    <h3>按场景、年份和气氛关联</h3>
                    <p>同地点、同年份和同气氛的内容会放在一起，方便继续查看。</p>
                  </div>
                </div>
                <div class="memory-graph-grid">
                  ${safeArray(preset.sceneKeys)
                    .map((key) => graphScenes[key])
                    .filter(Boolean)
                    .map(
                      (scene) => `
                        <article class="memory-graph-scene" style="--memory-accent:${escapeHtml(scene.accent || "#e29aa9")};">
                          <div class="memory-graph-scene-head">
                            <strong>${escapeHtml(scene.label)}</strong>
                            <span>${escapeHtml(scene.count)} 页</span>
                          </div>
                          <div class="memory-graph-meta">
                            <span>${escapeHtml((scene.years || []).slice(0, 2).map((item) => item.label).join(" / ") || "长期更新")}</span>
                            <span>${escapeHtml((scene.moods || []).slice(0, 2).map((item) => item.label).join(" / ") || "持续延伸")}</span>
                          </div>
                          <div class="memory-graph-story-list">
                            ${safeArray(scene.highlights)
                              .map((url) => itemMap[normalizePath(url)])
                              .filter(Boolean)
                              .slice(0, 2)
                              .map((item) => renderGraphStory(item, "相关记录"))
                              .join("")}
                          </div>
                        </article>
                      `
                    )
                    .join("")}
                </div>
              </section>

              <section class="memory-panel">
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
              <section class="memory-panel memory-play-panel">
                <div class="memory-panel-head">
                  <div>
                    <span class="memory-panel-kicker">探索进度</span>
                    <h3>当前浏览器里的回访记录</h3>
                  </div>
                  <a href="/search-memory/">继续找</a>
                </div>
                <div class="memory-play-progress">
                  <div class="memory-play-progress-ring">
                    <strong>${exploration.percent}%</strong>
                    <span>已看</span>
                  </div>
                  <div class="memory-play-progress-copy">
                    <p>${exploration.visitedCount}/${exploration.totalCount || 0} 条公开回忆已点亮，${exploration.unlockedAchievementCount || 0}/${safeArray(exploration.achievements).length} 枚徽章已解锁。</p>
                    <div class="memory-play-progress-bar" aria-hidden="true">
                      <span style="width:${Math.max(0, Math.min(100, exploration.percent))}%"></span>
                    </div>
                  </div>
                </div>
                <div class="memory-achievement-grid">
                  ${safeArray(exploration.achievements)
                    .map(
                      (item) => `
                        <div class="memory-achievement ${item.unlocked ? "is-unlocked" : ""}">
                          <strong>${escapeHtml(item.label)}</strong>
                          <span>${escapeHtml(item.desc)}</span>
                        </div>
                      `
                    )
                    .join("")}
                </div>
              </section>

              <section class="memory-panel">
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

              <section class="memory-panel">
                <div class="memory-panel-head">
                  <div>
                    <span class="memory-panel-kicker">年度回顾</span>
                    <h3>按年份查看记录</h3>
                  </div>
                  <a href="/year-review/">查看全部</a>
                </div>
                <div class="memory-letter-preview-list">
                  ${safeArray(yearReview.years)
                    .slice(0, 3)
                    .map(
                      (year) => `
                        <article class="memory-letter-preview">
                          <span>${year.year} 年</span>
                          <strong>${year.totalCount} 条回忆</strong>
                          <p>主章节：${escapeHtml((year.primaryScene && year.primaryScene.label) || "日常")} · 旅行 ${year.travelCount} 条 · 节日 ${year.festivalCount} 条</p>
                        </article>
                      `
                    )
                    .join("")}
                </div>
              </section>

              <section class="memory-panel">
                <div class="memory-panel-head">
                  <div>
                    <span class="memory-panel-kicker">未来信件</span>
                    <h3>留给之后再拆开的页</h3>
                  </div>
                  <a href="/future-letters/">查看全部</a>
                </div>
                <div class="memory-letter-preview-list">
                  ${safeArray(letters.letters)
                    .slice(0, 3)
                    .map(
                      (letter) => `
                        <article class="memory-letter-preview ${letter.unlocked ? "is-open" : "is-locked"}">
                          <span>${letter.unlocked ? "已解锁" : `还有 ${letter.daysRemaining} 天`}</span>
                          <strong>${escapeHtml(letter.title)}</strong>
                          <p>${escapeHtml(letter.teaser || letter.summary || "")}</p>
                        </article>
                      `
                    )
                    .join("")}
                </div>
              </section>
            </aside>
          </section>

          <section class="memory-panel">
            <div class="memory-panel-head">
              <div>
                <span class="memory-panel-kicker">语音明信片</span>
                <h3>语音和配乐明信片</h3>
              </div>
            </div>
            <div class="memory-voice-grid">
              ${safeArray(meta.voicePostcards).map(renderVoiceCard).join("")}
            </div>
          </section>
        </section>
      `;

      container.querySelector('[data-role="switcher"]').appendChild(
        runtime.createPerspectiveSwitcher({ compact: true, label: "切换视角" })
      );
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
          .slice(0, 8);

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
