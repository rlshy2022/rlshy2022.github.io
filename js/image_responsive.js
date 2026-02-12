/**
 * 图片响应式优化 - srcset + sizes
 * 根据设备屏幕大小和图片容器大小，自动生成合适的srcset和sizes属性
 */
(function() {
  'use strict';

  // OSS图片尺寸配置
  const IMAGE_SIZES = [
    { width: 400, suffix: 'w_400' },
    { width: 800, suffix: 'w_800' },
    { width: 1200, suffix: 'w_1200' },
    { width: 1920, suffix: 'w_1920' }
  ];

  // 不同场景的sizes配置
  const SIZE_PRESETS = {
    // 首页Banner - 全宽
    banner: '100vw',
    // 文章内图片 - 最大800px
    article: '(max-width: 768px) 100vw, (max-width: 1200px) 800px, 1200px',
    // 相册图片 - 响应式
    gallery: '(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 400px',
    // 卡片封面 - 固定宽度
    card: '(max-width: 768px) 100vw, 400px'
  };

  /**
   * 检查是否为OSS图片
   */
  function isOSSImage(src) {
    return src && (
      src.includes('aliyuncs.com') ||
      src.includes('oss-cn-')
    );
  }

  /**
   * 生成OSS响应式图片URL
   */
  function generateOSSURL(baseURL, sizeSuffix) {
    if (!baseURL) return '';
    
    // 移除可能存在的旧参数
    let cleanURL = baseURL.split('?')[0];
    
    // 检查是否已有OSS处理参数
    if (baseURL.includes('x-oss-process=')) {
      const params = baseURL.split('x-oss-process=')[1];
      // 移除可能存在的resize参数
      const cleanParams = params.replace(/\/resize[^\/]*/g, '');
      cleanURL = baseURL.split('x-oss-process=')[0] + 'x-oss-process=image/' + sizeSuffix + '/format,webp' + (cleanParams.includes('format') ? '' : '');
    } else {
      cleanURL = baseURL + (baseURL.includes('?') ? '&' : '?') + 'x-oss-process=image/' + sizeSuffix + '/format,webp';
    }
    
    return cleanURL;
  }

  /**
   * 生成srcset字符串
   */
  function generateSrcset(baseURL, sizes) {
    if (!isOSSImage(baseURL)) return '';
    
    const srcset = sizes.map(size => {
      const url = generateOSSURL(baseURL, size.suffix);
      return `${url} ${size.width}w`;
    }).join(', ');
    
    return srcset;
  }

  /**
   * 判断图片类型并返回合适的sizes
   */
  function getSizes(img) {
    // 首页Banner
    if (img.closest('#page-header.full_page') || img.closest('.index #page-header')) {
      return SIZE_PRESETS.banner;
    }
    
    // 文章内图片
    if (img.closest('#article-container')) {
      return SIZE_PRESETS.article;
    }
    
    // 相册图片
    if (img.closest('.gallery-items, .gallery-container, .love-photo-wall')) {
      return SIZE_PRESETS.gallery;
    }
    
    // 卡片封面
    if (img.closest('.card-widget, .recent-post-item')) {
      return SIZE_PRESETS.card;
    }
    
    // 默认
    return SIZE_PRESETS.article;
  }

  /**
   * 优化单个图片
   */
  function optimizeImage(img) {
    if (img._responsiveOptimized) return;
    img._responsiveOptimized = true;

    const src = img.getAttribute('src') || img.getAttribute('data-src') || img.getAttribute('data-lazy-src');
    if (!src || !isOSSImage(src)) return;

    // 获取原始URL（移除可能存在的resize参数）
    const baseURL = src.split('?')[0] + (src.includes('?') ? '?' + src.split('?')[1].replace(/\/resize[^\/]*/g, '') : '');
    
    // 生成srcset
    const srcset = generateSrcset(baseURL, IMAGE_SIZES);
    if (srcset) {
      img.setAttribute('srcset', srcset);
    }

    // 设置sizes
    const sizes = getSizes(img);
    if (sizes) {
      img.setAttribute('sizes', sizes);
    }

    // 设置默认src（使用中等尺寸）
    const defaultSrc = generateOSSURL(baseURL, 'w_800');
    if (defaultSrc && !img.getAttribute('src')) {
      img.setAttribute('src', defaultSrc);
    }
  }

  /**
   * 批量优化图片
   */
  function optimizeImages(root) {
    const scope = root && root.nodeType === 1 ? root : document;
    const selector = 'img[src*="aliyuncs.com"], img[data-src*="aliyuncs.com"], img[data-lazy-src*="aliyuncs.com"]';
    const images = scope === document 
      ? document.querySelectorAll(selector)
      : scope.querySelectorAll(selector);
    
    images.forEach(optimizeImage);
  }

  /**
   * 监听相册动态插入的图片
   */
  function observeGalleries() {
    document.querySelectorAll('.gallery-container, .love-photo-wall').forEach(container => {
      if (container._responsiveObserved) return;
      container._responsiveObserved = true;
      
      const observer = new MutationObserver(() => {
        optimizeImages(container);
      });
      
      observer.observe(container, { 
        childList: true, 
        subtree: true 
      });
    });
  }

  /**
   * 初始化
   */
  function init() {
    // 立即优化现有图片
    optimizeImages();
    
    // 监听相册动态插入
    observeGalleries();
    
    // 延迟优化（处理懒加载图片）
    setTimeout(() => optimizeImages(), 500);
    setTimeout(() => optimizeImages(), 1500);
  }

  // DOM加载完成后执行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Pjax支持
  document.addEventListener('pjax:complete', init);
})();
