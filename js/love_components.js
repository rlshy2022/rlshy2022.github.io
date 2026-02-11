(function () {
  "use strict";

  const enhanceImages = () => {
    const imgs = document.querySelectorAll(
      ".gallery-items img, .fj-gallery-item img, #article-container img"
    );

    imgs.forEach((img) => {
      if (img.getAttribute("alt")) return;

      const src = img.getAttribute("data-lazy-src") || img.getAttribute("src") || "";
      let altText = "";

      if (img.closest(".gallery-items, .fj-gallery-item")) {
        altText = "欢欢和怡怡的照片";
      } else if (src) {
        try {
          const url = new URL(src, window.location.origin);
          const name = decodeURIComponent(url.pathname.split("/").pop() || "")
            .split(".")
            .slice(0, -1)
            .join(".");
          altText = name || "文章插图";
        } catch (e) {
          altText = "文章插图";
        }
      } else {
        altText = "文章插图";
      }

      img.setAttribute("alt", altText);
    });
  };

  const bootComponents = () => {
    enhanceImages();
  };

  document.addEventListener("DOMContentLoaded", bootComponents);
  document.addEventListener("pjax:complete", bootComponents);
})();


