/**
 * 恋爱计时器 (遵循Butterfly Pjax规范)
 * 适配Hexo Butterfly主题，兼容页面切换/异步渲染
 */
(function(window, document) {
  "use strict";

  // 配置项 (独立抽离，方便修改)
  const CONFIG = {
    startDate: new Date(2022, 7, 18, 0, 0, 0), // 月份从0开始，7=8月 (兼容所有浏览器)
    interval: 1000, // 1秒刷新一次
    delay: 300 // 延迟执行，适配异步渲染
  };

  // 核心计时逻辑
  const loveTimerFn = () => {
    const timerElement = document.getElementById("love_timer");
    if (!timerElement) return; // 无元素则退出

    const now = new Date();
    const timeDiff = now.getTime() - CONFIG.startDate.getTime();
    if (timeDiff < 0) { // 防止开始时间晚于当前时间
      timerElement.innerHTML = '<span class="timer-unit">0</span> 天 <span class="timer-unit">0</span> 时 <span class="timer-unit">0</span> 分 <span class="timer-unit">0</span> 秒';
      return;
    }

    // 计算天/时/分/秒
    const days = Math.floor(timeDiff / (24 * 60 * 60 * 1000));
    const hours = Math.floor((timeDiff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((timeDiff % (60 * 60 * 1000)) / (60 * 1000));
    const seconds = Math.floor((timeDiff % (60 * 1000)) / 1000);

    // 渲染到页面 (保留样式类，兼容CSS)
    timerElement.innerHTML = `
      <span class="timer-unit">${days}</span> 天 
      <span class="timer-unit">${hours}</span> 时 
      <span class="timer-unit">${minutes}</span> 分 
      <span class="timer-unit">${seconds}</span> 秒
    `;
  };

  // 启动计时器 (封装为可复用函数)
  const startLoveTimer = () => {
    // 清除旧定时器，防止叠加 (主题Pjax切换时关键)
    if (window.loveInterval) {
      clearInterval(window.loveInterval);
      window.loveInterval = null;
    }

    // 延迟执行，确保侧边栏元素已渲染 (兼容主题异步加载)
    setTimeout(() => {
      loveTimerFn(); // 立即执行一次，避免空白
      window.loveInterval = setInterval(loveTimerFn, CONFIG.interval);
    }, CONFIG.delay);
  };

  // 监听主题核心事件 (严格遵循Butterfly规范)
  // 1. 页面初次加载完成
  document.addEventListener("DOMContentLoaded", startLoveTimer);
  // 2. Pjax页面切换完成 (主题核心事件)
  document.addEventListener("pjax:complete", startLoveTimer);
  // 3. 兼容部分主题的pjax:success事件
  document.addEventListener("pjax:success", startLoveTimer);
  // 4. 窗口加载完成 (兜底方案)
  window.addEventListener("load", startLoveTimer);

  // 暴露到全局，方便调试
  window.startLoveTimer = startLoveTimer;
  window.loveTimerFn = loveTimerFn;

})(window, document);