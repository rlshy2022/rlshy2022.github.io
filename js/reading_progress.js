(function () {
  "use strict";

  const BAR_ID = "love-reading-progress";
  let listenersBound = false;

  const getArticle = () => document.getElementById("article-container");

  const ensureBar = () => {
    let bar = document.getElementById(BAR_ID);
    if (bar) return bar;

    bar = document.createElement("div");
    bar.id = BAR_ID;
    bar.setAttribute("role", "progressbar");
    bar.setAttribute("aria-label", "阅读进度");
    bar.setAttribute("aria-valuemin", "0");
    bar.setAttribute("aria-valuemax", "100");
    bar.innerHTML = '<span class="love-reading-progress-inner"></span>';
    document.body.appendChild(bar);
    return bar;
  };

  const update = () => {
    const article = getArticle();
    const bar = document.getElementById(BAR_ID);
    if (!article || !bar) return;

    const inner = bar.querySelector(".love-reading-progress-inner");
    if (!inner) return;

    const articleTop = article.offsetTop;
    const articleHeight = article.offsetHeight;
    const start = articleTop - window.innerHeight * 0.5;
    const end = articleTop + articleHeight - window.innerHeight * 0.3;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;

    let pct = 0;
    if (end > start) {
      pct = ((scrollTop - start) / (end - start)) * 100;
    }

    pct = Math.max(0, Math.min(100, pct));
    inner.style.width = `${pct.toFixed(1)}%`;
    bar.setAttribute("aria-valuenow", String(Math.round(pct)));
  };

  const boot = () => {
    if (!getArticle()) {
      document.getElementById(BAR_ID)?.remove();
      return;
    }

    ensureBar();

    if (!listenersBound) {
      window.addEventListener("scroll", update, { passive: true });
      window.addEventListener("resize", update);
      listenersBound = true;
    }

    update();
  };

  boot();
  document.addEventListener("DOMContentLoaded", boot);
  document.addEventListener("pjax:complete", boot);
  window.addEventListener("hexo-blog-decrypt", () => window.setTimeout(boot, 80));
})();
