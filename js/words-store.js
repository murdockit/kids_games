// Heart words "database".
//
// The starter list lives in data/heart-words.json (edit it on the computer running Docker).
// Changes made on the Grown-ups screen are saved on this iPad in localStorage as a diff
// (added / removed / learned / stats), so edits to the file still show up without wiping progress.
import { load, save, pick } from './common.js';

const KEY = 'lg.heartWords';
const FILE_URL = new URL('../data/heart-words.json', import.meta.url);
const FALLBACK = ['I', 'a', 'the', 'and', 'is', 'can', 'see', 'to', 'we', 'my', 'like', 'go', 'you', 'it'];

let baseWords = null;

const norm = (w) => w.trim().toLowerCase();

function cleanList(list) {
  const seen = new Set();
  const out = [];
  for (const raw of Array.isArray(list) ? list : []) {
    if (typeof raw !== 'string') continue;
    const w = raw.trim().replace(/\s+/g, ' ');
    if (!w || w.length > 30 || seen.has(norm(w))) continue;
    seen.add(norm(w));
    out.push(w);
  }
  return out;
}

function local() {
  const s = load(KEY, {});
  return {
    added: cleanList(s.added),
    removed: cleanList(s.removed),
    learned: cleanList(s.learned),
    stats: s.stats && typeof s.stats === 'object' ? s.stats : {},
  };
}

function store(state) {
  save(KEY, state);
}

export async function loadBaseWords() {
  if (baseWords) return baseWords;
  try {
    const res = await fetch(FILE_URL, { cache: 'no-cache' });
    if (!res.ok) throw new Error(res.status);
    baseWords = cleanList((await res.json()).words);
    if (!baseWords.length) baseWords = FALLBACK;
  } catch {
    baseWords = FALLBACK;
  }
  return baseWords;
}

// The current list: starter words + added − removed.
export async function getWords() {
  const base = await loadBaseWords();
  const s = local();
  const removed = new Set(s.removed.map(norm));
  return cleanList([...base, ...s.added]).filter((w) => !removed.has(norm(w)));
}

export async function getRemovedStarterWords() {
  const base = await loadBaseWords();
  const removed = new Set(local().removed.map(norm));
  return base.filter((w) => removed.has(norm(w)));
}

export function isLearned(word) {
  return local().learned.some((w) => norm(w) === norm(word));
}

export function getStats(word) {
  return local().stats[norm(word)] || { right: 0, wrong: 0 };
}

export async function addWords(text) {
  const words = cleanList(String(text).split(/[,\n]+/));
  if (!words.length) return [];
  const base = (await loadBaseWords()).map(norm);
  const s = local();
  for (const w of words) {
    s.removed = s.removed.filter((r) => norm(r) !== norm(w));
    if (!base.includes(norm(w))) s.added = cleanList([...s.added, w]);
  }
  store(s);
  return words;
}

export async function removeWord(word) {
  const base = (await loadBaseWords()).map(norm);
  const s = local();
  s.added = s.added.filter((w) => norm(w) !== norm(word));
  if (base.includes(norm(word))) s.removed = cleanList([...s.removed, word]);
  s.learned = s.learned.filter((w) => norm(w) !== norm(word));
  store(s);
}

export function setLearned(word, learned) {
  const s = local();
  s.learned = s.learned.filter((w) => norm(w) !== norm(word));
  if (learned) s.learned.push(word);
  store(s);
}

export function recordAnswer(word, right) {
  const s = local();
  const k = norm(word);
  const st = s.stats[k] || { right: 0, wrong: 0 };
  if (right) st.right++;
  else st.wrong++;
  s.stats[k] = st;
  store(s);
}

export function resetStats() {
  const s = local();
  s.stats = {};
  store(s);
}

// Picks a word, favoring ones she hasn't learned yet (3x as likely).
export function pickPracticeWord(words, avoid) {
  const pool = [];
  for (const w of words) {
    if (avoid && norm(w) === norm(avoid) && words.length > 1) continue;
    const weight = isLearned(w) ? 1 : 3;
    for (let i = 0; i < weight; i++) pool.push(w);
  }
  return pick(pool);
}

// Export is shaped like data/heart-words.json, so the file can replace it directly.
export async function exportData() {
  const s = local();
  return {
    words: await getWords(),
    learned: s.learned,
    stats: s.stats,
    exportedAt: new Date().toISOString(),
    app: "Lydia's Games",
  };
}

// Import makes this iPad's list match the file's "words", and restores learned/stats if present.
export async function importData(data) {
  const words = cleanList(data?.words);
  if (!words.length) throw new Error('That file has no "words" list.');
  const base = await loadBaseWords();
  const wanted = new Set(words.map(norm));
  const baseSet = new Set(base.map(norm));
  store({
    added: words.filter((w) => !baseSet.has(norm(w))),
    removed: base.filter((w) => !wanted.has(norm(w))),
    learned: cleanList(data.learned).filter((w) => wanted.has(norm(w))),
    stats: data.stats && typeof data.stats === 'object' ? data.stats : {},
  });
  return words.length;
}
