/* ============================================
   HSK Quiz - Multi-Theme Manager (Dark/Light/Pink)
   ============================================ */

const THEMES = ['dark', 'light', 'pink'];

function getSavedTheme() {
  return localStorage.getItem('hsk_theme') || 'dark';
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('hsk_theme', theme);
  
  const icons = {
    'dark': '🌙',
    'light': '☀️',
    'pink': '🌸'
  };

  const titles = {
    'dark': 'Giao diện Tối (Nhấp để sang Sáng)',
    'light': 'Giao diện Sáng (Nhấp để sang Hồng)',
    'pink': 'Giao diện Hồng Sakura (Nhấp để sang Tối)'
  };

  const btns = document.querySelectorAll('.theme-toggle-btn');
  btns.forEach(btn => {
    btn.textContent = icons[theme] || '🌙';
    btn.setAttribute('title', titles[theme] || 'Đổi giao diện');
  });
}

function toggleTheme() {
  const current = getSavedTheme();
  const currentIndex = THEMES.indexOf(current);
  const nextIndex = (currentIndex + 1) % THEMES.length;
  const next = THEMES[nextIndex];
  applyTheme(next);
}

// Immediate execution to prevent theme flicker on load
(function initTheme() {
  const saved = getSavedTheme();
  document.documentElement.setAttribute('data-theme', saved);
  
  document.addEventListener('DOMContentLoaded', () => {
    applyTheme(saved);
  });
})();
