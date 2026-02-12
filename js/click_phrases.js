(function () {
  // 1. 主题与全局配置
  const THEMES = {
    // 梦幻粉色：当前默认风格
    pink_dream: {
      id: "pink_dream",
      displayName: "粉色恋爱",
      phrases: [
        "爱你 ❤️",
        "想你 ✨",
        "么么哒 🌸",
        "执子之手 🤝",
        "欢欢 ❤️ 怡怡",
        "始终如一",
        "咱俩天下第一好",
        "小窝最暖"
      ],
      particles: ["💗", "✨", "💖", "💫", "⭐", "🌸", "💕", "💞"],
      baseDistance: 85,
      baseDuration: 730,
      pathStyle: "mixed", // 直上 + 弧线 + 少量绕圈
      gradients: {
        light: "linear-gradient(180deg, rgba(255,255,255,0.95), #FFD1DC)",
        dark: "linear-gradient(180deg, #D81B60, #880E4F)",
        textShadowLight: "0 0 6px rgba(0,0,0,0.35)",
        textShadowDark: "0 0 6px rgba(255,255,255,0.55)"
      },
      particleCount: 7,
      // 整体皮肤（全站配色与背景）
      skin: {
        primary: "#FF9EAC",
        secondary: "#89C3EB",
        bodyBg:
          "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 30%, #fdf2ff 100%)",
        metaThemeColor: "#FF9EAC"
      }
    },
    // 星光夜空：偏蓝紫 + 绕圈轨迹
    star_night: {
      id: "star_night",
      displayName: "星光夜空",
      phrases: [
        "陪你看星星 ✨",
        "今晚的月亮为你亮",
        "你是我的小星星 ⭐",
        "星河滚烫，你是人间理想",
        "夜空下的约定 🌙",
        "银河为你铺路",
        "抬头总能看到你"
      ],
      particles: ["✨", "⭐", "🌙", "💫", "🌌"],
      baseDistance: 110,
      baseDuration: 900,
      pathStyle: "orbit", // 更偏向绕圈旋转
      gradients: {
        light: "linear-gradient(180deg, #5C6BC0, #1E88E5)",
        dark: "linear-gradient(180deg, #BBDEFB, #E3F2FD)",
        textShadowLight: "0 0 6px rgba(0,0,0,0.45)",
        textShadowDark: "0 0 8px rgba(0,0,0,0.7)"
      },
      particleCount: 6,
      skin: {
        primary: "#5C6BC0",
        secondary: "#90CAF9",
        bodyBg:
          "linear-gradient(135deg, #050816 0%, #0b1120 40%, #020617 100%)",
        metaThemeColor: "#0b1120"
      }
    },
    // 元气早晨：清爽橙黄 + 波浪轨迹
    sunny_morning: {
      id: "sunny_morning",
      displayName: "元气早晨",
      phrases: [
        "早安呀 ☀️",
        "今天也要开心",
        "元气满满 💪",
        "多喝热水呀",
        "阳光正好 🌈",
        "出门记得戴口罩",
        "拥抱新的一天"
      ],
      particles: ["☀️", "✨", "🌈", "🍊", "🌻"],
      baseDistance: 75,
      baseDuration: 650,
      pathStyle: "wave", // 左右摆动更明显
      gradients: {
        light: "linear-gradient(180deg, #FFB74D, #FF9800)",
        dark: "linear-gradient(180deg, #FFF8E1, #FFE082)",
        textShadowLight: "0 0 5px rgba(255,255,255,0.5)",
        textShadowDark: "0 0 7px rgba(0,0,0,0.5)"
      },
      particleCount: 5,
      skin: {
        primary: "#FFB74D",
        secondary: "#FFCC80",
        bodyBg:
          "linear-gradient(135deg, #FFFDE7 0%, #FFF3E0 45%, #FFE0B2 100%)",
        metaThemeColor: "#FFB74D"
      }
    }
  };

  const DEFAULT_THEME_KEY = "pink_dream";

  // 手势 / 动画 / 粒子 / 声音相关参数（与主题无关的基准值）
  const LONG_PRESS_DELAY = 500; // 长按判定（ms）
  const DOUBLE_TAP_DELAY = 300; // 双击判定窗口（ms）
  const THROTTLE_MS = 80;       // 触发节流（ms）
  const PARTICLE_COUNT_DEFAULT = 7; // 每次点击生成的粒子数量默认值
  const SOUND_STORAGE_KEY = "clickPhraseSoundEnabled";
  const THEME_BUTTON_SELECTOR = ".click-theme-btn";

  let currentThemeKey = null;
  let activeTheme = null;
  let lastEffectTime = 0;
  let lastTapTime = 0;
  let tapTimeoutId = null;
  let longPressTimeoutId = null;
  let pointerDownPosition = null;
  let soundEnabled = true;
  let audioContext = null;

  // 解析 rgb/rgba 字符串
  function parseRGB(colorString) {
    if (!colorString) return null;
    const match = colorString.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    if (!match) return null;
    return {
      r: parseInt(match[1], 10),
      g: parseInt(match[2], 10),
      b: parseInt(match[3], 10)
    };
  }

  // 根据点击位置背景亮度，返回推荐文字主题：'lightText'（浅色字）或 'darkText'（深色字）
  function getTextThemeAtPoint(x, y) {
    try {
      const el = document.elementFromPoint(x, y);
      if (!el) return "darkText"; // 默认：深色字（假设背景偏浅）

      const style = window.getComputedStyle(el);
      // 优先使用背景色，没有就退化到文字颜色
      let colorString = style.backgroundColor;
      if (
        !colorString ||
        colorString === "transparent" ||
        colorString === "rgba(0, 0, 0, 0)"
      ) {
        colorString = style.color;
      }

      const rgb = parseRGB(colorString);
      if (!rgb) return "darkText";

      // 简单亮度估算（0 ~ 255）
      const brightness = 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b;
      // 背景越亮，文字越要深；背景越暗，文字越要浅
      return brightness > 160 ? "darkText" : "lightText";
    } catch (e) {
      return "darkText";
    }
  }

  // 主题相关：随机选一个主题 key
  function pickRandomThemeKey() {
    const keys = Object.keys(THEMES);
    if (!keys.length) return DEFAULT_THEME_KEY;
    return keys[Math.floor(Math.random() * keys.length)];
  }

  // 应用整站皮肤（全局颜色与背景）
  function applySkinForTheme(theme) {
    if (!theme || !theme.skin) return;

    const root = document.documentElement;
    const body = document.body;
    const skin = theme.skin;

    try {
      if (skin.primary) {
        root.style.setProperty("--love-primary", skin.primary);
      }
      if (skin.secondary) {
        root.style.setProperty("--love-secondary", skin.secondary);
      }

      // 仅在非暗色模式下覆盖背景，避免干扰暗黑主题
      const mode = root.getAttribute("data-theme");
      if (skin.bodyBg && mode !== "dark") {
        body.style.backgroundImage = skin.bodyBg;
      }

      if (skin.metaThemeColor) {
        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) {
          meta.setAttribute("content", skin.metaThemeColor);
        }
      }
    } catch (e) {
      // 忽略皮肤应用中的单次错误
    }
  }

  function applyTheme(themeKey) {
    const theme = THEMES[themeKey] || THEMES[DEFAULT_THEME_KEY];
    if (!theme) return;
    currentThemeKey = theme.id;
    activeTheme = theme;
    applySkinForTheme(theme);
    // 同步右侧卡片中的按钮高亮
    syncThemeButtons();
  }

  function syncThemeButtons() {
    try {
      const buttons = document.querySelectorAll(THEME_BUTTON_SELECTOR);
      if (!buttons || !buttons.length) return;
      buttons.forEach(function (btn) {
        const key = btn.getAttribute("data-theme-key");
        if (key === currentThemeKey) {
          btn.classList.add("is-active");
        } else {
          btn.classList.remove("is-active");
        }
      });
    } catch (e) {
      // 忽略 UI 同步错误
    }
  }

  function setThemeExternally(themeKey) {
    applyTheme(themeKey);
  }

  // 随机选择一个轨迹类型：直上 / 左弧线 / 右弧线 / S 形 / 小行星绕圈
  function getRandomPathType(mode) {
    const theme = activeTheme || THEMES[DEFAULT_THEME_KEY];

    // 基础路径
    const base = ["up", "arcLeft", "arcRight"];
    let extra = [];

    // 根据主题风格追加偏好路径
    if (theme.pathStyle === "orbit") {
      extra = ["orbit", "orbit", "sine"];
    } else if (theme.pathStyle === "wave") {
      extra = ["sine", "sine", "arcLeft", "arcRight"];
    } else {
      // mixed
      extra = ["sine", "orbit"];
    }

    let pool = base.concat(extra);

    // 长按、双击时增加夸张轨迹概率
    if (mode === "long" || mode === "double") {
      pool = pool.concat(extra);
    }

    const index = Math.floor(Math.random() * pool.length);
    return pool[index];
  }

  // 简单的 Web Audio 点击音效
  function ensureAudioContext() {
    if (audioContext) return audioContext;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    audioContext = new AC();
    return audioContext;
  }

  function playClickSound(mode) {
    if (!soundEnabled) return;

    const ctx = ensureAudioContext();
    if (!ctx) return;

    // 某些浏览器需要在用户交互后 resume
    if (ctx.state === "suspended") {
      ctx.resume().catch(function () { });
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    let baseFreq = 520;
    if (mode === "double") baseFreq = 660;
    if (mode === "long") baseFreq = 440;

    osc.type = "triangle";
    osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);

    gain.gain.setValueAtTime(0.0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.22, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      ctx.currentTime + (mode === "long" ? 0.35 : 0.22)
    );

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + (mode === "long" ? 0.4 : 0.25));
  }

  // 声音开关 UI
  function setupSoundToggle() {
    // 从本地存储读取上次设置
    try {
      const saved = window.localStorage.getItem(SOUND_STORAGE_KEY);
      if (saved === "off") {
        soundEnabled = false;
      }
    } catch (e) {
      // 忽略本地存储错误
    }

    const toggle = document.createElement("button");
    toggle.className = "click-phrase-sound-toggle";
    toggle.type = "button";
    toggle.setAttribute("aria-label", "切换点击音效");
    toggle.style.position = "fixed";
    toggle.style.right = "12px";
    toggle.style.bottom = "12px";
    toggle.style.zIndex = "999999";
    toggle.style.width = "32px";
    toggle.style.height = "32px";
    toggle.style.borderRadius = "999px";
    toggle.style.border = "none";
    toggle.style.display = "flex";
    toggle.style.alignItems = "center";
    toggle.style.justifyContent = "center";
    toggle.style.fontSize = "18px";
    toggle.style.cursor = "pointer";
    toggle.style.background =
      "linear-gradient(135deg, rgba(255,255,255,0.92), rgba(255,182,193,0.95))";
    toggle.style.boxShadow =
      "0 6px 18px rgba(0,0,0,0.18), 0 0 0 1px rgba(255,255,255,0.85)";
    toggle.style.color = "#C2185B";
    toggle.style.padding = "0";

    function refreshIcon() {
      // 不在脚本文字中用 emoji，但这里作为 UI 图标可以增加趣味
      toggle.textContent = soundEnabled ? "🔊" : "🔈";
      toggle.style.opacity = soundEnabled ? "0.95" : "0.6";
    }

    refreshIcon();

    toggle.addEventListener("click", function (e) {
      e.stopPropagation();
      e.preventDefault();

      soundEnabled = !soundEnabled;
      try {
        window.localStorage.setItem(
          SOUND_STORAGE_KEY,
          soundEnabled ? "on" : "off"
        );
      } catch (err) {
        // ignore
      }

      refreshIcon();

      // 打开时顺便预初始化一下音频
      if (soundEnabled) {
        ensureAudioContext();
      }
    });

    document.body.appendChild(toggle);
  }

  // 粒子 / Emoji 零散效果
  function createParticles(x, y) {
    const theme = activeTheme || THEMES[DEFAULT_THEME_KEY];
    const particleEmojis =
      (theme && theme.particles && theme.particles.length
        ? theme.particles
        : ["💗", "✨", "⭐"]) || ["💗", "✨", "⭐"];
    const count =
      theme && typeof theme.particleCount === "number"
        ? theme.particleCount
        : PARTICLE_COUNT_DEFAULT;

    for (let i = 0; i < count; i++) {
      const p = document.createElement("span");
      p.textContent =
        particleEmojis[
        Math.floor(Math.random() * particleEmojis.length)
        ];

      const startX = x;
      const startY = y;

      p.style.position = "fixed";
      p.style.left = startX + "px";
      p.style.top = startY + "px";
      p.style.transform = "translate(-50%, -50%)";
      p.style.pointerEvents = "none";
      p.style.zIndex = "999998";
      p.style.fontSize = "0.9rem";
      p.style.willChange = "transform, opacity, filter";

      document.body.appendChild(p);

      const angle = Math.random() * Math.PI * 2; // 0~2π 随机方向
      const maxRadius = 40 + Math.random() * 20;
      const duration = 380 + Math.random() * 180; // ms

      let startTime = null;

      function animateParticle(ts) {
        if (!startTime) startTime = ts;
        const elapsed = ts - startTime;
        const progress = Math.min(elapsed / duration, 1); // 0~1

        const radius = maxRadius * progress;
        const offsetX = Math.cos(angle) * radius;
        const offsetY = Math.sin(angle) * radius * 0.7 - 10 * progress; // 略微上扬

        const scale = 0.7 + 0.5 * (1 - progress);
        const opacity = 1 - progress;
        const blur = 1.5 * progress;

        p.style.transform =
          `translate(-50%, -50%) translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
        p.style.opacity = String(opacity);
        p.style.filter = `blur(${blur}px)`;

        if (progress < 1) {
          requestAnimationFrame(animateParticle);
        } else {
          p.remove();
        }
      }

      requestAnimationFrame(animateParticle);
    }
  }

  // 创建并播放点击文字，mode: 'single' | 'double' | 'long'
  function createPhrase(x, y, mode) {
    const now = Date.now();
    // 简单节流，避免极端高频触发导致性能问题
    if (now - lastEffectTime < THROTTLE_MS && mode === "single") {
      return;
    }
    lastEffectTime = now;

    const themeCfgForText = activeTheme || THEMES[DEFAULT_THEME_KEY];
    const phrasePool =
      (themeCfgForText && themeCfgForText.phrases && themeCfgForText.phrases.length
        ? themeCfgForText.phrases
        : THEMES[DEFAULT_THEME_KEY].phrases) || THEMES[DEFAULT_THEME_KEY].phrases;
    const text =
      phrasePool[Math.floor(Math.random() * phrasePool.length)];
    const span = document.createElement("span");
    span.innerText = text;

    // 基础样式
    span.style.zIndex = "999999";
    span.style.position = "fixed";
    span.style.top = `${y}px`;
    span.style.left = `${x}px`;
    span.style.fontWeight = "bold";
    span.style.fontFamily = "'ZCOOL KuaiLe', sans-serif";
    span.style.pointerEvents = "none";
    span.style.whiteSpace = "nowrap";
    span.style.transform = "translate(-50%, -50%)";
    span.style.willChange = "transform, opacity, filter";

    // 根据手势不同，稍微区分一下大小
    if (mode === "double") {
      span.style.fontSize = "1.4rem";
    } else if (mode === "long") {
      span.style.fontSize = "1.2rem";
    } else {
      span.style.fontSize = "1rem";
    }

    // 颜色：根据背景亮度 + 当前主题调整渐变色
    const bgThemeType = getTextThemeAtPoint(x, y);
    const themeCfg = activeTheme || THEMES[DEFAULT_THEME_KEY];
    const gradients = themeCfg.gradients || {};

    if (bgThemeType === "lightText") {
      // 暗背景：浅色渐变文字
      span.style.backgroundImage =
        gradients.dark ||
        "linear-gradient(180deg, #D81B60, #880E4F)";
      span.style.textShadow =
        gradients.textShadowDark || "0 0 6px rgba(255,255,255,0.55)";
    } else {
      // 亮背景：更亮的渐变文字
      span.style.backgroundImage =
        gradients.light ||
        "linear-gradient(180deg, rgba(255,255,255,0.95), #FFD1DC)";
      span.style.textShadow =
        gradients.textShadowLight || "0 0 6px rgba(0,0,0,0.35)";
    }
    span.style.color = "transparent";
    span.style.backgroundClip = "text";
    span.style.webkitBackgroundClip = "text";

    document.body.appendChild(span);

    // 同步触发粒子效果和声音
    createParticles(x, y);
    playClickSound(mode);

    // 动画参数：上飘距离 / 时长 / 旋转等 + 多轨迹（按主题微调）
    const baseDistance =
      (themeCfgForText && typeof themeCfgForText.baseDistance === "number"
        ? themeCfgForText.baseDistance
        : 80) || 80;
    const baseDuration =
      (themeCfgForText && typeof themeCfgForText.baseDuration === "number"
        ? themeCfgForText.baseDuration
        : 700) || 700;

    const distance = mode === "long" ? baseDistance * 1.4 : baseDistance;
    const duration =
      mode === "long"
        ? baseDuration * 1.4
        : mode === "double"
          ? baseDuration * 1.15
          : baseDuration; // ms
    const rotateDirection = Math.random() > 0.5 ? 1 : -1;
    const startScale = mode === "double" ? 1.25 : 1;
    const pathType = getRandomPathType(mode);

    let startTime = null;

    function animateFrame(timestamp) {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1); // 0 ~ 1

      let xOffset = 0;
      let yOffset = -distance * progress; // 默认直线上飘

      // 不同路径的偏移
      if (pathType === "arcLeft") {
        const bend = Math.sin(progress * Math.PI);
        xOffset = -40 * bend;
      } else if (pathType === "arcRight") {
        const bend = Math.sin(progress * Math.PI);
        xOffset = 40 * bend;
      } else if (pathType === "sine") {
        xOffset = 35 * Math.sin(progress * 2 * Math.PI);
        yOffset = -distance * (0.8 * progress + 0.2 * progress * progress);
      } else if (pathType === "orbit") {
        const angle = progress * Math.PI * 2 * 1.1; // 小行星绕一圈多一点
        const radius = 10 + 36 * progress;
        xOffset = Math.cos(angle) * radius;
        yOffset = -distance * progress + Math.sin(angle) * radius * 0.35;
      }

      const scale = startScale + 0.35 * progress; // 缩放
      const rotate = rotateDirection * 18 * progress; // 旋转角度
      const opacity = 1 - progress; // 渐隐
      const blur = 2.5 * progress; // 模糊

      span.style.transform =
        `translate(-50%, -50%) translate(${xOffset}px, ${yOffset}px) ` +
        `scale(${scale}) rotate(${rotate}deg)`;
      span.style.opacity = String(opacity);
      span.style.filter = `blur(${blur}px)`;

      if (progress < 1) {
        requestAnimationFrame(animateFrame);
      } else {
        span.remove();
      }
    }

    requestAnimationFrame(animateFrame);
  }

  // 绑定手势（支持 PC 和 移动端，优先用 Pointer 事件）
  function setupGestureHandlers() {
    if (window.PointerEvent) {
      document.addEventListener(
        "pointerdown",
        function (e) {
          // 点击声音按钮时不触发效果
          if (
            e.target &&
            e.target.closest &&
            e.target.closest(".click-phrase-sound-toggle")
          ) {
            return;
          }

          // 只处理主键 / 主指针
          if (e.button !== undefined && e.button !== 0) return;

          const x = e.clientX;
          const y = e.clientY;
          pointerDownPosition = { x, y };

          // 长按计时器
          longPressTimeoutId = setTimeout(function () {
            longPressTimeoutId = null;
            if (pointerDownPosition) {
              createPhrase(pointerDownPosition.x, pointerDownPosition.y, "long");
            }
          }, LONG_PRESS_DELAY);
        },
        { passive: true }
      );

      document.addEventListener(
        "pointerup",
        function (e) {
          if (
            e.target &&
            e.target.closest &&
            e.target.closest(".click-phrase-sound-toggle")
          ) {
            return;
          }

          if (e.button !== undefined && e.button !== 0) return;

          const x = e.clientX;
          const y = e.clientY;

          // 如果长按计时器还在，说明这次不是长按
          if (longPressTimeoutId) {
            clearTimeout(longPressTimeoutId);
            longPressTimeoutId = null;

            const now = Date.now();
            if (lastTapTime && now - lastTapTime < DOUBLE_TAP_DELAY) {
              // 确认为双击
              clearTimeout(tapTimeoutId);
              tapTimeoutId = null;
              lastTapTime = 0;
              createPhrase(x, y, "double");
            } else {
              // 先暂存一次点击，等待是否形成双击
              lastTapTime = now;
              tapTimeoutId = setTimeout(function () {
                createPhrase(x, y, "single");
                tapTimeoutId = null;
                lastTapTime = 0;
              }, DOUBLE_TAP_DELAY);
            }
          } else {
            // 长按已经触发过了，这里不再重复创建
          }

          pointerDownPosition = null;
        },
        { passive: true }
      );

      document.addEventListener(
        "pointercancel",
        function () {
          if (longPressTimeoutId) {
            clearTimeout(longPressTimeoutId);
            longPressTimeoutId = null;
          }
          if (tapTimeoutId) {
            clearTimeout(tapTimeoutId);
            tapTimeoutId = null;
            lastTapTime = 0;
          }
          pointerDownPosition = null;
        },
        { passive: true }
      );
    } else {
      // 老浏览器降级：仅支持单击效果
      document.addEventListener("click", function (e) {
        if (
          e.target &&
          e.target.closest &&
          e.target.closest(".click-phrase-sound-toggle")
        ) {
          return;
        }
        createPhrase(e.clientX, e.clientY, "single");
      });
    }
  }

  // 初始化主题系统并暴露切换方法给全局（供侧边栏按钮调用）
  function initThemeSystem() {
    const randomKey = pickRandomThemeKey();
    applyTheme(randomKey);
  }

  // 挂到 window 上，方便在 HTML 中直接调用 setClickPhraseTheme('xxx')
  window.setClickPhraseTheme = function (themeKey) {
    setThemeExternally(themeKey);
  };

  initThemeSystem();
  setupGestureHandlers();
  setupSoundToggle();
})();                                                                                                                                                                                                                                                                                                                                        