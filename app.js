/* ============================================
   HSK Quiz - Main Application Logic
   ============================================ */

const WRONG_THRESHOLD = 2; // Mark word after this many wrong answers

// ── State ──────────────────────────────────
let currentData = [];          // The word pool for current level
let currentQuestion = null;     // Current question object
let questionCount = 0;
let correctCount = 0;
let incorrectCount = 0;
let answered = false;
let selectedChoiceIndex = -1;
let currentLevel = 'hsk5';
let currentSource = 'custom';
let sessionStartTime = null;
let sessionWrongWords = [];    // Words answered wrong in THIS session

// ── Storage Keys ───────────────────────────
const WRONG_COUNTS_KEY = 'hsk_wrong_counts';
const ACTIVE_SESSION_KEY = 'hsk_active_session';
const PLAY_HISTORY_KEY = 'hsk_play_history';

// ── Utility Functions ──────────────────────

function getWrongCounts() {
  try {
    const data = localStorage.getItem(WRONG_COUNTS_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

function saveWrongCounts(counts) {
  try {
    localStorage.setItem(WRONG_COUNTS_KEY, JSON.stringify(counts));
  } catch (e) {
    console.error('Failed to save wrong counts:', e);
  }
}

function incrementWrongCount(chinese) {
  const counts = getWrongCounts();
  counts[chinese] = (counts[chinese] || 0) + 1;
  saveWrongCounts(counts);
}

function getMarkedWords() {
  const counts = getWrongCounts();
  const marked = [];
  
  // Search across all datasets
  let searchPool = typeof ALL_DATA !== 'undefined' ? ALL_DATA : currentData;
  if (typeof GEMINI_HSK5_DATA !== 'undefined') {
    searchPool = [...searchPool, ...GEMINI_HSK5_DATA];
  }

  for (const [chinese, count] of Object.entries(counts)) {
    if (count >= WRONG_THRESHOLD) {
      const word = searchPool.find(w => w.chinese === chinese);
      if (word) {
        marked.push({ ...word, wrongCount: count });
      }
    }
  }
  marked.sort((a, b) => b.wrongCount - a.wrongCount);
  return marked;
}

function shuffleArray(arr) {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function formatDateTime(date) {
  const d = new Date(date);
  const pad = n => n < 10 ? '0' + n : n;
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function getLevelLabel(level, source) {
  const labels = {
    'hsk2': 'HSK 2',
    'hsk3': 'HSK 3',
    'hsk4': 'HSK 4',
    'hsk5': source === 'gemini' ? 'HSK 5 (Gemini)' : 'HSK 5 (File gộp)'
  };
  return labels[level] || level.toUpperCase();
}

// ── Level & Source Detection ────────────────

function detectLevel() {
  const params = new URLSearchParams(window.location.search);
  const level = params.get('level') || localStorage.getItem('hsk_current_level') || 'hsk5';
  const source = params.get('source') || localStorage.getItem('hsk_data_source') || 'custom';
  
  currentLevel = level;
  currentSource = source;

  localStorage.setItem('hsk_current_level', level);
  localStorage.setItem('hsk_data_source', source);

  // Set data based on level and source
  if (source === 'gemini' && typeof GEMINI_HSK5_DATA !== 'undefined' && GEMINI_HSK5_DATA.length > 0) {
    currentData = GEMINI_HSK5_DATA;
  } else if (typeof DATA_MAP !== 'undefined' && DATA_MAP[level] && DATA_MAP[level].length > 0) {
    currentData = DATA_MAP[level];
  } else if (typeof ALL_DATA !== 'undefined' && ALL_DATA.length > 0) {
    currentData = ALL_DATA;
  } else if (typeof HSK5_DATA !== 'undefined' && HSK5_DATA.length > 0) {
    currentData = HSK5_DATA;
  }

  // Update badge
  const badge = document.getElementById('quiz-level-badge');
  if (badge) {
    badge.textContent = getLevelLabel(level, source);
  }

  console.log(`Loaded Level: ${level}, Source: ${source}, Words: ${currentData.length}`);
}

// ── Active Session Persistence (LocalStorage) ──

function saveActiveSession() {
  if (!currentQuestion || !currentQuestion.word) return;
  
  const sessionData = {
    level: currentLevel,
    source: currentSource,
    questionCount,
    correctCount,
    incorrectCount,
    currentQuestion,
    answered,
    selectedChoiceIndex,
    sessionStartTime: sessionStartTime || new Date().toISOString(),
    sessionWrongWords,
    lastUpdated: new Date().toISOString()
  };

  try {
    localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(sessionData));
  } catch (e) {
    console.error('Failed to save active session:', e);
  }
}

function clearActiveSession() {
  try {
    localStorage.removeItem(ACTIVE_SESSION_KEY);
  } catch (e) {
    console.error('Failed to clear active session:', e);
  }
}

function tryRestoreActiveSession() {
  try {
    const raw = localStorage.getItem(ACTIVE_SESSION_KEY);
    if (!raw) return false;
    
    const data = JSON.parse(raw);
    if (!data || !data.currentQuestion || !data.currentQuestion.word) return false;

    const params = new URLSearchParams(window.location.search);
    const isExplicitResume = params.get('resume') === '1';

    // Match level & source or explicit resume
    if (!isExplicitResume && (data.level !== currentLevel || data.source !== currentSource)) {
      return false;
    }

    // Restore state
    currentLevel = data.level || currentLevel;
    currentSource = data.source || currentSource;
    questionCount = data.questionCount || 1;
    correctCount = data.correctCount || 0;
    incorrectCount = data.incorrectCount || 0;
    currentQuestion = data.currentQuestion;
    answered = !!data.answered;
    selectedChoiceIndex = typeof data.selectedChoiceIndex === 'number' ? data.selectedChoiceIndex : -1;
    sessionStartTime = data.sessionStartTime || new Date().toISOString();
    sessionWrongWords = data.sessionWrongWords || [];

    // Re-detect data for restored level/source
    detectLevel();

    // Render UI
    renderCurrentQuestionUI();
    return true;
  } catch (e) {
    console.error('Failed to restore active session:', e);
    return false;
  }
}

function finishAndSaveSession() {
  if (questionCount <= 0 || !currentQuestion) {
    window.location.href = 'index.html';
    return;
  }

  // Create play history record
  const historyItem = {
    id: 'sess_' + Date.now(),
    startTime: sessionStartTime || new Date().toISOString(),
    endTime: new Date().toISOString(),
    dateStr: formatDateTime(new Date()),
    level: currentLevel,
    source: currentSource,
    levelLabel: getLevelLabel(currentLevel, currentSource),
    totalQuestions: questionCount,
    correctCount: correctCount,
    incorrectCount: incorrectCount,
    wrongWords: sessionWrongWords
  };

  // Append to play history in localStorage
  try {
    const raw = localStorage.getItem(PLAY_HISTORY_KEY);
    const history = raw ? JSON.parse(raw) : [];
    history.unshift(historyItem); // Newest first
    localStorage.setItem(PLAY_HISTORY_KEY, JSON.stringify(history));
  } catch (e) {
    console.error('Error saving play history:', e);
  }

  // Clear active session
  clearActiveSession();

  // Redirect to stats page history tab
  window.location.href = 'stats.html?tab=history';
}

// ── Question Generation ────────────────────

function generateQuestion() {
  if (!currentData || currentData.length === 0) {
    console.error('No word data available to generate question!');
    return null;
  }

  const wordIndex = Math.floor(Math.random() * currentData.length);
  const word = currentData[wordIndex];

  const otherWords = currentData.filter(w => w.chinese !== word.chinese && w.meaning !== word.meaning);
  const wrongChoices = shuffleArray(otherWords).slice(0, 3);

  const choices = shuffleArray([
    { text: word.meaning, isCorrect: true },
    ...wrongChoices.map(w => ({ text: w.meaning, isCorrect: false }))
  ]);

  return {
    word,
    choices,
    correctIndex: choices.findIndex(c => c.isCorrect)
  };
}

// ── Quiz Display & Render ──────────────────

function initQuiz() {
  detectLevel();

  // Try to restore previous active session first
  if (tryRestoreActiveSession()) {
    console.log('Restored active session from localStorage successfully!');
    return;
  }

  // Otherwise start a brand new session
  questionCount = 1;
  correctCount = 0;
  incorrectCount = 0;
  answered = false;
  selectedChoiceIndex = -1;
  sessionStartTime = new Date().toISOString();
  sessionWrongWords = [];

  currentQuestion = generateQuestion();
  saveActiveSession();
  renderCurrentQuestionUI();
}

function renderCurrentQuestionUI() {
  if (!currentQuestion || !currentQuestion.word) {
    console.error('Cannot render UI: currentQuestion is null');
    return;
  }

  // Update score bar
  document.getElementById('question-number').textContent = questionCount;
  document.getElementById('correct-count').textContent = correctCount;
  document.getElementById('incorrect-count').textContent = incorrectCount;

  // Update question card
  const card = document.getElementById('question-card');
  if (card) {
    card.style.animation = 'none';
    card.offsetHeight; // trigger reflow
    card.style.animation = 'cardIn 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
  }

  document.getElementById('question-chinese').textContent = currentQuestion.word.chinese;
  document.getElementById('question-type').textContent = currentQuestion.word.type || '';

  const pinyinEl = document.getElementById('question-pinyin');
  pinyinEl.textContent = currentQuestion.word.pinyin;

  const nextBtn = document.getElementById('next-btn');

  if (answered) {
    pinyinEl.classList.add('show');

    const isCorrect = selectedChoiceIndex >= 0 && currentQuestion.choices[selectedChoiceIndex] && currentQuestion.choices[selectedChoiceIndex].isCorrect;

    currentQuestion.choices.forEach((choice, i) => {
      const btn = document.getElementById(`choice-${i}`);
      const textEl = document.getElementById(`choice-text-${i}`);
      if (btn && textEl) {
        textEl.textContent = choice.text;
        btn.className = 'choice-btn disabled';
        btn.disabled = true;

        if (i === currentQuestion.correctIndex) {
          btn.classList.add('correct');
        } else if (i === selectedChoiceIndex && !isCorrect) {
          btn.classList.add('incorrect');
        }
      }
    });

    if (isCorrect) {
      showFeedback('✓ Chính xác!', 'correct');
    } else {
      showFeedback(`✗ Sai rồi! Đáp án: ${currentQuestion.word.meaning}`, 'incorrect');
    }

    if (nextBtn) nextBtn.classList.remove('hidden');
  } else {
    pinyinEl.classList.remove('show');
    const feedback = document.getElementById('feedback');
    if (feedback) feedback.classList.remove('show', 'correct', 'incorrect');
    if (nextBtn) nextBtn.classList.add('hidden');

    currentQuestion.choices.forEach((choice, i) => {
      const btn = document.getElementById(`choice-${i}`);
      const textEl = document.getElementById(`choice-text-${i}`);
      if (btn && textEl) {
        textEl.textContent = choice.text;
        btn.className = 'choice-btn';
        btn.disabled = false;
      }
    });
  }

  updateMarkedSection();
}

function showNextQuestion() {
  answered = false;
  selectedChoiceIndex = -1;
  questionCount++;

  currentQuestion = generateQuestion();
  saveActiveSession();
  renderCurrentQuestionUI();
}

function selectAnswer(index) {
  if (answered) return;
  answered = true;
  selectedChoiceIndex = index;

  const q = currentQuestion;
  const isCorrect = q.choices[index].isCorrect;

  if (isCorrect) {
    correctCount++;
    document.getElementById('question-card').classList.add('pulse');
  } else {
    incorrectCount++;
    incrementWrongCount(q.word.chinese);

    if (!sessionWrongWords.some(w => w.chinese === q.word.chinese)) {
      sessionWrongWords.push({
        chinese: q.word.chinese,
        pinyin: q.word.pinyin,
        meaning: q.word.meaning
      });
    }
    document.getElementById('question-card').classList.add('shake');
  }

  saveActiveSession();
  renderCurrentQuestionUI();
}

function nextQuestion() {
  const card = document.getElementById('question-card');
  if (card) card.classList.remove('pulse', 'shake');
  showNextQuestion();
}

function showFeedback(message, type) {
  const feedback = document.getElementById('feedback');
  if (feedback) {
    feedback.textContent = message;
    feedback.className = `feedback show ${type}`;
  }
}

// ── Marked Words Section ───────────────────

function updateMarkedSection() {
  const container = document.getElementById('marked-content');
  if (!container) return;
  
  const marked = getMarkedWords();

  if (marked.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">✨</div>
        <p>Chưa có từ nào cần ôn tập</p>
      </div>
    `;
    return;
  }

  let html = `
    <table class="marked-table">
      <thead>
        <tr>
          <th>Tiếng Trung</th>
          <th>Nghĩa</th>
          <th>Pinyin</th>
          <th>Sai</th>
        </tr>
      </thead>
      <tbody>
  `;

  marked.forEach(word => {
    html += `
      <tr>
        <td>${word.chinese}</td>
        <td>${word.meaning}</td>
        <td>${word.pinyin}</td>
        <td><span class="wrong-count">×${word.wrongCount}</span></td>
      </tr>
    `;
  });

  html += '</tbody></table>';
  container.innerHTML = html;
}

// ── Initialize ─────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  initQuiz();
});
