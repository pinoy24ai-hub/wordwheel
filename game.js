'use strict';

/* ══════════════════════════════════════════════
   WordWheel — game.js
   ══════════════════════════════════════════════ */

/* ── Difficulty configuration ────────────────── */
const DIFFICULTY_CONFIG = {
  easy:   { timer: 0,  hintCost: 5,  label: 'Easy'   },
  medium: { timer: 60, hintCost: 5,  label: 'Medium' },
  hard:   { timer: 30, hintCost: 10, label: 'Hard'   },
};

/* ── Scoring ─────────────────────────────────── */
function pointsForWord(word) {
  const len = word.length;
  if (len <= 3) return 2;
  if (len === 4) return 4;
  if (len === 5) return 6;
  if (len === 6) return 10;
  return len + 5;   // 7-letter hard words → 12 pts
}

const BONUS_PTS = { 3: 5, 4: 10, 5: 15 };

/* ── Streak multiplier ───────────────────────── */
function streakMultiplier(streak) {
  if (streak >= 4) return 3;
  if (streak === 3) return 2;
  if (streak === 2) return 1.5;
  return 1;
}

function streakFlames(streak) {
  if (streak >= 7) return '🔥🔥🔥';
  if (streak >= 5) return '🔥🔥';
  if (streak >= 3) return '🔥';
  return '';
}

/* ── Daily Challenge — seeded PRNG (Mulberry32) ── */
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed  = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ (seed >>> 15), seed | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function todaySeed() {
  const d = new Date();
  // YYYYMMDD integer — unique per calendar day, timezone-local
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

function getDailyPuzzle() {
  const seed  = todaySeed();
  const rng   = mulberry32(seed);
  // Rotate difficulty by day-of-year so Easy/Medium/Hard cycle predictably
  const diffs = ['easy', 'medium', 'hard'];
  const diff  = diffs[seed % 3];
  const pool  = WORD_SETS[diff];
  const idx   = Math.floor(rng() * pool.length);
  return { puzzle: pool[idx], difficulty: diff };
}

function formatDailyDate() {
  return new Date().toLocaleDateString('en-US', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

/* ── Bonus word helpers ──────────────────────── */
function canFormWord(word, letters) {
  const freq = {};
  for (const l of letters) freq[l] = (freq[l] || 0) + 1;
  for (const l of word) {
    if (!freq[l]) return false;
    freq[l]--;
  }
  return true;
}

function computeBonusWords(puzzle) {
  const target = puzzle.target;
  const available = new Set();
  for (const w of BONUS_WORDS) {
    if (w.length < target.length && canFormWord(w, puzzle.letters)) {
      available.add(w);
    }
  }
  return available;
}

/* ── Ring / timer circumferences ────────────── */
const RING_C  = 2 * Math.PI * 15;   // round-progress ring  r=15 ≈ 94.25
const TIMER_C = 2 * Math.PI * 18;   // countdown timer ring r=18 ≈ 113.10

/* ── Active puzzle set (set when difficulty chosen) ── */
let currentPuzzles = [];

/* ── Random selection helper ─────────────────── */
function pickRandom(pool, n) {
  // Fisher-Yates on a copy, then slice to n
  const arr = [...pool];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, Math.min(n, arr.length));
}

/* ── State ───────────────────────────────────── */
const state = {
  puzzleIndex  : 0,
  selected     : [],      // original letter indices in click order
  wheelOrder   : [],      // visual position → original letter index
  score        : 0,
  hintUsed      : false,
  done          : false,
  checking      : false,   // true during wrong-answer shake
  difficulty      : null,
  timerValue      : 0,
  timerInterval   : null,
  bonusAvailable  : new Set(),
  bonusFound      : new Set(),
  streak          : 0,      // consecutive target-word solves
  bestStreak      : 0,      // session high
  puzzleStartTime : 0,      // Date.now() at puzzle load
  speedSolves     : 0,      // rounds solved within 10 s
  hintFreeCount   : 0,      // rounds solved without a hint
  // Daily Challenge
  isDailyChallenge: false,
  dailySolved     : false,
  dailyHintsUsed  : 0,
  dailySpeedSolve : false,
};

/* ── DOM references ──────────────────────────── */
const $ = id => document.getElementById(id);

const dom = {
  // Difficulty screen
  diffScreen    : $('diff-screen'),
  diffBtnEasy   : $('diff-easy'),
  diffBtnMedium : $('diff-medium'),
  diffBtnHard   : $('diff-hard'),
  // Header
  diffBadge     : $('diff-badge'),
  roundCurrent  : $('round-current'),
  roundTotal    : $('round-total'),
  ringFill      : $('ring-fill'),
  score         : $('score'),
  // Game area
  category      : $('category'),
  progressFill  : $('progress-fill'),
  timerWrap     : $('timer-wrap'),
  timerNum      : $('timer-num'),
  timerRingFill : $('timer-ring-fill'),
  slots         : $('slots'),
  feedback      : $('feedback'),
  wheel         : $('wheel'),
  streakFlame      : $('streak-flame'),
  completeStats    : $('complete-stats'),
  // Daily Challenge
  diffBtnDaily     : $('diff-daily'),
  dailyBtnSub      : $('daily-btn-sub'),
  dailyScreen      : $('daily-screen'),
  dailyDateStr     : $('daily-date-str'),
  dailyDiffLbl     : $('daily-diff-lbl'),
  dailyResultIcon  : $('daily-result-icon'),
  dailyWordReveal  : $('daily-word-reveal'),
  dsScore          : $('ds-score'),
  dsHints          : $('ds-hints'),
  dsSpeed          : $('ds-speed'),
  dailySharePrev   : $('daily-share-preview'),
  btnShareResult   : $('btn-share-result'),
  btnDailyBack     : $('btn-daily-back'),
  // Buttons
  btnShuffle    : $('btn-shuffle'),
  btnClear      : $('btn-clear'),
  btnSubmit     : $('btn-submit'),
  btnHint       : $('btn-hint'),
  btnNext       : $('btn-next'),
  // Complete screen
  complete      : $('complete-screen'),
  finalScore    : $('final-score'),
  completeEmoji : $('complete-emoji'),
  completeMsg   : $('complete-msg'),
  btnRestart    : $('btn-restart'),
};

/* ══════════════════════════════════════════════
   Round progress ring
   ══════════════════════════════════════════════ */
function updateRing(roundNum) {
  const total  = currentPuzzles.length;
  const offset = RING_C * (1 - roundNum / total);
  dom.ringFill.style.strokeDashoffset = offset.toFixed(2);
  dom.roundCurrent.textContent = roundNum;
  dom.roundTotal.textContent   = total;
}

/* ══════════════════════════════════════════════
   Streak display
   ══════════════════════════════════════════════ */
function updateStreakDisplay() {
  const flames = streakFlames(state.streak);
  dom.streakFlame.textContent = flames;
  if (flames) {
    dom.streakFlame.classList.remove('flame-pop');
    // force reflow so animation re-triggers
    void dom.streakFlame.offsetWidth;
    dom.streakFlame.classList.add('flame-pop');
    dom.streakFlame.addEventListener('animationend',
      () => dom.streakFlame.classList.remove('flame-pop'), { once: true }
    );
  }
}

/* ══════════════════════════════════════════════
   Timer
   ══════════════════════════════════════════════ */
function startTimer() {
  const { timer } = DIFFICULTY_CONFIG[state.difficulty];
  if (timer === 0) return;    // easy — no countdown

  state.timerValue = timer;
  updateTimerDisplay();

  state.timerInterval = setInterval(() => {
    if (state.done) { stopTimer(); return; }
    state.timerValue--;
    updateTimerDisplay();
    if (state.timerValue <= 0) {
      stopTimer();
      onTimeUp();
    }
  }, 1000);
}

function stopTimer() {
  if (state.timerInterval) {
    clearInterval(state.timerInterval);
    state.timerInterval = null;
  }
}

function updateTimerDisplay() {
  const { timer: maxTime } = DIFFICULTY_CONFIG[state.difficulty];
  const t      = state.timerValue;
  const offset = TIMER_C * (1 - t / maxTime);

  dom.timerNum.textContent = t;
  dom.timerRingFill.style.strokeDashoffset = offset.toFixed(2);

  // Colour state
  const w = dom.timerWrap;
  w.className = 'timer-wrap';
  if      (t <= 5)  w.classList.add('timer-critical');
  else if (t <= 15) w.classList.add('timer-warning');
}

function onTimeUp() {
  if (state.done) return;
  state.done   = true;
  state.streak = 0;
  updateStreakDisplay();

  const puzzle  = currentPuzzles[state.puzzleIndex];

  // Reveal the answer in the slots (shown red)
  const slotEls = dom.slots.querySelectorAll('.slot');
  [...puzzle.target].forEach((ch, i) => {
    if (slotEls[i]) { slotEls[i].textContent = ch; slotEls[i].className = 'slot wrong'; }
  });
  dom.slots.classList.add('shake');
  dom.slots.addEventListener('animationend', () => dom.slots.classList.remove('shake'), { once: true });

  // Drain the ring fully
  dom.timerRingFill.style.strokeDashoffset = TIMER_C.toFixed(2);
  dom.timerWrap.className = 'timer-wrap timer-critical';

  setFeedback(`⏰ Time's up!  The word was ${puzzle.target}`, 'error');

  dom.btnClear.disabled   = true;
  dom.btnSubmit.disabled  = true;
  dom.btnHint.disabled    = true;
  dom.btnShuffle.disabled = true;

  setTimeout(() => {
    const isLast = state.puzzleIndex + 1 >= currentPuzzles.length;
    if (state.isDailyChallenge) {
      dom.btnNext.textContent = '📊 See Result';
    } else {
      dom.btnNext.textContent = isLast ? 'See Results 🏆' : 'Next Puzzle →';
    }
    dom.btnNext.classList.remove('hidden');
  }, 700);
}

/* ══════════════════════════════════════════════
   Screens
   ══════════════════════════════════════════════ */

/* Show difficulty selector, reset everything */
function init() {
  stopTimer();
  state.puzzleIndex   = 0;
  state.score         = 0;
  state.done          = false;
  state.checking      = false;
  state.difficulty    = null;
  currentPuzzles      = [];

  state.streak           = 0;
  state.bestStreak       = 0;
  state.speedSolves      = 0;
  state.hintFreeCount    = 0;
  state.isDailyChallenge = false;
  state.dailySolved      = false;
  state.dailyHintsUsed   = 0;
  state.dailySpeedSolve  = false;
  dom.streakFlame.textContent  = '';
  dom.dailyBtnSub.textContent  = formatDailyDate();
  dom.complete.classList.add('hidden');
  dom.dailyScreen.classList.add('hidden');
  dom.diffScreen.classList.remove('hidden');
}

/* Called when player taps a difficulty card */
function startGame(level) {
  state.difficulty    = level;
  state.score         = 0;
  state.streak        = 0;
  state.bestStreak    = 0;
  state.speedSolves   = 0;
  state.hintFreeCount = 0;
  currentPuzzles      = pickRandom(WORD_SETS[level], 20);

  dom.diffScreen.classList.add('hidden');
  dom.score.textContent = '0';

  // Difficulty badge
  const cfg = DIFFICULTY_CONFIG[level];
  dom.diffBadge.textContent = cfg.label;
  dom.diffBadge.className   = `diff-badge diff-badge-${level}`;

  // Show/hide timer ring
  dom.timerWrap.classList.toggle('hidden', cfg.timer === 0);

  loadPuzzle(0);
}

/* ══════════════════════════════════════════════
   Puzzle loading
   ══════════════════════════════════════════════ */
function loadPuzzle(idx) {
  const puzzle = currentPuzzles[idx];

  stopTimer();

  state.selected      = [];
  state.wheelOrder    = puzzle.letters.map((_, i) => i);
  state.hintUsed      = false;
  state.done          = false;
  state.checking      = false;
  state.bonusFound      = new Set();
  state.bonusAvailable  = computeBonusWords(puzzle);
  state.puzzleStartTime = Date.now();

  updateRing(idx + 1);
  dom.category.textContent     = puzzle.category;
  dom.progressFill.style.width = `${(idx / currentPuzzles.length) * 100}%`;

  renderSlots(puzzle.target.length);
  setFeedback('', '');
  renderWheel(puzzle.letters);

  dom.btnNext.classList.add('hidden');
  dom.btnClear.disabled   = false;
  dom.btnHint.disabled    = false;
  dom.btnShuffle.disabled = false;
  dom.btnSubmit.disabled  = true;

  startTimer();
}

/* ══════════════════════════════════════════════
   Rendering
   ══════════════════════════════════════════════ */
function renderSlots(count) {
  dom.slots.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const d = document.createElement('div');
    d.className = 'slot';
    d.id        = `slot-${i}`;
    dom.slots.appendChild(d);
  }
}

function renderWheel(letters) {
  dom.wheel.innerHTML = '';

  // SVG layer for the slide trail — appended first so it sits behind tiles
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.id = 'trail-svg';
  svg.style.cssText =
    'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:visible;z-index:0';
  dom.wheel.appendChild(svg);

  const size   = dom.wheel.offsetWidth;
  const cx     = size / 2;
  const cy     = size / 2;
  const radius = size * 0.365;
  const n      = state.wheelOrder.length;

  state.wheelOrder.forEach((letterIdx, position) => {
    // Equal angular spacing for any number of tiles (5, 6, or 7)
    const angle = (position * (360 / n) - 90) * (Math.PI / 180);
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);

    const btn = document.createElement('button');
    btn.className     = 'tile';
    btn.textContent   = letters[letterIdx];
    btn.dataset.index = letterIdx;
    btn.style.left    = `${x}px`;
    btn.style.top     = `${y}px`;
    btn.setAttribute('aria-label', `Letter ${letters[letterIdx]}`);

    // Restore highlight if this letter is already in the current word
    if (state.selected.includes(letterIdx)) {
      btn.classList.add('selected', 'used');
    }

    dom.wheel.appendChild(btn);
  });
}

function getTile(index) {
  return dom.wheel.querySelector(`.tile[data-index="${index}"]`);
}

/* ══════════════════════════════════════════════
   Slide trail (SVG overlay)
   ══════════════════════════════════════════════ */
function renderTrail(liveX, liveY) {
  const svg = document.getElementById('trail-svg');
  if (!svg) return;
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  if (state.selected.length === 0) return;

  const wr = dom.wheel.getBoundingClientRect();
  const lx = (cx, cy) => [cx - wr.left, cy - wr.top];

  // Centre point of each selected tile
  const pts = [];
  for (const idx of state.selected) {
    const tile = getTile(idx);
    if (!tile) continue;
    const r = tile.getBoundingClientRect();
    pts.push(lx(r.left + r.width / 2, r.top + r.height / 2));
  }

  // Extend to live finger position while dragging
  if (_isDragging && liveX !== undefined) pts.push(lx(liveX, liveY));

  const ns  = 'http://www.w3.org/2000/svg';
  const str = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');

  if (pts.length >= 2) {
    // Outer glow
    const glow = document.createElementNS(ns, 'polyline');
    glow.setAttribute('points', str);
    glow.setAttribute('fill', 'none');
    glow.setAttribute('stroke', 'rgba(251,191,36,0.20)');
    glow.setAttribute('stroke-width', '14');
    glow.setAttribute('stroke-linecap', 'round');
    glow.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(glow);

    // Core line
    const line = document.createElementNS(ns, 'polyline');
    line.setAttribute('points', str);
    line.setAttribute('fill', 'none');
    line.setAttribute('stroke', 'rgba(251,191,36,0.80)');
    line.setAttribute('stroke-width', '3');
    line.setAttribute('stroke-linecap', 'round');
    line.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(line);
  }

  // Dot at each confirmed tile centre
  for (const [x, y] of pts.slice(0, state.selected.length)) {
    const dot = document.createElementNS(ns, 'circle');
    dot.setAttribute('cx', x.toFixed(1));
    dot.setAttribute('cy', y.toFixed(1));
    dot.setAttribute('r', '5');
    dot.setAttribute('fill', 'rgba(251,191,36,0.90)');
    svg.appendChild(dot);
  }
}

/* ══════════════════════════════════════════════
   Interaction — drag-to-select (touch + mouse)
   ══════════════════════════════════════════════ */
let _isDragging = false;

function setupWheelInteraction() {
  /* Hit-test: find the .tile element (if any) directly under a screen point.
     elementFromPoint skips pointer-events:none nodes like the SVG trail. */
  function tileAt(x, y) {
    const el = document.elementFromPoint(x, y);
    if (!el) return null;
    const t = el.classList.contains('tile') ? el : el.closest('.tile');
    return t && dom.wheel.contains(t) ? t : null;
  }

  function startGesture(x, y) {
    if (state.done || state.checking) return;
    _isDragging = true;
    clearAll();
    const tile = tileAt(x, y);
    if (tile) selectTile(parseInt(tile.dataset.index, 10));
    renderTrail(x, y);
  }

  function moveGesture(x, y) {
    if (!_isDragging || state.done || state.checking) return;
    const tile = tileAt(x, y);
    if (tile) selectTile(parseInt(tile.dataset.index, 10));
    renderTrail(x, y);
  }

  function endGesture() {
    if (!_isDragging) return;
    _isDragging = false;
    renderTrail();
    if (state.selected.length > 0 && !state.done && !state.checking) {
      onSubmit();
    }
  }

  function cancelGesture() {
    if (!_isDragging) return;
    _isDragging = false;
    clearAll();
  }

  /* ── Touch (mobile) — registered on wheel so touchmove follows the
        original contact point even when the finger drifts outside.
        { passive: false } is required so preventDefault() can block
        the browser's scroll before it claims the gesture.          ── */
  dom.wheel.addEventListener('touchstart', e => {
    e.preventDefault();
    const t = e.changedTouches[0];
    startGesture(t.clientX, t.clientY);
  }, { passive: false });

  dom.wheel.addEventListener('touchmove', e => {
    e.preventDefault();
    const t = e.changedTouches[0];
    moveGesture(t.clientX, t.clientY);
  }, { passive: false });

  dom.wheel.addEventListener('touchend', e => {
    e.preventDefault(); // prevent synthetic mouse click from firing
    endGesture();
  }, { passive: false });

  dom.wheel.addEventListener('touchcancel', cancelGesture);

  /* ── Mouse (desktop) — mousemove/mouseup on document so dragging
        outside the wheel boundary still completes the gesture.      ── */
  dom.wheel.addEventListener('mousedown', e => {
    if (e.button !== 0) return;
    startGesture(e.clientX, e.clientY);
  });

  document.addEventListener('mousemove', e => {
    moveGesture(e.clientX, e.clientY);
  });

  document.addEventListener('mouseup', e => {
    if (e.button !== 0) return;
    endGesture();
  });
}

function selectTile(index) {
  if (state.done || state.checking) return;
  if (state.selected.includes(index)) return;

  const tile = getTile(index);
  if (!tile) return;
  tile.classList.add('selected', 'used');

  const slotIdx = state.selected.length;
  state.selected.push(index);

  const slot = $(`slot-${slotIdx}`);
  if (slot) {
    slot.textContent = currentPuzzles[state.puzzleIndex].letters[index];
    slot.classList.add('filled');
  }

  if (navigator.vibrate) navigator.vibrate(8);
  updateSubmitBtn();
}

function updateSubmitBtn() {
  dom.btnSubmit.disabled =
    state.selected.length === 0 || state.done || state.checking;
}

function onSubmit() {
  if (state.done || state.checking || state.selected.length === 0) return;
  const puzzle = currentPuzzles[state.puzzleIndex];
  const formed = state.selected.map(i => puzzle.letters[i]).join('');
  if (formed === puzzle.target) {
    onCorrect(puzzle.target);
  } else if (state.bonusAvailable.has(formed) && !state.bonusFound.has(formed)) {
    onBonus(formed);
  } else if (state.bonusFound.has(formed)) {
    setFeedback(`"${formed}" already found!`, 'hint');
    setTimeout(() => { clearAll(); setFeedback('', ''); }, 800);
  } else {
    onWrong();
  }
}

/* ── Correct ─────────────────────────────────── */
function onCorrect(word) {
  state.done = true;
  stopTimer();
  const _trailSvg = document.getElementById('trail-svg');
  if (_trailSvg) _trailSvg.innerHTML = '';

  // Streak & multiplier
  state.streak++;
  state.bestStreak = Math.max(state.bestStreak, state.streak);
  const mult = streakMultiplier(state.streak);

  // Speed bonus (timer modes only, within 10 s of puzzle start)
  const elapsed   = Date.now() - state.puzzleStartTime;
  const hasTimer  = DIFFICULTY_CONFIG[state.difficulty].timer > 0;
  const speedBon  = (hasTimer && elapsed <= 10000) ? 3 : 0;
  if (speedBon) state.speedSolves++;

  // Hint-free tracking
  if (!state.hintUsed) state.hintFreeCount++;

  // Daily-challenge specific
  if (state.isDailyChallenge) {
    state.dailySolved     = true;
    state.dailySpeedSolve = speedBon > 0;
  }

  const basePts = pointsForWord(word);
  const pts     = Math.round(basePts * mult) + speedBon;
  state.score  += pts;
  dom.score.textContent = state.score;
  updateStreakDisplay();

  dom.slots.querySelectorAll('.slot').forEach(s => s.classList.add('correct'));
  dom.wheel.classList.add('correct-glow');
  setTimeout(() => dom.wheel.classList.remove('correct-glow'), 1400);

  // Build feedback
  let fb = `✓ Correct!  +${pts} pts`;
  if (mult > 1) fb += `  🔥 ×${mult}`;
  if (speedBon) fb += `  ⚡ speed`;
  setFeedback(fb, 'success');

  dom.btnClear.disabled   = true;
  dom.btnSubmit.disabled  = true;
  dom.btnHint.disabled    = true;
  dom.btnShuffle.disabled = true;

  setTimeout(() => {
    const isLast = state.puzzleIndex + 1 >= currentPuzzles.length;
    if (state.isDailyChallenge) {
      dom.btnNext.textContent = '📊 See Result';
    } else {
      dom.btnNext.textContent = isLast ? 'See Results 🏆' : 'Next Puzzle →';
    }
    dom.btnNext.classList.remove('hidden');
  }, 550);
}

/* ── Bonus ───────────────────────────────────── */
function onBonus(word) {
  const pts = BONUS_PTS[word.length] || 5;
  state.bonusFound.add(word);
  state.score += pts;
  dom.score.textContent = state.score;

  dom.wheel.classList.add('bonus-glow');
  setTimeout(() => dom.wheel.classList.remove('bonus-glow'), 900);

  setFeedback(`⭐ Bonus! "${word}"  +${pts} pts`, 'bonus');
  showBonusParticle(`+${pts}`);

  setTimeout(() => {
    clearAll();
    setFeedback('', '');
  }, 1100);
}

function showBonusParticle(text) {
  const el = document.createElement('span');
  el.className    = 'bonus-particle';
  el.textContent  = text;
  el.setAttribute('aria-hidden', 'true');
  dom.feedback.parentNode.appendChild(el);
  el.addEventListener('animationend', () => el.remove(), { once: true });
}

/* ── Wrong ───────────────────────────────────── */
function onWrong() {
  state.streak   = 0;
  state.checking = true;
  updateStreakDisplay();
  dom.btnSubmit.disabled = true;
  dom.btnClear.disabled  = true;

  dom.slots.querySelectorAll('.slot').forEach(s => s.classList.add('wrong'));
  dom.slots.classList.add('shake');
  dom.slots.addEventListener('animationend', () => dom.slots.classList.remove('shake'), { once: true });

  dom.wheel.classList.add('wrong-flash');
  dom.wheel.addEventListener('animationend', () => dom.wheel.classList.remove('wrong-flash'), { once: true });

  setFeedback('✗ Not quite — try again!', 'error');

  setTimeout(() => {
    clearAll();
    state.checking = false;
    dom.btnClear.disabled = false;
    updateSubmitBtn();
  }, 750);
}

/* ── Backspace ───────────────────────────────── */
function backspace() {
  if (state.done || state.checking || state.selected.length === 0) return;

  const lastTileIdx = state.selected.pop();
  const tile = getTile(lastTileIdx);
  if (tile) {
    tile.classList.remove('selected', 'used');
    tile.style.boxShadow = '';
  }

  const slot = $(`slot-${state.selected.length}`);
  if (slot) { slot.textContent = ''; slot.className = 'slot'; }

  updateSubmitBtn();
  setFeedback('', '');
}

/* ── Clear all ───────────────────────────────── */
function clearAll() {
  if (state.done) return;
  const puzzle = currentPuzzles[state.puzzleIndex];
  state.selected = [];
  const _svg = document.getElementById('trail-svg');
  if (_svg) _svg.innerHTML = '';

  dom.wheel.querySelectorAll('.tile').forEach(t => {
    t.classList.remove('selected', 'used');
    t.style.boxShadow = '';
  });
  for (let i = 0; i < puzzle.target.length; i++) {
    const slot = $(`slot-${i}`);
    if (slot) { slot.textContent = ''; slot.className = 'slot'; }
  }
  updateSubmitBtn();
  setFeedback('', '');
}

/* ── Shuffle ─────────────────────────────────── */
function onShuffle() {
  if (state.done || state.checking) return;
  const puzzle = currentPuzzles[state.puzzleIndex];
  dom.btnShuffle.disabled = true;

  dom.wheel.querySelectorAll('.tile').forEach(t => t.classList.add('exiting'));
  dom.wheel.classList.add('shuffling');

  setTimeout(() => {
    const order = [...state.wheelOrder];
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    state.wheelOrder = order;
    renderWheel(puzzle.letters);
    dom.wheel.classList.remove('shuffling');
    dom.btnShuffle.disabled = false;
  }, 210);
}

/* ── Hint ────────────────────────────────────── */
function onHint() {
  if (state.done || state.checking || state.hintUsed) return;

  state.hintUsed       = true;
  dom.btnHint.disabled = true;
  if (state.isDailyChallenge) state.dailyHintsUsed++;

  // Cost depends on difficulty (Hard = 10 pts, otherwise 5 pts)
  const penalty = DIFFICULTY_CONFIG[state.difficulty].hintCost;
  state.score   = Math.max(0, state.score - penalty);
  dom.score.textContent = state.score;

  const puzzle  = currentPuzzles[state.puzzleIndex];
  const target  = puzzle.target[state.selected.length];
  const tileIdx = puzzle.letters.findIndex(
    (l, i) => l === target && !state.selected.includes(i)
  );

  setFeedback(`💡 Next: ${target}  (−${penalty} pts)`, 'hint');

  if (tileIdx !== -1) {
    const tile = getTile(tileIdx);
    tile.style.boxShadow = '0 0 0 3px #f59e0b, 0 0 24px rgba(245,158,11,0.65)';
    setTimeout(() => {
      if (!state.selected.includes(tileIdx)) tile.style.boxShadow = '';
    }, 2000);
  }
}

/* ── Next puzzle / game end ──────────────────── */
function onNext() {
  const next = state.puzzleIndex + 1;
  if (next >= currentPuzzles.length) {
    if (state.isDailyChallenge) showDailyResult();
    else showComplete();
    return;
  }
  state.puzzleIndex = next;
  loadPuzzle(next);
}

/* ══════════════════════════════════════════════
   Complete screen
   ══════════════════════════════════════════════ */
function showComplete() {
  stopTimer();
  dom.progressFill.style.width = '100%';
  updateRing(currentPuzzles.length);

  const maxScore = currentPuzzles.reduce((sum, p) => sum + pointsForWord(p.target), 0);
  dom.finalScore.textContent = `${state.score} / ${maxScore}`;

  const pct = state.score / maxScore;
  let emoji, msg;
  if      (pct === 1)    { emoji = '🏆'; msg = 'Perfect score — wordsmith supreme!'; }
  else if (pct >= 0.8)   { emoji = '🌟'; msg = 'Brilliant — almost flawless!'; }
  else if (pct >= 0.6)   { emoji = '😊'; msg = 'Solid effort — well played!'; }
  else if (pct >= 0.4)   { emoji = '🙂'; msg = 'Good start — keep practising!'; }
  else                   { emoji = '💪'; msg = "Keep going — you'll crack it!"; }

  dom.completeEmoji.textContent = emoji;
  dom.completeMsg.textContent   = msg;

  // Session stats row
  const total = currentPuzzles.length;
  dom.completeStats.innerHTML = `
    <div class="cstat">
      <span class="cstat-val">🔥 ${state.bestStreak}</span>
      <span class="cstat-label">Best streak</span>
    </div>
    <div class="cstat">
      <span class="cstat-val">⚡ ${state.speedSolves}</span>
      <span class="cstat-label">Speed solves</span>
    </div>
    <div class="cstat">
      <span class="cstat-val">✨ ${state.hintFreeCount}/${total}</span>
      <span class="cstat-label">Hint-free</span>
    </div>
  `;

  dom.complete.classList.remove('hidden');
}

/* ══════════════════════════════════════════════
   Helpers
   ══════════════════════════════════════════════ */
function setFeedback(text, type) {
  dom.feedback.textContent = text;
  dom.feedback.className   = 'feedback' + (type ? ` ${type}` : '');
}

/* ══════════════════════════════════════════════
   Daily Challenge
   ══════════════════════════════════════════════ */

function startDailyChallenge() {
  const { puzzle, difficulty } = getDailyPuzzle();

  // Stamp the button sub-label with today's date
  dom.dailyBtnSub.textContent = formatDailyDate();

  state.isDailyChallenge = true;
  state.dailySolved      = false;
  state.dailyHintsUsed   = 0;
  state.dailySpeedSolve  = false;
  state.difficulty       = difficulty;
  state.score            = 0;
  state.streak           = 0;
  state.bestStreak       = 0;
  state.speedSolves      = 0;
  state.hintFreeCount    = 0;
  currentPuzzles         = [puzzle];

  dom.diffScreen.classList.add('hidden');
  dom.score.textContent = '0';

  const cfg = DIFFICULTY_CONFIG[difficulty];
  dom.diffBadge.textContent = `📅 ${cfg.label}`;
  dom.diffBadge.className   = `diff-badge diff-badge-${difficulty}`;
  dom.timerWrap.classList.toggle('hidden', cfg.timer === 0);

  loadPuzzle(0);
}

function buildShareText() {
  const cfg      = DIFFICULTY_CONFIG[state.difficulty];
  const dateStr  = formatDailyDate();
  const solved   = state.dailySolved;
  const pts      = state.score;
  const hints    = state.dailyHintsUsed;
  const speed    = state.dailySpeedSolve;
  const word     = currentPuzzles[0].target;

  const lines = [
    'WordWheel Daily Challenge 🎯',
    `📅 ${dateStr}  ·  ${cfg.label}`,
    '',
    solved
      ? `✅ Solved!  —  ${word}`
      : `❌ Time's up!  —  ${word}`,
    `⭐ ${pts} pts  ·  💡 ${hints === 0 ? 'No hints' : hints === 1 ? '1 hint' : `${hints} hints`}`,
    speed && solved ? '⚡ Speed solve!' : '',
    '',
    '#WordWheel',
  ].filter((l, i, arr) => !(l === '' && arr[i - 1] === ''));  // collapse double blanks

  return lines.join('\n');
}

function showDailyResult() {
  const cfg     = DIFFICULTY_CONFIG[state.difficulty];
  const puzzle  = currentPuzzles[0];
  const solved  = state.dailySolved;

  dom.dailyDateStr.textContent    = formatDailyDate();
  dom.dailyDiffLbl.textContent    = cfg.label;
  dom.dailyResultIcon.textContent = solved ? '✅' : '❌';
  dom.dailyWordReveal.textContent = puzzle.target;
  dom.dsScore.textContent         = state.score;
  dom.dsHints.textContent         = state.dailyHintsUsed === 0 ? '💡 None' : `💡 ${state.dailyHintsUsed}`;
  dom.dsSpeed.textContent         = state.dailySpeedSolve ? '⚡ Yes' : '—';

  dom.dailySharePrev.textContent  = buildShareText();
  dom.dailyScreen.classList.remove('hidden');
}

/* ── Clipboard copy ───────────────────────────── */
function copyShareResult() {
  const text = buildShareText();

  const succeed = () => {
    dom.btnShareResult.textContent = '✓ Copied!';
    setTimeout(() => { dom.btnShareResult.textContent = '📋 Copy Result'; }, 2200);
  };
  const fail = () => {
    dom.btnShareResult.textContent = 'Copy failed';
    setTimeout(() => { dom.btnShareResult.textContent = '📋 Copy Result'; }, 2200);
  };

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(succeed).catch(() => fallbackCopy(text, succeed, fail));
  } else {
    fallbackCopy(text, succeed, fail);
  }
}

function fallbackCopy(text, onOk, onErr) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy') ? onOk() : onErr();
  } catch {
    onErr();
  }
  ta.remove();
}

/* ══════════════════════════════════════════════
   Event listeners
   ══════════════════════════════════════════════ */
dom.diffBtnEasy.addEventListener('click',   () => startGame('easy'));
dom.diffBtnMedium.addEventListener('click', () => startGame('medium'));
dom.diffBtnHard.addEventListener('click',   () => startGame('hard'));
dom.diffBtnDaily.addEventListener('click',  startDailyChallenge);

dom.btnClear.addEventListener('click',      backspace);
dom.btnSubmit.addEventListener('click',     onSubmit);
dom.btnHint.addEventListener('click',       onHint);
dom.btnShuffle.addEventListener('click',    onShuffle);
dom.btnNext.addEventListener('click',       onNext);
dom.btnRestart.addEventListener('click',    init);

dom.btnShareResult.addEventListener('click', copyShareResult);
dom.btnDailyBack.addEventListener('click',   () => {
  dom.dailyScreen.classList.add('hidden');
  state.isDailyChallenge = false;
  init();
});

document.addEventListener('keydown', e => {
  if (e.key === 'Backspace') { e.preventDefault(); backspace(); }
  if (e.key === 'Enter')     { e.preventDefault(); onSubmit();  }
});

/* ══════════════════════════════════════════════
   Boot
   ══════════════════════════════════════════════ */
setupWheelInteraction();
init();
