(function() {
  "use strict";

  // --- 配置信息 ---
  const LOVE_START_DATE = "2022-08-18"; 
  const NICKNAMES = "欢欢 & 怡怡";

  function showLoveAlert() {
    // 1. 计算天数
    const now = new Date();
    const start = new Date(LOVE_START_DATE);
    const diffTime = Math.abs(now - start);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // 2. 创建弹窗 HTML
    const alertOverlay = document.createElement('div');
    alertOverlay.id = 'love-alert-overlay';
    alertOverlay.innerHTML = `
      <div class="love-alert-card">
        <div class="love-alert-heart">❤️</div>
        <div class="love-alert-title">亲爱的，欢迎回家</div>
        <div class="love-alert-content">
          这是 ${NICKNAMES} <br>
          相爱的第 <span class="love-days">${diffDays}</span> 天
        </div>
        <div class="love-alert-quote">“ 始于初见，止于终老 ”</div>
        <button class="love-alert-btn" onclick="document.getElementById('love-alert-overlay').remove()">进入小窝</button>
      </div>
    `;

    // 3. 注入 CSS 样式
    const style = document.createElement('style');
    style.innerHTML = `
      #love-alert-overlay {
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.4);
        backdrop-filter: blur(8px);
        display: flex; align-items: center; justify-content: center;
        z-index: 999999; animation: fadeIn 0.5s;
      }
      .love-alert-card {
        background: rgba(255, 255, 255, 0.85);
        border: 1px solid rgba(255, 255, 255, 0.4);
        border-radius: 30px;
        padding: 40px; text-align: center;
        box-shadow: 0 20px 50px rgba(255, 158, 172, 0.3);
        max-width: 320px; width: 90%;
        transform: scale(0); animation: popUp 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
      }
      .love-alert-heart {
        font-size: 50px; margin-bottom: 15px;
        animation: alertHeartBeat 1.2s infinite;
      }
      .love-alert-title {
        font-family: 'ZCOOL KuaiLe', sans-serif;
        font-size: 1.5rem; color: #FF7E93; margin-bottom: 10px;
      }
      .love-alert-content {
        font-size: 1.1rem; color: #666; line-height: 1.6;
      }
      .love-days {
        font-size: 2rem; font-weight: bold; color: #FF4757;
        margin: 0 5px; font-family: 'Nunito', sans-serif;
      }
      .love-alert-quote {
        font-size: 0.9rem; color: #999; margin-top: 20px; font-style: italic;
      }
      .love-alert-btn {
        margin-top: 25px; padding: 10px 40px;
        background: linear-gradient(135deg, #FF9EAC, #FF4757);
        color: white; border: none; border-radius: 20px;
        font-weight: bold; cursor: pointer; transition: 0.3s;
        box-shadow: 0 5px 15px rgba(255, 71, 87, 0.3);
      }
      .love-alert-btn:hover { transform: scale(1.05); }

      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes popUp { to { transform: scale(1); } }
      @keyframes alertHeartBeat {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.2); }
      }
    `;

    document.body.appendChild(alertOverlay);
    document.head.appendChild(style);
  }

  // 每次进入页面都执行（不使用 Cookie 存储，满足你“每次进入都弹”的要求）
  // 但为了用户体验，建议只在首页弹，或者在进入网站的第一次弹
  // 如果想只在首页弹，可以加：if (window.location.pathname === '/')
  
  // 适配 Butterfly
    if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
    showLoveAlert();
    }
})();