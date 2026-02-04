/**
 * 恋爱计时器 (双时间版)
 * 1. 侧边栏：显示"爱的开始" (从相识/相爱那一天算起)
 * 2. 页脚：显示"小窝守护" (从建站那一天算起)
 */
(function() {
  "use strict";

  const CONFIG = {
    // A. 恋爱纪念日 (侧边栏使用：2022年)
    loveDate: new Date("2022-08-18T00:00:00"), 
    
    // B. 建站时间 (底部使用：2026年2月3日 20:00)
    siteDate: new Date("2026-02-03T20:00:00"),
    
    refreshInterval: 1000
  };

  const pad = (n) => n < 10 ? `0${n}` : n;

  // 1. 修改侧边栏标题和图标
  const updateTitle = () => {
    const titleElem = document.querySelector('.card-announcement .item-headline span');
    const iconElem = document.querySelector('.card-announcement .item-headline i');
    
    if (titleElem) titleElem.innerText = '爱的开始';
    
    if (iconElem) {
      iconElem.classList.remove('fa-bullhorn');
      iconElem.classList.add('fa-heart');
      iconElem.style.color = '#FF9EAC';
      iconElem.style.animation = 'beat 1.3s infinite';
    }
  };

  // 2. 核心计时逻辑
  const updateTimer = () => {
    const timerBox = document.getElementById("love_timer");     // 侧边栏容器
    const footerTimer = document.getElementById("footer-timer"); // 底部容器
    const now = new Date();

    // --- A. 计算恋爱时长 (侧边栏) ---
    if (timerBox) {
      const loveDiff = now - CONFIG.loveDate;
      
      if (loveDiff < 0) {
        timerBox.innerHTML = "我们在未来相遇";
      } else {
        const loveDays = Math.floor(loveDiff / (1000 * 60 * 60 * 24));
        const loveHours = Math.floor((loveDiff / (1000 * 60 * 60)) % 24);
        const loveMinutes = Math.floor((loveDiff / (1000 * 60)) % 60);
        const loveSeconds = Math.floor((loveDiff / 1000) % 60);

        timerBox.innerHTML = `
          <div class="timer-unit-group big-group">
            <span class="timer-num big">${loveDays}</span>
            <span class="timer-text">Days</span>
          </div>
          <div class="timer-unit-group small">
            <span class="timer-num">${pad(loveHours)}</span><span class="timer-split">:</span>
            <span class="timer-num">${pad(loveMinutes)}</span><span class="timer-split">:</span>
            <span class="timer-num second-beat">${pad(loveSeconds)}</span>
          </div>
        `;
      }
    }

    // --- B. 计算建站时长 (底部) ---
    if (footerTimer) {
      const siteDiff = now - CONFIG.siteDate;
      
      // 为了避免刚建站时显示负数或0天，做个简单判断
      let siteText = "";
      if (siteDiff < 0) {
        siteText = "即将开启守护...";
      } else {
        const siteDays = Math.floor(siteDiff / (1000 * 60 * 60 * 24));
        const siteHours = Math.floor((siteDiff / (1000 * 60 * 60)) % 24);
        // 如果需要更精确，也可以加上分钟，这里只保留天和小时保持简洁
        siteText = `我们的小窝已守护彼此 ${siteDays} 天 ${siteHours} 小时`;
      }
      
      footerTimer.innerHTML = siteText;
    }
  };

  const startTimer = () => {
    if (window.loveTimerInterval) clearInterval(window.loveTimerInterval);
    updateTitle();
    updateTimer();
    window.loveTimerInterval = setInterval(updateTimer, CONFIG.refreshInterval);
  };

  document.addEventListener("DOMContentLoaded", startTimer);
  document.addEventListener("pjax:complete", startTimer);
})();