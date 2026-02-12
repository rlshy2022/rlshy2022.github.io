(function () {
  "use strict";

  const gallerySelector =
    ".gallery-items img, .gallery-items .item img, .fj-gallery-item img";
  const allSelector =
    gallerySelector +
    ", #article-container img, #recent-posts .recent-post-item .post-cover img";

  const enhanceOne = (img) => {
    if (img._loveEnhanced) return;
    img._loveEnhanced = true;

    if (!img.complete) {
      img.classList.add("love-img-loading");
      img.addEventListener(
        "load",
        () => {
          img.classList.remove("love-img-loading");
          img.classList.add("love-img-loaded");
        },
        { once: true }
      );
      img.addEventListener(
        "error",
        () => {
          img.classList.remove("love-img-loading");
        },
        { once: true }
      );
    } else {
      img.classList.add("love-img-loaded");
    }

    if (!img.getAttribute("alt")) {
      const src = img.getAttribute("data-lazy-src") || img.getAttribute("src") || "";
      const inGallery = img.closest(".gallery-items, .fj-gallery-item");
      let altText = inGallery
        ? "欢欢和怡怡的照片"
        : (() => {
            if (!src) return "文章插图";
            try {
              const url = new URL(src, window.location.origin);
              const name = decodeURIComponent(url.pathname.split("/").pop() || "")
                .split(".")
                .slice(0, -1)
                .join(".");
              return name || "文章插图";
            } catch (e) {
              return "文章插图";
            }
          })();
      img.setAttribute("alt", altText);
    }

    if (img.closest(".gallery-container")) {
      img.setAttribute("loading", "lazy");
    }
  };

  const enhanceImages = (root) => {
    const scope = root && root.nodeType === 1 ? root : document;
    const imgs = scope === document
      ? document.querySelectorAll(allSelector)
      : scope.querySelectorAll(allSelector);
    imgs.forEach(enhanceOne);
  };

  const observeGalleries = () => {
    document.querySelectorAll(".gallery-container").forEach((container) => {
      if (container._loveObserved) return;
      container._loveObserved = true;
      const observer = new MutationObserver(() => {
        container.querySelectorAll("img").forEach(enhanceOne);
      });
      observer.observe(container, { childList: true, subtree: true });
    });
  };

  const bootComponents = () => {
    enhanceImages();
    observeGalleries();
    setTimeout(() => enhanceImages(), 800);
    setTimeout(() => enhanceImages(), 1800);
  };

  document.addEventListener("DOMContentLoaded", bootComponents);
  document.addEventListener("pjax:complete", bootComponents);
})();


