/* ============================================
   HSK Quiz - Stats Page Logic
   ============================================ */

const STORAGE_KEY = 'hsk5_wrong_counts';
const WRONG_THRESHOLD = 2;

function getWrongCounts() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

function saveWrongCounts(counts) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(counts));
}

function getMarkedWords() {
  const counts = getWrongCounts();
  const marked = [];
  for (const [no, count] of Object.entries(counts)) {
    if (count >= WRONG_THRESHOLD) {
      const word = HSK5_DATA.find(w => w.no === parseInt(no));
      if (word) {
        marked.push({ ...word, wrongCount: count });
      }
    }
  }
  marked.sort((a, b) => b.wrongCount - a.wrongCount);
  return marked;
}

function renderStats() {
  const marked = getMarkedWords();
  const listEl = document.getElementById('stats-list');
  const emptyEl = document.getElementById('empty-state');
  const actionsEl = document.getElementById('stats-actions');
  const totalEl = document.getElementById('stats-total');

  totalEl.textContent = `${marked.length} từ`;

  if (marked.length === 0) {
    listEl.classList.add('hidden');
    emptyEl.classList.remove('hidden');
    actionsEl.querySelector('.btn-danger').classList.add('hidden');
    return;
  }

  emptyEl.classList.add('hidden');
  listEl.classList.remove('hidden');
  actionsEl.querySelector('.btn-danger').classList.remove('hidden');

  listEl.innerHTML = marked.map((word, i) => `
    <div class="stats-item" style="animation-delay: ${i * 50}ms">
      <div class="stats-chinese">${word.chinese}</div>
      <div class="stats-detail">
        <div class="stats-meaning">${word.meaning}</div>
        <div class="stats-pinyin">${word.pinyin}</div>
      </div>
      <div class="stats-wrong">
        <div class="stats-wrong-count">${word.wrongCount}</div>
        <div class="stats-wrong-label">lần sai</div>
      </div>
    </div>
  `).join('');
}

function confirmClearAll() {
  document.getElementById('confirm-dialog').classList.remove('hidden');
}

function closeDialog() {
  document.getElementById('confirm-dialog').classList.add('hidden');
}

function clearAllMarks() {
  saveWrongCounts({});
  closeDialog();
  renderStats();
}

// Close dialog on overlay click
document.getElementById('confirm-dialog').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) {
    closeDialog();
  }
});

// Initialize
document.addEventListener('DOMContentLoaded', renderStats);
