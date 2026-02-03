/**
 * 恋爱计时器 (精确版)
 * 优化：立即执行、防抖动、Pjax适配、等宽数字
 */
(function() {
  "use strict";

  //在此修改你们的纪念日
  const CONFIG = {
    startDate: new Date("2022-08-18T00:00:00"), 
    refreshInterval: 1000
  };

  // 补零函数 (例如 8 -> 08)
  const pad = (n) => n < 10 ? `0${n}` : n;

  const updateTimer = () => {
    const timerBox = document.getElementById("love_timer");
    if (!timerBox) return; // 页面未找到元素则停止

    const now = new Date();
    const diff = now - CONFIG.startDate;

    // 如果时间还没到
    if (diff < 0) {
      timerBox.innerHTML = "我们在未来相遇";
      return;
    }

    // 精确计算时间
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    // 渲染HTML (区分秒数，便于添加动画)
    timerBox.innerHTML = `
      <div class="timer-unit-group">
        <span class="timer-num big">${days}</span>
        <span class="timer-text">天</span>
      </div>
      <div class="timer-unit-group small">
        <span class="timer-num">${pad(hours)}</span><span class="timer-split">:</span>
        <span class="timer-num">${pad(minutes)}</span><span class="timer-split">:</span>
        <span class="timer-num second-beat">${pad(seconds)}</span>
      </div>
    `;
  };

  const startTimer = () => {
    // 1. 清除可能存在的旧定时器 (防止Pjax切换后累积)
    if (window.loveTimerInterval) {
      clearInterval(window.loveTimerInterval);
    }
    
    // 2. 立即执行一次 (避免页面加载后的1秒空白)
    updateTimer();
    
    // 3. 启动定时器
    window.loveTimerInterval = setInterval(updateTimer, CONFIG.refreshInterval);
  };

  // 监听各类加载事件 (兼容Hexo Butterfly的Pjax机制)
  document.addEventListener("DOMContentLoaded", startTimer);
  document.addEventListener("pjax:complete", startTimer);
})();