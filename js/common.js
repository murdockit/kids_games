// Shared helpers for Lydia's Games: speech, sounds, cheers, stars, storage, page chrome.

export const KID = 'Lydia';

// ---------- Storage (localStorage can throw or be empty; never let that break a game) ----------
export function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable: progress just isn't remembered */
  }
}

const SETTINGS_KEY = 'lg.settings';
export function getSettings() {
  return { speech: true, sounds: true, ...load(SETTINGS_KEY, {}) };
}
export function setSettings(patch) {
  save(SETTINGS_KEY, { ...getSettings(), ...patch });
}

// ---------- Random helpers ----------
export function randInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}
export function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
export function sample(arr, n) {
  return shuffle(arr).slice(0, n);
}

// ---------- Speech ----------
let voice = null;
function chooseVoice() {
  if (!('speechSynthesis' in window)) return;
  const voices = speechSynthesis.getVoices().filter((v) => v.lang && v.lang.toLowerCase().startsWith('en'));
  const preferred = ['Samantha', 'Karen', 'Moira', 'Google US English', 'Microsoft Aria', 'Microsoft Jenny'];
  voice =
    preferred.map((name) => voices.find((v) => v.name.includes(name))).find(Boolean) ||
    voices.find((v) => v.lang === 'en-US' && v.localService) ||
    voices.find((v) => v.lang === 'en-US') ||
    voices[0] ||
    null;
}
if ('speechSynthesis' in window) {
  chooseVoice();
  speechSynthesis.addEventListener?.('voiceschanged', chooseVoice);
}

// Speaks text and resolves when finished (or after a safety timeout, since iOS doesn't always fire onend).
export function say(text, { rate = 0.85, pitch = 1.1 } = {}) {
  return new Promise((resolve) => {
    if (!text || !getSettings().speech || !('speechSynthesis' in window)) return resolve();
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    if (voice) u.voice = voice;
    u.lang = voice?.lang || 'en-US';
    u.rate = rate;
    u.pitch = pitch;
    const timer = setTimeout(resolve, 900 + text.length * 110);
    u.onend = u.onerror = () => {
      clearTimeout(timer);
      resolve();
    };
    speechSynthesis.speak(u);
  });
}

// ---------- Sound effects (tiny Web Audio tones; nothing harsh) ----------
let audioCtx = null;
function ctx() {
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    audioCtx = new AC();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function tone(freq, start, dur, type = 'sine', gain = 0.18) {
  const ac = ctx();
  if (!ac) return;
  const t = ac.currentTime + start;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.connect(g).connect(ac.destination);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

export function sfx(kind) {
  if (!getSettings().sounds) return;
  switch (kind) {
    case 'good':
      tone(660, 0, 0.18);
      tone(880, 0.1, 0.25);
      break;
    case 'oops':
      tone(330, 0, 0.18, 'triangle', 0.14);
      tone(262, 0.12, 0.25, 'triangle', 0.12);
      break;
    case 'pop':
      tone(randInt(500, 900), 0, 0.08, 'sine', 0.2);
      break;
    case 'tap':
      tone(520, 0, 0.07, 'sine', 0.1);
      break;
    case 'win':
      [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.3));
      break;
  }
}

// iPad Safari only plays audio after a tap, so unlock both speech and Web Audio on the first touch.
function unlock() {
  ctx();
  if ('speechSynthesis' in window && !speechSynthesis.speaking) {
    const u = new SpeechSynthesisUtterance(' ');
    u.volume = 0;
    speechSynthesis.speak(u);
  }
}
document.addEventListener('pointerdown', unlock, { once: true, capture: true });

// ---------- Cheers & stars ----------
const CHEERS = [
  `Way to go, ${KID}!`,
  `You did it, ${KID}!`,
  'Great job!',
  'Yes! You got it!',
  `Super, ${KID}!`,
  'Awesome!',
  'Hooray!',
];
const TRY_AGAIN = ['Try again!', 'Almost! Try again.', 'Oops! Try another one.'];

export function confetti(count = 24) {
  const bits = ['⭐', '🎉', '💖', '🌟', '🎈', '✨'];
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'confetti';
    el.textContent = pick(bits);
    el.style.left = `${Math.random() * 100}vw`;
    el.style.animationDuration = `${1.6 + Math.random() * 1.6}s`;
    el.style.animationDelay = `${Math.random() * 0.4}s`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3800);
  }
}

// Shows a big happy bubble and speaks a cheer. Resolves when the speech is done.
export async function cheer(message = pick(CHEERS), { big = false } = {}) {
  sfx('good');
  if (big) confetti();
  const wrap = document.createElement('div');
  wrap.className = 'cheer';
  wrap.innerHTML = '<div class="bubble"></div>';
  wrap.firstChild.textContent = `${message} ${pick(['⭐', '🎉', '💖', '🌟'])}`;
  document.body.appendChild(wrap);
  await Promise.all([say(message), new Promise((r) => setTimeout(r, 1100))]);
  wrap.remove();
}

export function tryAgain(el) {
  sfx('oops');
  wiggle(el);
  return pick(TRY_AGAIN);
}

export function wiggle(el) {
  if (!el) return;
  el.classList.remove('wiggle');
  void el.offsetWidth; // restart the animation
  el.classList.add('wiggle');
}

const STARS_KEY = 'lg.stars';
export function getStars() {
  return Number(load(STARS_KEY, 0)) || 0;
}
export function addStar(n = 1) {
  save(STARS_KEY, getStars() + n);
  renderStars();
}
export function resetStars() {
  save(STARS_KEY, 0);
  renderStars();
}
function renderStars() {
  document.querySelectorAll('[data-stars]').forEach((el) => {
    el.innerHTML = `⭐ <span>${getStars()}</span>`;
    el.classList.remove('bump');
    void el.offsetWidth;
    el.classList.add('bump');
  });
}

// ---------- Page chrome ----------
// Builds the top bar: back button, title, repeat-the-question button, and star counter.
// Returns controls so a game can change what Back and 🔊 do as she moves between screens.
export function topBar({ title, home = '../index.html' }) {
  const bar = document.createElement('header');
  bar.className = 'topbar';
  bar.innerHTML = `
    <button class="round-btn" data-back aria-label="Back">⬅️</button>
    <h1></h1>
    <button class="round-btn hidden" data-repeat aria-label="Say it again">🔊</button>
    <div class="stars" data-stars>⭐ <span>${getStars()}</span></div>`;
  bar.querySelector('h1').textContent = title;
  document.body.prepend(bar);

  let backFn = () => (location.href = home);
  let repeatFn = null;
  const repeatBtn = bar.querySelector('[data-repeat]');
  bar.querySelector('[data-back]').addEventListener('click', () => {
    speechSynthesis?.cancel();
    backFn();
  });
  repeatBtn.addEventListener('click', () => repeatFn && repeatFn());

  return {
    onBack(fn) {
      backFn = fn || (() => (location.href = home));
    },
    onRepeat(fn) {
      repeatFn = fn;
      repeatBtn.classList.toggle('hidden', !fn);
    },
    setTitle(t) {
      bar.querySelector('h1').textContent = t;
    },
  };
}

// A screen of big emoji tiles to choose an activity. Each mode: { emoji, name, color, start() }.
export function modePicker({ main, bar, title, intro, modes }) {
  function show() {
    speechSynthesis?.cancel();
    bar.setTitle(title);
    bar.onBack(null);
    bar.onRepeat(intro ? () => say(intro) : null);
    main.innerHTML = '<div class="tiles"></div>';
    const tiles = main.querySelector('.tiles');
    for (const mode of modes) {
      const btn = document.createElement('button');
      btn.className = `tile ${mode.color}`;
      btn.innerHTML = `<span class="emoji">${mode.emoji}</span><span></span>`;
      btn.lastChild.textContent = mode.name;
      btn.addEventListener('click', () => {
        sfx('tap');
        document.querySelectorAll('.confetti').forEach((c) => c.remove());
        bar.setTitle(mode.name);
        bar.onBack(show);
        main.innerHTML = '';
        mode.start();
      });
      tiles.appendChild(btn);
    }
  }
  show();
  return show;
}

// The end-of-round celebration with Play Again / Back buttons. Awards one star.
export function doneScreen(main, { onAgain, onBack, message = `You did it, ${KID}!` }) {
  addStar(1);
  sfx('win');
  confetti(36);
  main.innerHTML = `
    <div class="done-screen">
      <div class="big">🌟</div>
      <h2></h2>
      <p class="note">You earned a star!</p>
      <div class="row">
        <button class="round-btn" data-again aria-label="Play again">🔁</button>
        <button class="round-btn" data-back aria-label="Back">🏠</button>
      </div>
    </div>`;
  main.querySelector('h2').textContent = message;
  main.querySelector('[data-again]').addEventListener('click', onAgain);
  main.querySelector('[data-back]').addEventListener('click', onBack);
  say(`${message} You earned a star!`);
}

export function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}
