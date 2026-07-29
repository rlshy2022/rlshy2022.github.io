(function () {
  "use strict";

  const escapeHtml = (value) =>
    String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const getPath = () => window.location.pathname || "/";

  const isPath = (...paths) => paths.includes(getPath());

  const readJsonStorage = (key, fallback = {}) => {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      return fallback;
    }
  };

  const writeJsonStorage = (key, value) => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      return false;
    }
  };

  const showToast = (text, options = {}) => {
    const toast = document.createElement("div");
    toast.className = options.className || "love-toast";

    if (options.icon !== false) {
      const icon = document.createElement("i");
      icon.className = options.iconClass || "fas fa-heart";
      toast.appendChild(icon);
      toast.appendChild(document.createTextNode(" "));
    }

    toast.appendChild(document.createTextNode(String(text || "")));
    document.body.appendChild(toast);

    if (options.showClass) {
      requestAnimationFrame(() => toast.classList.add(options.showClass));
    }

    const duration = Number(options.duration || 2600);
    window.setTimeout(() => {
      if (options.showClass) {
        toast.classList.remove(options.showClass);
        window.setTimeout(() => toast.remove(), Number(options.removeDelay || 260));
        return;
      }
      toast.remove();
    }, duration);
  };

  window.LOVE_UI_UTILS = {
    escapeHtml,
    getPath,
    isPath,
    readJsonStorage,
    writeJsonStorage,
    showToast,
  };
})();
