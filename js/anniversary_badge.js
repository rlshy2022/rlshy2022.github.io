(function () {
  "use strict";

  const LOVE_CFG = window.LOVE_CONFIG || {};

  const getUpcomingAnniversaries = (limit = 3) => {
    const anniversaries = Array.isArray(LOVE_CFG.anniversaries)
      ? LOVE_CFG.anniversaries.slice()
      : [];
    if (!anniversaries.length) return [];

    const now = new Date();
    const year = now.getFullYear();
    const current = new Date(year, now.getMonth(), now.getDate());

    return anniversaries
      .map((item) => {
        let target = new Date(year, Number(item.month) - 1, Number(item.day));
        if (target < current) {
          target = new Date(year + 1, Number(item.month) - 1, Number(item.day));
        }

        return {
          ...item,
          diff: Math.ceil((target - current) / (1000 * 60 * 60 * 24)),
        };
      })
      .sort((a, b) => a.diff - b.diff)
      .slice(0, limit);
  };

  const render = () => {
    const upcoming = getUpcomingAnniversaries(3);
    if (!upcoming.length) return;
    if (document.getElementById("love-anniv-badge")) return;

    const next = upcoming[0];
    const badge = document.createElement("button");
    badge.id = "love-anniv-badge";
    badge.type = "button";
    badge.setAttribute("aria-expanded", "false");
    badge.setAttribute("aria-controls", "love-anniv-panel");
    badge.innerHTML = `
      <span class="love-anniv-label">下一个纪念日</span>
      <span class="love-anniv-name">${window.LOVE_UI_UTILS?.escapeHtml ? window.LOVE_UI_UTILS.escapeHtml(next.name) : next.name}</span>
      <span class="love-anniv-days">还有 ${next.diff} 天</span>
    `;

    const panel = document.createElement("div");
    panel.id = "love-anniv-panel";
    panel.innerHTML = `
      <div class="love-anniv-panel-header">
        <span>接下来要记得的日子</span>
        <button type="button" class="love-anniv-link" data-href="/love-calendar/">
          去纪念日历 <i class="fas fa-chevron-right"></i>
        </button>
      </div>
      <div class="love-anniv-list">
        ${upcoming
          .map((item) => {
            const month = String(item.month).padStart(2, "0");
            const day = String(item.day).padStart(2, "0");
            const name = window.LOVE_UI_UTILS?.escapeHtml ? window.LOVE_UI_UTILS.escapeHtml(item.name) : item.name;
            return `<div class="love-anniv-item">
              <div class="love-anniv-item-name">${name}</div>
              <div class="love-anniv-item-meta">${month}-${day} · 还有 ${item.diff} 天</div>
            </div>`;
          })
          .join("")}
      </div>
    `;

    document.body.appendChild(badge);
    document.body.appendChild(panel);

    const calendarLink = panel.querySelector(".love-anniv-link");
    calendarLink?.addEventListener("click", () => {
      window.location.href = calendarLink.getAttribute("data-href") || "/love-calendar/";
    });

    let open = false;
    badge.addEventListener("click", () => {
      open = !open;
      panel.style.display = open ? "block" : "none";
      badge.setAttribute("aria-expanded", String(open));
    });
  };

  render();
  document.addEventListener("DOMContentLoaded", render);
  document.addEventListener("pjax:complete", render);
})();
