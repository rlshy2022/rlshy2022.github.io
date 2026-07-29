(function () {
  "use strict";

  const PAGE_SELECTOR = "#future-letters-page";
  const runtime = window.LOVE_MEMORY_RUNTIME;
  if (!runtime) return;

  let lettersPromise = null;
  let searchPromise = null;
  let graphPromise = null;
  let perspectiveBound = false;

  const safeArray = runtime.safeArray || ((value) => (Array.isArray(value) ? value : []));
  const formatDate = runtime.formatDate || ((value) => String(value || ""));
  const renderCoverMarkup = runtime.renderCoverMarkup;
  const normalizePath = runtime.normalizePath || ((value) => String(value || "/"));

  const loadLetters = () => {
    if (!lettersPromise) {
      lettersPromise = runtime.fetchJson("/memories/future-letters.json", {
        letters: [],
        unlockedCount: 0,
        pendingCount: 0,
      });
    }
    return lettersPromise;
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
        : Promise.resolve({ pagePresets: {}, scenes: [] });
    }
    return graphPromise;
  };

  const escapeHtml = (value) =>
    String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const formatParagraphs = (value) =>
    escapeHtml(value)
      .replace(/\r?\n\r?\n/g, "</p><p>")
      .replace(/\r?\n/g, "<br>");

  const buildItemMap = (items) =>
    safeArray(items).reduce((acc, item) => {
      acc[normalizePath(item && item.url)] = item;
      return acc;
    }, {});

  const init = () => {
    const container = document.querySelector(PAGE_SELECTOR);
    if (!container) return;

    Promise.all([runtime.getMeta(), runtime.getPerspective(), loadLetters(), loadSearchIndex(), loadGraph()]).then(
      ([meta, perspective, lettersData, searchData, graphData]) => {
        if (!document.body.contains(container)) return;

        const voiceCards = safeArray(meta.voicePostcards);
        const itemMap = buildItemMap(searchData.items);
        const preset = (graphData.pagePresets && graphData.pagePresets["/future-letters/"]) || {
          nextStops: [],
          sceneKeys: [],
        };
        const featuredStories = safeArray(preset.nextStops)
          .map((url) => itemMap[normalizePath(url)])
          .filter(Boolean)
          .slice(0, 3);

        container.innerHTML = `
          <section class="memory-page-shell future-letters-shell">
            <header class="memory-page-hero">
              <div>
                <span class="memory-page-kicker">Future Letters</span>
                <h2>把想对未来说的话先认真写好</h2>
                <p>${(perspective && perspective.letterNote) || "有些话适合留给未来，再慢慢拆开看它有没有继续发光。"}</p>
              </div>
              <div class="memory-page-stats">
                <div><strong>${lettersData.unlockedCount || 0}</strong><span>已解锁</span></div>
                <div><strong>${lettersData.pendingCount || 0}</strong><span>待开启</span></div>
                <div><strong>${voiceCards.length}</strong><span>语音明信片</span></div>
              </div>
            </header>

            <div class="memory-page-switcher" data-role="switcher"></div>

            <section class="memory-hub-journey-board future-letter-board">
              <section class="memory-hub-quest-card">
                <span class="memory-hub-continue-kicker">解锁前先走一圈</span>
                <strong>这些页会把信里提到的情绪提前接起来</strong>
                <p>未来信不是终点页，等它打开之前，也可以先去时间轴、相册和相关文章里把上下文补全。</p>
              </section>
              <div class="passport-story-loop">
                ${featuredStories
                  .map(
                    (item) => `
                      <a class="passport-highlight-item" href="${escapeHtml(item.url)}">
                        <strong>${escapeHtml(item.title || "打开下一页")}</strong>
                        <span>${escapeHtml(formatDate(item.isoDate || ""))}</span>
                        <p>${escapeHtml(item.summary || "先去把这一段故事的上下文补全。")}</p>
                      </a>
                    `
                  )
                  .join("")}
              </div>
            </section>

            <section class="future-letter-grid">
              ${safeArray(lettersData.letters)
                .map((letter) => {
                  const scene = runtime.getScene(letter.scene) || runtime.getScene("daily") || {};
                  const relatedStories = safeArray(searchData.items)
                    .filter((item) => item.scene === letter.scene)
                    .slice(0, 2);
                  return `
                    <article class="future-letter-card ${letter.unlocked ? "is-open" : "is-locked"}" style="--memory-accent:${letter.accent || scene.accent || "#df829c"};">
                      ${renderCoverMarkup({
                        wrapperClass: "future-letter-cover-wrap",
                        imageClass: "future-letter-cover",
                        src: letter.cover,
                        alt: letter.title,
                        placeholder: "未来信件",
                      })}
                      <div class="future-letter-body">
                        <div class="future-letter-meta">
                          <span>${letter.unlocked ? "已解锁" : `还有 ${letter.daysRemaining} 天`}</span>
                          <span>${formatDate(letter.unlockDate)}</span>
                        </div>
                        <h3>${escapeHtml(letter.title)}</h3>
                        <p class="future-letter-summary">${escapeHtml(letter.teaser || letter.summary || "")}</p>
                        ${
                          letter.unlocked
                            ? `
                              <div class="future-letter-content"><p>${formatParagraphs(letter.content || "")}</p></div>
                              <div class="future-letter-signature">${escapeHtml(letter.signature || "")}</div>
                            `
                            : `
                              <div class="future-letter-lock">
                                <strong>还没有到开启日期</strong>
                                <span>先把这封信留给 ${formatDate(letter.unlockDate)} 的我们。</span>
                              </div>
                            `
                        }
                        <div class="passport-card-actions future-letter-actions">
                          ${scene.timelineUrl ? `<a href="${scene.timelineUrl}">时间轴</a>` : ""}
                          ${scene.galleryUrl ? `<a href="${scene.galleryUrl}">相册</a>` : ""}
                          ${scene.photoWallUrl ? `<a href="${scene.photoWallUrl}">照片墙</a>` : ""}
                        </div>
                        ${
                          relatedStories.length
                            ? `
                              <div class="passport-story-loop is-inline">
                                ${relatedStories
                                  .map(
                                    (item) => `
                                      <a class="passport-highlight-item" href="${escapeHtml(item.url || "/future-letters/")}">
                                        <strong>${escapeHtml(item.title || "相关回忆")}</strong>
                                        <span>${escapeHtml(formatDate(item.isoDate || ""))}</span>
                                        <p>${escapeHtml(item.summary || "从这里继续把这封信的上下文补上。")}</p>
                                      </a>
                                    `
                                  )
                                  .join("")}
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

            <section class="memory-panel">
              <div class="memory-panel-head">
                <div>
                  <span class="memory-panel-kicker">语音明信片</span>
                  <h3>把这些声音明信片先放在这里</h3>
                </div>
              </div>
              <div class="memory-voice-grid">
                ${voiceCards
                  .map((item) => {
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
                          <span class="memory-voice-badge">${escapeHtml(item.badge || "语音明信片")}</span>
                          <h3>${escapeHtml(item.title)}</h3>
                          <p>${escapeHtml(item.summary || "")}</p>
                          <div class="memory-voice-meta">${escapeHtml(item.speaker || "")}${scene.label ? ` · ${escapeHtml(scene.label)}` : ""}</div>
                          <audio controls preload="none" src="${item.audio}"></audio>
                        </div>
                      </article>
                    `;
                  })
                  .join("")}
              </div>
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
