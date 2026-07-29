(function () {
  "use strict";

  const PAGE_SELECTOR = "#travel-passport-page";
  const runtime = window.LOVE_MEMORY_RUNTIME;
  if (!runtime) return;

  let passportPromise = null;
  let searchPromise = null;
  let graphPromise = null;
  let perspectiveBound = false;

  const safeArray = runtime.safeArray || ((value) => (Array.isArray(value) ? value : []));
  const formatDate = runtime.formatDate || ((value) => String(value || ""));
  const renderCoverMarkup = runtime.renderCoverMarkup;
  const normalizePath = runtime.normalizePath || ((value) => String(value || "/"));

  const loadPassport = () => {
    if (!passportPromise) {
      passportPromise = runtime.fetchJson("/memories/travel-passport.json", {
        routeCount: 0,
        routes: [],
      });
    }
    return passportPromise;
  };

  const loadSearchIndex = () => {
    if (!searchPromise) {
      searchPromise = runtime.fetchJson("/memories/search-index.json", {
        itemCount: 0,
        items: [],
      });
    }
    return searchPromise;
  };

  const loadGraph = () => {
    if (!graphPromise) {
      graphPromise = runtime.getGraph
        ? runtime.getGraph()
        : Promise.resolve({ scenes: [], pagePresets: {}, recommendations: {} });
    }
    return graphPromise;
  };

  const escapeHtml = (value) =>
    String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const buildItemMap = (items) =>
    safeArray(items).reduce((acc, item) => {
      acc[normalizePath(item && item.url)] = item;
      return acc;
    }, {});

  const renderRouteStory = (item, label) => `
    <a class="passport-highlight-item" href="${escapeHtml(item.url || "/travel-passport/")}">
      <strong>${escapeHtml(item.title || "未命名片段")}</strong>
      <span>${escapeHtml(formatDate(item.isoDate || ""))} · ${escapeHtml(label || item.badge || "")}</span>
      <p>${escapeHtml(item.summary || "")}</p>
    </a>
  `;

  const init = () => {
    const container = document.querySelector(PAGE_SELECTOR);
    if (!container) return;

    Promise.all([runtime.getMeta(), runtime.getPerspective(), loadPassport(), loadSearchIndex(), loadGraph()]).then(
      ([meta, perspective, passport, searchData, graphData]) => {
        if (!document.body.contains(container)) return;

        const routes = safeArray(passport.routes);
        const searchIndex = safeArray(searchData.items);
        const itemMap = buildItemMap(searchIndex);
        const graphScenes = safeArray(graphData.scenes).reduce((acc, item) => {
          acc[item.key] = item;
          return acc;
        }, {});
        const preset = (graphData.pagePresets && graphData.pagePresets["/travel-passport/"]) || {
          nextStops: [],
          sceneKeys: [],
        };
        const featuredStops = safeArray(preset.nextStops)
          .map((url) => itemMap[normalizePath(url)])
          .filter(Boolean)
          .slice(0, 3);

        container.innerHTML = `
          <section class="memory-page-shell travel-passport-shell">
            <header class="memory-page-hero">
              <div>
                <span class="memory-page-kicker">Travel Passport</span>
                <h2>把一起走过的城市盖成印章</h2>
                <p>${(perspective && perspective.passportNote) || "这本护照不是为了证明去过哪里，而是为了记住和你一起去过的样子。"}</p>
              </div>
              <div class="memory-page-stats">
                <div><strong>${passport.routeCount || 0}</strong><span>旅行章节</span></div>
                <div><strong>${routes.reduce((sum, item) => sum + Number(item.memoryCount || 0), 0)}</strong><span>收录片段</span></div>
                <div><strong>${safeArray(meta.scenes).filter((scene) => scene.passport).length}</strong><span>可盖印章</span></div>
              </div>
            </header>

            <div class="memory-page-switcher" data-role="switcher"></div>

            <section class="memory-hub-journey-board passport-journey-board">
              <section class="memory-hub-quest-card">
                <span class="memory-hub-continue-kicker">路线总览</span>
                <strong>先从最会串起故事的几站继续</strong>
                <p>这本护照已经不只是地点索引，而是一张能继续把文章、相册和时间轴串在一起的旅行图。</p>
                <div class="memory-hub-quest-stats">
                  <span>${escapeHtml(routes.map((route) => route.label).join(" · "))}</span>
                </div>
              </section>
              <div class="passport-story-loop">
                ${featuredStops.map((item) => renderRouteStory(item, "下一站")).join("")}
              </div>
            </section>

            <section class="travel-passport-route">
              ${routes
                .map((route) => {
                  const graphScene = graphScenes[route.key] || {};
                  const sceneStories = safeArray(graphScene.highlights)
                    .map((url) => itemMap[normalizePath(url)])
                    .filter(Boolean)
                    .slice(0, 3);

                  return `
                    <article class="passport-card${route.cover ? "" : " is-no-cover"}" style="--memory-accent:${route.accent || "#e29aa9"};">
                      ${renderCoverMarkup({
                        wrapperClass: "passport-card-cover",
                        src: route.cover,
                        alt: route.title,
                        placeholder: "旅行印章",
                        overlayHtml: `<span class="passport-card-stamp">${escapeHtml(route.stamp || route.label)}</span>`,
                      })}
                      <div class="passport-card-body">
                        <div class="passport-card-meta">
                          <span>${escapeHtml(route.badge || route.label)}</span>
                          <span>Route ${route.order}</span>
                        </div>
                        <h3>${escapeHtml(route.title || route.label)}</h3>
                        <p>${escapeHtml(route.note || "")}</p>
                        <div class="passport-card-dates">
                          <span>首次盖章 ${formatDate(route.firstDate)}</span>
                          <span>最近更新 ${formatDate(route.latestDate)}</span>
                        </div>
                        <div class="memory-graph-meta passport-card-taxonomy">
                          <span>${escapeHtml((graphScene.seasons || []).slice(0, 2).map((item) => item.label).join(" / ") || "四季可回看")}</span>
                          <span>${escapeHtml((graphScene.moods || []).slice(0, 2).map((item) => item.label).join(" / ") || "继续延伸")}</span>
                        </div>
                        <div class="passport-card-actions">
                          ${route.timelineUrl ? `<a href="${route.timelineUrl}">时间轴</a>` : ""}
                          ${route.galleryUrl ? `<a href="${route.galleryUrl}">相册</a>` : ""}
                          ${route.photoWallUrl ? `<a href="${route.photoWallUrl}">照片墙</a>` : ""}
                        </div>
                        <div class="passport-highlight-list">
                          ${safeArray(route.highlights)
                            .map(
                              (item) => `
                                <a class="passport-highlight-item" href="${item.url || route.timelineUrl || "/travel-passport/"}">
                                  <strong>${escapeHtml(item.title || "未命名片段")}</strong>
                                  <span>${formatDate(item.isoDate)} · ${escapeHtml(item.badge || "")}</span>
                                  <p>${escapeHtml(item.summary || "")}</p>
                                </a>
                              `
                            )
                            .join("")}
                        </div>
                        ${
                          sceneStories.length
                            ? `
                              <div class="passport-story-loop is-inline">
                                ${sceneStories.map((item) => renderRouteStory(item, "图谱串联")).join("")}
                              </div>
                            `
                            : ""
                        }
                      </div>
                    </article>
                  `;
                })
                .join("")}
            </section>
          </section>
        `;

        container.querySelector('[data-role="switcher"]').appendChild(
          runtime.createPerspectiveSwitcher({ compact: true, label: "切换视角" })
        );
        runtime.hydrateCoverImages && runtime.hydrateCoverImages(container);
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
