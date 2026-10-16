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
// Natural voices come from the Piper text-to-speech container on the computer running the games
// (Safari won't let web pages use the iPad's downloaded Premium voices). If that container isn't
// reachable, we fall back to the iPad's built-in voices.
const TTS_URL = new URL('../tts', import.meta.url);
const NATURAL_PREFIX = 'piper:';
const NOVELTY = [
  'albert', 'bad news', 'bahh', 'bells', 'boing', 'bubbles', 'cellos', 'good news', 'jester', 'organ',
  'superstar', 'trinoids', 'whisper', 'wobble', 'zarvox', 'fred', 'junior', 'ralph', 'kathy',
  'eddy', 'flo', 'grandma', 'grandpa', 'reed', 'rocko', 'sandy', 'shelley',
];

function voiceScore(v) {
  const id = `${v.name} ${v.voiceURI}`.toLowerCase();
  const name = v.name.toLowerCase();
  if (id.includes('eloquence') || NOVELTY.some((n) => name === n || name.startsWith(`${n} `))) return -1;
  let score = 0;
  if (id.includes('premium')) score += 100;
  else if (id.includes('enhanced')) score += 60;
  if (name.includes('samantha')) score += 20;
  if (v.lang.replace('_', '-') === 'en-US') score += 10;
  if (v.localService) score += 5;
  return score;
}

export const SPEEDS = { slower: 0.85, normal: 0.95, faster: 1.05 };
const speedKey = () => (SPEEDS[getSettings().speechRate] ? getSettings().speechRate : 'normal');

// iPad voices worth offering, best first, one entry per name + language.
function ipadVoices() {
  if (!('speechSynthesis' in window)) return [];
  const seen = new Set();
  return speechSynthesis
    .getVoices()
    .filter((v) => v.lang && v.lang.toLowerCase().startsWith('en'))
    .map((v) => ({ voice: v, score: voiceScore(v) }))
    .filter((x) => x.score >= 0)
    .sort((a, b) => b.score - a.score || a.voice.name.localeCompare(b.voice.name))
    .filter(({ voice: v }) => {
      const key = `${v.name}|${v.lang}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map(({ voice: v }) => ({ uri: v.voiceURI, label: `${v.name} · ${v.lang}`, voice: v, natural: false }));
}

let naturalVoices = [];
// Resolves once we know whether the natural-voice container is there.
export const voicesReady = fetch(new URL('../tts/voices', import.meta.url), { cache: 'no-cache' })
  .then((r) => (r.ok ? r.json() : []))
  .then((list) => {
    naturalVoices = (Array.isArray(list) ? list : []).map((v) => ({
      uri: NATURAL_PREFIX + v.id,
      label: v.label,
      natural: true,
      isDefault: v.default,
    }));
    naturalVoices.sort((a, b) => b.isDefault - a.isDefault);
  })
  .catch(() => {})
  .then(() => {
    chooseVoice();
    prefetch([...CHEERS, ...TRY_AGAIN]);
  });

// Every voice to offer on the Grown-ups screen: natural voices first, then the iPad's own.
export function listVoices() {
  return [...naturalVoices, ...ipadVoices()];
}

let current = null; // { uri, voice?, natural }
function chooseVoice() {
  const voices = listVoices();
  const saved = getSettings().voiceURI;
  current = voices.find((v) => v.uri === saved) || voices[0] || null;
}
chooseVoice();
if ('speechSynthesis' in window) speechSynthesis.addEventListener?.('voiceschanged', chooseVoice);

export function currentVoiceURI() {
  return current?.uri || '';
}

export function setVoice(uri) {
  setSettings({ voiceURI: uri || '' });
  chooseVoice();
}

// Decoded natural-voice clips, so repeated phrases ("Great job!") play instantly.
const clips = new Map();
const CLIP_LIMIT = 80;
let playing = null;
let speechId = 0;

function clipKey(text, uri, speed) {
  return `${uri}|${speed}|${text}`;
}

async function loadClip(text, uri, speed) {
  const key = clipKey(text, uri, speed);
  if (clips.has(key)) return clips.get(key);
  const url = new URL(TTS_URL);
  url.search = new URLSearchParams({ text, voice: uri.slice(NATURAL_PREFIX.length), speed });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  const promise = fetch(url, { signal: controller.signal })
    .then((r) => {
      if (!r.ok) throw new Error(`TTS ${r.status}`);
      return r.arrayBuffer();
    })
    .then((buf) => new Promise((ok, fail) => ctx().decodeAudioData(buf, ok, fail)))
    .finally(() => clearTimeout(timer));
  clips.set(key, promise);
  promise.catch(() => clips.delete(key));
  if (clips.size > CLIP_LIMIT) clips.delete(clips.keys().next().value);
  return promise;
}

// Warm the cache for phrases we're about to need (e.g. the praise for the current question).
export function prefetch(texts) {
  if (!current?.natural || !getSettings().speech || !ctx()) return;
  for (const t of texts) if (t) loadClip(t, current.uri, speedKey()).catch(() => {});
}

export function stopSpeech() {
  speechId++;
  try {
    playing?.stop();
  } catch {
    /* already stopped */
  }
  playing = null;
  if ('speechSynthesis' in window) speechSynthesis.cancel();
}

function sayNatural(text, id) {
  return loadClip(text, current.uri, speedKey()).then(
    (buffer) =>
      new Promise((resolve) => {
        if (id !== speechId) return resolve(); // something newer started talking
        const ac = ctx();
        const src = ac.createBufferSource();
        src.buffer = buffer;
        src.connect(ac.destination);
        src.onended = () => {
          if (playing === src) playing = null;
          resolve();
        };
        playing = src;
        src.start();
      }),
  );
}

function sayIpad(text) {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) return resolve();
    const rate = SPEEDS[speedKey()];
    const fallback = current?.natural ? ipadVoices()[0] : current;
    const u = new SpeechSynthesisUtterance(text);
    if (fallback?.voice) u.voice = fallback.voice;
    u.lang = fallback?.voice?.lang || 'en-US';
    u.rate = rate;
    u.pitch = 1;
    const timer = setTimeout(resolve, 900 + (text.length * 100) / rate);
    u.onend = u.onerror = () => {
      clearTimeout(timer);
      resolve();
    };
    speechSynthesis.speak(u);
  });
}

// Speaks text and resolves when finished. Starting a new phrase stops the previous one.
export function say(text) {
  stopSpeech();
  if (!text || !getSettings().speech) return Promise.resolve();
  const id = speechId;
  if (current?.natural && ctx()) {
    // If the voice container is unreachable, say it with the iPad's voice instead.
    return sayNatural(text, id).catch(() => (id === speechId ? sayIpad(text) : undefined));
  }
  return sayIpad(text);
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

// Filtered white noise, for snips, sprays and whooshes.
let noiseBuffer = null;
function noise(start, dur, { type = 'bandpass', freq = 2000, q = 1, gain = 0.15 } = {}) {
  const ac = ctx();
  if (!ac) return;
  if (!noiseBuffer) {
    noiseBuffer = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  const t = ac.currentTime + start;
  const src = ac.createBufferSource();
  src.buffer = noiseBuffer;
  const filter = ac.createBiquadFilter();
  filter.type = type;
  filter.frequency.value = freq;
  filter.Q.value = q;
  const g = ac.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + Math.min(0.02, dur / 3));
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  src.connect(filter).connect(g).connect(ac.destination);
  src.start(t, Math.random() * 0.5);
  src.stop(t + dur + 0.05);
}

export function sfx(kind) {
  if (!getSettings().sounds) return;
  switch (kind) {
    case 'snip':
      noise(0, 0.05, { type: 'highpass', freq: 3500, gain: 0.25 });
      noise(0.07, 0.05, { type: 'highpass', freq: 4500, gain: 0.2 });
      break;
    case 'spray':
      noise(0, 0.3, { freq: 5000, q: 0.7, gain: 0.12 });
      break;
    case 'whoosh':
      noise(0, 0.35, { type: 'lowpass', freq: 900, gain: 0.18 });
      break;
    case 'splash':
      noise(0, 0.25, { freq: 1500, q: 0.5, gain: 0.12 });
      break;
    case 'bubble':
      tone(randInt(700, 1200), 0, 0.06, 'sine', 0.12);
      break;
    case 'camera':
      noise(0, 0.04, { type: 'highpass', freq: 2500, gain: 0.3 });
      noise(0.09, 0.06, { type: 'highpass', freq: 2000, gain: 0.25 });
      break;
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
  // Let spoken words play through the speaker even when the iPad's silent switch is on.
  if (navigator.audioSession) navigator.audioSession.type = 'playback';
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
    stopSpeech();
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
    stopSpeech();
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

// A big ✔ / ✖ question (spoken), for things like "Start over?". Resolves true for ✔.
export function askYesNo(question) {
  return new Promise((resolve) => {
    const overlay = el('div', 'overlay');
    const box = el('div', 'overlay-box');
    const yes = el('button', 'round-btn yes', '✔️');
    const no = el('button', 'round-btn no', '✖️');
    yes.setAttribute('aria-label', 'Yes');
    no.setAttribute('aria-label', 'No');
    const row = el('div', 'row');
    row.append(yes, no);
    box.append(el('p', 'prompt-text', question), row);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    say(question);
    const done = (answer) => {
      sfx('tap');
      overlay.remove();
      resolve(answer);
    };
    yes.addEventListener('click', () => done(true));
    no.addEventListener('click', () => done(false));
  });
}

export function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}
