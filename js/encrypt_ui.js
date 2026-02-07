(function () {
  function enhanceEncryptUI() {
    const pass = document.getElementById('hbePass');
    const btn = document.getElementById('hbeSubmitBtn');
    if (!pass || !btn) return;

    pass.focus();

    pass.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') btn.click();
    }, { passive: true });
  }

  document.addEventListener('DOMContentLoaded', enhanceEncryptUI);
  document.addEventListener('pjax:complete', enhanceEncryptUI);
})();
