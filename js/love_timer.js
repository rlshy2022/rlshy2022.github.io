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
    
    if (isPlaying) {
      if (disc) disc.classList.add('music-playing');
      if (icon) icon.className = 'fas fa-pause';
    } else {
      if (disc) disc.classList.remove('music-playing');
      if (icon) icon.className = 'fas fa-play';
    }
  };

  window.toggleMusic = function() {
    const audio = document.getElementById('love-audio');
    if (!audio) return;

    if (audio.paused) {
      // 手动点击播放
      audio.play().then(() => updateMusicState(true)).catch(console.error);
    } else {
      audio.pause();
      updateMusicState(false);
    }
  };

  const tryAutoPlay = () => {
    const audio = document.getElementById('love-audio');
    if (!audio) return;

    // 1. 尝试直接播放
    const playPromise = audio.play();

    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          updateMusicState(true); // 成功播放
        })
        .catch((e) => {
          console.log("自动播放被拦截，等待交互唤醒");
          updateMusicState(false);
          
          // 2. 添加一次性全局监听 (点击/触摸/滑动任意位置即播放)
          const forcePlay = () => {
            audio.play().then(() => {
              updateMusicState(true);
              // 移除监听器，避免重复触发
              document.removeEventListener('click', forcePlay);
              document.removeEventListener('touchstart', forcePlay);
              document.removeEventListener('scroll', forcePlay);
            }).catch(e => console.log("交互唤醒仍失败", e));
          };

          document.addEventListener('click', forcePlay);
          document.addEventListener('touchstart', forcePlay);
          document.addEventListener('scroll', forcePlay);
        });
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
    
    if (titleElem) titleElem.innerText = '爱的开始';
    if (iconElem) {
      iconElem.className = 'fas fa-heart';
      iconElem.style.color = '#FF9EAC';
      iconElem.style.animation = 'beat 1.3s infinite';
    }
    
    document.removeEventListener('click', handleSurpriseClick);
    document.addEventListener('click', handleSurpriseClick);

    // 尝试播放音乐
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

    // 音乐按钮可访问性与键盘支持
    const musicBtn = document.querySelector('.love-music-player .music-btn');
    if (musicBtn && !musicBtn.dataset.bound) {
      musicBtn.setAttribute('tabindex', '0');
      musicBtn.setAttribute('role', 'button');
      musicBtn.setAttribute('aria-label', '播放或暂停我们的爱情歌曲');

      musicBtn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          window.toggleMusic && window.toggleMusic();
        }
      });

      musicBtn.dataset.bound = '1';
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

  // -----------------------------------
  // 6. 控制台彩蛋 (Console Love Letter)
  // -----------------------------------
  runWhenIdle(function () {
    try {
      const styleTitle =
        'font-size: 40px; font-weight: bold; color: #FF9EAC; text-shadow: 2px 2px 4px rgba(0,0,0,0.2); font-family: "ZCOOL KuaiLe";';
      const styleBody =
        'font-size: 16px; color: #89C3EB; margin-top: 10px;';

      console.log("%c 欢欢 ❤️ 怡怡", styleTitle);
      console.log("%c 我们的故事，写在代码里，更刻在心里。", styleBody);
      console.log(
        "%c (此博客由欢欢为怡怡专属打造 v2026.02)",
        "font-size:12px; color:#ccc;"
      );
    } catch (e) {}
  });



  (function() {

  const handleHoverQuotes = () => {
    // 1. 获取需要绑定特效的元素
    // .info-avatar 是侧边栏头像，.love-timer-wrapper 是你写的计时器容器
    const targets = document.querySelectorAll('.info-avatar, .love-timer-wrapper');
    const titleElem = document.querySelector('.love-title'); // “我们已经相爱了”那个标题

    if (!targets.length || !titleElem) return;

    // 记录原始标题，以便鼠标离开时恢复
    const originalTitle = titleElem.innerText;

    targets.forEach(target => {
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