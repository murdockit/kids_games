// Shared helpers for Lydia's Games: speech, sounds, cheers, stars, storage, page chrome.
import { earnedStar, takeNewRewards } from './rewards.js';
import { setTrack, startMusic, duck, preload } from './music.js';

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
// `ipad` is what the iPad's own voice should say instead, for text only the natural voice
// understands (letter sounds written as phonemes, like "[[ kə ]]").
export function say(text, { ipad } = {}) {
  stopSpeech();
  if (!text || !getSettings().speech) return Promise.resolve();
  const id = speechId;
  duck(true); // music dips while someone is talking
  const plain = ipad ?? text;
  const done = current?.natural && ctx()
    ? // If the voice container is unreachable, say it with the iPad's voice instead.
      sayNatural(text, id).catch(() => (id === speechId ? sayIpad(plain) : undefined))
    : sayIpad(plain);
  return done.finally(() => {
    if (id === speechId) duck(false);
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

// Each game has its own "that's right!" sound.
function goodSound() {
  const game = location.pathname.split('/').pop().replace(/\.html$/, '');
  switch (game) {
    case 'letters': // xylophone
      tone(784, 0, 0.25, 'sine', 0.2);
      tone(1175, 0.09, 0.35, 'sine', 0.18);
      tone(3136, 0, 0.05, 'sine', 0.05);
      break;
    case 'counting': // coin
      tone(988, 0, 0.08, 'square', 0.06);
      tone(1319, 0.08, 0.3, 'square', 0.06);
      break;
    case 'heart-words': // harp
      [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.05, 0.4, 'triangle', 0.12));
      break;
    case 'shapes': // marimba
      tone(523, 0, 0.18, 'sine', 0.22);
      tone(784, 0.1, 0.25, 'sine', 0.2);
      break;
    default:
      tone(660, 0, 0.18);
      tone(880, 0.1, 0.25);
  }
}

// A tone that glides from one pitch to another (boing, whee).
function slide(from, to, start, dur, type = 'sine', gain = 0.15) {
  const ac = ctx();
  if (!ac) return;
  const t = ac.currentTime + start;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, t);
  osc.frequency.exponentialRampToValueAtTime(to, t + dur * 0.7);
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
      goodSound();
      navigator.vibrate?.(25); // a tiny buzz where the device supports it (most iPads don't)
      break;
    case 'clink':
      tone(1568, 0, 0.12, 'triangle', 0.12);
      tone(2093, 0.06, 0.25, 'triangle', 0.1);
      break;
    case 'splat':
      noise(0, 0.18, { type: 'lowpass', freq: 700, gain: 0.25 });
      slide(300, 120, 0, 0.18, 'sine', 0.12);
      break;
    case 'oops':
      tone(330, 0, 0.18, 'triangle', 0.14);
      tone(262, 0.12, 0.25, 'triangle', 0.12);
      break;
    case 'pop':
      tone(randInt(500, 900), 0, 0.08, 'sine', 0.2);
      break;
    case 'tap':
      tone(620, 0, 0.06, 'sine', 0.09);
      tone(930, 0.04, 0.07, 'sine', 0.06);
      break;
    case 'boing':
      slide(260, 720, 0, 0.22, 'sine', 0.16);
      break;
    case 'win':
      // A little celebration tune, with a soft chime on top.
      [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => {
        const t = [0, 0.11, 0.22, 0.33, 0.5, 0.61, 0.75][i];
        tone(f, t, i === 6 ? 0.6 : 0.22, 'triangle', 0.16);
        tone(f * 2, t, 0.15, 'sine', 0.05);
      });
      break;
    case 'firework':
      slide(400, 1400, 0, 0.25, 'sine', 0.05);
      noise(0.25, 0.35, { type: 'lowpass', freq: 1200, gain: 0.2 });
      for (let i = 0; i < 6; i++) noise(0.3 + Math.random() * 0.3, 0.04, { type: 'highpass', freq: 4000, gain: 0.08 });
      break;
    case 'whee':
      slide(400, 1200, 0, 0.5, 'triangle', 0.1);
      break;
  }
}

// iPad Safari only plays audio after a tap, so unlock both speech and Web Audio on the first touch.
function unlock() {
  // Let spoken words play through the speaker even when the iPad's silent switch is on.
  if (navigator.audioSession) navigator.audioSession.type = 'playback';
  ctx();
  startMusic();
  if ('speechSynthesis' in window && !speechSynthesis.speaking) {
    const u = new SpeechSynthesisUtterance(' ');
    u.volume = 0;
    speechSynthesis.speak(u);
  }
}
document.addEventListener('pointerdown', unlock, { once: true, capture: true });

// Each page picks its music with <body data-music="clappy|vibes|lullaby|none">.
{
  const track = document.body?.dataset.music ?? 'clappy';
  if (track !== 'none') {
    setTrack(track);
    preload(track);
  }
}

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
  earnedStar(n);
  renderStars();
  setTimeout(showNewRewards, 1200);
}

const BOOK_URL = new URL('../games/stickers.html', import.meta.url).href;

// "You got a new sticker!" with the sticker spinning in, and a button to the sticker book.
function showNewRewards() {
  const { stickers, bonuses } = takeNewRewards();
  if (!stickers.length && !bonuses.length) return;
  const overlay = el('div', 'overlay reward-pop');
  const box = el('div', 'overlay-box');
  const items = [...stickers.map((x) => x.emoji), ...bonuses.map((b) => b.emoji)];
  box.appendChild(el('p', 'prompt-text', bonuses.length ? 'A surprise present!' : 'A new sticker!'));
  const show = el('div', 'reward-items');
  items.forEach((e, i) => {
    const sp = el('span', 'reward-item', e);
    sp.style.animationDelay = `${i * 0.15}s`;
    show.appendChild(sp);
  });
  const row = el('div', 'row');
  const book = el('button', 'round-btn', '📒');
  book.setAttribute('aria-label', 'Open my sticker book');
  const ok = el('button', 'round-btn yes', '✔️');
  ok.setAttribute('aria-label', 'Done');
  row.append(book, ok);
  box.append(show, row);
  overlay.appendChild(box);
  document.body.appendChild(overlay);
  confetti(30);
  sfx('win');
  const words = [
    ...stickers.map((x) => `a new sticker, the ${x.name}`),
    ...bonuses.map((b) => `a surprise: ${b.name}`),
  ];
  say(`Wow, ${KID}! You got ${words.join(', and ')}!`);
  book.addEventListener('click', () => go(BOOK_URL));
  ok.addEventListener('click', () => {
    sfx('tap');
    overlay.remove();
  });
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

// ---------- Page transitions & background ----------
// Fade the page out, then go. Pages fade/slide in on load (CSS).
export function go(url) {
  stopSpeech?.();
  document.body.classList.add('leaving');
  setTimeout(() => (location.href = url), 180);
}
document.addEventListener('click', (e) => {
  const a = e.target.closest?.('a[href]');
  if (!a || a.target || a.hasAttribute('download') || e.metaKey || e.ctrlKey) return;
  const url = new URL(a.href, location.href);
  if (url.origin !== location.origin) return;
  e.preventDefault();
  sfx('tap');
  go(url.href);
});

// Soft drifting clouds and rising bubbles behind everything (pure CSS animation, cheap to draw).
function addSky() {
  if (document.body.dataset.calm !== undefined || document.querySelector('.sky')) return;
  const sky = document.createElement('div');
  sky.className = 'sky';
  sky.setAttribute('aria-hidden', 'true');
  let html = '';
  for (let i = 0; i < 4; i++) {
    html += `<span class="cloud" style="top:${8 + i * 22}%;animation-duration:${60 + i * 17}s;animation-delay:-${i * 19}s;transform:scale(${0.7 + (i % 3) * 0.25})"></span>`;
  }
  for (let i = 0; i < 10; i++) {
    html += `<span class="bubble-bg" style="left:${(i * 37) % 100}%;width:${14 + (i % 4) * 10}px;height:${14 + (i % 4) * 10}px;animation-duration:${14 + (i % 5) * 4}s;animation-delay:-${i * 3}s"></span>`;
  }
  sky.innerHTML = html;
  document.body.prepend(sky);
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addSky);
else addSky();

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
    <button class="stars" data-stars aria-label="My sticker book">⭐ <span>${getStars()}</span></button>`;
  bar.querySelector('h1').textContent = title;
  bar.querySelector('[data-stars]').addEventListener('click', () => {
    if (!location.pathname.endsWith('stickers.html')) go(BOOK_URL);
  });
  document.body.prepend(bar);

  let backFn = () => go(home);
  let repeatFn = null;
  const repeatBtn = bar.querySelector('[data-repeat]');
  bar.querySelector('[data-back]').addEventListener('click', () => {
    stopSpeech();
    backFn();
  });
  repeatBtn.addEventListener('click', () => repeatFn && repeatFn());

  return {
    onBack(fn) {
      backFn = fn || (() => go(home));
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
// Fireworks drawn on a temporary full-screen canvas.
export function fireworks(bursts = 5) {
  const c = document.createElement('canvas');
  c.className = 'fireworks';
  const dpr = window.devicePixelRatio || 1;
  c.width = innerWidth * dpr;
  c.height = innerHeight * dpr;
  document.body.appendChild(c);
  const g = c.getContext('2d');
  g.scale(dpr, dpr);
  const sparks = [];
  const colors = ['#ef4444', '#f97316', '#facc15', '#22c55e', '#3b82f6', '#a855f7', '#ec4899'];
  for (let b = 0; b < bursts; b++) {
    setTimeout(() => {
      const x = innerWidth * (0.15 + Math.random() * 0.7);
      const y = innerHeight * (0.15 + Math.random() * 0.4);
      const col = pick(colors);
      for (let i = 0; i < 46; i++) {
        const a = (i / 46) * Math.PI * 2;
        const v = 2 + Math.random() * 3.5;
        sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 60 + Math.random() * 20, col });
      }
      if (b % 2 === 0) sfx('firework');
    }, b * 330);
  }
  let frames = 0;
  (function tick() {
    g.clearRect(0, 0, innerWidth, innerHeight);
    for (const p of sparks) {
      if (p.life <= 0) continue;
      p.life--;
      p.vy += 0.06;
      p.vx *= 0.985;
      p.x += p.vx;
      p.y += p.vy;
      g.globalAlpha = Math.min(1, p.life / 30);
      g.fillStyle = p.col;
      g.beginPath();
      g.arc(p.x, p.y, 3.2, 0, Math.PI * 2);
      g.fill();
    }
    if (++frames < 240) requestAnimationFrame(tick);
    else c.remove();
  })();
}

// Balloons float up; tapping one pops it.
export function balloons(n = 8) {
  const box = document.createElement('div');
  box.className = 'balloons';
  for (let i = 0; i < n; i++) {
    const b = document.createElement('button');
    b.className = 'balloon';
    b.textContent = '🎈';
    b.setAttribute('aria-label', 'balloon');
    b.style.left = `${5 + Math.random() * 85}%`;
    b.style.animationDuration = `${6 + Math.random() * 4}s`;
    b.style.animationDelay = `${Math.random() * 1.5}s`;
    b.style.filter = `hue-rotate(${Math.floor(Math.random() * 360)}deg)`;
    b.addEventListener('pointerdown', () => {
      sfx('pop');
      const r = b.getBoundingClientRect();
      burstAt(r.left + r.width / 2, r.top + r.height / 3);
      b.remove();
    });
    box.appendChild(b);
  }
  document.body.appendChild(box);
  setTimeout(() => box.remove(), 12000);
  return box;
}

// A quick ring of sparkles at a point on screen.
export function burstAt(x, y, bits = ['✨', '⭐', '💖', '🎉']) {
  for (let i = 0; i < 8; i++) {
    const el = document.createElement('span');
    el.className = 'burst';
    el.textContent = pick(bits);
    const a = (i / 8) * Math.PI * 2;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.setProperty('--dx', `${Math.cos(a) * 70}px`);
    el.style.setProperty('--dy', `${Math.sin(a) * 70}px`);
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 700);
  }
}

// The big star flies up into the star counter, then the counter goes up.
function flyStar(from) {
  const target = document.querySelector('[data-stars]');
  if (!from || !target) {
    addStar(1);
    return;
  }
  const a = from.getBoundingClientRect();
  const b = target.getBoundingClientRect();
  const star = document.createElement('div');
  star.className = 'flying-star';
  star.textContent = '⭐';
  star.style.left = `${a.left + a.width / 2}px`;
  star.style.top = `${a.top + a.height / 2}px`;
  document.body.appendChild(star);
  requestAnimationFrame(() => {
    star.style.transform = `translate(${b.left + 30 - (a.left + a.width / 2)}px, ${b.top + b.height / 2 - (a.top + a.height / 2)}px) scale(0.35) rotate(360deg)`;
  });
  setTimeout(() => {
    sfx('whee');
  }, 100);
  setTimeout(() => {
    star.remove();
    addStar(1);
  }, 900);
}

// The end-of-round celebration with Play Again / Back buttons. Awards one star.
export function doneScreen(main, { onAgain, onBack, message = `You did it, ${KID}!` }) {
  sfx('win');
  confetti(30);
  fireworks();
  const floaters = balloons();
  main.innerHTML = `
    <div class="done-screen">
      <div class="done-row">
        <div class="mascot-spot"></div>
        <div class="big">🌟</div>
      </div>
      <h2></h2>
      <p class="note">You earned a star! Pop the balloons!</p>
      <div class="row">
        <button class="round-btn" data-again aria-label="Play again">🔁</button>
        <button class="round-btn" data-back aria-label="Back">🏠</button>
      </div>
    </div>`;
  import('./mascot.js').then(({ unicornSVG }) => {
    const spot = main.querySelector('.mascot-spot');
    if (spot) spot.innerHTML = `<div class="mascot cheering">${unicornSVG()}</div>`;
  });
  main.querySelector('h2').textContent = message;
  const leave = (fn) => () => {
    floaters.remove();
    fn();
  };
  main.querySelector('[data-again]').addEventListener('click', leave(onAgain));
  main.querySelector('[data-back]').addEventListener('click', leave(onBack));
  setTimeout(() => flyStar(main.querySelector('.done-screen .big')), 700);
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

// Raw sound building blocks, for instruments (Music Maker) that always play.
export { tone, slide, noise };
