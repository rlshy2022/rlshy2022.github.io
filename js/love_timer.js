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




  /**
 * 恋爱博客综合脚本
 * 包含：双计时器、公告标题修改、图标替换、以及"点我有惊喜"特效
 */
(function() {
  "use strict";

  // --- 配置区域 ---
  const CONFIG = {
    loveDate: new Date("2022-08-18T00:00:00"), // 恋爱纪念日
    siteDate: new Date("2026-02-03T20:00:00"), // 建站时间
    refreshInterval: 1000
  };

  // --- 情话库 (可自由添加) ---
  const LOVE_QUOTES = [
    "斯人若彩虹，遇上方知有 🌈",
    "你是我所有的少女情怀 🎀",
    "山野万里，你是我藏在微风里的欢喜 ✨",
    "想和你一起看遍世界的粉色晚霞 🌄",
    "醒来觉得甚是爱你 ❤️",
    "这里永远是为你亮着灯的小窝 🏠",
    "喜欢你，是我做过最坚持的事 💪",
    "我在贩卖日落，你像神明一样慷慨将光洒向我 ✨",
    "和你在一起，每天都是情人节 🌹",
    "想和你一起虚度光阴，比如低头看鱼 🐟",
    "我的世界因为有你，变得粉粉嫩嫩 🌸"
  ];

  const pad = (n) => n < 10 ? `0${n}` : n;

  // 1. 惊喜按钮点击逻辑
  const handleSurpriseClick = (e) => {
    // 寻找点击的目标是否是我们设置的链接
    let target = e.target;
    // 向上冒泡寻找 A 标签 (因为可能点到图标)
    while (target && target.tagName !== 'A') {
      target = target.parentNode;
    }
    
    if (target && target.getAttribute('href') === '#love-surprise') {
      e.preventDefault(); // 阻止跳转
      
      // 随机选取一句情话
      const randomQuote = LOVE_QUOTES[Math.floor(Math.random() * LOVE_QUOTES.length)];
      
      // 创建浮动元素
      const toast = document.createElement('div');
      toast.className = 'love-toast';
      toast.innerHTML = `<i class="fas fa-heart"></i> ${randomQuote}`;
      document.body.appendChild(toast);
      
      // 动画结束后移除元素 (2.5秒与CSS动画对应)
      setTimeout(() => {
        toast.remove();
      }, 2500);
    }
  };

  // 2. 界面修改 (标题/图标)
  const updateUI = () => {
    const titleElem = document.querySelector('.card-announcement .item-headline span');
    const iconElem = document.querySelector('.card-announcement .item-headline i');
    
    if (titleElem) titleElem.innerText = '爱的开始';
    
    if (iconElem) {
      iconElem.className = 'fas fa-heart'; // 直接重置类名更稳定
      iconElem.style.color = '#FF9EAC';
      iconElem.style.animation = 'beat 1.3s infinite';
    }
    
    // 绑定惊喜按钮事件 (防止重复绑定)
    document.removeEventListener('click', handleSurpriseClick);
    document.addEventListener('click', handleSurpriseClick);
  };

  // 3. 计时器逻辑
  const updateTimer = () => {
    const timerBox = document.getElementById("love_timer");
    const footerTimer = document.getElementById("footer-timer");
    const now = new Date();

    // 侧边栏计时
    if (timerBox) {
      const loveDiff = now - CONFIG.loveDate;
      if (loveDiff < 0) {
        timerBox.innerHTML = "我们在未来相遇";
      } else {
        const d = Math.floor(loveDiff / (1000 * 60 * 60 * 24));
        const h = Math.floor((loveDiff / (1000 * 60 * 60)) % 24);
        const m = Math.floor((loveDiff / (1000 * 60)) % 60);
        const s = Math.floor((loveDiff / 1000) % 60);
        timerBox.innerHTML = `
          <div class="timer-unit-group big-group">
            <span class="timer-num big">${d}</span>
            <span class="timer-text">Days</span>
          </div>
          <div class="timer-unit-group small">
            <span class="timer-num">${pad(h)}</span><span class="timer-split">:</span>
            <span class="timer-num">${pad(m)}</span><span class="timer-split">:</span>
            <span class="timer-num second-beat">${pad(s)}</span>
          </div>`;
      }
    }

    // 底部计时
    if (footerTimer) {
      const siteDiff = now - CONFIG.siteDate;
      const d = Math.floor(siteDiff / (1000 * 60 * 60 * 24));
      const h = Math.floor((siteDiff / (1000 * 60 * 60)) % 24);
      footerTimer.innerHTML = siteDiff < 0 ? "即将开启守护..." : `我们的小窝已守护彼此 ${d} 天 ${h} 小时`;
    }
  };

  const init = () => {
    if (window.loveTimerInterval) clearInterval(window.loveTimerInterval);
    updateUI();
    updateTimer();
    window.loveTimerInterval = setInterval(updateTimer, CONFIG.refreshInterval);
  };

  document.addEventListener("DOMContentLoaded", init);
  document.addEventListener("pjax:complete", init);
})();
})();