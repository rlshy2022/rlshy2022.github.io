/**
 * OSS 相册图片二次优化脚本
 * 专门处理已经带有 WebP 参数的链接，追加尺寸压缩
 */
(function() {
  const doOptimize = () => {
    // 锁定相册区域的图片
    const images = document.querySelectorAll('.gallery-items img, .fj-gallery-item img');
    
    // 我们要追加的参数：限制宽度为 1024px (适合手机和电脑阅读，体积减小极大)
    const resizeParam = '/resize,w_1024';

    images.forEach(img => {
      // 兼容 Butterfly 的懒加载，同时获取 data-lazy-src 和 src
      let src = img.getAttribute('data-lazy-src') || img.getAttribute('src');

      // 逻辑判断：
      // 1. 必须是阿里云 OSS 链接
      // 2. 已经包含了 format,webp
      // 3. 还没有包含 resize 参数（防止重复添加）
      if (src && src.includes('aliyuncs.com') && src.includes('format,webp') && !src.includes('resize')) {
        
        // 在原有参数后面追加 /resize,w_1024
        const newSrc = src + resizeParam;

        // 如果是懒加载模式，必须更新 data-lazy-src
        if (img.getAttribute('data-lazy-src')) {
          img.setAttribute('data-lazy-src', newSrc);
        }
        
        // 更新当前显示的 src
        img.setAttribute('src', newSrc);
      }
    });
  };

  // 页面加载完成执行
  document.addEventListener('DOMContentLoaded', doOptimize);
  // 适配 PJAX 切换页面（非常重要，否则切换到相册页会失效）
  document.addEventListener('pjax:complete', doOptimize);
  
  // 针对瀑布流相册的动态渲染，额外延迟触发一次
  setTimeout(doOptimize, 800);
})();