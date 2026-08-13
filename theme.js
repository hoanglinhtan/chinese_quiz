/* ============================================
   HSK Quiz - Light / Dark Theme Manager
   ============================================ */

function getSavedTheme() {
  return localStorage.getItem('hsk_theme') || 'dark';
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('hsk_theme', theme);
  
  // Update toggle button icons across page
  const btns = document.querySelectorAll('.theme-toggle-btn');
  btns.forEach(btn => {
    btn.textContent = theme === 'light' ? '🌙' : '☀️';
    btn.setAttribute('title', theme === 'light' ? 'Chuyển sang giao diện Tối' : 'Chuyển sang giao diện Sáng');
  });
}

function toggleTheme() {
  const current = getSavedTheme();
  const next = current === 'light' ? 'dark' : 'light';
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
