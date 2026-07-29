(function () {
  const TOAST_ID = 'love-encrypt-welcome-toast';

  function ensureHero(content) {
    if (content.querySelector('.love-encrypt-hero')) return;

    const hero = document.createElement('div');
    hero.className = 'love-encrypt-hero';
    hero.innerHTML = `
      <div class="love-encrypt-badge">
        <i class="fas fa-lock" aria-hidden="true"></i>
        <span>只对特别的人开放</span>
      </div>
      <h2 class="love-encrypt-title">这段故事正在等你轻轻打开</h2>
      <p class="love-encrypt-desc">
        输入暗号，就能看到专属于我们的秘密花园了哦。
      </p>
    `;
    content.prepend(hero);
  }

  function ensureVisibilityToggle(pass, actions) {
    if (!pass || !actions || actions.querySelector('.love-encrypt-visibility')) return;

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'love-encrypt-visibility';
    toggle.textContent = '显示密码';
    toggle.setAttribute('aria-pressed', 'false');

    toggle.addEventListener('click', () => {
      const shouldShow = pass.type === 'password';
      pass.type = shouldShow ? 'text' : 'password';
      toggle.textContent = shouldShow ? '隐藏密码' : '显示密码';
      toggle.classList.toggle('is-active', shouldShow);
      toggle.setAttribute('aria-pressed', shouldShow ? 'true' : 'false');
      pass.focus({ preventScroll: true });
      const length = pass.value.length;
      if (typeof pass.setSelectionRange === 'function') {
        pass.setSelectionRange(length, length);
      }
    });

    actions.appendChild(toggle);
  }

  function bindHintReset(pass) {
    const status = document.getElementById('hbeStatus');
    if (!pass || !status || pass.dataset.hintBound === 'true') return;

    pass.dataset.hintBound = 'true';

    pass.addEventListener('input', () => {
      if (status.classList.contains('is-loading') || status.classList.contains('is-success')) return;

      status.className = 'love-encrypt-status is-idle';
      status.textContent = pass.value.trim()
        ? '输入好了就点「确认解锁」，手机上会比键盘回车更顺手。'
        : '输入约定好的密码，点一下确认就能打开。';
    });
  }

  function enhanceEncryptUI() {
    const main = document.getElementById('hexo-blog-encrypt');
    const content = main?.querySelector('.hbe-content');
    const pass = document.getElementById('hbePass');
    const actions = main?.querySelector('.love-encrypt-actions');

    if (!main || !content || !pass) return;
    if (main.dataset.loveEnhanced === 'true') return;

    main.dataset.loveEnhanced = 'true';

    ensureHero(content);
    ensureVisibilityToggle(pass, actions);
    bindHintReset(pass);

    pass.focus({ preventScroll: true });
  }

  function showDecryptToast() {
    const existing = document.getElementById(TOAST_ID);
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = TOAST_ID;
    toast.className = 'love-toast';
    toast.innerHTML = '<i class="fas fa-heart"></i> 专属内容已经为你轻轻打开啦。';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2600);
  }

  function bindDecryptToast() {
    if (window.__loveEncryptToastBound) return;
    window.__loveEncryptToastBound = true;
    window.addEventListener('hexo-blog-decrypt', showDecryptToast);
  }

  enhanceEncryptUI();
  document.addEventListener('pjax:complete', enhanceEncryptUI);
  bindDecryptToast();
})();
