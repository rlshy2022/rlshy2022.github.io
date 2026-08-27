(function () {
  "use strict";

  const ENDPOINT = "/memories/love-timeline.json";
  const PAGE_SELECTOR = "#love-timeline-page";
  const runtime = window.LOVE_MEMORY_RUNTIME;
  if (!runtime) return;

  let loadPromise = null;
  let perspectiveBound = false;

  const safeArray = runtime.safeArray || ((value) => (Array.isArray(value) ? value : []));
  const formatDate = runtime.formatDate || ((value) => String(value || ""));

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

  const loadTimelineData = () => {
    if (!loadPromise) {
      loadPromise = runtime.fetchJson(ENDPOINT, {
        eventCount: 0,
        manualCount: 0,
        postCount: 0,
        events: [],
      });
    }
    return loadPromise;
  };

  const getParams = () => {
    try {
      return new URL(window.location.href).searchParams;
    } catch (error) {
      return new URLSearchParams(window.location.search || "");
    }
  };

  const buildGroups = (events) => {
    const groups = [];
    let currentYear = "";

    safeArray(events).forEach((item) => {
      const year = String(item.year || "");
      if (!groups.length || year !== currentYear) {
        currentYear = year;
        groups.push({ year, items: [] });
      }
      groups[groups.length - 1].items.push(item);
    });

    return groups;
  };

  const createFilterButtons = (items, activeValue, className, type) =>
    items
      .map(
        (item) => `
          <button
            type="button"
            class="${className}${item.value === activeValue ? " is-active" : ""}"
            data-filter-type="${type}"
            data-filter-value="${item.value}"
          >
            ${item.label}
          </button>
        `
      )
      .join("");

  const createActions = (item, scene) => {
    const actions = [];

    if (item.url) {
      actions.push(`<a href="${item.url}" class="love-timeline-action">打开回忆</a>`);
    }
    if (scene.timelineUrl && item.url !== scene.timelineUrl) {
      actions.push(`<a href="${scene.timelineUrl}" class="love-timeline-action is-ghost">同章时间轴</a>`);
    }
    if (scene.galleryUrl) {
      actions.push(`<a href="${scene.galleryUrl}" class="love-timeline-action is-ghost">翻相册</a>`);
    }
    if (scene.photoWallUrl) {
      actions.push(`<a href="${scene.photoWallUrl}" class="love-timeline-action is-ghost">看照片墙</a>`);
    }

    return actions.join("");
  };

  const renderEventCard = (item, explorationMap) => {
    const scene = runtime.getScene(item.scene) || runtime.getScene("daily") || {};
    const tag = safeArray(item.tags)[0] || safeArray(item.categories)[0] || scene.label || "回忆";
    const memoryId = runtime.getMemoryId ? runtime.getMemoryId(item) : item.id || item.url || "";
    const visited = Boolean(explorationMap && explorationMap[memoryId]);

    return `
      <article class="love-timeline-card${visited ? " is-visited" : ""}" style="--timeline-accent:${scene.accent || "#e29aa9"};">
        <span class="love-timeline-dot"></span>
        <div class="love-timeline-date">
          <time datetime="${item.isoDate || ""}">${formatDate(item.isoDate)}</time>
          <span>${item.badge || "故事节点"}</span>
        </div>
        <div class="love-timeline-card-main">
          ${item.cover ? `<div class="love-timeline-cover"><img src="${item.cover}" alt="${item.title || "恋爱时间轴封面"}" loading="lazy"></div>` : ""}
          <div class="love-timeline-content">
            <div class="love-timeline-tags">
              <span class="love-timeline-badge">${scene.label || "日常"}</span>
              <span class="love-timeline-tag">${tag}</span>
              ${visited ? '<span class="love-timeline-tag is-visited">已看过</span>' : ""}
            </div>
            <h3 class="love-timeline-card-title">${item.title || "未命名回忆"}</h3>
            <p class="love-timeline-card-summary">${item.summary || "这一页被认真放进了我们的时间线里。"}</p>
            <div class="love-timeline-actions">
              ${createActions(item, scene)}
            </div>
          </div>
        </div>
      </article>
    `;
  };

  const render = (container, meta, perspective, data) => {
    const params = getParams();
    const allEvents = safeArray(data && data.events);
    const sceneKeys = Array.from(new Set(allEvents.map((item) => runtime.inferScene(item))));
    const scenes = safeArray(meta.scenes).filter((scene) => sceneKeys.includes(scene.key));
    const initialScene = params.get("scene") || "all";
    const initialType = params.get("type") || "all";
    const initialYear = params.get("year") || "all";

    const sceneOptions = [
      { value: "all", label: "全部场景" },
      ...scenes.map((scene) => ({ value: scene.key, label: scene.label })),
    ];

    const typeOptions = [
      { value: "all", label: "全部类型" },
      ...Array.from(new Set(allEvents.map((item) => item.type).filter(Boolean))).map((type) => ({
        value: type,
        label: TYPE_LABELS[type] || type,
      })),
    ];

    const yearOptions = [
      { value: "all", label: "全部年份" },
      ...buildGroups(allEvents).map((group) => ({ value: group.year, label: `${group.year}` })),
    ];

    let state = {
      scene: sceneOptions.some((item) => item.value === initialScene) ? initialScene : "all",
      type: typeOptions.some((item) => item.value === initialType) ? initialType : "all",
      year: yearOptions.some((item) => item.value === initialYear) ? initialYear : "all",
      openYears: buildGroups(allEvents).reduce((acc, group) => {
        acc[group.year] = true;
        return acc;
      }, {}),
    };

    const matchesState = (item, nextState = state) => {
      const sceneKey = runtime.inferScene(item);
      const sceneMatched = nextState.scene === "all" || sceneKey === nextState.scene;
      const typeMatched = nextState.type === "all" || item.type === nextState.type;
      const yearMatched = nextState.year === "all" || String(item.year) === nextState.year;
      return sceneMatched && typeMatched && yearMatched;
    };

    const expandMatchedYears = (nextState) => {
      if (nextState.scene === "all" && nextState.type === "all" && nextState.year === "all") {
        return nextState;
      }

      const openYears = { ...nextState.openYears };
      allEvents.filter((item) => matchesState(item, nextState)).forEach((item) => {
        if (item.year) openYears[String(item.year)] = true;
      });
      return { ...nextState, openYears };
    };

    state = expandMatchedYears(state);

    container.innerHTML = `
      <section class="love-timeline-shell">
        <header class="love-timeline-hero">
          <div>
            <span class="love-timeline-kicker">Timeline Archive</span>
            <h2 class="love-timeline-title">按时间筛选相遇、见面、旅行和文章</h2>
            <p class="love-timeline-desc">先筛年份、场景或类型，再顺着时间线展开具体回忆。</p>
          </div>
          <div class="love-timeline-stats">
            <div class="love-timeline-stat"><span class="value">${allEvents.length}</span><span class="label">时间节点</span></div>
            <div class="love-timeline-stat"><span class="value">${data.manualCount || 0}</span><span class="label">手工纪念</span></div>
            <div class="love-timeline-stat"><span class="value">${data.postCount || 0}</span><span class="label">文章片段</span></div>
          </div>
        </header>

        <div class="memory-page-switcher" data-role="switcher"></div>

        <section class="love-timeline-toolbar">
          <div class="love-timeline-filter-group">
            ${createFilterButtons(sceneOptions, state.scene, "love-timeline-filter", "scene")}
          </div>
          <div class="love-timeline-filter-group">
            ${createFilterButtons(typeOptions, state.type, "love-timeline-filter is-soft", "type")}
          </div>
          <div class="love-timeline-filter-group">
            ${createFilterButtons(yearOptions, state.year, "love-timeline-filter is-soft", "year")}
          </div>
        </section>

        <section class="timeline-scene-rail">
          ${scenes
            .map(
              (scene) => `
                <a class="timeline-scene-pill" href="${scene.timelineUrl || `/love-timeline/?scene=${encodeURIComponent(scene.key)}`}" style="--timeline-accent:${scene.accent};">
                  <span>${scene.label}</span>
                  <small>${scene.badge || "章节"}</small>
                </a>
              `
            )
            .join("")}
        </section>

        <section class="love-timeline-list" data-role="timeline-list"></section>
      </section>
    `;

    container.querySelector('[data-role="switcher"]').appendChild(
      runtime.createPerspectiveSwitcher({ compact: true, label: "切换视角" })
    );

    const list = container.querySelector('[data-role="timeline-list"]');

    const renderList = () => {
      const exploration = runtime.getExplorationSummary
        ? runtime.getExplorationSummary(allEvents)
        : { recent: [] };
      const visitedMap = (exploration.recent || []).reduce((acc, item) => {
        const id = runtime.getMemoryId ? runtime.getMemoryId(item) : item.id || item.url || "";
        if (id) acc[id] = true;
        return acc;
      }, {});

      const filtered = allEvents.filter((item) => matchesState(item));

      container.querySelectorAll(".love-timeline-filter").forEach((button) => {
        const type = button.getAttribute("data-filter-type");
        const value = button.getAttribute("data-filter-value");
        button.classList.toggle("is-active", state[type] === value);
      });

      if (!filtered.length) {
        list.innerHTML = `
          <div class="love-timeline-empty">
            <h3>这一组筛选暂时还没有回忆</h3>
            <p>可以换一个场景，或者先回到全部节点继续往下翻。</p>
          </div>
        `;
        return;
      }

      list.innerHTML = buildGroups(filtered)
        .map((group) => {
          const expanded = Boolean(state.openYears[group.year]);
          return `
            <section class="love-timeline-year${expanded ? " is-open" : ""}">
              <button type="button" class="love-timeline-year-label" data-year-toggle="${group.year}">
                <span>${group.year}</span>
                <small>${group.items.length} 条</small>
              </button>
              <div class="love-timeline-year-list"${expanded ? "" : ' hidden'}>
                ${group.items.map((item) => renderEventCard(item, visitedMap)).join("")}
              </div>
            </section>
          `;
        })
        .join("");

      list.querySelectorAll("[data-year-toggle]").forEach((button) => {
        button.addEventListener("click", () => {
          const year = button.getAttribute("data-year-toggle") || "";
          state = {
            ...state,
            openYears: {
              ...state.openYears,
              [year]: !state.openYears[year],
            },
          };
          renderList();
        });
      });
    };

    container.querySelectorAll(".love-timeline-filter").forEach((button) => {
      button.addEventListener("click", () => {
        const type = button.getAttribute("data-filter-type");
        const value = button.getAttribute("data-filter-value");
        state = expandMatchedYears({
          ...state,
          [type]: value || "all",
        });
        renderList();
      });
    });

    renderList();
  };

  const init = () => {
    const container = document.querySelector(PAGE_SELECTOR);
    if (!container) return;

    Promise.all([runtime.getMeta(), runtime.getPerspective(), loadTimelineData()]).then(
      ([meta, perspective, data]) => {
        if (!document.body.contains(container)) return;
        render(container, meta, perspective, data || {});
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
  window.addEventListener("hexo-blog-decrypt", () => {
    window.setTimeout(init, 80);
  });
})();
