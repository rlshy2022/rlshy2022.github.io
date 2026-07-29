/**
 * 恋爱博客综合脚本
 */
(function() {
  "use strict";

  // --- 配置区域 ---
  const LOVE_CFG = window.LOVE_CONFIG || {};
  const CONFIG = {
    loveDate: new Date(
      (LOVE_CFG.dates && LOVE_CFG.dates.loveStart) || "2022-08-18T00:00:00"
    ),
    siteDate: new Date(
      (LOVE_CFG.dates && LOVE_CFG.dates.siteStart) || "2026-02-03T20:00:00"
    ),
    refreshInterval: 1000,
  };

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

  const pad = (n) => (n < 10 ? `0${n}` : n);

  const ensureAudioSource = (audio) => {
    if (!audio || audio.dataset.loaded === "1") return;

    const src = audio.dataset.src;
    if (src && !audio.getAttribute("src")) {
      audio.setAttribute("src", src);
      audio.load();
    }

    audio.dataset.loaded = "1";
  };

  const runWhenIdle = (fn) => {
    if (window.requestIdleCallback) {
      window.requestIdleCallback(fn, { timeout: 1500 });
    } else {
      setTimeout(fn, 500);
    }
  };

  // -----------------------------------
  // 1. 强力音乐控制逻辑 (适配 Github Pages)
  // -----------------------------------
  
  const updateMusicState = (isPlaying) => {
    const disc = document.getElementById('music-disc');
    const icon = document.getElementById('play-icon');
    const musicBtn = document.querySelector('.love-music-player .music-btn');
    
    if (isPlaying) {
      if (disc) disc.classList.add('music-playing');
      if (icon) icon.className = 'fas fa-pause';
    } else {
      if (disc) disc.classList.remove('music-playing');
      if (icon) icon.className = 'fas fa-play';
    }
    if (musicBtn) {
      musicBtn.setAttribute("aria-pressed", isPlaying ? "true" : "false");
    }
  };

  window.toggleMusic = function() {
    const audio = document.getElementById('love-audio');
    if (!audio) return;

    if (audio.paused) {
      ensureAudioSource(audio);
      audio.play().then(() => updateMusicState(true)).catch(() => updateMusicState(false));
    } else {
      audio.pause();
      updateMusicState(false);
    }
  };

  // -----------------------------------
  // 2. 惊喜按钮逻辑
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
  // 3. 界面初始化
  // -----------------------------------
  const updateUI = () => {
    const titleElem = document.querySelector('.card-announcement .item-headline span');
    const iconElem = document.querySelector('.card-announcement .item-headline i');
    const audio = document.getElementById("love-audio");
    
    if (titleElem) titleElem.innerText = '爱的开始';
    if (iconElem) {
      iconElem.className = 'fas fa-heart';
      iconElem.style.color = '#FF9EAC';
      iconElem.style.animation = 'beat 1.3s infinite';
    }
    
    document.removeEventListener('click', handleSurpriseClick);
    document.addEventListener('click', handleSurpriseClick);

    updateMusicState(!!(audio && !audio.paused && !audio.ended));
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

    // 音乐按钮事件绑定
    const audio = document.getElementById("love-audio");
    const musicBtn = document.querySelector('.love-music-player .music-btn');
    if (musicBtn && !musicBtn.dataset.bound) {
      musicBtn.addEventListener('click', () => {
        window.toggleMusic && window.toggleMusic();
      });

      musicBtn.dataset.bound = '1';
    }
    if (audio && !audio.dataset.uiBound) {
      audio.addEventListener("play", () => updateMusicState(true));
      audio.addEventListener("pause", () => updateMusicState(false));
      audio.addEventListener("ended", () => updateMusicState(false));
      audio.dataset.uiBound = "1";
    }

    // 计时器区域的无障碍属性
    const timerBox = document.getElementById("love_timer");
    if (timerBox) {
      timerBox.setAttribute("aria-live", "polite");
      timerBox.setAttribute("role", "status");
    }
    const footerTimer = document.getElementById("footer-timer");
    if (footerTimer) {
      footerTimer.setAttribute("aria-live", "polite");
      footerTimer.setAttribute("role", "status");
    }

    // 侧边栏“点我有惊喜”按钮的 aria-label
    const surpriseBtn =
      document.querySelector('.card-author a[href="#love-surprise"]') ||
      document.querySelector('a[href="#love-surprise"]');
    if (surpriseBtn && !surpriseBtn.dataset.boundA11y) {
      surpriseBtn.setAttribute("aria-label", "点我收获一条专属小情话");
      surpriseBtn.setAttribute("role", "button");
      surpriseBtn.dataset.boundA11y = "1";
    }
  };


  // -----------------------------------
  // 5. 网页标题搞怪特效
  // -----------------------------------
  runWhenIdle(function () {
  var originTitle = document.title;
  var titleTime;
    document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
        document.title = "😭 别走呀，再看看嘛...";
      clearTimeout(titleTime);
    } else {
        document.title = "😍 你回来啦！欢迎你呀~";
        titleTime = setTimeout(function () {
        document.title = originTitle;
      }, 2000);
    }
    });
  });

  (function() {

  const handleHoverQuotes = () => {
    // 1. 获取需要绑定特效的元素
    // .info-avatar 是侧边栏头像，.love-timer-wrapper 是你写的计时器容器
    const targets = document.querySelectorAll('.info-avatar, .love-timer-wrapper');
    const titleElem = document.querySelector('.love-title'); // “我们已经相爱了”那个标题

    if (!targets.length || !titleElem) return;

    // 记录原始标题，以便鼠标离开时恢复
    const originalTitle = titleElem.dataset.originalTitle || titleElem.innerText;
    titleElem.dataset.originalTitle = originalTitle;

    targets.forEach(target => {
      if (target.dataset.hoverQuoteBound === '1') return;

      // 鼠标移入：随机换一句情话
      target.addEventListener('mouseenter', () => {
        const randomQuote = LOVE_QUOTES[Math.floor(Math.random() * LOVE_QUOTES.length)];
        titleElem.style.opacity = '0'; // 先透明，做个淡入淡出效果
        
        setTimeout(() => {
          titleElem.innerText = randomQuote;
          titleElem.style.color = '#FF4757'; // 变红一点，更显眼
          titleElem.style.opacity = '1';
        }, 150);
      });

      // 鼠标移出：恢复原状
      target.addEventListener('mouseleave', () => {
        titleElem.style.opacity = '0';
        
        setTimeout(() => {
          titleElem.innerText = originalTitle;
          titleElem.style.color = '#555'; // 恢复原色
          titleElem.style.opacity = '1';
        }, 150);
      });

      target.dataset.hoverQuoteBound = '1';
    });
  };

  // 在统一的初始化入口中，既处理计时器/音乐，也处理悬停情话
  const newInit = () => {
    init();
    handleHoverQuotes();
  };

  document.addEventListener("DOMContentLoaded", newInit);
  document.addEventListener("pjax:complete", newInit);
})();
})();
