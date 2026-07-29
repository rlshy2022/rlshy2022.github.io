(function () {
  "use strict";

  const runtime = window.LOVE_MEMORY_RUNTIME;
  if (!runtime) return;

  const SEARCH_ENDPOINT = "/memories/search-index.json";
  const safeArray = runtime.safeArray || ((value) => (Array.isArray(value) ? value : []));
  const normalizeText = runtime.normalizeText || ((value) => String(value || "").toLowerCase().trim());
  const normalizePath = runtime.normalizePath || ((value) => String(value || "/"));
  const formatDate = runtime.formatDate || ((value) => String(value || ""));

  let searchPromise = null;
  let graphPromise = null;
  let metaPromise = null;
  let retryTimer = 0;

  const loadSearch = () => {
    if (!searchPromise) {
      searchPromise = runtime.fetchJson(SEARCH_ENDPOINT, { items: [] });
    }
    return searchPromise;
  };

  const loadGraph = () => {
    if (!graphPromise) {
      graphPromise = runtime.getGraph
        ? runtime.getGraph()
        : Promise.resolve({ scenes: [], pagePresets: {} });
    }
    return graphPromise;
  };

  const loadMeta = () => {
    if (!metaPromise) {
      metaPromise = runtime.getMeta();
    }
    return metaPromise;
  };

  const escapeHtml = (value) =>
    String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const getParams = () => {
    try {
      return new URL(window.location.href).searchParams;
    } catch (error) {
      return new URLSearchParams(window.location.search || "");
    }
  };

  const getCurrentPath = () => normalizePath(window.location.pathname || "/");

  const buildItemMap = (items) =>
    safeArray(items).reduce((acc, item) => {
      acc[normalizePath(item && item.url)] = item;
      return acc;
    }, {});

  const resolveSceneKey = (meta, rawValue) => {
    const target = normalizeText(rawValue);
    if (!target) return "";

    const matched = safeArray(meta && meta.scenes).find((scene) => {
      const values = [scene.key, scene.label, scene.chapter, ...(scene.keywords || [])];
      return values.some((item) => normalizeText(item) === target);
    });

    return matched ? matched.key : "";
  };

  const renderStory = (item, label) => `
    <a class="memory-graph-story" href="${escapeHtml(item.url || "/")}">
      <span class="memory-graph-story-badge">${escapeHtml(label || "继续下一站")}</span>
      <strong>${escapeHtml(item.title || "打开下一页")}</strong>
      <p>${escapeHtml(item.summary || "从这里继续把这一章往前接。")}</p>
      <small>${escapeHtml(formatDate(item.isoDate || ""))}</small>
    </a>
  `;

  const buildBridgeMarkup = (scene, stories, mode) => {
    if (!scene || !stories.length) return "";

    const title = mode === "gallery" ? "继续逛这一章" : "把这一面墙继续接回故事里";
    const desc =
      mode === "gallery"
        ? "相册不是终点，顺着同一章的文章、时间轴和照片墙继续往下翻，故事会更完整。"
        : "照片墙适合自由翻阅，但真正的闭环还是要回到文章、时间轴和路线里。";

    return `
      <section class="memory-panel memory-story-bridge" data-memory-story-bridge="${mode}">
        <div class="memory-panel-head">
          <div>
            <span class="memory-panel-kicker">${escapeHtml(scene.label)} · Story Bridge</span>
            <h3>${title}</h3>
            <p>${desc}</p>
          </div>
        </div>
        <div class="passport-card-actions future-letter-actions">
          ${scene.timelineUrl ? `<a href="${scene.timelineUrl}">时间轴</a>` : ""}
          ${scene.galleryUrl ? `<a href="${scene.galleryUrl}">相册</a>` : ""}
          ${scene.photoWallUrl ? `<a href="${scene.photoWallUrl}">照片墙</a>` : ""}
        </div>
        <div class="memory-graph-story-list">
          ${stories.map((item) => renderStory(item, "章节串联")).join("")}
        </div>
      </section>
    `;
  };

  const initBridge = () => {
    const path = getCurrentPath();
    const isGallery = path === "/gallery/";
    const isPhotoWall = path === "/photo-wall/";
    if (!isGallery && !isPhotoWall) return;

    const article = document.getElementById("article-container");
    const hostSelectors = isGallery
      ? [".love-gallery-experience", ".love-gallery-hero"]
      : [".love-photo-wall-shell", "#love-photo-wall"];
    const host = hostSelectors.map((selector) => document.querySelector(selector)).find(Boolean);
    if (!article || !host) {
      window.clearTimeout(retryTimer);
      retryTimer = window.setTimeout(initBridge, 240);
      return;
    }

    Promise.all([loadMeta(), loadSearch(), loadGraph()]).then(([meta, searchData, graphData]) => {
      const itemMap = buildItemMap(searchData.items);
      const params = getParams();
      const rawScene = isGallery ? params.get("chapter") : params.get("scene");
      const sceneKey =
        resolveSceneKey(meta, rawScene) ||
        safeArray((graphData.pagePresets && graphData.pagePresets[path] && graphData.pagePresets[path].sceneKeys) || [])[0] ||
        "";
      const scene = runtime.getScene(sceneKey) || safeArray(meta.scenes)[0] || null;
      const graphScene = safeArray(graphData.scenes).find((item) => item.key === sceneKey) || null;
      const stories = safeArray(graphScene && graphScene.highlights)
        .map((url) => itemMap[normalizePath(url)])
        .filter(Boolean)
        .slice(0, 3);

      article.querySelectorAll(`[data-memory-story-bridge="${isGallery ? "gallery" : "photo-wall"}"]`).forEach((node) => node.remove());
      const markup = buildBridgeMarkup(scene, stories, isGallery ? "gallery" : "photo-wall");
      if (!markup) return;
      host.insertAdjacentHTML("afterend", markup);
    });
  };

  initBridge();
  document.addEventListener("DOMContentLoaded", initBridge);
  document.addEventListener("pjax:complete", initBridge);
  window.addEventListener("hexo-blog-decrypt", () => {
    window.setTimeout(initBridge, 120);
  });
})();
