/**
 * 恋爱博客综合脚本 (自动播放增强版)
 */
(function() {
  "use strict";

  // --- 配置区域 ---
  const CONFIG = {
    loveDate: new Date("2022-08-18T00:00:00"), // 恋爱纪念日
    siteDate: new Date("2026-02-03T20:00:00"), // 建站时间
    refreshInterval: 1000
  };

  // --- 情话库 ---
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
    "我的世界因为有你，变得粉粉嫩嫩 🌸"
  ];

  const pad = (n) => n < 10 ? `0${n}` : n;

  // -----------------------------------
  // 1. 音乐控制逻辑 (含自动播放处理)
  // -----------------------------------
  
  // 更新音乐界面的状态（转动/图标）
  const updateMusicState = (isPlaying) => {
    const disc = document.getElementById('music-disc');
    const icon = document.getElementById('play-icon');
    
    if (isPlaying) {
      if (disc) disc.classList.add('music-playing'); // 开始旋转
      if (icon) icon.className = 'fas fa-pause';     // 显示暂停图标
    } else {
      if (disc) disc.classList.remove('music-playing'); // 停止旋转
      if (icon) icon.className = 'fas fa-play';         // 显示播放图标
    }
  };

  // 切换播放/暂停（给按钮用的）
  window.toggleMusic = function() {
    const audio = document.getElementById('love-audio');
    if (!audio) return;

    if (audio.paused) {
      audio.play().then(() => updateMusicState(true)).catch(console.error);
    } else {
      audio.pause();
      updateMusicState(false);
    }
  };

  // 尝试自动播放逻辑
  const tryAutoPlay = () => {
    const audio = document.getElementById('love-audio');
    if (!audio) return;

    // 尝试直接播放
    const playPromise = audio.play();

    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          // 自动播放成功
          updateMusicState(true);
        })
        .catch(() => {
          // 自动播放失败 (浏览器拦截)
          updateMusicState(false);
          // 添加一次性点击监听：用户点击页面任何地方，就立刻开始播放
          const oneShotPlay = () => {
            if (audio.paused) {
              audio.play().then(() => updateMusicState(true));
            }
            document.removeEventListener('click', oneShotPlay);
          };
          document.addEventListener('click', oneShotPlay);
        });
    }
  };

  // -----------------------------------
  // 2. 惊喜按钮点击逻辑
  // -----------------------------------
  const handleSurpriseClick = (e) => {
    let target = e.target;
    while (target && target.tagName !== 'A') {
      target = target.parentNode;
    }
    
    if (target && target.getAttribute('href') === '#love-surprise') {
      e.preventDefault();
      const randomQuote = LOVE_QUOTES[Math.floor(Math.random() * LOVE_QUOTES.length)];
      
      const toast = document.createElement('div');
      toast.className = 'love-toast';
      toast.innerHTML = `<i class="fas fa-heart"></i> ${randomQuote}`;
      document.body.appendChild(toast);
      
      setTimeout(() => { toast.remove(); }, 2500);
    }
  };

  // -----------------------------------
  // 3. 界面修改 (标题/图标)
  // -----------------------------------
  const updateUI = () => {
    const titleElem = document.querySelector('.card-announcement .item-headline span');
    const iconElem = document.querySelector('.card-announcement .item-headline i');
    
    if (titleElem) titleElem.innerText = '爱的开始';
    if (iconElem) {
      iconElem.className = 'fas fa-heart';
      iconElem.style.color = '#FF9EAC';
      iconElem.style.animation = 'beat 1.3s infinite';
    }
    
    document.removeEventListener('click', handleSurpriseClick);
    document.addEventListener('click', handleSurpriseClick);

    // 每次页面加载/切换时，尝试恢复播放状态或自动播放
    tryAutoPlay();
  };

  // -----------------------------------
  // 4. 计时器逻辑
  // -----------------------------------
  const updateTimer = () => {
    const timerBox = document.getElementById("love_timer");
    const footerTimer = document.getElementById("footer-timer");
    const now = new Date();

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