(function () {
  "use strict";

  const PAGE_SELECTOR = "#year-review-page";
  const runtime = window.LOVE_MEMORY_RUNTIME;
  if (!runtime) return;

  let reviewPromise = null;
  let searchPromise = null;
  let graphPromise = null;
  let perspectiveBound = false;

  const safeArray = runtime.safeArray || ((value) => (Array.isArray(value) ? value : []));
  const formatDate = runtime.formatDate || ((value) => String(value || ""));
  const renderCoverMarkup = runtime.renderCoverMarkup;
  const normalizePath = runtime.normalizePath || ((value) => String(value || "/"));

  const loadYearReview = () => {
    if (!reviewPromise) {
      reviewPromise = runtime.fetchJson("/memories/year-review.json", {
        yearCount: 0,
        totalCount: 0,
        currentYear: "",
        years: [],
      });
    }
    return reviewPromise;
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
        : Promise.resolve({ pagePresets: {}, recommendations: {} });
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

  const renderHighlight = (item) => {
    const scene = runtime.getScene(item.scene) || runtime.getScene("daily") || {};
    return `
      <article class="year-review-highlight" style="--memory-accent:${scene.accent || "#e29aa9"};">
        ${renderCoverMarkup({
          wrapperClass: "year-review-highlight-cover",
          src: item.cover,
          alt: item.title,
          placeholder: "年度高光",
        })}
        <div class="year-review-highlight-body">
          <span class="year-review-highlight-badge">${escapeHtml(scene.label || item.badge || "回忆")}</span>
          <h4>${escapeHtml(item.title || "未命名回忆")}</h4>
          <p>${escapeHtml(item.summary || "")}</p>
          <div class="year-review-highlight-meta">
            <span>${formatDate(item.isoDate)}</span>
            ${item.url ? `<a href="${item.url}">打开</a>` : ""}
          </div>
        </div>
      </article>
    `;
  };

  const renderYearStory = (item, label) => `
    <a class="memory-graph-story" href="${escapeHtml(item.url || "/year-review/")}">
      <span class="memory-graph-story-badge">${escapeHtml(label || "继续回看")}</span>
      <strong>${escapeHtml(item.title || "打开这一页")}</strong>
      <p>${escapeHtml(item.summary || "从这里继续把这一年的上下文接起来。")}</p>
      <small>${escapeHtml(formatDate(item.isoDate || ""))}</small>
    </a>
  `;

  const init = () => {
    const container = document.querySelector(PAGE_SELECTOR);
    if (!container) return;

    Promise.all([runtime.getMeta(), runtime.getPerspective(), loadYearReview(), loadSearchIndex(), loadGraph()]).then(
      ([meta, perspective, data, searchData, graphData]) => {
        if (!document.body.contains(container)) return;

        const years = safeArray(data.years);
        const itemMap = buildItemMap(searchData.items);
        const preset = (graphData.pagePresets && graphData.pagePresets["/year-review/"]) || {
          nextStops: [],
        };
        const featuredStories = safeArray(preset.nextStops)
          .map((url) => itemMap[normalizePath(url)])
          .filter(Boolean)
          .slice(0, 3);

        let state = {
          activeYear: years[0] ? String(years[0].year) : "all",
          openYears: years.slice(0, 2).reduce((acc, year) => {
            acc[String(year.year)] = true;
            return acc;
          }, {}),
        };

        const render = () => {
          const visibleYears = years.filter(
            (year) => state.activeYear === "all" || String(year.year) === state.activeYear
          );

          container.innerHTML = `
            <section class="memory-page-shell year-review-shell">
              <header class="memory-page-hero">
                <div>
                  <span class="memory-page-kicker">Year Review</span>
                  <h2>把每一年重新翻成一页完整的纪念册</h2>
                  <p>这里按年份回看章节结构，不只看去了哪里，也看这一年更多写下了什么、反复翻开了什么、哪一章最亮。</p>
                </div>
                <div class="memory-page-stats">
                  <div><strong>${data.yearCount || 0}</strong><span>年份章节</span></div>
                  <div><strong>${data.totalCount || 0}</strong><span>收录总条数</span></div>
                  <div><strong>${safeArray(meta.scenes).length}</strong><span>场景维度</span></div>
                </div>
              </header>

              <div class="memory-page-switcher" data-role="switcher"></div>

              <section class="memory-hub-journey-board year-review-journey-board">
                <section class="memory-hub-quest-card">
                  <span class="memory-hub-continue-kicker">跨年串联</span>
                  <strong>把同一年里的故事先连成一条线</strong>
                  <p>这里会把同年份、同场景和同一段旅程的内容重新装订起来，不让阅读停在单篇文章里。</p>
                </section>
                <div class="passport-story-loop">
                  ${featuredStories.map((item) => renderYearStory(item, "推荐回看")).join("")}
                </div>
              </section>

              <section class="year-review-filter-rail">
                <button type="button" class="memory-chip${state.activeYear === "all" ? " is-active" : ""}" data-year-filter="all">全部年份</button>
                ${years
                  .map(
                    (year) => `
                      <button type="button" class="memory-chip${state.activeYear === String(year.year) ? " is-active" : ""}" data-year-filter="${year.year}">
                        ${year.year}
                      </button>
                    `
                  )
                  .join("")}
              </section>

              <section class="year-review-stack">
                ${visibleYears
                  .map((year) => {
                    const expanded = Boolean(state.openYears[String(year.year)]);
                    const relatedStories = safeArray(year.highlights)
                      .map((item) => itemMap[normalizePath(item.url)])
                      .filter(Boolean)
                      .slice(0, 2);
                    return `
                      <article class="year-review-card${expanded ? " is-open" : ""}">
                        <header class="year-review-card-head">
                          <div>
                            <span class="year-review-card-kicker">${year.year} 年</span>
                            <h3>${year.title}</h3>
                            <p>共 ${year.totalCount} 条回忆，其中 ${year.articleCount} 条写成了文章，${year.manualCount} 条保留为时间轴节点。</p>
                          </div>
                          <div class="year-review-card-stats">
                            <div><strong>${year.travelCount}</strong><span>旅行</span></div>
                            <div><strong>${year.festivalCount}</strong><span>节日</span></div>
                            <div><strong>${year.letterCount}</strong><span>文字片段</span></div>
                          </div>
                        </header>

                        <div class="year-review-card-toggle">
                          <button type="button" class="memory-chip is-soft" data-year-toggle="${year.year}">
                            ${expanded ? "收起这一年" : "展开这一年"}
                          </button>
                        </div>

                        <div class="year-review-card-body"${expanded ? "" : ' hidden'}>
                          <div class="year-review-scene-bar">
                            ${safeArray(year.scenes)
                              .map(
                                (scene) => `
                                  <span class="year-review-scene-pill" style="--memory-accent:${scene.accent || "#e29aa9"};">
                                    ${escapeHtml(scene.label)} · ${scene.count}
                                  </span>
                                `
                              )
                              .join("")}
                          </div>

                          <div class="year-review-month-grid">
                            ${safeArray(year.months)
                              .map(
                                (month) => `
                                  <div class="year-review-month${month.count ? " has-content" : ""}">
                                    <strong>${String(month.month).padStart(2, "0")}</strong>
                                    <span>${month.count}</span>
                                  </div>
                                `
                              )
                              .join("")}
                          </div>

                          <div class="year-review-highlights">
                            ${safeArray(year.highlights).map(renderHighlight).join("")}
                          </div>

                          ${
                            relatedStories.length
                              ? `
                                <div class="memory-graph-story-list year-review-story-list">
                                  ${relatedStories.map((item) => renderYearStory(item, "继续这一年")).join("")}
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

          container.querySelectorAll("[data-year-filter]").forEach((button) => {
            button.addEventListener("click", () => {
              state = {
                ...state,
                activeYear: button.getAttribute("data-year-filter") || "all",
              };
              render();
            });
          });

          container.querySelectorAll("[data-year-toggle]").forEach((button) => {
            button.addEventListener("click", () => {
              const year = button.getAttribute("data-year-toggle") || "";
              state = {
                ...state,
                openYears: {
                  ...state.openYears,
                  [year]: !state.openYears[year],
                },
              };
              render();
            });
          });
        };

        render();
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
