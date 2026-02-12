(function () {
  function enhanceEncryptUI() {
    const pass = document.getElementById('hbePass');
    const btn = document.getElementById('hbeSubmitBtn');
    if (!pass || !btn) return;

    pass.focus();

    pass.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') btn.click();
    }, { passive: true });

    // 输入正确密码后给一个小小的欢迎弹幕
    btn.addEventListener('click', () => {
      setTimeout(() => {
        const stillExists = document.getElementById('hbePass');
        if (stillExists) return; // 说明还在输入态，密码可能不正确

        const title = (document.title || '').split('|')[0].trim() || '这间小剧场';
        const toast = document.createElement('div');
        toast.className = 'love-toast';
        toast.innerHTML = `<i class="fas fa-film"></i> 欢迎回来，「${title}」的专属影厅已经为你点亮啦～`;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2600);
      }, 400);
    }, { passive: true });
  }

  document.addEventListener('DOMContentLoaded', enhanceEncryptUI);
  document.addEventListener('pjax:complete', enhanceEncryptUI);
})();
