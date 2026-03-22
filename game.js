'use strict';

/* ══════════════════════════════════════════════
   WordWheel — game.js
   ══════════════════════════════════════════════ */

/* ── State ───────────────────────────────────── */
const state = {
  puzzleIndex : 0,
  selected    : [],   // tile indices in click order
  score       : 0,
  hintUsed    : false,
  done        : false,
  checking    : false, // true while the wrong-answer animation is running
};

/* ── Scoring: points awarded per correct word ── */
function pointsForWord(word) {
  const len = word.length;
  if (len <= 3) return 2;
  if (len === 4) return 4;
  if (len === 5) return 6;
  if (len === 6) return 10;
  return len + 5;   // 7+ letters
}

/* ── DOM References ──────────────────────────── */
const $ = id => document.getElementById(id);

const RING_C = 2 * Math.PI * 15;   // circumference for r=15 in the SVG ring ≈ 94.25

const dom = {
  roundCurrent : $('round-current'),
  roundTotal   : $('round-total'),
  ringFill     : $('ring-fill'),
  score        : $('score'),
  category     : $('category'),
  progressFill : $('progress-fill'),
  slots        : $('slots'),
  feedback     : $('feedback'),
  wheel        : $('wheel'),
  btnClear     : $('btn-clear'),
  btnSubmit    : $('btn-submit'),
  btnHint      : $('btn-hint'),
  btnNext      : $('btn-next'),
  complete     : $('complete-screen'),
  finalScore   : $('final-score'),
  completeEmoji: $('complete-emoji'),
  completeMsg  : $('complete-msg'),
  btnRestart   : $('btn-restart'),
};

/* ── Round progress ring ─────────────────────── */
function updateRing(roundNum) {
  const offset = RING_C * (1 - roundNum / PUZZLES.length);
  dom.ringFill.style.strokeDashoffset = offset.toFixed(2);
  dom.roundCurrent.textContent = roundNum;
  dom.roundTotal.textContent   = PUZZLES.length;
}

/* ── Init / Restart ──────────────────────────── */
function init() {
  state.puzzleIndex = 0;
  state.score       = 0;
  state.done        = false;
  state.checking    = false;

  dom.complete.classList.add('hidden');
  dom.score.textContent = '0';

  loadPuzzle(0);
}

/* ── Load a Puzzle ───────────────────────────── */
function loadPuzzle(idx) {
  const puzzle = PUZZLES[idx];

  state.selected = [];
  state.hintUsed = false;
  state.done     = false;
  state.checking = false;

  // Header / progress
  updateRing(idx + 1);
  dom.category.textContent     = puzzle.category;
  dom.progressFill.style.width = `${(idx / PUZZLES.length) * 100}%`;

  // Word slots
  renderSlots(puzzle.target.length);
  setFeedback('', '');

  // Wheel
  renderWheel(puzzle.letters);

  // Buttons
  dom.btnNext.classList.add('hidden');
  dom.btnClear.disabled  = false;
  dom.btnHint.disabled   = false;
  dom.btnSubmit.disabled = true;   // nothing typed yet
}

/* ── Render Word Slots ───────────────────────── */
function renderSlots(count) {
  dom.slots.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const d = document.createElement('div');
    d.className = 'slot';
    d.id        = `slot-${i}`;
    dom.slots.appendChild(d);
  }
}

/* ── Render Wheel ────────────────────────────── */
function renderWheel(letters) {
  dom.wheel.innerHTML = '';

  const size   = dom.wheel.offsetWidth;
  const cx     = size / 2;
  const cy     = size / 2;
  const radius = size * 0.365;   // ~37 % of diameter places tiles on the rim

  letters.forEach((letter, i) => {
    const angle = (i * 60 - 90) * (Math.PI / 180);   // top = 0, 60° steps
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);

    const btn = document.createElement('button');
    btn.className     = 'tile';
    btn.textContent   = letter;
    btn.dataset.index = i;
    btn.style.left    = `${x}px`;
    btn.style.top     = `${y}px`;
    btn.setAttribute('aria-label', `Letter ${letter}`);

    btn.addEventListener('click', () => onTileClick(i));
    dom.wheel.appendChild(btn);
  });
}

/* ── Helper: get a tile button by its data-index ── */
function getTile(index) {
  return dom.wheel.querySelector(`.tile[data-index="${index}"]`);
}

/* ── Tile Click ──────────────────────────────── */
function onTileClick(index) {
  const puzzle = PUZZLES[state.puzzleIndex];
  if (state.done || state.checking) return;
  if (state.selected.includes(index)) return;   // tile already used

  // Highlight tile
  const tile = getTile(index);
  tile.classList.add('selected', 'used');

  // Append to selection and fill the next slot
  const slotIdx = state.selected.length;
  state.selected.push(index);

  const slot = $(`slot-${slotIdx}`);
  if (slot) {
    slot.textContent = puzzle.letters[index];
    slot.classList.add('filled');
  }

  // Keep submit enabled/disabled in sync
  updateSubmitBtn();
}

/* ── Enable / disable Submit based on input ─── */
function updateSubmitBtn() {
  dom.btnSubmit.disabled = state.selected.length === 0 || state.done || state.checking;
}

/* ── Submit (explicit check) ─────────────────── */
function onSubmit() {
  if (state.done || state.checking || state.selected.length === 0) return;
  checkWord();
}

/* ── Check Word ──────────────────────────────── */
function checkWord() {
  const puzzle = PUZZLES[state.puzzleIndex];
  const formed = state.selected.map(i => puzzle.letters[i]).join('');

  if (formed === puzzle.target) {
    onCorrect(puzzle.target);
  } else {
    onWrong();
  }
}

/* ── Correct Answer ──────────────────────────── */
function onCorrect(word) {
  state.done = true;

  // Always award full points — hint deduction already happened at hint-click time
  const pts = pointsForWord(word);
  state.score += pts;
  dom.score.textContent = state.score;

  // Green wave on each slot (CSS handles staggered animation via .correct)
  dom.slots.querySelectorAll('.slot').forEach(s => s.classList.add('correct'));

  // Green glow on the wheel
  dom.wheel.classList.add('correct-glow');
  setTimeout(() => dom.wheel.classList.remove('correct-glow'), 1400);

  const ptLabel = `+${pts} pt${pts !== 1 ? 's' : ''}`;
  setFeedback(`✓ Correct!  ${ptLabel}`, 'success');

  dom.btnClear.disabled  = true;
  dom.btnSubmit.disabled = true;
  dom.btnHint.disabled   = true;

  setTimeout(() => {
    const isLast = state.puzzleIndex + 1 >= PUZZLES.length;
    dom.btnNext.textContent = isLast ? 'See Results 🏆' : 'Next Puzzle →';
    dom.btnNext.classList.remove('hidden');
  }, 550);
}

/* ── Wrong Answer ────────────────────────────── */
function onWrong() {
  state.checking = true;
  dom.btnSubmit.disabled = true;
  dom.btnClear.disabled  = true;

  // Shake + turn slots red
  dom.slots.querySelectorAll('.slot').forEach(s => s.classList.add('wrong'));
  dom.slots.classList.add('shake');
  dom.slots.addEventListener('animationend', () => dom.slots.classList.remove('shake'), { once: true });

  // Red flash on the wheel border
  dom.wheel.classList.add('wrong-flash');
  dom.wheel.addEventListener('animationend', () => dom.wheel.classList.remove('wrong-flash'), { once: true });

  setFeedback('✗ Not quite — try again!', 'error');

  // Auto-clear after the shake animation, then re-enable input
  setTimeout(() => {
    clearAll();
    state.checking = false;
    dom.btnClear.disabled = false;
    updateSubmitBtn();
  }, 750);
}

/* ── Backspace: remove the last typed letter ─── */
function backspace() {
  if (state.done || state.checking || state.selected.length === 0) return;

  // Pop the last tile index from the selection
  const lastTileIdx = state.selected.pop();

  // Un-highlight the tile so it can be clicked again
  const tile = getTile(lastTileIdx);
  if (tile) {
    tile.classList.remove('selected', 'used');
    tile.style.boxShadow = '';
  }

  // Clear the slot it was filling
  const slotIdx = state.selected.length;   // length after pop = the slot index
  const slot = $(`slot-${slotIdx}`);
  if (slot) {
    slot.textContent = '';
    slot.className   = 'slot';
  }

  updateSubmitBtn();
  setFeedback('', '');
}

/* ── Clear All: full selection reset ─────────── */
function clearAll() {
  if (state.done) return;

  const puzzle = PUZZLES[state.puzzleIndex];
  state.selected = [];

  dom.wheel.querySelectorAll('.tile').forEach(t => {
    t.classList.remove('selected', 'used');
    t.style.boxShadow = '';
  });

  for (let i = 0; i < puzzle.target.length; i++) {
    const slot = $(`slot-${i}`);
    if (slot) {
      slot.textContent = '';
      slot.className   = 'slot';
    }
  }

  updateSubmitBtn();
  setFeedback('', '');
}

/* ── Hint (costs 5 points immediately) ──────── */
function onHint() {
  if (state.done || state.checking || state.hintUsed) return;

  state.hintUsed       = true;
  dom.btnHint.disabled = true;

  // Deduct 5 pts right away (floor at 0)
  const penalty = 5;
  state.score = Math.max(0, state.score - penalty);
  dom.score.textContent = state.score;

  const puzzle  = PUZZLES[state.puzzleIndex];
  const nextPos = state.selected.length;
  const target  = puzzle.target[nextPos];

  // Find the tile for the next expected letter that hasn't been used yet
  const tileIdx = puzzle.letters.findIndex(
    (l, i) => l === target && !state.selected.includes(i)
  );

  setFeedback(`💡 Next: ${target}  (−${penalty} pts)`, 'hint');

  if (tileIdx !== -1) {
    const tile = getTile(tileIdx);
    tile.style.boxShadow = '0 0 0 3px #f59e0b, 0 0 24px rgba(245,158,11,0.65)';

    setTimeout(() => {
      if (!state.selected.includes(tileIdx)) {
        tile.style.boxShadow = '';
      }
    }, 2000);
  }
}

/* ── Next Puzzle ─────────────────────────────── */
function onNext() {
  const next = state.puzzleIndex + 1;

  if (next >= PUZZLES.length) {
    showComplete();
    return;
  }

  state.puzzleIndex = next;
  loadPuzzle(next);
}

/* ── Complete Screen ─────────────────────────── */
function showComplete() {
  dom.progressFill.style.width = '100%';

  const maxScore = PUZZLES.reduce((sum, p) => sum + pointsForWord(p.target), 0);
  dom.finalScore.textContent = `${state.score} / ${maxScore}`;

  const pct = state.score / maxScore;
  let emoji, msg;

  if (pct === 1)       { emoji = '🏆'; msg = 'Perfect score — wordsmith supreme!'; }
  else if (pct >= 0.8) { emoji = '🌟'; msg = 'Brilliant — almost flawless!'; }
  else if (pct >= 0.6) { emoji = '😊'; msg = 'Solid effort — well played!'; }
  else if (pct >= 0.4) { emoji = '🙂'; msg = 'Good start — keep practising!'; }
  else                 { emoji = '💪'; msg = "Keep going — you'll crack it!"; }

  dom.completeEmoji.textContent = emoji;
  dom.completeMsg.textContent   = msg;

  dom.complete.classList.remove('hidden');
}

/* ── Helpers ─────────────────────────────────── */
function setFeedback(text, type) {
  dom.feedback.textContent = text;
  dom.feedback.className   = 'feedback' + (type ? ` ${type}` : '');
}

/* ── Event Listeners ─────────────────────────── */
dom.btnClear.addEventListener('click',   backspace);
dom.btnSubmit.addEventListener('click',  onSubmit);
dom.btnHint.addEventListener('click',    onHint);
dom.btnNext.addEventListener('click',    onNext);
dom.btnRestart.addEventListener('click', init);

/* ── Keyboard support ────────────────────────── */
document.addEventListener('keydown', e => {
  if (e.key === 'Backspace') { e.preventDefault(); backspace(); }
  if (e.key === 'Enter')     { e.preventDefault(); onSubmit(); }
});

/* ── Start ───────────────────────────────────── */
init();
