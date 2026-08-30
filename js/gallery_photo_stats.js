(function () {
  "use strict";

  const collectFromImages = (images) => {
    const photos = [];
    Array.from(images || []).forEach((img) => {
      const src = img.getAttribute("data-lazy-src") || img.getAttribute("src");
      if (!src) return;
      photos.push({ src, alt: img.getAttribute("alt") || "" });
    });
    return photos;
  };

  const collect = (body) => {
    if (!body) return [];
    const photos = [];

    Array.from(body.querySelectorAll(".gallery-container")).forEach((container) => {
      const items = container.querySelector(".gallery-items");
      if (!items) return;

      const rendered = collectFromImages(items.querySelectorAll("img"));
      if (rendered.length) {
        rendered.forEach((photo) => photos.push(photo));
        return;
      }

      if (container.getAttribute("data-type") === "data") {
        try {
          const data = JSON.parse(items.textContent.trim());
          if (Array.isArray(data)) {
            data.forEach((item) => {
              if (item && item.url) photos.push({ src: item.url, alt: item.alt || "" });
            });
          }
        } catch (e) {}
      }
    });

    collectFromImages(
      Array.from(body.querySelectorAll("img")).filter(
        (img) => !img.closest(".gallery-container")
      )
    ).forEach((photo) => photos.push(photo));

    return photos;
  };

  window.LOVE_GALLERY_STATS = { collect };
})();
