/* ============================================
   HSK Quiz - Main Application Logic
   ============================================ */

const QUESTIONS_PER_SESSION = 15;
const WRONG_THRESHOLD = 2; // Mark word after this many wrong answers
const NEXT_DELAY = 1500; // ms before auto-advancing

// ── State ──────────────────────────────────
let currentQuestions = [];
let currentQuestionIndex = 0;
let correctCount = 0;
let incorrectCount = 0;
let answered = false;

// ── Storage Keys ───────────────────────────
const STORAGE_KEY = 'hsk5_wrong_counts';

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

function incrementWrongCount(wordNo) {
  const counts = getWrongCounts();
  counts[wordNo] = (counts[wordNo] || 0) + 1;
  saveWrongCounts(counts);
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

// ── Quiz Generation ────────────────────────

function generateQuiz() {
  // Pick 15 random words
  const shuffled = shuffleArray(HSK5_DATA);
  const selected = shuffled.slice(0, QUESTIONS_PER_SESSION);

  return selected.map(word => {
    // Generate 3 wrong choices (different meanings)
    const otherWords = HSK5_DATA.filter(w => w.no !== word.no && w.meaning !== word.meaning);
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
  });
}

// ── Quiz Display ───────────────────────────

function startNewQuiz() {
  currentQuestions = generateQuiz();
  currentQuestionIndex = 0;
  correctCount = 0;
  incorrectCount = 0;

  document.getElementById('quiz-area').classList.remove('hidden');
  document.getElementById('summary-area').classList.add('hidden');

  displayQuestion();
  updateProgress();
}

function displayQuestion() {
  if (currentQuestionIndex >= currentQuestions.length) {
    showSummary();
    return;
  }

  answered = false;
  const q = currentQuestions[currentQuestionIndex];

  // Update question card with animation
  const card = document.getElementById('question-card');
  card.style.animation = 'none';
  card.offsetHeight; // trigger reflow
  card.style.animation = 'cardIn 0.4s cubic-bezier(0.4, 0, 0.2, 1)';

  document.getElementById('question-chinese').textContent = q.word.chinese;
  document.getElementById('question-type').textContent = q.word.type || '';

  // Hide pinyin initially
  const pinyinEl = document.getElementById('question-pinyin');
  pinyinEl.textContent = q.word.pinyin;
  pinyinEl.classList.remove('show');

  // Reset feedback
  const feedback = document.getElementById('feedback');
  feedback.classList.remove('show', 'correct', 'incorrect');

  // Set choices
  const letters = ['A', 'B', 'C', 'D'];
  q.choices.forEach((choice, i) => {
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

  const q = currentQuestions[currentQuestionIndex];
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

    // Track wrong answer
    incrementWrongCount(q.word.no);

    // Show incorrect feedback
    showFeedback(`✗ Sai rồi! Đáp án: ${q.word.meaning}`, 'incorrect');

    // Shake animation
    document.getElementById('question-card').classList.add('shake');
  }

  // Disable all buttons
  for (let i = 0; i < 4; i++) {
    const btn = document.getElementById(`choice-${i}`);
    if (!btn.classList.contains('correct') && !btn.classList.contains('incorrect')) {
      btn.classList.add('disabled');
    }
  }

  // Auto-advance after delay
  setTimeout(() => {
    document.getElementById('question-card').classList.remove('pulse', 'shake');
    currentQuestionIndex++;
    updateProgress();
    displayQuestion();
    updateMarkedSection();
  }, NEXT_DELAY);
}

function showFeedback(message, type) {
  const feedback = document.getElementById('feedback');
  feedback.textContent = message;
  feedback.className = `feedback show ${type}`;
}

function updateProgress() {
  const answered = Math.min(currentQuestionIndex, QUESTIONS_PER_SESSION);
  document.getElementById('progress-count').textContent = `${answered} / ${QUESTIONS_PER_SESSION}`;
  const pct = (answered / QUESTIONS_PER_SESSION) * 100;
  document.getElementById('progress-fill').style.width = `${pct}%`;
}

// ── Summary ────────────────────────────────

function showSummary() {
  document.getElementById('quiz-area').classList.add('hidden');
  document.getElementById('summary-area').classList.remove('hidden');

  document.getElementById('summary-score').textContent = `${correctCount}/${QUESTIONS_PER_SESSION}`;
  document.getElementById('stat-correct').textContent = correctCount;
  document.getElementById('stat-incorrect').textContent = incorrectCount;

  // Emoji based on score
  const ratio = correctCount / QUESTIONS_PER_SESSION;
  let emoji = '🎉';
  if (ratio < 0.4) emoji = '💪';
  else if (ratio < 0.7) emoji = '👍';
  else if (ratio < 1) emoji = '🔥';
  else emoji = '🏆';

  document.getElementById('summary-emoji').textContent = emoji;
}

// ── Marked Words Section ───────────────────

function updateMarkedSection() {
  const container = document.getElementById('marked-content');
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
  startNewQuiz();
  updateMarkedSection();
});
