(function () {
  "use strict";

  const runtime = window.LOVE_MEMORY_RUNTIME;
  if (!runtime) return;

  let todayPromise = null;
  let futurePromise = null;
  let timelinePromise = null;
  let yearReviewPromise = null;
  let searchPromise = null;
  let perspectiveBound = false;

  const isHomePage = () =>
    window.location.pathname === "/" || window.location.pathname === "/index.html";

  const safeArray = runtime.safeArray || ((value) => (Array.isArray(value) ? value : []));
  const escapeHtml = runtime.escapeHtml || ((value) => String(value || ""));

  const loadToday = () => {
    if (!todayPromise) {
      todayPromise = runtime.fetchJson("/memories/today-memory.json", { posts: [] });
    }
    return todayPromise;
  };

  const loadFutureLetters = () => {
    if (!futurePromise) {
      futurePromise = runtime.fetchJson("/memories/future-letters.json", {
        letters: [],
        unlockedCount: 0,
        pendingCount: 0,
      });
    }
    return futurePromise;
  };

  const loadTimeline = () => {
    if (!timelinePromise) {
      timelinePromise = runtime.fetchJson("/memories/love-timeline.json", { events: [] });
    }
    return timelinePromise;
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

  const loadSearchIndex = () => {
    if (!searchPromise) {
      searchPromise = runtime.fetchJson("/memories/search-index.json", {
        itemCount: 0,
        scenes: [],
        years: [],
      });
    }
    return searchPromise;
  };

  const updateHomeHero = (perspective) => {
    if (!perspective || document.body.classList.contains("love-special-day-active")) return;

    const title = document.querySelector(".home-story-title");
    const desc = document.querySelector(".home-story-desc");
    if (title && perspective.heroTitle) {
      title.textContent = perspective.heroTitle;
    }
    if (desc && perspective.heroDesc) {
      desc.textContent = perspective.heroDesc;
    }
  };

  const createEntryCard = (item) => `
    <a class="home-memory-portal-card${item.featured ? " is-featured" : ""}" href="${item.href}">
      <span class="home-memory-portal-badge">${item.badge}</span>
      <strong>${item.title}</strong>
      <p>${item.desc}</p>
      <span class="home-memory-portal-meta">${item.meta}</span>
    </a>
  `;

  const buildPortal = ({ meta, perspective, today, futureLetters, timeline, yearReview, searchData }) => {
    const recentPosts = document.getElementById("recent-posts");
    if (!recentPosts) return;

    recentPosts.querySelectorAll(".home-memory-portal").forEach((node) => node.remove());
    updateHomeHero(perspective);

    const todayEntries = safeArray(today && today.posts).slice(0, 3);
    const latestToday = todayEntries[0];
    const routes = safeArray(meta && meta.scenes).filter((scene) => scene.passport);
    const latestUnlockedLetter = safeArray(futureLetters && futureLetters.letters).find((item) => item.unlocked);
    const eventCount = safeArray(timeline && timeline.events).length;
    const latestYear = safeArray(yearReview && yearReview.years)[0];
    const exploration = runtime.getExplorationSummary
      ? runtime.getExplorationSummary(safeArray(searchData && searchData.items))
      : null;
    const recentEntries = exploration ? safeArray(exploration.recent).slice(0, 3) : [];
    const nextUnvisited = exploration && exploration.nextUnvisited;

    const cards = [
      {
        featured: true,
        badge: "回忆入口",
        title: "回忆中心",
        desc: perspective && perspective.hubDesc ? perspective.hubDesc : "时间线、旅行护照、相册、照片墙和未来信件都在这里。",
        meta: `${meta.scenes.length || 0} 个场景入口`,
        href: "/memory-hub/",
      },
      {
        badge: "这一天的今天",
        title: latestToday ? latestToday.title : "今天的日期记录",
        desc: latestToday && latestToday.summary
          ? latestToday.summary
          : "按今天的月份和日期自动挑出相关记录。",
        meta: todayEntries.length ? `今天可翻 ${todayEntries.length} 条回忆` : "按日期自动挑选",
        href: latestToday && latestToday.url ? latestToday.url : "/memory-hub/",
      },
      {
        badge: "旅行档案",
        title: "旅行护照",
        desc: perspective && perspective.passportNote
          ? perspective.passportNote
          : "按城市整理旅行路线，每一站都能回到文章和照片。",
        meta: `${routes.length} 枚旅行印章`,
        href: "/travel-passport/",
      },
      {
        badge: "未来信件",
        title: latestUnlockedLetter ? latestUnlockedLetter.title : "写给未来的信",
        desc: latestUnlockedLetter && latestUnlockedLetter.summary
          ? latestUnlockedLetter.summary
          : "把写给之后日期的话放在这里，到时间再打开。",
        meta: `${futureLetters.unlockedCount || 0} 封已解锁 / ${futureLetters.pendingCount || 0} 封待开启`,
        href: "/future-letters/",
      },
      {
        badge: "年度回顾",
        title: latestYear ? `${latestYear.year} 年回顾` : "年度回顾",
        desc: latestYear
          ? `${latestYear.year} 年的旅行、节日和文章已经整理成年度页。`
          : "按年份查看旅行、节日、文章和高光片段。",
        meta: `${yearReview.yearCount || 0} 个年份`,
        href: "/year-review/",
      },
      {
        badge: "深度检索",
        title: "回忆搜索",
        desc: "按年份、场景、类型和关键词把回忆重新筛出来，找某个地点或某个阶段会更快。",
        meta: `${searchData.itemCount || 0} 条可检索内容`,
        href: "/search-memory/",
      },
    ];

    const section = document.createElement("section");
    section.className = "home-memory-portal";
    section.innerHTML = `
      <div class="home-memory-portal-header">
        <div>
          <span class="home-memory-portal-kicker">Story Portal</span>
          <h2>${(perspective && perspective.hubTitle) || "先从最值得点开的几扇门进去"}</h2>
          <p>${(perspective && perspective.hubDesc) || "时间线、旅行护照、未来信件、年度回顾和今天的回忆都放在首页第一排。"}</p>
        </div>
        <div class="home-memory-portal-stats">
          <div><strong>${eventCount}</strong><span>时间节点</span></div>
          <div><strong>${meta.scenes.length || 0}</strong><span>场景入口</span></div>
          <div><strong>${yearReview.yearCount || 0}</strong><span>年度页</span></div>
        </div>
      </div>
      <div class="home-memory-portal-switcher" data-role="switcher"></div>
      <div class="home-memory-portal-grid is-six">
        ${cards.map(createEntryCard).join("")}
      </div>
      ${
        exploration
          ? `
            <section class="home-memory-continue">
              <div class="home-memory-continue-head">
                <div>
                  <span class="home-memory-portal-kicker">Continue</span>
                  <h3>继续看上次没看完的内容</h3>
                  <p>本地记录只保存在当前浏览器里，用来帮你接着翻上次看过的公开回忆。</p>
                </div>
                <div class="home-memory-progress-pill">
                  <strong>${exploration.percent}%</strong>
                  <span>${exploration.visitedCount}/${exploration.totalCount || 0} 已看</span>
                </div>
              </div>
              <div class="home-memory-progress-bar" aria-hidden="true">
                <span style="width:${Math.max(0, Math.min(100, exploration.percent))}%"></span>
              </div>
              <div class="home-memory-continue-grid">
                ${
                  recentEntries.length
                    ? recentEntries
                        .map(
                          (item) => `
                            <a class="home-memory-continue-card" href="${item.url || "/memory-hub/"}">
                              <span>${escapeHtml(item.badge || item.type || "最近看过")}</span>
                              <strong>${escapeHtml(item.title || "未命名回忆")}</strong>
                              <small>${escapeHtml(item.isoDate || item.scene || "继续翻这一页")}</small>
                            </a>
                          `
                        )
                        .join("")
                    : `
                        <a class="home-memory-continue-card" href="${nextUnvisited && nextUnvisited.url ? nextUnvisited.url : "/memory-hub/"}">
                          <span>从这里开始</span>
                          <strong>${escapeHtml((nextUnvisited && nextUnvisited.title) || "先打开第一段公开回忆")}</strong>
                          <small>探索记录会在访问后自动点亮</small>
                        </a>
                      `
                }
                <a class="home-memory-continue-card is-action" href="${nextUnvisited && nextUnvisited.url ? nextUnvisited.url : "/memory-gacha/"}">
                  <span>继续未看</span>
                  <strong>${escapeHtml((nextUnvisited && nextUnvisited.title) || "去扭蛋机抽一段回忆")}</strong>
                  <small>${nextUnvisited ? "打开下一段还没点亮的公开回忆" : "当前浏览器还没有更多未看记录"}</small>
                </a>
              </div>
            </section>
          `
          : ""
      }
    `;

    section.querySelector('[data-role="switcher"]').appendChild(
      runtime.createPerspectiveSwitcher({ compact: true, label: "切换视角" })
    );

    const hero = recentPosts.querySelector(".home-story-hero");
    if (hero && hero.nextSibling) {
      recentPosts.insertBefore(section, hero.nextSibling);
    } else if (hero) {
      recentPosts.appendChild(section);
    } else {
      recentPosts.insertBefore(section, recentPosts.firstChild || null);
    }
  };

  const init = () => {
    if (!isHomePage()) return;

    Promise.all([
      runtime.getMeta(),
      runtime.getPerspective(),
      loadToday(),
      loadFutureLetters(),
      loadTimeline(),
      loadYearReview(),
      loadSearchIndex(),
    ]).then(([meta, perspective, today, futureLetters, timeline, yearReview, searchData]) => {
      if (!document.getElementById("recent-posts")) return;
      buildPortal({ meta, perspective, today, futureLetters, timeline, yearReview, searchData });
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
