/**
 * Theme: System / Light / Dark
 *
 * The choice is stored in chrome.storage.local under "bnt_theme" and mirrored
 * to localStorage, which is synchronous, so this script (loaded in <head>)
 * applies it before first paint. "system" follows prefers-color-scheme live.
 * Any element with data-theme-option="system|light|dark" becomes a switch.
 */
(() => {
  const THEME_KEY = 'bnt_theme';
  const THEMES = ['system', 'light', 'dark'];
  const prefersLight = matchMedia('(prefers-color-scheme: light)');
  let choice = 'system';

  function readCached() {
    try {
      const cached = localStorage.getItem(THEME_KEY);
      return THEMES.includes(cached) ? cached : 'system';
    } catch {
      return 'system';
    }
  }

  function apply(theme) {
    choice = THEMES.includes(theme) ? theme : 'system';
    const resolved = choice === 'system'
      ? (prefersLight.matches ? 'light' : 'dark')
      : choice;
    document.documentElement.dataset.theme = resolved;
    try {
      localStorage.setItem(THEME_KEY, choice);
    } catch {}
    document.querySelectorAll('[data-theme-option]').forEach(btn => {
      const on = btn.dataset.themeOption === choice;
      btn.classList.toggle('active', on);
      btn.setAttribute('aria-checked', String(on));
    });
  }

  apply(readCached());

  prefersLight.addEventListener('change', () => {
    if (choice === 'system') apply('system');
  });

  // chrome.storage is the source of truth; it also syncs other open pages
  chrome.storage.local.get(THEME_KEY, result => apply(result[THEME_KEY]));
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes[THEME_KEY]) apply(changes[THEME_KEY].newValue);
  });

  document.addEventListener('DOMContentLoaded', () => {
    apply(choice);
    document.addEventListener('click', e => {
      const btn = e.target.closest('[data-theme-option]');
      if (!btn) return;
      apply(btn.dataset.themeOption);
      chrome.storage.local.set({ [THEME_KEY]: choice });
    });
  });
})();
