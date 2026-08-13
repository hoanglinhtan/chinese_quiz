/* ============================================
   HSK Quiz - Main Application Logic
   ============================================ */

const WRONG_THRESHOLD = 2; // Mark word after this many wrong answers

// ── State ──────────────────────────────────
let currentData = [];       // The word pool for current level
let currentQuestion = null;  // Current question object
let questionCount = 0;
let correctCount = 0;
let incorrectCount = 0;
let answered = false;
let currentLevel = 'hsk5';

// ── Storage Keys ───────────────────────────
const STORAGE_KEY = 'hsk_wrong_counts';

// ── Utility Functions ──────────────────────

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

function incrementWrongCount(chinese) {
  const counts = getWrongCounts();
  counts[chinese] = (counts[chinese] || 0) + 1;
  saveWrongCounts(counts);
}

function getMarkedWords() {
  const counts = getWrongCounts();
  const marked = [];
  for (const [chinese, count] of Object.entries(counts)) {
    if (count >= WRONG_THRESHOLD) {
      // Find word data from current data or all data
      const searchPool = typeof ALL_DATA !== 'undefined' ? ALL_DATA : currentData;
      const word = searchPool.find(w => w.chinese === chinese);
      if (word) {
        marked.push({ ...word, wrongCount: count });
      }
    }
  }
  // Sort by wrong count descending
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

// ── Level Detection ────────────────────────

function detectLevel() {
  const params = new URLSearchParams(window.location.search);
  const level = params.get('level') || 'hsk5';
  currentLevel = level;

  // Set data based on level
  if (typeof DATA_MAP !== 'undefined' && DATA_MAP[level]) {
    currentData = DATA_MAP[level];
  } else if (typeof ALL_DATA !== 'undefined') {
    currentData = ALL_DATA;
  } else if (typeof HSK5_DATA !== 'undefined') {
    currentData = HSK5_DATA;
  }

  // Update badge
  const badge = document.getElementById('quiz-level-badge');
  if (badge) {
    const labels = {
      'hsk2': 'HSK 2',
      'hsk3': 'HSK 3',
      'hsk4': 'HSK 4',
      'hsk5': 'HSK 5 (Tổng hợp)'
    };
    badge.textContent = labels[level] || level.toUpperCase();
  }

  console.log(`Level: ${level}, Words: ${currentData.length}`);
}

// ── Question Generation ────────────────────

function generateQuestion() {
  // Pick a random word
  const wordIndex = Math.floor(Math.random() * currentData.length);
  const word = currentData[wordIndex];

  // Generate 3 wrong choices (different meanings)
  const otherWords = currentData.filter(w => w.chinese !== word.chinese && w.meaning !== word.meaning);
  const wrongChoices = shuffleArray(otherWords).slice(0, 3);

  // Build choices array with correct answer
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

// ── Quiz Display ───────────────────────────

function startQuiz() {
  questionCount = 0;
  correctCount = 0;
  incorrectCount = 0;
  showNextQuestion();
  updateMarkedSection();
}

function showNextQuestion() {
  answered = false;
  questionCount++;
  currentQuestion = generateQuestion();

  // Update score bar
  document.getElementById('question-number').textContent = questionCount;
  document.getElementById('correct-count').textContent = correctCount;
  document.getElementById('incorrect-count').textContent = incorrectCount;

  // Update question card with animation
  const card = document.getElementById('question-card');
  card.style.animation = 'none';
  card.offsetHeight; // trigger reflow
  card.style.animation = 'cardIn 0.4s cubic-bezier(0.4, 0, 0.2, 1)';

  document.getElementById('question-chinese').textContent = currentQuestion.word.chinese;
  document.getElementById('question-type').textContent = currentQuestion.word.type || '';

  // Hide pinyin initially
  const pinyinEl = document.getElementById('question-pinyin');
  pinyinEl.textContent = currentQuestion.word.pinyin;
  pinyinEl.classList.remove('show');

  // Reset feedback
  const feedback = document.getElementById('feedback');
  feedback.classList.remove('show', 'correct', 'incorrect');

  // Hide next button
  document.getElementById('next-btn').classList.add('hidden');

  // Set choices
  currentQuestion.choices.forEach((choice, i) => {
    const btn = document.getElementById(`choice-${i}`);
    const textEl = document.getElementById(`choice-text-${i}`);
    textEl.textContent = choice.text;
    btn.className = 'choice-btn';
    btn.disabled = false;
  });
}

function selectAnswer(index) {
  if (answered) return;
  answered = true;

  const q = currentQuestion;
  const isCorrect = q.choices[index].isCorrect;

  // Show pinyin
  document.getElementById('question-pinyin').classList.add('show');

  // Highlight selected choice
  const selectedBtn = document.getElementById(`choice-${index}`);
  const correctBtn = document.getElementById(`choice-${q.correctIndex}`);

  if (isCorrect) {
    selectedBtn.classList.add('correct');
    correctCount++;

    // Show correct feedback
    showFeedback('✓ Chính xác!', 'correct');

    // Pulse animation on question card
    document.getElementById('question-card').classList.add('pulse');
  } else {
    selectedBtn.classList.add('incorrect');
    correctBtn.classList.add('correct');
    incorrectCount++;

    // Track wrong answer by chinese characters
    incrementWrongCount(q.word.chinese);

    // Show incorrect feedback
    showFeedback(`✗ Sai rồi! Đáp án: ${q.word.meaning}`, 'incorrect');

    // Shake animation
    document.getElementById('question-card').classList.add('shake');
  }

  // Update score
  document.getElementById('correct-count').textContent = correctCount;
  document.getElementById('incorrect-count').textContent = incorrectCount;

  // Disable all buttons
  for (let i = 0; i < 4; i++) {
    const btn = document.getElementById(`choice-${i}`);
    if (!btn.classList.contains('correct') && !btn.classList.contains('incorrect')) {
      btn.classList.add('disabled');
    }
  }

  // Show next button
  document.getElementById('next-btn').classList.remove('hidden');

  // Update marked section
  updateMarkedSection();
}

function nextQuestion() {
  document.getElementById('question-card').classList.remove('pulse', 'shake');
  showNextQuestion();
}

function showFeedback(message, type) {
  const feedback = document.getElementById('feedback');
  feedback.textContent = message;
  feedback.className = `feedback show ${type}`;
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
  detectLevel();
  startQuiz();
});
