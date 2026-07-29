(function () {
  "use strict";

  const core = window.LOVE_EXPERIENCE_CORE;
  if (!core) return;

  const {
    MEMORY_SCENE_ALIASES,
    runWhenIdle,
    decodeSafe,
    normalizeSearchText,
    getQueryParams,
    isGalleryPage,
    isPhotoWallPage,
    calcLoveDays,
    getUpcomingAnniversaries,
    getHomeMemoryDeck,
    pickAnotherIndex,
    normalizeChapterKey,
    cleanChapterTitle,
    getGalleryAccent,
    getGalleryChapterMeta,
    getGalleryContentRoot,
    getPhotoWallScenes,
    inferPhotoWallScene,
    showToast,
  } = core;

  const initGalleryExperience = () => {
    if (!isGalleryPage()) return;

    const scope = getGalleryContentRoot();
    if (!scope || scope.querySelector(".love-gallery-experience")) return;

    const resetButton = scope.querySelector("#hbeResetBtn");
    const children = Array.from(scope.children).filter((node) => node !== resetButton);
    const sectionGroups = [];
    const prefaceNodes = [];
    let currentGroup = null;

    children.forEach((node) => {
      const isHeading = /^H[1-6]$/.test(node.tagName || "");
      if (isHeading) {
        currentGroup = { heading: node, nodes: [node] };
        sectionGroups.push(currentGroup);
        return;
      }

      if (currentGroup) {
        currentGroup.nodes.push(node);
      } else {
        prefaceNodes.push(node);
      }
    });

    if (!sectionGroups.length) return;

    const coverHolder = prefaceNodes.find(
      (node) => node.tagName === "IMG" || node.querySelector?.("img")
    );
    const coverImage =
      (coverHolder &&
        (coverHolder.tagName === "IMG" ? coverHolder : coverHolder.querySelector("img"))) ||
      null;
    const fallbackCover = getHomeMemoryDeck()[0] || {};
    const coverSrc =
      coverImage?.getAttribute("src") ||
      coverImage?.getAttribute("data-lazy-src") ||
      fallbackCover.image ||
      "";
    const coverAlt = coverImage?.getAttribute("alt") || "甜蜜相册封面";
    const upcoming = getUpcomingAnniversaries(1)[0];

    const experience = document.createElement("div");
    experience.className = "love-gallery-experience";

    const nav = document.createElement("nav");
    nav.className = "love-gallery-nav";
    nav.id = "love-gallery-chapters";

    const spotlight = document.createElement("section");
    spotlight.className = "love-gallery-spotlight";
    spotlight.id = "love-gallery-spotlight";
    spotlight.innerHTML = `
      <div class="love-gallery-spotlight-copy">
        <span class="love-gallery-spotlight-kicker">随机掉落</span>
        <h3 class="love-gallery-spotlight-title">这一张，今天也值得重新看一遍</h3>
        <p class="love-gallery-spotlight-desc">
          每次点开，都会随机翻出一张我们认真留下来的证据。
        </p>
        <div class="love-gallery-spotlight-actions">
          <button type="button" class="love-gallery-action is-button" data-gallery-random="1">
            <i class="fas fa-dice"></i>
            换一张照片
          </button>
          <a href="/photo-wall/" class="love-gallery-action is-ghost">
            <i class="fas fa-th-large"></i>
            去照片墙
          </a>
        </div>
      </div>
      <div class="love-gallery-spotlight-card">
        <div class="love-gallery-spotlight-photo-wrap">
          <img class="love-gallery-spotlight-photo" src="" alt="">
          <span class="love-gallery-spotlight-chip"></span>
        </div>
        <div class="love-gallery-spotlight-meta">
          <span class="love-gallery-spotlight-label">来自章节</span>
          <strong class="love-gallery-spotlight-chapter"></strong>
          <p class="love-gallery-spotlight-note"></p>
          <a class="love-gallery-spotlight-link" href="#love-gallery-chapters">
            去看看这段回忆
            <i class="fas fa-chevron-right"></i>
          </a>
        </div>
      </div>
    `;

    const chaptersWrap = document.createElement("div");
    chaptersWrap.className = "love-gallery-chapters";

    const navItems = [];
    const spotlightEntries = [];
    let totalPhotos = 0;

    sectionGroups.forEach((group, index) => {
      const title = cleanChapterTitle(group.heading.textContent);
      const meta = getGalleryChapterMeta(title, index);
      const section = document.createElement("section");
      const sectionId = `gallery-chapter-${normalizeChapterKey(title) || index + 1}`;
      section.className = "love-gallery-chapter";
      section.id = sectionId;
      section.style.setProperty("--chapter-accent", meta.accent);

      const body = document.createElement("div");
      body.className = "love-gallery-chapter-body";
      group.nodes.slice(1).forEach((node) => {
        body.appendChild(node);
      });
      group.heading.remove();

      const photoCount = body.querySelectorAll("img").length;
      totalPhotos += photoCount;

      const header = document.createElement("div");
      header.className = "love-gallery-chapter-head";
      header.innerHTML = `
        <div class="love-gallery-chapter-copy">
          <span class="love-gallery-chapter-badge">${meta.badge}</span>
          <h2 class="love-gallery-chapter-title">${title}</h2>
          <p class="love-gallery-chapter-desc">${meta.desc}</p>
        </div>
        <div class="love-gallery-chapter-meta">
          <span>${meta.date}</span>
          <span>${photoCount} 张照片</span>
        </div>
      `;

      const quote = document.createElement("blockquote");
      quote.className = "love-gallery-chapter-quote";
      quote.textContent = meta.quote;

      body.querySelectorAll(".gallery-container").forEach((container) => {
        container.classList.add("love-gallery-frame");
      });

      section.appendChild(header);
      section.appendChild(quote);
      section.appendChild(body);
      chaptersWrap.appendChild(section);

      navItems.push(
        `<a href="#${sectionId}" class="love-gallery-nav-link">
          <span>${title}</span>
          <em>${photoCount}</em>
        </a>`
      );

      body.querySelectorAll("img").forEach((img, photoIndex) => {
        const src = img.getAttribute("data-lazy-src") || img.getAttribute("src");
        if (!src) return;
        spotlightEntries.push({
          src,
          alt: img.getAttribute("alt") || `${title} 的照片`,
          title,
          note: meta.desc,
          chip: `第 ${photoIndex + 1} 张`,
          href: `#${sectionId}`,
        });
      });
    });

    const hero = document.createElement("section");
    hero.className = "love-gallery-hero";
    hero.innerHTML = `
      <div class="love-gallery-hero-copy">
        <span class="love-gallery-kicker">
          <i class="fas fa-book-open"></i>
          私人纪念册 · unlocked
        </span>
        <h2 class="love-gallery-title">把见面、旅行和日常都装进同一本胶片册</h2>
        <p class="love-gallery-desc">
          输入密码之后，翻开的不只是照片，而是我们把喜欢认真收纳起来的每一个章节。
          从初见到礼物，从远行到平凡，原来真的都值得被反复喜欢。
        </p>
        <div class="love-gallery-actions">
          <a href="#love-gallery-chapters" class="love-gallery-action">
            <i class="fas fa-images"></i>
            开始翻看
          </a>
          <button type="button" class="love-gallery-action is-button is-soft" data-gallery-random="1">
            <i class="fas fa-shuffle"></i>
            随机掉落一张
          </button>
        </div>
      </div>
      <div class="love-gallery-hero-visual">
        ${
          coverSrc
            ? `<img class="love-gallery-cover" src="${coverSrc}" alt="${coverAlt}">`
            : ""
        }
        <div class="love-gallery-stats">
          <div class="love-gallery-stat">
            <span class="value">${sectionGroups.length}</span>
            <span class="label">故事章节</span>
          </div>
          <div class="love-gallery-stat">
            <span class="value">${totalPhotos}</span>
            <span class="label">照片数量</span>
          </div>
          <div class="love-gallery-stat">
            <span class="value">${calcLoveDays()}</span>
            <span class="label">相爱天数</span>
          </div>
          <div class="love-gallery-stat">
            <span class="value">${upcoming ? upcoming.diff : "∞"}</span>
            <span class="label">${upcoming ? upcoming.name : "每天都值得纪念"}</span>
          </div>
        </div>
      </div>
    `;

    nav.innerHTML = navItems.join("");

    prefaceNodes.forEach((node) => node.remove());
    scope.insertBefore(experience, scope.firstChild);
    experience.appendChild(hero);
    experience.appendChild(nav);
    experience.appendChild(spotlight);
    experience.appendChild(chaptersWrap);

    const tiltValues = ["-2.8deg", "2.2deg", "-1.4deg", "1deg", "0deg", "-0.6deg"];
    chaptersWrap
      .querySelectorAll(".gallery-items .item, .fj-gallery-item")
      .forEach((item, index) => {
        item.style.setProperty("--love-tilt", tiltValues[index % tiltValues.length]);
        item.classList.add("love-gallery-polaroid");
      });

    const standalonePhotos = chaptersWrap.querySelectorAll(".love-gallery-chapter-body p > img");
    standalonePhotos.forEach((img, index) => {
      const wrap = img.parentElement;
      if (!wrap) return;
      wrap.classList.add("love-gallery-inline-photo");
      wrap.style.setProperty("--love-tilt", tiltValues[index % tiltValues.length]);
    });

    if (spotlightEntries.length) {
      const photo = spotlight.querySelector(".love-gallery-spotlight-photo");
      const chip = spotlight.querySelector(".love-gallery-spotlight-chip");
      const chapter = spotlight.querySelector(".love-gallery-spotlight-chapter");
      const note = spotlight.querySelector(".love-gallery-spotlight-note");
      const link = spotlight.querySelector(".love-gallery-spotlight-link");
      let currentIndex = new Date().getDate() % spotlightEntries.length;

      const updateSpotlight = (index, withToast) => {
        const entry = spotlightEntries[index];
        if (!entry || !photo || !chip || !chapter || !note || !link) return;
        currentIndex = index;
        photo.src = entry.src;
        photo.alt = entry.alt;
        chip.textContent = entry.chip;
        chapter.textContent = entry.title;
        note.textContent = entry.note;
        link.href = entry.href;

        if (withToast) {
          showToast(`翻到了「${entry.title}」里的一张心动照片`);
        }
      };

      updateSpotlight(currentIndex, false);

      experience.querySelectorAll("[data-gallery-random='1']").forEach((trigger) => {
        trigger.addEventListener("click", () => {
          updateSpotlight(pickAnotherIndex(spotlightEntries, currentIndex), true);
        });
      });
    } else {
      spotlight.remove();
    }

    const navLinks = Array.from(nav.querySelectorAll(".love-gallery-nav-link"));
    const setActive = (id) => {
      navLinks.forEach((link) => {
        link.classList.toggle("is-active", link.getAttribute("href") === `#${id}`);
      });
    };

    if (navLinks.length) {
      setActive(chaptersWrap.querySelector(".love-gallery-chapter")?.id || "");
    }

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          const visible = entries
            .filter((entry) => entry.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
          if (visible) setActive(visible.target.id);
        },
        {
          rootMargin: "-18% 0px -58% 0px",
          threshold: [0.2, 0.45, 0.7],
        }
      );

      chaptersWrap.querySelectorAll(".love-gallery-chapter").forEach((section) => {
        observer.observe(section);
      });
    }

    const chapterAliases = {};
    chaptersWrap.querySelectorAll(".love-gallery-chapter").forEach((section) => {
      const sectionKey = normalizeChapterKey(section.id.replace(/^gallery-chapter-/, ""));
      const titleKey = normalizeChapterKey(
        section.querySelector(".love-gallery-chapter-title")?.textContent || ""
      );
      if (sectionKey) chapterAliases[sectionKey] = section.id;
      if (titleKey) chapterAliases[titleKey] = section.id;
    });

    Object.keys(MEMORY_SCENE_ALIASES).forEach((key) => {
      const alias = MEMORY_SCENE_ALIASES[key];
      const sectionKey = normalizeChapterKey(alias && alias.galleryChapter);
      if (sectionKey) {
        chapterAliases[normalizeChapterKey(key)] = `gallery-chapter-${sectionKey}`;
      }
    });

    const queryChapter = normalizeChapterKey(getQueryParams().get("chapter") || "");
    const hashTarget = decodeSafe((window.location.hash || "").replace(/^#/, ""));
    const hashChapter = hashTarget.startsWith("gallery-chapter-")
      ? normalizeChapterKey(hashTarget.replace(/^gallery-chapter-/, ""))
      : hashTarget.startsWith("chapter-")
        ? normalizeChapterKey(hashTarget.replace(/^chapter-/, ""))
        : "";
    const targetId =
      chapterAliases[queryChapter] ||
      chapterAliases[hashChapter] ||
      (hashTarget.startsWith("gallery-chapter-") ? hashTarget : "");

    if (targetId) {
      const targetSection = document.getElementById(targetId);
      if (targetSection) {
        setActive(targetId);
        setTimeout(() => {
          targetSection.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 120);
      }
    }
  };

  // ---------- 5. 照片墙：胶片墙 / 筛选 / 沉浸式查看 ----------
  const initPhotoWallExperience = () => {
    if (!isPhotoWallPage()) return;

    const article = document.getElementById("article-container");
    const wall = document.getElementById("love-photo-wall");
    if (!article || !wall || wall.dataset.enhanced === "true") return;

    wall.dataset.enhanced = "true";
    article.classList.add("love-photo-wall-page");

    const intro = Array.from(article.children).find(
      (node) => node.tagName === "P" && /瀑布流|甜蜜相册/.test(node.textContent || "")
    );
    if (intro) intro.remove();

    const scenes = getPhotoWallScenes();
    const items = Array.from(wall.querySelectorAll(".love-photo-wall-item"));
    if (!items.length) return;

    const tiltValues = ["-2.8deg", "2.4deg", "-1.5deg", "0.8deg", "-0.9deg", "1.6deg"];
    const counts = {};
    const entries = [];

    items.forEach((item, index) => {
      const img = item.querySelector("img");
      if (!img) return;

      const fullSrc =
        img.getAttribute("data-src") ||
        img.getAttribute("data-lazy-src") ||
        img.getAttribute("data-original") ||
        img.getAttribute("data-fancybox") ||
        img.closest("a")?.getAttribute("href") ||
        img.getAttribute("src") ||
        "";
      const thumbSrc =
        img.getAttribute("src") ||
        img.getAttribute("data-lazy-src") ||
        fullSrc;
      const scene = inferPhotoWallScene(fullSrc);
      const number = index + 1;

      counts[scene.key] = (counts[scene.key] || 0) + 1;

      item.dataset.scene = scene.key;
      item.dataset.index = String(index);
      item.style.setProperty("--love-tilt", tiltValues[index % tiltValues.length]);
      item.style.setProperty("--photo-accent", scene.accent || getGalleryAccent(index));
      item.classList.add("love-photo-wall-polaroid");
      item.setAttribute("tabindex", "0");
      item.setAttribute("role", "button");
      item.setAttribute("aria-label", `查看${scene.label}的第 ${number} 张照片`);

      const meta = document.createElement("div");
      meta.className = "love-photo-wall-item-meta";
      meta.innerHTML = `
        <span class="love-photo-wall-item-badge">${scene.badge || scene.label}</span>
        <span class="love-photo-wall-item-index">${String(number).padStart(2, "0")}</span>
      `;
      item.appendChild(meta);

      entries.push({
        item,
        img,
        fullSrc,
        thumbSrc,
        alt: img.getAttribute("alt") || `${scene.label} 的回忆照片`,
        scene,
        number,
      });
    });

    const totalPhotos = entries.length;
    const activeSceneList = scenes.filter((scene) => counts[scene.key]);
    const upcoming = getUpcomingAnniversaries(1)[0];

    const shell = document.createElement("div");
    shell.className = "love-photo-wall-shell";
    shell.innerHTML = `
      <section class="love-photo-wall-hero">
        <div class="love-photo-wall-copy">
          <span class="love-photo-wall-kicker">
            <i class="fas fa-film"></i>
            Memory Film Wall
          </span>
          <h2 class="love-photo-wall-title">把很多张小瞬间，钉成一整面会发光的回忆墙</h2>
          <p class="love-photo-wall-desc">
            这里没有严格按时间排列，像真正的回忆一样，有些片段会突然跳出来，
            有些温柔则会在你慢慢往下翻的时候重新发亮。
          </p>
          <div class="love-photo-wall-stats">
            <div class="love-photo-wall-stat">
              <span class="value">${totalPhotos}</span>
              <span class="label">照片数量</span>
            </div>
            <div class="love-photo-wall-stat">
              <span class="value">${activeSceneList.length}</span>
              <span class="label">场景章节</span>
            </div>
            <div class="love-photo-wall-stat">
              <span class="value">${calcLoveDays()}</span>
              <span class="label">相爱天数</span>
            </div>
            <div class="love-photo-wall-stat">
              <span class="value">${upcoming ? upcoming.diff : "∞"}</span>
              <span class="label">${upcoming ? upcoming.name : "每天都值得纪念"}</span>
            </div>
          </div>
        </div>
        <div class="love-photo-wall-feature" id="love-photo-wall-feature">
          <div class="love-photo-wall-feature-photo-wrap">
            <img class="love-photo-wall-feature-photo" src="" alt="">
            <span class="love-photo-wall-feature-chip"></span>
          </div>
          <div class="love-photo-wall-feature-body">
            <span class="love-photo-wall-feature-label">今日翻到</span>
            <h3 class="love-photo-wall-feature-title"></h3>
            <p class="love-photo-wall-feature-desc"></p>
            <div class="love-photo-wall-feature-actions">
              <button type="button" class="love-photo-wall-action is-button" data-photo-wall-random="1">
                <i class="fas fa-shuffle"></i>
                随机翻一张
              </button>
              <button type="button" class="love-photo-wall-action is-ghost is-button" data-photo-wall-open="1">
                <i class="fas fa-expand"></i>
                点开放大看
              </button>
            </div>
          </div>
        </div>
      </section>
      <section class="love-photo-wall-toolbar">
        <div class="love-photo-wall-filters"></div>
        <div class="love-photo-wall-status">
          正在展开 <strong>${totalPhotos}</strong> / ${totalPhotos} 张回忆
        </div>
      </section>
      <section class="love-photo-wall-board">
        <div class="love-photo-wall-board-head">
          <div>
            <span class="love-photo-wall-board-kicker">自由翻阅</span>
            <h3 class="love-photo-wall-board-title">不按顺序，也刚好是回忆该有的样子</h3>
          </div>
          <p class="love-photo-wall-board-note">
            点任意一张都可以进入沉浸式查看，手机上也能直接点按钮切换前后照片。
          </p>
        </div>
      </section>
    `;

    article.insertBefore(shell, wall);
    shell.querySelector(".love-photo-wall-board")?.appendChild(wall);

    const filtersWrap = shell.querySelector(".love-photo-wall-filters");
    const status = shell.querySelector(".love-photo-wall-status");
    const feature = shell.querySelector("#love-photo-wall-feature");
    const featurePhoto = feature?.querySelector(".love-photo-wall-feature-photo");
    const featureChip = feature?.querySelector(".love-photo-wall-feature-chip");
    const featureTitle = feature?.querySelector(".love-photo-wall-feature-title");
    const featureDesc = feature?.querySelector(".love-photo-wall-feature-desc");
    const featureOpenButton = feature?.querySelector("[data-photo-wall-open='1']");

    const filterItems = [
      {
        key: "all",
        label: "全部",
        badge: "全部回忆",
        desc: "把所有被认真留下来的瞬间一起摊开来看。",
        accent: "#ff8aa5",
      },
      ...activeSceneList,
    ];

    let currentFilter = "all";
    let currentFeaturePoolIndex = 0;
    let currentFeatureEntry = entries[0] || null;
    const requestedScene = normalizeSearchText(
      getQueryParams().get("scene") ||
        decodeSafe((window.location.hash || "").replace(/^#scene-/, ""))
    );

    if (filtersWrap) {
      filtersWrap.innerHTML = filterItems
        .map((scene) => {
          const count = scene.key === "all" ? totalPhotos : counts[scene.key] || 0;
          return `
            <button type="button" class="love-photo-wall-filter${
              scene.key === "all" ? " is-active" : ""
            }" data-scene="${scene.key}">
              <span>${scene.label}</span>
              <em>${count}</em>
            </button>
          `;
        })
        .join("");
    }

    const visibleEntries = () =>
      entries.filter((entry) => currentFilter === "all" || entry.scene.key === currentFilter);

    const updateFeature = (poolIndex, withToast) => {
      const pool = visibleEntries();
      if (!pool.length || !featurePhoto || !featureChip || !featureTitle || !featureDesc) return;

      const safeIndex = ((poolIndex % pool.length) + pool.length) % pool.length;
      const entry = pool[safeIndex];
      currentFeaturePoolIndex = safeIndex;
      currentFeatureEntry = entry;

      feature.style.setProperty("--photo-accent", entry.scene.accent || "#ff8aa5");
      featurePhoto.src = entry.thumbSrc || entry.fullSrc;
      featurePhoto.alt = entry.alt;
      featureChip.textContent = `${entry.scene.label} · 第 ${entry.number} 张`;
      featureTitle.textContent = entry.scene.badge || entry.scene.label;
      featureDesc.textContent = entry.scene.desc || "这一张照片，也把那天的心情一起留了下来。";

      if (withToast) {
        showToast(`翻到了「${entry.scene.label}」的一张回忆照片`);
      }
    };

    const applyFilter = (sceneKey) => {
      currentFilter = sceneKey;
      let visibleCount = 0;

      entries.forEach((entry) => {
        const matched = sceneKey === "all" || entry.scene.key === sceneKey;
        entry.item.classList.toggle("is-hidden", !matched);
        if (matched) visibleCount += 1;
      });

      filtersWrap?.querySelectorAll(".love-photo-wall-filter").forEach((button) => {
        button.classList.toggle("is-active", button.getAttribute("data-scene") === sceneKey);
      });

      if (status) {
        status.innerHTML = `正在展开 <strong>${visibleCount}</strong> / ${totalPhotos} 张回忆`;
      }

      updateFeature(0, false);
    };

    let modal = document.getElementById("love-photo-wall-modal");
    if (modal) modal.remove();

    modal = document.createElement("div");
    modal.id = "love-photo-wall-modal";
    modal.className = "love-photo-wall-modal";
    modal.innerHTML = `
      <div class="love-photo-wall-modal-backdrop" data-modal-close="1"></div>
      <div class="love-photo-wall-modal-dialog" role="dialog" aria-modal="true" aria-label="照片查看器">
        <button type="button" class="love-photo-wall-modal-close" data-modal-close="1" aria-label="关闭看图层">
          <i class="fas fa-times"></i>
        </button>
        <button type="button" class="love-photo-wall-modal-nav is-prev" data-modal-step="-1" aria-label="上一张照片">
          <i class="fas fa-chevron-left"></i>
        </button>
        <div class="love-photo-wall-modal-stage">
          <img class="love-photo-wall-modal-image" src="" alt="">
        </div>
        <button type="button" class="love-photo-wall-modal-nav is-next" data-modal-step="1" aria-label="下一张照片">
          <i class="fas fa-chevron-right"></i>
        </button>
        <div class="love-photo-wall-modal-meta">
          <span class="love-photo-wall-modal-chip"></span>
          <strong class="love-photo-wall-modal-title"></strong>
          <p class="love-photo-wall-modal-desc"></p>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    const modalImage = modal.querySelector(".love-photo-wall-modal-image");
    const modalChip = modal.querySelector(".love-photo-wall-modal-chip");
    const modalTitle = modal.querySelector(".love-photo-wall-modal-title");
    const modalDesc = modal.querySelector(".love-photo-wall-modal-desc");
    let currentModalIndex = 0;

    const renderModal = (nextIndex) => {
      if (!modalImage || !modalChip || !modalTitle || !modalDesc) return;
      const count = entries.length;
      if (!count) return;

      currentModalIndex = ((nextIndex % count) + count) % count;
      const entry = entries[currentModalIndex];
      modal.style.setProperty("--photo-accent", entry.scene.accent || "#ff8aa5");
      modalImage.src = entry.fullSrc || entry.thumbSrc;
      modalImage.alt = entry.alt;
      modalChip.textContent = `${entry.scene.label} · 第 ${entry.number} 张`;
      modalTitle.textContent = entry.scene.badge || entry.scene.label;
      modalDesc.textContent = entry.scene.desc || "这一张照片，也把那天的心情一起留了下来。";
    };

    const openModal = (index) => {
      renderModal(index);
      modal.classList.add("is-open");
      document.body.classList.add("love-photo-wall-modal-open");
    };

    const closeModal = () => {
      modal.classList.remove("is-open");
      document.body.classList.remove("love-photo-wall-modal-open");
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

    entries.forEach((entry, index) => {
      const open = () => openModal(index);
      entry.item.addEventListener("click", open);
      entry.item.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          open();
        }
      });
    });

    filtersWrap?.querySelectorAll(".love-photo-wall-filter").forEach((button) => {
      button.addEventListener("click", () => {
        applyFilter(button.getAttribute("data-scene") || "all");
      });
    });

    feature?.querySelectorAll("[data-photo-wall-random='1']").forEach((button) => {
      button.addEventListener("click", () => {
        const pool = visibleEntries();
        if (!pool.length) return;
        let nextIndex = currentFeaturePoolIndex;
        while (pool.length > 1 && nextIndex === currentFeaturePoolIndex) {
          nextIndex = Math.floor(Math.random() * pool.length);
        }
        updateFeature(nextIndex, true);
      });
    });

    featureOpenButton?.addEventListener("click", () => {
      if (!currentFeatureEntry) return;
      const index = entries.indexOf(currentFeatureEntry);
      if (index >= 0) openModal(index);
    });

    const initialScene = filterItems.find(
      (scene) => normalizeSearchText(scene.key) === requestedScene
    );
    applyFilter(initialScene ? initialScene.key : "all");
  };

  const bootMediaExperience = () => {
    runWhenIdle(initGalleryExperience);
    runWhenIdle(initPhotoWallExperience);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootMediaExperience);
  } else {
    bootMediaExperience();
  }
  document.addEventListener("pjax:complete", bootMediaExperience);
  window.addEventListener("hexo-blog-decrypt", () => {
    setTimeout(bootMediaExperience, 80);
  });
})();
