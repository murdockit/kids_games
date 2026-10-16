// Background music: gentle CC0 loops (see music/CREDITS.md), quiet under everything else.
// Uses Web Audio so the loop is seamless (an <audio loop> has a gap on iPad), and dips the
// music whenever someone is talking. Each page picks its track with <body data-music="...">.
const TRACKS = {
  clappy: 'happy-clappy.mp3',
  vibes: 'happy-vibes.mp3',
  lullaby: 'happy-lullaby.mp3',
};
const VOLUME = 0.22;
const DUCKED = 0.06;
const KEY = 'lg.settings';

let ac = null;
let gain = null;
let source = null;
let current = null;
let wanted = null;
let started = false;
const buffers = new Map();

function settings() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
}

export function musicOn() {
  return settings().music !== false; // on unless a grown-up turned it off
}

export function setMusicOn(on) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...settings(), music: !!on }));
  } catch {
    /* not saved */
  }
  if (on) play(wanted);
  else stop();
}

function context() {
  if (!ac) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ac = new AC();
    gain = ac.createGain();
    gain.gain.value = 0;
    gain.connect(ac.destination);
  }
  if (ac.state === 'suspended') ac.resume();
  return ac;
}

async function load(name) {
  if (!buffers.has(name)) {
    const url = new URL(`../music/${TRACKS[name]}`, import.meta.url);
    buffers.set(
      name,
      fetch(url)
        .then((r) => r.arrayBuffer())
        .then((b) => new Promise((ok, fail) => context().decodeAudioData(b, ok, fail))),
    );
  }
  return buffers.get(name);
}

function stop() {
  if (!source) return;
  const s = source;
  source = null;
  current = null;
  gain.gain.setTargetAtTime(0, ac.currentTime, 0.3);
  setTimeout(() => {
    try {
      s.stop();
    } catch {
      /* already stopped */
    }
  }, 1200);
}

async function play(name) {
  if (!name || !TRACKS[name] || !started || !musicOn() || current === name) return;
  if (!context()) return;
  current = name;
  try {
    const buf = await load(name);
    if (current !== name) return;
    source?.stop();
    source = ac.createBufferSource();
    source.buffer = buf;
    source.loop = true;
    source.connect(gain);
    source.start();
    gain.gain.cancelScheduledValues(ac.currentTime);
    gain.gain.setValueAtTime(0, ac.currentTime);
    gain.gain.linearRampToValueAtTime(VOLUME, ac.currentTime + 1.5); // fade in
  } catch {
    current = null;
  }
}

// Pick this page's track. Music only starts after her first tap (iPad rule).
export function setTrack(name) {
  wanted = name;
  if (started) play(name);
}

// Called on the first tap of each page.
export function startMusic() {
  started = true;
  play(wanted);
}

// Turn the music down while someone is speaking, then back up.
export function duck(on) {
  if (!gain || !source) return;
  gain.gain.setTargetAtTime(on ? DUCKED : VOLUME, ac.currentTime, on ? 0.08 : 0.4);
}

// Load the track early (no sound) so it can start instantly on the first tap.
export function preload(name) {
  if (TRACKS[name] && musicOn()) load(name).catch(() => {});
}
