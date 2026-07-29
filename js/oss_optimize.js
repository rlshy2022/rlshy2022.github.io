/**
 * OSS 相册图片二次优化脚本
 * 专门处理已经带有 WebP 参数的链接，追加尺寸压缩
 * 支持 InfiniteGrid 动态插入的 .gallery-items .item img，通过 MutationObserver 补跑
 */
(function() {
  const selector = '.gallery-items img, .gallery-items .item img, .fj-gallery-item img, #article-container img';

  const doOptimize = (root) => {
    const scope = root && root.nodeType === 1 ? root : document;
    const images = scope === document ? document.querySelectorAll(selector) : scope.querySelectorAll(selector);
    if (!images.length && scope !== document) return;

    const isMobile = window.innerWidth < 768;
    const resizeParam = isMobile ? '/resize,w_800' : '/resize,w_1200';

    images.forEach(img => {
      let src = img.getAttribute('data-lazy-src') || img.getAttribute('src');
      if (src && src.includes('aliyuncs.com') && src.includes('format,webp') && !src.includes('resize')) {
        const newSrc = src + resizeParam;
        if (img.getAttribute('data-lazy-src')) {
          img.setAttribute('data-lazy-src', newSrc);
        }
        img.setAttribute('src', newSrc);
      }
    });
  };

  const runFull = () => doOptimize(document);

  // 相册容器动态插入图片时补跑 OSS 优化
  const observeGalleries = () => {
    document.querySelectorAll('.gallery-container').forEach(container => {
      if (container._ossObserved) return;
      container._ossObserved = true;
      const observer = new MutationObserver(() => {
        doOptimize(container);
      });
      observer.observe(container, { childList: true, subtree: true });
    });
  };

  const schedule = () => {
    runFull();
    observeGalleries();
    setTimeout(runFull, 600);
    setTimeout(runFull, 1500);
  };

  document.addEventListener('DOMContentLoaded', schedule);
  document.addEventListener('pjax:complete', schedule);
  window.addEventListener('hexo-blog-decrypt', () => {
    setTimeout(schedule, 60);
  });
})();
