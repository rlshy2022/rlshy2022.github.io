(function () {
  "use strict";

  const core = window.LOVE_EXPERIENCE_CORE;
  if (!core) return;

  const {
    LOVE_CFG,
    runWhenIdle,
    safeArray,
    formatMonthDay,
    formatIsoDate,
    isHomePage,
    calcLoveDays,
    loadTodayMemoryData,
    inferMemorySceneMeta,
    getTodayMemoryEntries,
    getTodayMemorySubtitle,
    getTodayMemoryBadge,
    getTodayMemoryAnniversary,
    getUpcomingAnniversaries,
    getHomeMemoryDeck,
    pickAnotherIndex,
    readSiteCounter,
    showToast,
    getNextTodayMemoryRenderToken,
  } = core;

  const initHomeStoryHero = () => {
    if (!isHomePage()) return;

    const recentPosts = document.getElementById("recent-posts");
    if (!recentPosts) return;

    document.querySelectorAll("#site-info > .home-story-hero").forEach((node) => node.remove());
    document
      .querySelectorAll("#content-inner > .home-story-hero")
      .forEach((node) => node.remove());

    if (recentPosts.querySelector(".home-story-hero")) return;

    const upcoming = getUpcomingAnniversaries(1)[0];
    const articleCount = readSiteCounter(1, "11");
    const tagCount = readSiteCounter(2, "19");
    const cityCount = Object.keys((LOVE_CFG.map && LOVE_CFG.map.geoCoordMap) || {}).length || 6;
    const loveDays = calcLoveDays();

    const hero = document.createElement("div");
    hero.className = "home-story-hero";
    hero.innerHTML = `
      <div class="home-story-main">
        <span class="home-story-kicker">
          <i class="fas fa-book-open"></i>
          恋爱纪念册 · ongoing
        </span>
        <h2 class="home-story-title">相遇、见面、旅行和日常记录</h2>
        <p class="home-story-desc">
          这里整理了相遇、旅行、节日、礼物和日常照片，
          想找某一站时可以直接从相册、时间轴和足迹地图进入。
        </p>
        <div class="home-story-actions">
          <a href="/gallery/" class="home-story-link">
            <i class="fas fa-images"></i>
            翻看相册
          </a>
          <a href="/love-map/" class="home-story-link is-ghost">
            <i class="fas fa-map-marked-alt"></i>
            打开足迹
          </a>
        </div>
      </div>
      <div class="home-story-side">
        <div class="home-story-next">
          <span class="label">下一份期待</span>
          <strong>${upcoming ? upcoming.name : "和你见面的下一天"}</strong>
          <span>${upcoming ? `还有 ${upcoming.diff} 天` : "每一天都值得纪念"}</span>
        </div>
        <div class="home-story-stats">
          <div class="home-story-stat">
            <span class="value">${loveDays}</span>
            <span class="label">相爱天数</span>
          </div>
          <div class="home-story-stat">
            <span class="value">${articleCount}</span>
            <span class="label">小情书</span>
          </div>
          <div class="home-story-stat">
            <span class="value">${cityCount}</span>
            <span class="label">足迹城市</span>
          </div>
          <div class="home-story-stat">
            <span class="value">${tagCount}</span>
            <span class="label">关键词</span>
          </div>
        </div>
      </div>
    `;

    recentPosts.insertBefore(hero, recentPosts.querySelector(".recent-post-items") || null);
  };

  const getLatestHomePostV2 = () => {
    const card = document.querySelector("#recent-posts .recent-post-items .recent-post-item");
    if (!card) {
      return {
        title: "从最新写下的一页开始",
        url: "/archives/",
        date: "",
        category: "恋爱日记",
      };
    }

    const titleLink = card.querySelector(".article-title");
    const date = card.querySelector("time")?.textContent?.trim() || "";
    const category =
      card.querySelector(".article-meta__categories:last-of-type")?.textContent?.trim() ||
      "恋爱日记";

    return {
      title: titleLink?.textContent?.trim() || "从最新写下的一页开始",
      url: titleLink?.getAttribute("href") || "/archives/",
      date,
      category,
    };
  };

  const initHomeChapterShelf = () => {
    if (!isHomePage()) return;

    const recentPosts = document.getElementById("recent-posts");
    if (!recentPosts) return;

    recentPosts
      .querySelectorAll(".home-chapter-shelf")
      .forEach((node) => node.parentElement === recentPosts && node.remove());
    document
      .querySelectorAll("#content-inner > .home-chapter-shelf")
      .forEach((node) => node.remove());

    if (recentPosts.querySelector(".home-chapter-shelf")) return;

    const latest = getLatestHomePostV2();
    const upcoming = getUpcomingAnniversaries(1)[0];
    const cityCount = Object.keys((LOVE_CFG.map && LOVE_CFG.map.geoCoordMap) || {}).length || 6;
    const deckCount = getHomeMemoryDeck().length || 12;

    const cards = [
      {
        featured: true,
        accent: "#e39aa9",
        icon: "fas fa-feather-pointed",
        badge: "最新文章",
        title: latest.title,
        desc: "从最近更新的文章开始看。",
        meta: latest.category || "恋爱日记",
        note: latest.date ? `更新于 ${latest.date}` : "刚刚更新",
        href: latest.url || "/archives/",
      },
      {
        accent: "#8fb3c2",
        icon: "fas fa-images",
        badge: "纪念相册",
        title: "把画面翻成一册",
        desc: `已经整理 ${deckCount} 份回忆卡片，可以从相册继续看。`,
        meta: "去看相册",
        note: "甜蜜画面",
        href: "/gallery/",
      },
      {
        accent: "#7fb4a4",
        icon: "fas fa-map-marked-alt",
        badge: "足迹地图",
        title: "按城市看路线",
        desc: `足迹地图已经标出 ${cityCount} 座相关城市。`,
        meta: "打开地图",
        note: "旅行记录",
        href: "/love-map/",
      },
      {
        accent: "#d89a79",
        icon: "fas fa-calendar-alt",
        badge: "纪念日历",
        title: upcoming ? upcoming.name : "把特别的日子留好",
        desc: upcoming
          ? `距离下一次特别的日子还有 ${upcoming.diff} 天。`
          : "把值得纪念的日子集中放在日历里。",
        meta: "翻看日历",
        note: upcoming ? "继续期待" : "纪念一下",
        href: "/love-calendar/",
      },
      {
        accent: "#9b8bd1",
        icon: "fas fa-clock-rotate-left",
        badge: "恋爱时间轴",
        title: "按时间看记录",
        desc: "从相遇、第一次见面，到最近一次旅行，都可以按时间查看。",
        meta: "打开时间轴",
        note: "长期更新",
        href: "/love-timeline/",
      },
    ];

    const section = document.createElement("section");
    section.className = "home-chapter-shelf";
    section.innerHTML = `
      <div class="home-chapter-header">
        <div>
          <span class="home-chapter-kicker">内容入口</span>
          <h2 class="home-chapter-title">从这里进入相册、地图、日历和时间轴</h2>
        </div>
        <p class="home-chapter-subtitle">
          常用入口放在首页，想看照片、路线或某个日期时不用再翻菜单。
        </p>
      </div>
      <div class="home-chapter-grid">
        ${cards
          .map(
            (card) => `
          <a
            href="${card.href}"
            class="home-chapter-card${card.featured ? " is-featured" : ""}"
            style="--chapter-accent:${card.accent};"
          >
            <span class="home-chapter-icon">
              <i class="${card.icon}"></i>
            </span>
            <span class="home-chapter-badge">${card.badge}</span>
            <h3 class="home-chapter-card-title">${card.title}</h3>
            <p class="home-chapter-card-desc">${card.desc}</p>
            <div class="home-chapter-meta">
              <span>${card.meta}</span>
              <span>${card.note}</span>
            </div>
          </a>
        `
          )
          .join("")}
      </div>
    `;

    recentPosts.insertBefore(section, recentPosts.querySelector(".recent-post-items") || null);
  };

  const initHomeMemoryShowcaseV2 = () => {
    if (!isHomePage()) return;

    const recentPosts = document.getElementById("recent-posts");
    if (!recentPosts) return;

    recentPosts
      .querySelectorAll(".home-memory-showcase")
      .forEach((node) => node.parentElement === recentPosts && node.remove());
    document
      .querySelectorAll("#content-inner > .home-memory-showcase")
      .forEach((node) => node.remove());

    if (recentPosts.querySelector(".home-memory-showcase")) return;

    const deck = getHomeMemoryDeck();
    if (!deck.length) return;

    const section = document.createElement("section");
    section.className = "home-memory-showcase home-memory-showcase-v2";
    section.innerHTML = `
      <div class="home-memory-header">
        <div>
          <span class="home-memory-kicker">回忆抽卡</span>
          <h2 class="home-memory-title">随机打开一张回忆卡</h2>
        </div>
        <p class="home-memory-subtitle">
          点一下随机切换，再从卡片进入对应文章。
        </p>
      </div>
      <div class="home-memory-card">
        <div class="home-memory-stage">
          <div class="home-memory-stack" aria-hidden="true">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <button
            type="button"
            class="home-memory-flipcard"
            aria-pressed="false"
            aria-label="翻开今天的回忆卡"
          >
            <span class="home-memory-flip-inner">
              <span class="home-memory-face home-memory-face-front">
                <span class="home-memory-seal">Memory Draw</span>
                <strong class="home-memory-cover-title">今天会抽到哪一页？</strong>
                <span class="home-memory-cover-note">点一下翻面，或重新抽一张。</span>
                <span class="home-memory-cover-index"></span>
              </span>
              <span class="home-memory-face home-memory-face-back">
                <span class="home-memory-pin">只属于我们</span>
                <img class="home-memory-image" src="" alt="">
                <span class="home-memory-date"></span>
              </span>
            </span>
          </button>
        </div>
        <div class="home-memory-body">
          <span class="home-memory-mood"></span>
          <h3 class="home-memory-card-title"></h3>
          <p class="home-memory-summary"></p>
          <blockquote class="home-memory-quote"></blockquote>
          <div class="home-memory-actions">
            <button type="button" class="home-memory-random">
              <i class="fas fa-dice"></i>
              再抽一张
            </button>
            <button type="button" class="home-memory-toggle">
              <i class="fas fa-book-open"></i>
              翻开卡片
            </button>
            <a href="/archives/" class="home-memory-link">
              去看原文
              <i class="fas fa-chevron-right"></i>
            </a>
          </div>
        </div>
      </div>
    `;

    recentPosts.insertBefore(section, recentPosts.querySelector(".recent-post-items") || null);

    const image = section.querySelector(".home-memory-image");
    const date = section.querySelector(".home-memory-date");
    const mood = section.querySelector(".home-memory-mood");
    const title = section.querySelector(".home-memory-card-title");
    const summary = section.querySelector(".home-memory-summary");
    const quote = section.querySelector(".home-memory-quote");
    const randomBtn = section.querySelector(".home-memory-random");
    const toggleBtn = section.querySelector(".home-memory-toggle");
    const flipCard = section.querySelector(".home-memory-flipcard");
    const coverIndex = section.querySelector(".home-memory-cover-index");
    const link = section.querySelector(".home-memory-link");

    const syncRevealState = (revealed) => {
      section.classList.toggle("is-revealed", revealed);
      flipCard.setAttribute("aria-pressed", revealed ? "true" : "false");
      flipCard.setAttribute("aria-label", revealed ? "合上这张回忆卡" : "翻开这张回忆卡");
      toggleBtn.innerHTML = revealed
        ? `<i class="fas fa-book"></i> 合上卡片`
        : `<i class="fas fa-book-open"></i> 翻开卡片`;
    };

    const playDrawAnimation = () => {
      section.classList.remove("is-drawing");
      void section.offsetWidth;
      section.classList.add("is-drawing");
      clearTimeout(section.__drawTimer);
      section.__drawTimer = setTimeout(() => {
        section.classList.remove("is-drawing");
      }, 760);
    };

    const updateCard = (index, withToast, reveal) => {
      const item = deck[index];
      if (!item) return;

      section.dataset.currentIndex = String(index);
      image.src = item.image || "";
      image.alt = `${item.title || "这段回忆"} 的照片`;
      date.textContent = item.date || "已保存的一天";
      mood.textContent = item.mood || "回忆切片";
      title.textContent = item.title || "这段回忆";
      summary.textContent =
        item.summary || "这张卡片对应一段已经保存的记录。";
      quote.textContent =
        item.quote || "以后还可以从这里回到那一天。";
      coverIndex.textContent = `CARD ${String(index + 1).padStart(2, "0")} / ${String(
        deck.length
      ).padStart(2, "0")}`;
      link.href = item.url || "/archives/";
      syncRevealState(Boolean(reveal));

      if (withToast) {
        showToast(`抽到了「${item.title || "这一页"}」这张回忆卡`);
      }
    };

    const initialIndex = new Date().getDate() % deck.length;
    updateCard(initialIndex, false, false);

    randomBtn.addEventListener("click", () => {
      const currentIndex = Number(section.dataset.currentIndex || 0);
      playDrawAnimation();
      updateCard(pickAnotherIndex(deck, currentIndex), true, true);
    });

    flipCard.addEventListener("click", () => {
      syncRevealState(!section.classList.contains("is-revealed"));
    });

    toggleBtn.addEventListener("click", () => {
      syncRevealState(!section.classList.contains("is-revealed"));
    });
  };

  const createTodayMemoryItem = (item, todayMonth) => {
    const sceneMeta = inferMemorySceneMeta(item);
    const card = document.createElement("article");
    card.className = "home-today-memory-item";

    const thumb = document.createElement("div");
    thumb.className = "home-today-memory-thumb";

    if (item.cover) {
      const image = document.createElement("img");
      image.src = item.cover;
      image.alt = `${item.title || "这段回忆"} 的封面`;
      image.loading = "lazy";
      thumb.appendChild(image);
    } else {
      thumb.innerHTML = '<span class="home-today-memory-thumb-fallback"><i class="fas fa-image"></i></span>';
    }

    const body = document.createElement("div");
    body.className = "home-today-memory-item-body";

    const meta = document.createElement("div");
    meta.className = "home-today-memory-item-meta";

    const badge = document.createElement("span");
    badge.className = "home-today-memory-item-badge";
    badge.textContent = getTodayMemoryBadge(item, todayMonth);

    const date = document.createElement("time");
    date.className = "home-today-memory-item-date";
    date.dateTime = item.isoDate || "";
    date.textContent = formatIsoDate(item.isoDate);

    meta.appendChild(badge);
    meta.appendChild(date);

    const title = document.createElement("h3");
    title.className = "home-today-memory-item-title";
    title.textContent = item.title || "这段回忆";

    const summary = document.createElement("p");
    summary.className = "home-today-memory-item-summary";
    summary.textContent =
      item.summary || "那一天已经留下记录，现在可以重新打开。";

    const footer = document.createElement("div");
    footer.className = "home-today-memory-item-footer";

    const tag = document.createElement("span");
    tag.className = "home-today-memory-item-tag";
    tag.textContent =
      safeArray(item.categories)[safeArray(item.categories).length - 1] ||
      safeArray(item.tags)[0] ||
      formatMonthDay(item.month, item.day);

    const action = document.createElement("span");
    action.className = "home-today-memory-item-action";
    action.innerHTML = '去看看 <i class="fas fa-chevron-right"></i>';

    footer.appendChild(tag);
    footer.appendChild(action);

    body.appendChild(meta);
    body.appendChild(title);
    body.appendChild(summary);
    body.appendChild(footer);

    card.appendChild(thumb);
    card.appendChild(body);

    return card;
  };

  const createTodayMemoryItemV2 = (item, todayMonth) => {
    const sceneMeta = inferMemorySceneMeta(item);
    const card = document.createElement("article");
    card.className = "home-today-memory-item";

    const thumb = document.createElement("div");
    thumb.className = "home-today-memory-thumb";

    if (item.cover) {
      const image = document.createElement("img");
      image.src = item.cover;
      image.alt = `${item.title || "这段回忆"} 的封面`;
      image.loading = "lazy";
      thumb.appendChild(image);
    } else {
      thumb.innerHTML =
        '<span class="home-today-memory-thumb-fallback"><i class="fas fa-image"></i></span>';
    }

    const body = document.createElement("div");
    body.className = "home-today-memory-item-body";

    const meta = document.createElement("div");
    meta.className = "home-today-memory-item-meta";

    const badge = document.createElement("span");
    badge.className = "home-today-memory-item-badge";
    badge.textContent = getTodayMemoryBadge(item, todayMonth);

    const date = document.createElement("time");
    date.className = "home-today-memory-item-date";
    date.dateTime = item.isoDate || "";
    date.textContent = formatIsoDate(item.isoDate);

    meta.appendChild(badge);
    meta.appendChild(date);

    const title = document.createElement("h3");
    title.className = "home-today-memory-item-title";
    title.textContent = item.title || "这段回忆";

    const summary = document.createElement("p");
    summary.className = "home-today-memory-item-summary";
    summary.textContent =
      item.summary || "那一天已经留下记录，现在可以重新打开。";

    const related = document.createElement("div");
    related.className = "home-today-memory-item-related";

    if (sceneMeta) {
      related.innerHTML = `
        <a href="${sceneMeta.galleryUrl}" class="home-today-memory-item-link is-soft">
          <i class="fas fa-images"></i>
          看相册
        </a>
        <a href="${sceneMeta.photoWallUrl}" class="home-today-memory-item-link is-soft">
          <i class="fas fa-film"></i>
          看照片墙
        </a>
      `;
    }

    const footer = document.createElement("div");
    footer.className = "home-today-memory-item-footer";

    const tag = document.createElement("span");
    tag.className = "home-today-memory-item-tag";
    tag.textContent =
      safeArray(item.categories)[safeArray(item.categories).length - 1] ||
      safeArray(item.tags)[0] ||
      formatMonthDay(item.month, item.day);

    const action = document.createElement("a");
    action.className = "home-today-memory-item-action";
    action.href = item.url || "/archives/";
    action.innerHTML = '去看看 <i class="fas fa-chevron-right"></i>';

    footer.appendChild(tag);
    footer.appendChild(action);

    body.appendChild(meta);
    body.appendChild(title);
    body.appendChild(summary);
    if (sceneMeta) body.appendChild(related);
    body.appendChild(footer);

    card.appendChild(thumb);
    card.appendChild(body);

    return card;
  };

  const initHomeTodayMemoryPanel = () => {
    if (!isHomePage()) return;

    const recentPosts = document.getElementById("recent-posts");
    if (!recentPosts) return;

    recentPosts
      .querySelectorAll(".home-today-memory")
      .forEach((node) => node.parentElement === recentPosts && node.remove());
    document
      .querySelectorAll("#content-inner > .home-today-memory")
      .forEach((node) => node.remove());

    const renderToken = getNextTodayMemoryRenderToken();
    recentPosts.dataset.todayMemoryToken = renderToken;

    loadTodayMemoryData().then((posts) => {
      if (!document.body.contains(recentPosts)) return;
      if (recentPosts.dataset.todayMemoryToken !== renderToken) return;
      if (recentPosts.querySelector(".home-today-memory")) return;

      const entries = getTodayMemoryEntries(posts, 3);
      if (!entries.length) return;

      const now = new Date();
      const todayMonth = now.getMonth() + 1;
      const todayDay = now.getDate();
      const anniversary = getTodayMemoryAnniversary();

      const section = document.createElement("section");
      section.className = "home-today-memory";
      section.innerHTML = `
        <div class="home-today-memory-header">
          <div>
            <span class="home-today-memory-kicker">今日回忆</span>
            <h2 class="home-today-memory-title">${formatMonthDay(todayMonth, todayDay)}，适合翻开这些页</h2>
          </div>
          <p class="home-today-memory-subtitle">${getTodayMemorySubtitle(entries)}</p>
        </div>
        <div class="home-today-memory-grid">
          <div class="home-today-memory-list"></div>
          <aside class="home-today-memory-side">
            <div class="home-today-memory-side-card">
              <span class="home-today-memory-side-kicker"></span>
              <h3 class="home-today-memory-side-title"></h3>
              <p class="home-today-memory-side-desc"></p>
              <div class="home-today-memory-side-actions">
                <a href="/love-calendar/" class="home-today-memory-side-link">去纪念日历</a>
                <a href="/archives/" class="home-today-memory-side-link is-ghost">翻全部回忆</a>
              </div>
            </div>
          </aside>
        </div>
      `;

      const list = section.querySelector(".home-today-memory-list");
      entries.forEach((item) => {
        list.appendChild(createTodayMemoryItemV2(item, todayMonth));
      });

      section.querySelector(".home-today-memory-side-kicker").textContent = anniversary.kicker;
      section.querySelector(".home-today-memory-side-title").textContent = anniversary.title;
      section.querySelector(".home-today-memory-side-desc").textContent = anniversary.desc;

      const sideActions = section.querySelector(".home-today-memory-side-actions");
      if (sideActions && !sideActions.querySelector('[href="/love-timeline/"]')) {
        const timelineLink = document.createElement("a");
        timelineLink.href = "/love-timeline/";
        timelineLink.className = "home-today-memory-side-link is-ghost";
        timelineLink.textContent = "去时间轴";
        sideActions.insertBefore(timelineLink, sideActions.lastElementChild || null);
      }

      recentPosts.insertBefore(section, recentPosts.querySelector(".recent-post-items") || null);
    });
  };

  // ---------- 3. 首页随机回忆卡 ----------
  const initHomeMemoryShowcase = () => {
    if (!isHomePage()) return;

    const recentPosts = document.getElementById("recent-posts");
    if (!recentPosts) return;

    document
      .querySelectorAll("#content-inner > .home-memory-showcase")
      .forEach((node) => node.remove());

    if (recentPosts.querySelector(".home-memory-showcase")) return;

    const deck = getHomeMemoryDeck();
    if (!deck.length) return;

    const section = document.createElement("section");
    section.className = "home-memory-showcase";
    section.innerHTML = `
      <div class="home-memory-header">
        <div>
          <span class="home-memory-kicker">随机回忆</span>
          <h2 class="home-memory-title">今天随机看哪一页？</h2>
        </div>
        <p class="home-memory-subtitle">
          点一下随机选择一段已保存的记录。
        </p>
      </div>
      <div class="home-memory-card">
        <div class="home-memory-visual">
          <span class="home-memory-pin">只属于我们</span>
          <img class="home-memory-image" src="" alt="">
          <span class="home-memory-date"></span>
        </div>
        <div class="home-memory-body">
          <span class="home-memory-mood"></span>
          <h3 class="home-memory-card-title"></h3>
          <p class="home-memory-summary"></p>
          <blockquote class="home-memory-quote"></blockquote>
          <div class="home-memory-actions">
            <button type="button" class="home-memory-random">
              <i class="fas fa-dice"></i>
              换一段回忆
            </button>
            <a href="/archives/" class="home-memory-link">
              去看看原文
              <i class="fas fa-chevron-right"></i>
            </a>
          </div>
        </div>
      </div>
    `;

    recentPosts.insertBefore(section, recentPosts.querySelector(".recent-post-items") || null);

    const image = section.querySelector(".home-memory-image");
    const date = section.querySelector(".home-memory-date");
    const mood = section.querySelector(".home-memory-mood");
    const title = section.querySelector(".home-memory-card-title");
    const summary = section.querySelector(".home-memory-summary");
    const quote = section.querySelector(".home-memory-quote");
    const randomBtn = section.querySelector(".home-memory-random");
    const link = section.querySelector(".home-memory-link");

    const updateCard = (index, withToast) => {
      const item = deck[index];
      if (!item) return;

      section.dataset.currentIndex = String(index);
      image.src = item.image || "";
      image.alt = `${item.title} 的回忆照片`;
      date.textContent = item.date || "已保存的一天";
      mood.textContent = item.mood || "回忆切片";
      title.textContent = item.title || "这段回忆";
      summary.textContent = item.summary || "这张卡片对应一段已经保存的记录。";
      quote.textContent = item.quote || "以后还可以从这里回到那一天。";
      link.href = item.url || "/archives/";

      if (withToast) {
        showToast(`随机翻到了「${item.title}」这一页`);
      }
    };

    const initialIndex = new Date().getDate() % deck.length;
    updateCard(initialIndex, false);

    randomBtn.addEventListener("click", () => {
      const currentIndex = Number(section.dataset.currentIndex || 0);
      updateCard(pickAnotherIndex(deck, currentIndex), true);
    });
  };

  // ---------- 4. 相册页：解锁后的纪念册体验 ----------

  const bootHomeExperience = () => {
    initHomeStoryHero();
    initHomeChapterShelf();
    initHomeMemoryShowcaseV2();
    runWhenIdle(initHomeTodayMemoryPanel);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootHomeExperience);
  } else {
    bootHomeExperience();
  }
  document.addEventListener("pjax:complete", bootHomeExperience);
})();
