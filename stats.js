/* ============================================
   HSK Quiz - Stats & Play History Logic
   ============================================ */

const STORAGE_KEY = 'hsk_wrong_counts';
const PLAY_HISTORY_KEY = 'hsk_play_history';
const WRONG_THRESHOLD = 2;

let currentTab = 'marked';
let pendingAction = null;

// ── Tab Management ─────────────────────────

function switchStatsTab(tab) {
  currentTab = tab;
  
  document.getElementById('tab-btn-marked').classList.toggle('active', tab === 'marked');
  document.getElementById('tab-btn-history').classList.toggle('active', tab === 'history');

  document.getElementById('marked-view').classList.toggle('hidden', tab !== 'marked');
  document.getElementById('history-view').classList.toggle('hidden', tab !== 'history');

  if (tab === 'marked') {
    renderStats();
  } else {
    renderHistory();
  }
}

// ── Marked Words ───────────────────────────

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
  
  let searchPool = typeof ALL_DATA !== 'undefined' ? ALL_DATA : [];
  if (typeof GEMINI_HSK5_DATA !== 'undefined') {
    searchPool = [...searchPool, ...GEMINI_HSK5_DATA];
  }
  
  for (const [chinese, count] of Object.entries(counts)) {
    if (count >= WRONG_THRESHOLD) {
      const word = searchPool.find(w => w.chinese === chinese);
      if (word) {
        marked.push({ ...word, wrongCount: count });
      } else {
        marked.push({ chinese, pinyin: '—', meaning: '—', wrongCount: count });
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

  totalEl.textContent = `${marked.length} từ sai`;

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
    <div class="stats-item" style="animation-delay: ${i * 30}ms">
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

// ── Play History ───────────────────────────

function getPlayHistory() {
  try {
    const raw = localStorage.getItem(PLAY_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function renderHistory() {
  const history = getPlayHistory();
  const listEl = document.getElementById('history-list');
  const emptyEl = document.getElementById('history-empty-state');
  const actionsEl = document.getElementById('history-actions');
  const totalEl = document.getElementById('stats-total');

  totalEl.textContent = `${history.length} lượt chơi`;

  if (history.length === 0) {
    listEl.classList.add('hidden');
    emptyEl.classList.remove('hidden');
    actionsEl.querySelector('.btn-danger').classList.add('hidden');
    return;
  }

  emptyEl.classList.add('hidden');
  listEl.classList.remove('hidden');
  actionsEl.querySelector('.btn-danger').classList.remove('hidden');

  listEl.innerHTML = history.map((session) => {
    const wrongWords = session.wrongWords || [];
    const accuracy = session.totalQuestions > 0 
      ? Math.round((session.correctCount / session.totalQuestions) * 100) 
      : 0;

    let wrongChipsHtml = '';
    if (wrongWords.length > 0) {
      wrongChipsHtml = `
        <div class="history-wrong-title">Từ chọn sai (${wrongWords.length}):</div>
        <div class="history-wrong-items">
          ${wrongWords.map(w => `
            <div class="history-wrong-chip">
              <span class="chip-chinese">${w.chinese}</span>
              <span class="chip-pinyin">(${w.pinyin})</span>
              <span class="chip-meaning">: ${w.meaning}</span>
            </div>
          `).join('')}
        </div>
      `;
    } else {
      wrongChipsHtml = `<div class="history-wrong-title" style="color: var(--correct);">🎉 Hoàn hảo! Không sai từ nào</div>`;
    }

    return `
      <div class="history-card">
        <div class="history-card-header">
          <span class="history-level">${session.levelLabel || 'HSK'}</span>
          <span class="history-date">🕒 ${session.dateStr || 'Vừa xong'}</span>
        </div>
        <div class="history-summary">
          <div class="history-score-tag">
            <span style="color: var(--correct);">${session.correctCount}</span> / ${session.totalQuestions} câu 
            <span style="font-size: 0.8125rem; color: var(--text-secondary); font-weight: 500;">(${accuracy}%)</span>
          </div>
          <div class="history-wrong-count-tag">
            ${session.incorrectCount} câu sai
          </div>
        </div>
        ${wrongChipsHtml}
      </div>
    `;
  }).join('');
}

// ── Dialog & Actions ───────────────────────

function confirmClearAll() {
  pendingAction = 'clear_marked';
  document.getElementById('dialog-title').textContent = 'Xóa danh sách từ sai?';
  document.getElementById('dialog-message').textContent = 'Tất cả các từ được lưu đánh dấu sai nhiều lần sẽ bị xóa. Hành động này không thể hoàn tác.';
  document.getElementById('confirm-dialog').classList.remove('hidden');
}

function confirmClearHistory() {
  pendingAction = 'clear_history';
  document.getElementById('dialog-title').textContent = 'Xóa lịch sử lượt chơi?';
  document.getElementById('dialog-message').textContent = 'Toàn bộ danh sách các lượt chơi đã lưu trước đây sẽ bị xóa. Hành động này không thể hoàn tác.';
  document.getElementById('confirm-dialog').classList.remove('hidden');
}

function closeDialog() {
  document.getElementById('confirm-dialog').classList.add('hidden');
  pendingAction = null;
}

function executePendingAction() {
  if (pendingAction === 'clear_marked') {
    saveWrongCounts({});
    renderStats();
  } else if (pendingAction === 'clear_history') {
    localStorage.removeItem(PLAY_HISTORY_KEY);
    renderHistory();
  }
  closeDialog();
}

// Close dialog on overlay click
document.getElementById('confirm-dialog').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) {
    closeDialog();
  }
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const tab = params.get('tab');
  if (tab === 'history') {
    switchStatsTab('history');
  } else {
    switchStatsTab('marked');
  }
});
