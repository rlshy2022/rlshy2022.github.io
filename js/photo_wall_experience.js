(function () {
  "use strict";

  const VERSION = "comfort-grid-v1";
  const LOVE_CFG = window.LOVE_CONFIG || {};
  const FALLBACK_ACCENT = "#b9828f";
  const DAY_MS = 24 * 60 * 60 * 1000;

  const safeArray = (value) => (Array.isArray(value) ? value : []);

  const decodeSafe = (value) => {
    try {
      return decodeURIComponent(String(value || ""));
    } catch (e) {
      return String(value || "");
    }
  };

  const normalizeText = (value) =>
    decodeSafe(value)
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();

  const escapeHtml = (value) =>
    String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const getQueryParams = () => {
    try {
      return new URL(window.location.href).searchParams;
    } catch (e) {
      return new URLSearchParams(window.location.search || "");
    }
  };

  const isPhotoWallPage = () => {
    const path = window.location.pathname || "/";
    return path === "/photo-wall/" || path === "/photo-wall/index.html";
  };

  const calcLoveDays = () => {
    const startRaw =
      ((window.LOVE_CONFIG || LOVE_CFG).dates && (window.LOVE_CONFIG || LOVE_CFG).dates.loveStart) ||
      "2022-08-18T00:00:00";
    const start = new Date(startRaw);
    if (Number.isNaN(start.getTime())) return 1;
    return Math.max(1, Math.floor((Date.now() - start.getTime()) / DAY_MS) + 1);
  };

  const defaultScenes = [
    {
      key: "jingdezhen",
      label: "景德镇",
      badge: "初见篇章",
      desc: "第一次见面的城市，跨年、陶阳里和一起走过的街。",
      accent: "#7ea6bd",
      keywords: ["jdz_", "景德镇", "jingdezhen"],
    },
    {
      key: "suzhou_2026_08",
      label: "八月苏州",
      badge: "四周年重逢",
      desc: "雨中的留园、寒山寺的锦鲤，和四周年写着 1462 的蛋糕。",
      accent: "#b07a93",
      keywords: ["26_8suzhou", "2026.8suzhou", "img/2026.8suzhou/", "八月苏州", "四周年", "留园", "寒山寺"],
    },
    {
      key: "suzhou",
      label: "苏州",
      badge: "旅行记录",
      desc: "七里山塘、小桥和晚风，都在苏州这一组照片里。",
      accent: "#c77f92",
      keywords: ["sz_", "suzhou", "苏州"],
    },
    {
      key: "yangzhou",
      label: "扬州",
      badge: "春日远行",
      desc: "校园、采购、火锅和一起生活过的春天。",
      accent: "#bb8d52",
      keywords: ["yz", "扬州", "yangzhou"],
    },
    {
      key: "ningguo_huangshan",
      label: "宁国黄山",
      badge: "七月登山",
      desc: "先到宁国，再爬黄山，最后回到屯溪、黎阳和新安江边。",
      accent: "#7c9967",
      keywords: ["img/nghs/", "/nghs/", "nghs", "宁国黄山", "宁国"],
    },
    {
      key: "huangshan",
      label: "黄山",
      badge: "清明出走",
      desc: "屯溪老街、黎阳老街、新安江边和红色心愿牌。",
      accent: "#8d9a5b",
      keywords: ["img/hs/", "/hs/", "huangshan", "黄山"],
    },
    {
      key: "fuzhou",
      label: "福州",
      badge: "母校与海",
      desc: "福建师范大学、西门小吃街和长乐海边。",
      accent: "#6f9fb1",
      keywords: ["img/fuzhou/", "/fuzhou/", "fuzhou", "福州", "长乐", "福师大"],
    },
    {
      key: "gifts_birthday",
      label: "礼物&生日&纪念日",
      badge: "心意纪念",
      desc: "互相准备过的礼物、生日蛋糕和纪念日惊喜，都放在这一组里。",
      accent: "#c77f92",
      keywords: ["礼物", "gift", "hh_s_yy", "yy_s_hh", "dg", "生日", "birthday", "纪念", "蛋糕", "cake"],
    },
    {
      key: "daily",
      label: "日常",
      badge: "日常片段",
      desc: "聊天、电影、情书和没有出远门的日子。",
      accent: "#65a58d",
      keywords: ["bige", "jianshen", "kaifa", "/其他/", "daily"],
    },
  ];

  const getPhotoWallScenes = () => {
    const configured = safeArray((window.LOVE_CONFIG || LOVE_CFG).photoWallScenes);
    return configured.length ? configured : defaultScenes;
  };

  const inferScene = (src) => {
    const normalized = normalizeText(src);
    const scenes = getPhotoWallScenes();
    const matched = scenes.find((scene) =>
      safeArray(scene.keywords).some((keyword) => normalized.includes(normalizeText(keyword)))
    );
    return matched || scenes.find((scene) => scene.key === "daily") || defaultScenes[defaultScenes.length - 1];
  };

  const getBatchConfig = () => {
    const width = window.innerWidth || 1280;
    if (width <= 560) return { initial: 12, step: 12 };
    if (width <= 900) return { initial: 18, step: 18 };
    return { initial: 24, step: 24 };
  };

  const getPhotoSources = (img) => {
    const fullSrc =
      img.getAttribute("data-src") ||
      img.getAttribute("data-lazy-src") ||
      img.getAttribute("data-original") ||
      img.closest("a")?.getAttribute("href") ||
      img.getAttribute("src") ||
      "";
    const thumbSrc = img.getAttribute("src") || img.getAttribute("data-lazy-src") || fullSrc;
    return { fullSrc, thumbSrc };
  };

  const resetExistingEnhancement = (article, wall) => {
    const oldShell = wall.closest(".love-photo-wall-shell");
    if (oldShell) {
      article.insertBefore(wall, oldShell);
      oldShell.remove();
    }

    const oldModal = document.getElementById("love-photo-wall-modal");
    if (oldModal) oldModal.remove();

    wall.querySelectorAll(".love-photo-wall-item-meta").forEach((node) => node.remove());
    wall.dataset.enhanced = "";
    wall.dataset.layoutVersion = "";
  };

  const createShell = (totalPhotos, activeSceneCount) => {
    const shell = document.createElement("div");
    shell.className = "love-photo-wall-shell";
    shell.innerHTML = `
      <section class="love-photo-wall-hero" aria-labelledby="love-photo-wall-title">
        <div class="love-photo-wall-copy">
          <span class="love-photo-wall-kicker">
            <i class="fas fa-images" aria-hidden="true"></i>
            Photo Wall
          </span>
          <h2 class="love-photo-wall-title" id="love-photo-wall-title">照片墙</h2>
          <p class="love-photo-wall-desc">
            按地点整理，默认分批展示。先看主要画面，点开照片再看完整细节。
          </p>
          <div class="love-photo-wall-stats" aria-label="照片墙统计">
            <div class="love-photo-wall-stat">
              <span class="value">${totalPhotos}</span>
              <span class="label">全部照片</span>
            </div>
            <div class="love-photo-wall-stat">
              <span class="value">${activeSceneCount}</span>
              <span class="label">地点分组</span>
            </div>
            <div class="love-photo-wall-stat">
              <span class="value">${calcLoveDays()}</span>
              <span class="label">相爱天数</span>
            </div>
          </div>
        </div>
        <div class="love-photo-wall-feature" id="love-photo-wall-feature">
          <div class="love-photo-wall-feature-photo-wrap">
            <img class="love-photo-wall-feature-photo" src="" alt="" decoding="async">
            <span class="love-photo-wall-feature-chip"></span>
          </div>
          <div class="love-photo-wall-feature-body">
            <span class="love-photo-wall-feature-label">精选预览</span>
            <h3 class="love-photo-wall-feature-title"></h3>
            <p class="love-photo-wall-feature-desc"></p>
            <div class="love-photo-wall-feature-actions">
              <button type="button" class="love-photo-wall-action is-button" data-photo-wall-random="1">
                <i class="fas fa-random" aria-hidden="true"></i>
                随机一张
              </button>
              <button type="button" class="love-photo-wall-action is-ghost is-button" data-photo-wall-open="1">
                <i class="fas fa-expand" aria-hidden="true"></i>
                放大查看
              </button>
            </div>
          </div>
        </div>
      </section>
      <section class="love-photo-wall-toolbar" aria-label="照片筛选">
        <div class="love-photo-wall-filters" aria-label="按地点筛选照片"></div>
        <p class="love-photo-wall-status" aria-live="polite">
          已显示 <strong>0</strong> / ${totalPhotos} 张
        </p>
      </section>
      <section class="love-photo-wall-board">
        <div class="love-photo-wall-board-head">
          <div>
            <span class="love-photo-wall-board-kicker">Browse</span>
            <h3 class="love-photo-wall-board-title">照片浏览</h3>
          </div>
          <p class="love-photo-wall-board-note">
            每次只展开一组，浏览节奏更稳；切换地点后会重新从第一组开始。
          </p>
        </div>
      </section>
    `;
    return shell;
  };

  const createModal = () => {
    const modal = document.createElement("div");
    modal.id = "love-photo-wall-modal";
    modal.className = "love-photo-wall-modal";
    modal.innerHTML = `
      <div class="love-photo-wall-modal-backdrop" data-modal-close="1"></div>
      <div class="love-photo-wall-modal-dialog" role="dialog" aria-modal="true" aria-label="照片查看器">
        <button type="button" class="love-photo-wall-modal-close" data-modal-close="1" aria-label="关闭">
          <i class="fas fa-times" aria-hidden="true"></i>
        </button>
        <button type="button" class="love-photo-wall-modal-nav is-prev" data-modal-step="-1" aria-label="上一张">
          <i class="fas fa-chevron-left" aria-hidden="true"></i>
        </button>
        <div class="love-photo-wall-modal-stage">
          <img class="love-photo-wall-modal-image" src="" alt="" decoding="async">
        </div>
        <button type="button" class="love-photo-wall-modal-nav is-next" data-modal-step="1" aria-label="下一张">
          <i class="fas fa-chevron-right" aria-hidden="true"></i>
        </button>
        <div class="love-photo-wall-modal-meta">
          <div class="love-photo-wall-modal-line">
            <span class="love-photo-wall-modal-chip"></span>
            <span class="love-photo-wall-modal-counter"></span>
          </div>
          <strong class="love-photo-wall-modal-title"></strong>
          <p class="love-photo-wall-modal-desc"></p>
        </div>
      </div>
    `;
    return modal;
  };

  const createLoadMore = () => {
    const wrap = document.createElement("div");
    wrap.className = "love-photo-wall-more";
    wrap.innerHTML = `
      <button type="button" class="love-photo-wall-action is-button" data-photo-wall-more="1">
        <i class="fas fa-plus" aria-hidden="true"></i>
        继续展开
      </button>
    `;
    return wrap;
  };

  const setCardPattern = (entry, displayIndex) => {
    entry.item.classList.remove("is-wide", "is-tall", "is-square");
    const phase = displayIndex % 12;
    if (phase === 0 || phase === 7) {
      entry.item.classList.add("is-wide");
    } else if (phase === 4 || phase === 10) {
      entry.item.classList.add("is-tall");
    } else if (phase === 2 || phase === 9) {
      entry.item.classList.add("is-square");
    }
  };

  const initPhotoWallExperience = () => {
    if (!isPhotoWallPage()) return;

    const article = document.getElementById("article-container");
    const wall = document.getElementById("love-photo-wall");
    if (!article || !wall) return;
    if (wall.dataset.layoutVersion === VERSION) return;

    resetExistingEnhancement(article, wall);

    wall.dataset.enhanced = "true";
    wall.dataset.layoutVersion = VERSION;
    article.classList.add("love-photo-wall-page");

    Array.from(article.children)
      .filter((node) => node.tagName === "P" && /瀑布流|甜蜜相册/.test(node.textContent || ""))
      .forEach((node) => node.remove());

    const scenes = getPhotoWallScenes();
    const counts = {};
    const entries = Array.from(wall.querySelectorAll(".love-photo-wall-item"))
      .map((item, index) => {
        const img = item.querySelector("img");
        if (!img) return null;

        const { fullSrc, thumbSrc } = getPhotoSources(img);
        const scene = inferScene(fullSrc || thumbSrc);
        const number = index + 1;
        counts[scene.key] = (counts[scene.key] || 0) + 1;

        img.decoding = "async";
        img.loading = index < 6 ? "eager" : "lazy";
        img.setAttribute("draggable", "false");

        item.dataset.scene = scene.key;
        item.dataset.index = String(index);
        item.style.setProperty("--photo-accent", scene.accent || FALLBACK_ACCENT);
        item.style.setProperty("--love-tilt", "0deg");
        item.classList.add("love-photo-wall-polaroid");
        item.setAttribute("tabindex", "0");
        item.setAttribute("role", "button");
        item.setAttribute("aria-label", `查看${scene.label}的第 ${number} 张照片`);

        const meta = document.createElement("div");
        meta.className = "love-photo-wall-item-meta";
        meta.innerHTML = `
          <span class="love-photo-wall-item-badge">${escapeHtml(scene.badge || scene.label)}</span>
          <span class="love-photo-wall-item-index">${String(number).padStart(2, "0")}</span>
        `;
        item.appendChild(meta);

        return {
          item,
          img,
          fullSrc,
          thumbSrc,
          alt: img.getAttribute("alt") || `${scene.label}的照片`,
          scene,
          number,
        };
      })
      .filter(Boolean);

    if (!entries.length) return;

    const totalPhotos = entries.length;
    const activeSceneList = scenes.filter((scene) => counts[scene.key]);
    const shell = createShell(totalPhotos, activeSceneList.length);
    article.insertBefore(shell, wall);

    const board = shell.querySelector(".love-photo-wall-board");
    const loadMoreWrap = createLoadMore();
    const empty = document.createElement("p");
    empty.className = "love-photo-wall-empty";
    empty.textContent = "这一组暂时没有照片。";
    board?.appendChild(wall);
    board?.appendChild(loadMoreWrap);
    board?.appendChild(empty);

    const filtersWrap = shell.querySelector(".love-photo-wall-filters");
    const status = shell.querySelector(".love-photo-wall-status");
    const feature = shell.querySelector("#love-photo-wall-feature");
    const featurePhoto = feature?.querySelector(".love-photo-wall-feature-photo");
    const featureChip = feature?.querySelector(".love-photo-wall-feature-chip");
    const featureTitle = feature?.querySelector(".love-photo-wall-feature-title");
    const featureDesc = feature?.querySelector(".love-photo-wall-feature-desc");
    const featureOpenButton = feature?.querySelector("[data-photo-wall-open='1']");
    const loadMoreButton = loadMoreWrap.querySelector("[data-photo-wall-more='1']");

    const filterItems = [
      {
        key: "all",
        label: "全部",
        badge: "全部照片",
        desc: "把所有地点和日常照片放在一起浏览。",
        accent: FALLBACK_ACCENT,
      },
      ...activeSceneList,
    ];

    let currentFilter = "all";
    let currentFeaturePoolIndex = 0;
    let currentFeatureEntry = entries[0];
    let displayLimit = getBatchConfig().initial;

    const SCENE_PARAM_ALIASES = { gifts: "gifts_birthday", birthday: "gifts_birthday" };
    const requestedSceneRaw =
      getQueryParams().get("scene") ||
      decodeSafe((window.location.hash || "").replace(/^#scene-/, ""));
    const requestedScene = normalizeText(SCENE_PARAM_ALIASES[requestedSceneRaw] || requestedSceneRaw);

    const matchedEntries = () =>
      entries.filter((entry) => currentFilter === "all" || entry.scene.key === currentFilter);

    const syncUrl = (sceneKey) => {
      if (!window.history || !window.history.replaceState) return;
      try {
        const url = new URL(window.location.href);
        if (sceneKey === "all") {
          url.searchParams.delete("scene");
        } else {
          url.searchParams.set("scene", sceneKey);
        }
        window.history.replaceState(null, "", url.toString());
      } catch (e) {}
    };

    const renderFilters = () => {
      if (!filtersWrap) return;
      filtersWrap.innerHTML = filterItems
        .map((scene) => {
          const count = scene.key === "all" ? totalPhotos : counts[scene.key] || 0;
          const active = scene.key === currentFilter;
          return `
            <button type="button" class="love-photo-wall-filter${
              active ? " is-active" : ""
            }" data-scene="${escapeHtml(scene.key)}" aria-pressed="${active ? "true" : "false"}">
              <span>${escapeHtml(scene.label)}</span>
              <em>${count}</em>
            </button>
          `;
        })
        .join("");
    };

    const renderGrid = () => {
      const pool = matchedEntries();
      const shown = Math.min(displayLimit, pool.length);
      const poolSet = new Set(pool);

      entries.forEach((entry) => {
        entry.item.classList.add("is-hidden");
        entry.item.setAttribute("aria-hidden", "true");
        entry.item.classList.remove("is-wide", "is-tall", "is-square");
      });

      pool.slice(0, shown).forEach((entry, displayIndex) => {
        if (!poolSet.has(entry)) return;
        setCardPattern(entry, displayIndex);
        entry.item.classList.remove("is-hidden");
        entry.item.removeAttribute("aria-hidden");
      });

      const remaining = Math.max(0, pool.length - shown);
      loadMoreWrap.classList.toggle("is-hidden", remaining <= 0);
      if (loadMoreButton) {
        loadMoreButton.innerHTML = `
          <i class="fas fa-plus" aria-hidden="true"></i>
          继续展开 ${Math.min(getBatchConfig().step, remaining)} 张
        `;
      }

      empty.classList.toggle("is-active", pool.length === 0);

      if (status) {
        const currentLabel =
          filterItems.find((scene) => scene.key === currentFilter)?.label || "当前分组";
        status.innerHTML = `已显示 <strong>${shown}</strong> / ${pool.length} 张 · ${escapeHtml(
          currentLabel
        )} · 全部 ${totalPhotos} 张`;
      }
    };

    const updateFeature = (poolIndex) => {
      const pool = matchedEntries();
      if (!pool.length || !feature || !featurePhoto || !featureChip || !featureTitle || !featureDesc) {
        currentFeatureEntry = null;
        if (featureOpenButton) featureOpenButton.disabled = true;
        return;
      }

      const safeIndex = ((poolIndex % pool.length) + pool.length) % pool.length;
      const entry = pool[safeIndex];
      currentFeaturePoolIndex = safeIndex;
      currentFeatureEntry = entry;

      feature.style.setProperty("--photo-accent", entry.scene.accent || FALLBACK_ACCENT);
      featurePhoto.src = entry.thumbSrc || entry.fullSrc;
      featurePhoto.alt = entry.alt;
      featureChip.textContent = `${entry.scene.label} · 第 ${entry.number} 张`;
      featureTitle.textContent = entry.scene.badge || entry.scene.label;
      featureDesc.textContent = entry.scene.desc || "这一张照片记录了当时的场景。";
      if (featureOpenButton) featureOpenButton.disabled = false;
    };

    const applyFilter = (sceneKey, updateUrl) => {
      currentFilter = filterItems.some((scene) => scene.key === sceneKey) ? sceneKey : "all";
      displayLimit = getBatchConfig().initial;
      renderFilters();
      renderGrid();
      updateFeature(0);
      if (updateUrl) syncUrl(currentFilter);
    };

    let modal = createModal();
    document.body.appendChild(modal);

    const modalImage = modal.querySelector(".love-photo-wall-modal-image");
    const modalChip = modal.querySelector(".love-photo-wall-modal-chip");
    const modalCounter = modal.querySelector(".love-photo-wall-modal-counter");
    const modalTitle = modal.querySelector(".love-photo-wall-modal-title");
    const modalDesc = modal.querySelector(".love-photo-wall-modal-desc");
    const modalClose = modal.querySelector(".love-photo-wall-modal-close");
    let modalPool = entries;
    let currentModalIndex = 0;
    let lastFocusedElement = null;

    const renderModal = (nextIndex) => {
      if (!modalImage || !modalChip || !modalCounter || !modalTitle || !modalDesc) return;
      const count = modalPool.length;
      if (!count) return;

      currentModalIndex = ((nextIndex % count) + count) % count;
      const entry = modalPool[currentModalIndex];
      modal.style.setProperty("--photo-accent", entry.scene.accent || FALLBACK_ACCENT);
      modalImage.src = entry.fullSrc || entry.thumbSrc;
      modalImage.alt = entry.alt;
      modalChip.textContent = `${entry.scene.label} · 第 ${entry.number} 张`;
      modalCounter.textContent = `${currentModalIndex + 1} / ${count}`;
      modalTitle.textContent = entry.scene.badge || entry.scene.label;
      modalDesc.textContent = entry.scene.desc || "这一张照片记录了当时的场景。";
    };

    const openModal = (entry) => {
      modalPool = matchedEntries();
      if (!modalPool.length) return;
      const startIndex = Math.max(0, modalPool.indexOf(entry));
      lastFocusedElement = document.activeElement;
      renderModal(startIndex);
      modal.classList.add("is-open");
      document.body.classList.add("love-photo-wall-modal-open");
      modalClose?.focus();
    };

    const closeModal = () => {
      modal.classList.remove("is-open");
      document.body.classList.remove("love-photo-wall-modal-open");
      if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
        lastFocusedElement.focus();
      }
    };

    modal.querySelectorAll("[data-modal-close='1']").forEach((button) => {
      button.addEventListener("click", closeModal);
    });
    modal.querySelectorAll("[data-modal-step]").forEach((button) => {
      button.addEventListener("click", () => {
        const step = Number(button.getAttribute("data-modal-step") || 0);
        renderModal(currentModalIndex + step);
      });
    });

    if (window.__lovePhotoWallKeyHandler) {
      document.removeEventListener("keydown", window.__lovePhotoWallKeyHandler);
    }
    window.__lovePhotoWallKeyHandler = (event) => {
      if (!modal.classList.contains("is-open")) return;
      if (event.key === "Escape") closeModal();
      if (event.key === "ArrowLeft") renderModal(currentModalIndex - 1);
      if (event.key === "ArrowRight") renderModal(currentModalIndex + 1);
    };
    document.addEventListener("keydown", window.__lovePhotoWallKeyHandler);

    entries.forEach((entry) => {
      const open = () => openModal(entry);
      entry.item.addEventListener("click", open);
      entry.item.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          open();
        }
      });
    });

    filtersWrap?.addEventListener("click", (event) => {
      const button = event.target?.closest(".love-photo-wall-filter");
      if (!button) return;
      applyFilter(button.getAttribute("data-scene") || "all", true);
    });

    loadMoreButton?.addEventListener("click", () => {
      displayLimit += getBatchConfig().step;
      renderGrid();
    });

    feature?.querySelectorAll("[data-photo-wall-random='1']").forEach((button) => {
      button.addEventListener("click", () => {
        const pool = matchedEntries();
        if (!pool.length) return;
        let nextIndex = currentFeaturePoolIndex;
        while (pool.length > 1 && nextIndex === currentFeaturePoolIndex) {
          nextIndex = Math.floor(Math.random() * pool.length);
        }
        updateFeature(nextIndex);
      });
    });

    featureOpenButton?.addEventListener("click", () => {
      if (currentFeatureEntry) openModal(currentFeatureEntry);
    });

    const initialScene = filterItems.find((scene) => {
      const key = normalizeText(scene.key);
      const label = normalizeText(scene.label);
      return requestedScene === key || requestedScene === label;
    });

    applyFilter(initialScene ? initialScene.key : "all", false);
  };

  window.LOVE_PHOTO_WALL_EXPERIENCE = initPhotoWallExperience;

  const start = () => window.setTimeout(initPhotoWallExperience, 0);
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
  document.addEventListener("pjax:complete", start);
  window.addEventListener("hexo-blog-decrypt", () => {
    setTimeout(initPhotoWallExperience, 80);
  });
})();
