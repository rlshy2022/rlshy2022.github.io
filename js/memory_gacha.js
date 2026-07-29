(function () {
  "use strict";

  const ENDPOINT = "/memories/gacha-pool.json";
  const PAGE_SELECTOR = "#memory-gacha-page";
  const runtime = window.LOVE_MEMORY_RUNTIME;
  if (!runtime) return;

  let loadPromise = null;
  let lastDrawId = "";
  let perspectiveBound = false;

  const safeArray = runtime.safeArray || ((value) => (Array.isArray(value) ? value : []));
  const formatDate = runtime.formatDate || ((value) => String(value || ""));

  const TYPE_LABELS = {
    all: "全部扭蛋",
    travel: "旅行扭蛋",
    letter: "文字片段",
    gift: "礼物回忆",
    festival: "特别日子",
    daily: "日常回忆",
    milestone: "纪念节点",
    site: "站点记录",
  };

  const loadPool = () => {
    if (!loadPromise) {
      loadPromise = runtime.fetchJson(ENDPOINT, { itemCount: 0, items: [] });
    }
    return loadPromise;
  };

  const pickRandom = (items) => {
    const pool = safeArray(items);
    if (!pool.length) return null;
    if (pool.length === 1) {
      lastDrawId = pool[0].id || "";
      return pool[0];
    }

    const state = runtime.getPlayState ? runtime.getPlayState() : { gachaHistory: [] };
    const recentIds = new Set(
      safeArray(state.gachaHistory)
        .slice(0, Math.min(6, Math.max(1, pool.length - 1)))
        .map((item) => item.id)
    );
    const candidatePool = pool.filter((item) => !recentIds.has(item.id || ""));
    const effectivePool = candidatePool.length ? candidatePool : pool;

    let next = effectivePool[Math.floor(Math.random() * effectivePool.length)];
    let guard = 12;
    while (guard > 0 && next && next.id === lastDrawId) {
      next = effectivePool[Math.floor(Math.random() * effectivePool.length)];
      guard -= 1;
    }
    lastDrawId = next ? next.id || "" : "";
    return next || null;
  };

  const createButtons = (items, activeValue, attr, labelMap) =>
    items
      .map(
        (option) => `
          <button
            type="button"
            class="memory-gacha-filter${option.value === activeValue ? " is-active" : ""}"
            data-${attr}="${option.value}"
          >
            ${labelMap[option.value] || option.label || option.value}
          </button>
        `
      )
      .join("");

  const renderCard = (item) => {
    if (!item) {
      return `
        <div class="memory-gacha-empty">
          <h3>这一组筛选暂时没有可抽回忆</h3>
          <p>换一个场景或类型再试一次，也可以先回到全部扭蛋。</p>
        </div>
      `;
    }

    const scene = runtime.getScene(item.scene) || runtime.getScene("daily") || {};
    const isFavorite = runtime.isMemoryFavorite && runtime.isMemoryFavorite(item);
    const links = [
      item.url ? `<a href="${item.url}" class="memory-gacha-action">打开回忆</a>` : "",
      scene.timelineUrl ? `<a href="${scene.timelineUrl}" class="memory-gacha-action is-ghost">同章时间线</a>` : "",
      scene.galleryUrl ? `<a href="${scene.galleryUrl}" class="memory-gacha-action is-ghost">看相册</a>` : "",
      scene.photoWallUrl ? `<a href="${scene.photoWallUrl}" class="memory-gacha-action is-ghost">看照片墙</a>` : "",
      runtime.toggleMemoryFavorite
        ? `<button type="button" class="memory-gacha-action is-ghost" data-gacha-favorite="1">${isFavorite ? "已收藏" : "收藏这段"}</button>`
        : "",
    ]
      .filter(Boolean)
      .join("");

    return `
      <article class="memory-gacha-result-card" style="--gacha-accent:${scene.accent || "#e29aa9"};">
        ${item.cover ? `<div class="memory-gacha-cover"><img src="${item.cover}" alt="${item.title || "回忆扭蛋"}" loading="lazy"></div>` : ""}
        <div class="memory-gacha-content">
          <div class="memory-gacha-meta">
            <span class="memory-gacha-badge">${item.badge || TYPE_LABELS[item.type] || "回忆扭蛋"}</span>
            <time datetime="${item.isoDate || ""}">${formatDate(item.isoDate)}</time>
          </div>
          <h3 class="memory-gacha-result-title">${item.title || "这一页回忆被抽到了"}</h3>
          <p class="memory-gacha-result-summary">${item.summary || "这段记录已经保存。"}</p>
          <div class="memory-gacha-tags">
            <span>${scene.label || "日常"}</span>
            ${item.type && TYPE_LABELS[item.type] ? `<span>${TYPE_LABELS[item.type]}</span>` : ""}
          </div>
          <div class="memory-gacha-actions">${links}</div>
        </div>
      </article>
    `;
  };

  const render = (container, meta, perspective, data) => {
    const items = safeArray(data && data.items);
    const sceneOptions = [
      { value: "all", label: "全部场景" },
      ...Array.from(new Set(items.map((item) => runtime.inferScene(item)))).map((key) => {
        const scene = runtime.getScene(key) || {};
        return { value: key, label: scene.label || key };
      }),
    ];
    const typeOptions = [
      { value: "all", label: "全部" },
      ...Array.from(new Set(items.map((item) => item.type).filter(Boolean))).map((type) => ({
        value: type,
        label: TYPE_LABELS[type] || type,
      })),
    ];

    let state = {
      type: "all",
      scene: "all",
      filtered: items,
      current: null,
    };

    container.innerHTML = `
      <section class="memory-gacha-shell">
        <header class="memory-gacha-hero">
          <div>
            <span class="memory-gacha-kicker">Memory Gacha</span>
            <h2 class="memory-gacha-title">${(perspective && perspective.hubTitle) || "让今天先从一段随机掉落的回忆开始"}</h2>
            <p class="memory-gacha-desc">可以抽旅行、礼物、特别日子，也可以只看某一个场景。抽到后会直接给出文章、时间线或照片入口。</p>
          </div>
          <div class="memory-gacha-summary-card">
            <span>可抽回忆</span>
            <strong>${items.length}</strong>
            <small>${meta.scenes.length} 个场景已经接入扭蛋机。</small>
          </div>
        </header>

        <div class="memory-page-switcher" data-role="switcher"></div>

        <section class="memory-gacha-toolbar">
          <div class="memory-gacha-filter-wrap">
            <div class="memory-gacha-filters">
              ${createButtons(sceneOptions, state.scene, "gacha-scene", Object.fromEntries(sceneOptions.map((item) => [item.value, item.label])))}
            </div>
            <div class="memory-gacha-filters">
              ${createButtons(typeOptions, state.type, "gacha-type", TYPE_LABELS)}
            </div>
          </div>
          <div class="memory-gacha-buttons">
            <button type="button" class="memory-gacha-trigger" data-draw="1">抽一段回忆</button>
            <button type="button" class="memory-gacha-trigger is-ghost" data-redraw="1">再抽一次</button>
          </div>
        </section>

        <section class="memory-gacha-result" data-role="result">
          <div class="memory-gacha-placeholder">
            <h3>点一下，看看今天先掉出哪一页</h3>
            <p>可能会抽到第一次见面、某次旅行，或者一篇情书。</p>
          </div>
        </section>

        <section class="memory-gacha-history" data-role="history"></section>
      </section>
    `;

    container.querySelector('[data-role="switcher"]').appendChild(
      runtime.createPerspectiveSwitcher({ compact: true, label: "切换视角" })
    );

    const result = container.querySelector('[data-role="result"]');
    const history = container.querySelector('[data-role="history"]');
    const trigger = container.querySelector('[data-draw="1"]');
    const redraw = container.querySelector('[data-redraw="1"]');

    const filterItems = () => {
      state.filtered = items.filter((item) => {
        const sceneKey = runtime.inferScene(item);
        const sceneMatched = state.scene === "all" || sceneKey === state.scene;
        const typeMatched = state.type === "all" || item.type === state.type;
        return sceneMatched && typeMatched;
      });
    };

    const refreshFilters = () => {
      container.querySelectorAll("[data-gacha-scene]").forEach((button) => {
        button.classList.toggle("is-active", button.getAttribute("data-gacha-scene") === state.scene);
      });
      container.querySelectorAll("[data-gacha-type]").forEach((button) => {
        button.classList.toggle("is-active", button.getAttribute("data-gacha-type") === state.type);
      });
    };

    const renderHistory = () => {
      if (!history || !runtime.getPlayState) return;
      const playState = runtime.getPlayState();
      const recent = safeArray(playState.gachaHistory).slice(0, 4);

      history.innerHTML = recent.length
        ? `
            <div class="memory-gacha-history-head">
              <span>最近抽到</span>
              <strong>本地抽取记录</strong>
            </div>
            <div class="memory-gacha-history-list">
              ${recent
                .map(
                  (item) => `
                    <a class="memory-gacha-history-item" href="${item.url || "/memory-hub/"}">
                      <span>${item.badge || item.type || "回忆"}</span>
                      <strong>${item.title || "未命名回忆"}</strong>
                    </a>
                  `
                )
                .join("")}
            </div>
          `
        : "";
    };

    const bindFavorite = () => {
      const button = result.querySelector("[data-gacha-favorite]");
      if (!button || !state.current || !runtime.toggleMemoryFavorite) return;

      button.addEventListener("click", () => {
        runtime.toggleMemoryFavorite(state.current);
        result.innerHTML = renderCard(state.current);
        bindFavorite();
      });
    };

    const draw = () => {
      filterItems();
      result.classList.add("is-drawing");
      trigger.textContent = "正在摇一摇...";

      window.setTimeout(() => {
        state.current = pickRandom(state.filtered);
        if (state.current && runtime.recordGachaDraw) runtime.recordGachaDraw(state.current);
        result.classList.remove("is-drawing");
        trigger.textContent = "抽一段回忆";
        result.innerHTML = renderCard(state.current);
        bindFavorite();
        renderHistory();
      }, 420);
    };

    container.querySelectorAll("[data-gacha-scene]").forEach((button) => {
      button.addEventListener("click", () => {
        state.scene = button.getAttribute("data-gacha-scene") || "all";
        refreshFilters();
        if (state.current) draw();
      });
    });

    container.querySelectorAll("[data-gacha-type]").forEach((button) => {
      button.addEventListener("click", () => {
        state.type = button.getAttribute("data-gacha-type") || "all";
        refreshFilters();
        if (state.current) draw();
      });
    });

    trigger.addEventListener("click", draw);
    redraw.addEventListener("click", draw);
    renderHistory();
  };

  const init = () => {
    const container = document.querySelector(PAGE_SELECTOR);
    if (!container) return;

    Promise.all([runtime.getMeta(), runtime.getPerspective(), loadPool()]).then(
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
})();
