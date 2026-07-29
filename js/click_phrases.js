(function () {
  // 1. 主题与全局配置
  const THEMES = window.CLICK_PHRASE_THEMES || {};

  const DEFAULT_THEME_KEY = "pink_dream";

  // 手势 / 动画 / 粒子 / 声音相关参数（与主题无关的基准值）
  const LONG_PRESS_DELAY = 500; // 长按判定（ms）
  const DOUBLE_TAP_DELAY = 300; // 双击判定窗口（ms）
  const THROTTLE_MS = 80;       // 触发节流（ms）
  const PARTICLE_COUNT_DEFAULT = 7; // 每次点击生成的粒子数量默认值
  const SOUND_STORAGE_KEY = "clickPhraseSoundEnabled";
  const THEME_STORAGE_KEY = "clickPhraseTheme";
  const THEME_BUTTON_SELECTOR = ".click-theme-btn";
  const IGNORE_EFFECT_SELECTOR =
    ".click-phrase-sound-toggle, .click-theme-btn, .music-btn, .love-anniv-link";

  let currentThemeKey = null;
  let activeTheme = null;

  /** @returns {typeof THEMES[keyof typeof THEMES]} 当前生效主题 */
  function getActiveTheme() {
    return activeTheme || THEMES[DEFAULT_THEME_KEY];
  }

  /** 用户是否开启了“减少动效” */
  function prefersReducedMotion() {
    try {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch (e) {
      return false;
    }
  }
  let lastEffectTime = 0;
  let lastTapTime = 0;
  let tapTimeoutId = null;
  let longPressTimeoutId = null;
  let pointerDownPosition = null;
  let soundEnabled = true;
  let audioContext = null;

  function shouldIgnoreEffectTarget(target) {
    return !!(target && target.closest && target.closest(IGNORE_EFFECT_SELECTOR));
  }

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

    const root = document.documentElement;
    if (root) {
      // 先清空扩展主题 class
      root.classList.remove("theme-spring-festival", "theme-sci-fi");
      if (theme.id === "spring_festival") {
        root.classList.add("theme-spring-festival");
      } else if (theme.id === "sci_fi_neon") {
        root.classList.add("theme-sci-fi");
      }
    }

    syncThemeButtons();
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, currentThemeKey);
    } catch (e) { /* ignore */ }
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

  function bindThemeButtons() {
    const buttons = document.querySelectorAll(THEME_BUTTON_SELECTOR);
    if (!buttons.length) return;

    buttons.forEach(function (btn) {
      if (btn.dataset.themeBound === "1") return;

      btn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        const themeKey = btn.getAttribute("data-theme-key");
        if (themeKey) {
          setThemeExternally(themeKey);
        }
      });

      btn.dataset.themeBound = "1";
    });

    syncThemeButtons();
  }

  // 随机选择一个轨迹类型：直上 / 左弧线 / 右弧线 / S 形 / 小行星绕圈
  function getRandomPathType(mode) {
    const theme = getActiveTheme();

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
    if (document.querySelector(".click-phrase-sound-toggle")) return;

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

  // 粒子 / Emoji 零散效果（减少动效时不生成）
  function createParticles(x, y) {
    if (prefersReducedMotion()) return;
    const theme = getActiveTheme();
    const particleEmojis =
      (theme.particles && theme.particles.length ? theme.particles : ["💗", "✨", "⭐"]);
    const count =
      typeof theme.particleCount === "number" ? theme.particleCount : PARTICLE_COUNT_DEFAULT;

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
      let rafId = null;

      function animateParticle(ts) {
        if (!startTime) startTime = ts;
        const elapsed = ts - startTime;
        const progress = Math.min(elapsed / duration, 1);

        const radius = maxRadius * progress;
        const offsetX = Math.cos(angle) * radius;
        const offsetY = Math.sin(angle) * radius * 0.7 - 10 * progress;

        const scale = 0.7 + 0.5 * (1 - progress);
        const opacity = 1 - progress;
        const blur = 1.5 * progress;

        p.style.transform =
          `translate(-50%, -50%) translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
        p.style.opacity = String(opacity);
        p.style.filter = `blur(${blur}px)`;

        if (progress < 1) {
          rafId = requestAnimationFrame(animateParticle);
        } else {
          rafId = null;
          p.remove();
        }
      }

      rafId = requestAnimationFrame(animateParticle);
    }
  }

  // 减少动效模式：仅短暂显示文字后淡出，无轨迹/粒子
  function createPhraseReduced(x, y, mode) {
    const themeCfg = getActiveTheme();
    const phrasePool =
      themeCfg.phrases && themeCfg.phrases.length ? themeCfg.phrases : THEMES[DEFAULT_THEME_KEY].phrases;
    const text = phrasePool[Math.floor(Math.random() * phrasePool.length)];
    const span = document.createElement("span");
    span.innerText = text;

    span.style.zIndex = "999999";
    span.style.position = "fixed";
    span.style.top = `${y}px`;
    span.style.left = `${x}px`;
    span.style.fontWeight = "bold";
    span.style.fontFamily = "'ZCOOL KuaiLe', sans-serif";
    span.style.pointerEvents = "none";
    span.style.whiteSpace = "nowrap";
    span.style.transform = "translate(-50%, -50%)";
    span.style.fontSize = mode === "double" ? "1.4rem" : mode === "long" ? "1.2rem" : "1rem";

    const bgThemeType = getTextThemeAtPoint(x, y);
    const gradients = themeCfg.gradients || {};
    if (bgThemeType === "lightText") {
      span.style.backgroundImage = gradients.dark || "linear-gradient(180deg, #D81B60, #880E4F)";
      span.style.textShadow = gradients.textShadowDark || "0 0 6px rgba(255,255,255,0.55)";
    } else {
      span.style.backgroundImage = gradients.light || "linear-gradient(180deg, rgba(255,255,255,0.95), #FFD1DC)";
      span.style.textShadow = gradients.textShadowLight || "0 0 6px rgba(0,0,0,0.35)";
    }
    span.style.color = "transparent";
    span.style.backgroundClip = "text";
    span.style.webkitBackgroundClip = "text";
    document.body.appendChild(span);

    playClickSound(mode);

    const duration = 400;
    let startTime = null;
    let rafId = null;
    function step(ts) {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      span.style.opacity = String(1 - progress);
      if (progress < 1) rafId = requestAnimationFrame(step);
      else { span.remove(); }
    }
    rafId = requestAnimationFrame(step);
  }

  // 创建并播放点击文字，mode: 'single' | 'double' | 'long'
  function createPhrase(x, y, mode) {
    const now = Date.now();
    if (now - lastEffectTime < THROTTLE_MS && mode === "single") return;
    lastEffectTime = now;

    if (prefersReducedMotion()) {
      createPhraseReduced(x, y, mode);
      return;
    }

    const themeCfgForText = getActiveTheme();
    const phrasePool =
      themeCfgForText.phrases && themeCfgForText.phrases.length
        ? themeCfgForText.phrases
        : THEMES[DEFAULT_THEME_KEY].phrases;
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
    const themeCfg = getActiveTheme();
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
      typeof themeCfgForText.baseDistance === "number" ? themeCfgForText.baseDistance : 80;
    const baseDuration =
      typeof themeCfgForText.baseDuration === "number" ? themeCfgForText.baseDuration : 700;

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
    let rafId = null;

    function animateFrame(timestamp) {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);

      let xOffset = 0;
      let yOffset = -distance * progress;

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
        const angle = progress * Math.PI * 2 * 1.1;
        const radius = 10 + 36 * progress;
        xOffset = Math.cos(angle) * radius;
        yOffset = -distance * progress + Math.sin(angle) * radius * 0.35;
      }

      const scale = startScale + 0.35 * progress;
      const rotate = rotateDirection * 18 * progress;
      const opacity = 1 - progress;
      const blur = 2.5 * progress;

      span.style.transform =
        `translate(-50%, -50%) translate(${xOffset}px, ${yOffset}px) ` +
        `scale(${scale}) rotate(${rotate}deg)`;
      span.style.opacity = String(opacity);
      span.style.filter = `blur(${blur}px)`;

      if (progress < 1) {
        rafId = requestAnimationFrame(animateFrame);
      } else {
        rafId = null;
        span.remove();
      }
    }

    rafId = requestAnimationFrame(animateFrame);
  }

  // 绑定手势（支持 PC 和 移动端，优先用 Pointer 事件）
  function setupGestureHandlers() {
    if (window.PointerEvent) {
      document.addEventListener(
        "pointerdown",
        function (e) {
          // 点击声音按钮时不触发效果
          if (shouldIgnoreEffectTarget(e.target)) {
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
          if (shouldIgnoreEffectTarget(e.target)) {
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
        if (shouldIgnoreEffectTarget(e.target)) {
          return;
        }
        createPhrase(e.clientX, e.clientY, "single");
      });
    }
  }

  function initThemeSystem() {
    let key = DEFAULT_THEME_KEY;
    try {
      const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (saved && THEMES[saved]) key = saved;
    } catch (e) { /* 无本地存储时用默认粉色 */ }
    applyTheme(key);
  }

  // 挂到 window 上，方便在 HTML 中直接调用 setClickPhraseTheme('xxx')
  window.setClickPhraseTheme = function (themeKey) {
    setThemeExternally(themeKey);
  };

  initThemeSystem();
  setupGestureHandlers();
  setupSoundToggle();
  bindThemeButtons();
  document.addEventListener("DOMContentLoaded", bindThemeButtons);
  document.addEventListener("pjax:complete", bindThemeButtons);
})();                                                                                                                                                                                                                                                                                                                                        
