(() => {
  const body = document.body;
  const themeToggle = document.getElementById('theme-toggle');
  const menuToggle = document.querySelector('.menu-toggle');
  const nav = document.getElementById('primary-nav');
  const year = document.getElementById('year');
  const themeKey = 'climano-site-theme';

  if (year) year.textContent = String(new Date().getFullYear());

  const copyCommandButton = document.querySelector('.copy-command');
  const cloneCommand = document.getElementById('clone-command-text');
  copyCommandButton?.addEventListener('click', async () => {
    if (!cloneCommand) return;
    const command = cloneCommand.textContent.trim();
    let copied = false;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(command);
        copied = true;
      }
    } catch { /* Use the fallback below when clipboard access is unavailable. */ }

    if (!copied) {
      const temporaryInput = document.createElement('textarea');
      temporaryInput.value = command;
      temporaryInput.setAttribute('readonly', '');
      temporaryInput.style.position = 'fixed';
      temporaryInput.style.opacity = '0';
      document.body.appendChild(temporaryInput);
      temporaryInput.select();
      try { copied = document.execCommand('copy'); } catch { copied = false; }
      temporaryInput.remove();
    }

    copyCommandButton.textContent = copied ? 'Copied' : 'Select command';
    copyCommandButton.setAttribute('aria-label', copied ? 'Command copied' : 'Select the command to copy it');
    window.setTimeout(() => {
      copyCommandButton.textContent = 'Copy';
      copyCommandButton.setAttribute('aria-label', 'Copy Git clone command');
    }, 1800);
  });

  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
  const getSavedTheme = () => {
    try { return localStorage.getItem(themeKey) || 'system'; }
    catch { return 'system'; }
  };

  const applyTheme = (theme) => {
    const normalized = ['light', 'dark', 'system'].includes(theme) ? theme : 'system';
    body.dataset.theme = normalized;
    const dark = normalized === 'dark' || (normalized === 'system' && prefersDark?.matches);
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) metaTheme.content = dark ? '#101010' : '#ffffff';
    if (themeToggle) {
      const next = normalized === 'system' ? 'light' : normalized === 'light' ? 'dark' : 'system';
      themeToggle.setAttribute('aria-label', `Theme: ${normalized}. Switch to ${next} theme`);
      themeToggle.setAttribute('title', `Theme: ${normalized[0].toUpperCase()}${normalized.slice(1)} · switch to ${next}`);
    }
  };

  let activeTheme = getSavedTheme();
  applyTheme(activeTheme);
  themeToggle?.addEventListener('click', () => {
    activeTheme = activeTheme === 'system' ? 'light' : activeTheme === 'light' ? 'dark' : 'system';
    try { localStorage.setItem(themeKey, activeTheme); } catch { /* Theme still changes for this visit. */ }
    applyTheme(activeTheme);
  });
  prefersDark?.addEventListener?.('change', () => {
    if (activeTheme === 'system') applyTheme('system');
  });

  const closeMenu = () => {
    if (!menuToggle || !nav) return;
    nav.classList.remove('is-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open navigation');
  };

  if (menuToggle && nav) {
    menuToggle.addEventListener('click', () => {
      const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
      menuToggle.setAttribute('aria-expanded', String(!expanded));
      menuToggle.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
      nav.classList.toggle('is-open', !expanded);
    });
    nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeMenu();
    });
    document.addEventListener('click', (event) => {
      if (!nav.contains(event.target) && !menuToggle.contains(event.target)) closeMenu();
    });
    window.matchMedia('(min-width: 901px)').addEventListener('change', closeMenu);
  }
})();
