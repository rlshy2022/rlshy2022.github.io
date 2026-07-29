(function() {
  "use strict";

  // --- 配置信息 ---
  const LOVE_CFG = window.LOVE_CONFIG || {};
  const featureEnabled = (key, defaultValue = true) => {
    const features = (window.LOVE_CONFIG && window.LOVE_CONFIG.features) || LOVE_CFG.features;
    if (!features || !Object.prototype.hasOwnProperty.call(features, key)) {
      return defaultValue;
    }
    return features[key] !== false;
  };
  const LOVE_START_DATE =
    (LOVE_CFG.dates && LOVE_CFG.dates.loveStart && LOVE_CFG.dates.loveStart.substring(0, 10)) ||
    "2022-08-18";
  const NICKNAMES = LOVE_CFG.nicknames || "欢欢 & 怡怡";

  function showLoveAlert() {
    // 1. 计算天数
    const now = new Date();
    const start = new Date(LOVE_START_DATE);
    const diffTime = Math.abs(now - start);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // 2. 创建弹窗 HTML
    const alertOverlay = document.createElement('div');
    alertOverlay.id = 'love-alert-overlay';
    alertOverlay.setAttribute('role', 'dialog');
    alertOverlay.setAttribute('aria-modal', 'true');
    alertOverlay.innerHTML = `
      <div class="love-alert-card">
        <div class="love-alert-heart">❤️</div>
        <div class="love-alert-title">亲爱的，欢迎回家</div>
        <div class="love-alert-content">
          这是 ${NICKNAMES} <br>
          相爱的第 <span class="love-days">${diffDays}</span> 天
        </div>
        <div class="love-alert-quote">“ 始于初见，止于终老 ”</div>
        <button class="love-alert-btn" type="button">进入小窝</button>
      </div>
    `;

    document.body.appendChild(alertOverlay);

    // 交互增强：支持点击遮罩和 ESC 关闭，并自动聚焦按钮
    const close = () => {
      alertOverlay.remove();
      document.removeEventListener('keydown', handleKeydown);
    };

    const handleKeydown = (e) => {
      if (e.key === 'Escape') {
        close();
      }
    };

    alertOverlay.addEventListener('click', (e) => {
      if (e.target === alertOverlay) {
        close();
      }
    });

    document.addEventListener('keydown', handleKeydown);

    const btn = alertOverlay.querySelector('.love-alert-btn');
    if (btn) {
      btn.addEventListener('click', close);
      btn.setAttribute('aria-label', '进入我们的小窝');
      btn.focus();
    }
  }

  if (!featureEnabled('loveAlert')) {
    document.getElementById('love-alert-overlay')?.remove();
    return;
  }

  // 适配 Butterfly：仅在首页弹出，并通过 localStorage 控制频率，避免过于打扰
  if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
    try {
      const KEY = 'love_alert_last_show';
      const INTERVAL_HOURS = 4; // 至少间隔 4 小时再弹一次
      const now = Date.now();
      const last = parseInt(localStorage.getItem(KEY) || '0', 10);

      if (!last || now - last > INTERVAL_HOURS * 60 * 60 * 1000) {
        showLoveAlert();
        localStorage.setItem(KEY, String(now));
      }
    } catch (e) {
      // localStorage 不可用时，降级为正常弹一次
      showLoveAlert();
    }
  }
})();
