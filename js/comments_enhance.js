(function () {
  "use strict";

  const LOVE_CFG = window.LOVE_CONFIG || {};
  const ui = window.LOVE_UI_UTILS || {};

  const isCommentsPage = () => {
    const path = window.location.pathname || "";
    return path === "/comments/" || path === "/comments/index.html";
  };

  const getTwikooRoot = () =>
    document.getElementById("twikoo-wrap") ||
    document.querySelector("#post-comment #twikoo") ||
    document.getElementById("twikoo");

  const initTwikooLazyPlaceholder = () => {
    if (!isCommentsPage()) return;

    const twikoo = getTwikooRoot();
    const wrapper = document.querySelector(".comments-card-wrapper");
    const placeholder = document.querySelector(".comments-twikoo-placeholder");
    if (!twikoo || !wrapper || !placeholder) return;
    if (wrapper.dataset.twikooLazyBound === "1") return;

    const reveal = () => {
      twikoo.classList.remove("twikoo-hidden");
      placeholder.remove();
    };

    twikoo.classList.add("twikoo-hidden");
    wrapper.dataset.twikooLazyBound = "1";

    if (!("IntersectionObserver" in window)) {
      reveal();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        reveal();
        observer.disconnect();
      },
      {
        rootMargin: "100px 0px",
        threshold: 0.1,
      }
    );

    observer.observe(wrapper);
    wrapper.__twikooLazyObserver = observer;
  };

  const findTwikooTextarea = () => {
    const twikoo = getTwikooRoot();
    if (!twikoo) return null;
    return twikoo.querySelector(".tk-input textarea") || twikoo.querySelector("textarea");
  };

  const attachShortcutHandlers = () => {
    document.querySelectorAll(".comment-shortcut").forEach((button) => {
      if (button.dataset.shortcutBound === "1") return;

      button.addEventListener("click", () => {
        const text = button.getAttribute("data-text") || "";
        const textarea = findTwikooTextarea();
        if (!textarea) {
          ui.showToast?.("加载留言框稍微慢了一点，再等一小下～", {
            icon: false,
            showClass: "love-toast-show",
            duration: 2400,
          });
          return;
        }

        const current = textarea.value || "";
        textarea.value = current ? `${current}\n${text}` : text;
        textarea.dispatchEvent(new Event("input", { bubbles: true }));
        textarea.focus();
      });

      button.dataset.shortcutBound = "1";
    });
  };

  const initReplyHighlight = () => {
    const twikoo = getTwikooRoot();
    if (!twikoo || twikoo.dataset.replyHighlightBound === "1") return;

    twikoo.addEventListener("click", (event) => {
      const target = event.target;
      if (!target) return;

      const isReplyButton = target.classList.contains("tk-reply") || target.closest(".tk-reply");
      if (!isReplyButton) return;

      const comment = target.closest(".tk-comment");
      if (!comment) return;

      twikoo.querySelectorAll(".tk-comment.tk-comment-highlight").forEach((item) => {
        item.classList.remove("tk-comment-highlight");
      });
      comment.classList.add("tk-comment-highlight");
    });

    twikoo.dataset.replyHighlightBound = "1";
  };

  const initCommentsAnniversaryBanner = () => {
    const anniversaries = Array.isArray(LOVE_CFG.anniversaries) ? LOVE_CFG.anniversaries : [];
    if (!anniversaries.length) return;

    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const todayEvents = anniversaries.filter((item) => item.month === month && item.day === day);
    if (!todayEvents.length) return;

    const wrapper = document.querySelector(".comments-main-card");
    if (!wrapper || document.querySelector(".comments-anniv-banner")) return;

    const names = todayEvents.map((item) => item.name).filter(Boolean).join("、");
    if (!names) return;

    const banner = document.createElement("div");
    banner.className = "comments-anniv-banner";
    banner.innerHTML = `
      <i class="fas fa-star-and-crescent"></i>
      今天是 <strong>${ui.escapeHtml ? ui.escapeHtml(names) : names}</strong>，要不要在这里给未来的我们留一句特别的话？💌
    `;
    wrapper.insertBefore(banner, wrapper.firstChild);
  };

  const initCommentsPageEnhance = () => {
    if (!isCommentsPage()) return;

    const twikoo = getTwikooRoot();
    initTwikooLazyPlaceholder();
    attachShortcutHandlers();
    initCommentsAnniversaryBanner();

    if (!twikoo) return;
    initReplyHighlight();

    if (twikoo.__loveShortcutObserver) return;
    const observer = new MutationObserver(() => {
      attachShortcutHandlers();
    });
    observer.observe(twikoo, { childList: true, subtree: true });
    twikoo.__loveShortcutObserver = observer;
  };

  initCommentsPageEnhance();
  document.addEventListener("DOMContentLoaded", initCommentsPageEnhance);
  document.addEventListener("pjax:complete", initCommentsPageEnhance);
})();
