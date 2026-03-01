import type { WordEntry } from '../types';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const WORDS_RAW: Array<{ word: string; emoji: string }> = [
  { word: 'cat', emoji: '🐱' },
  { word: 'dog', emoji: '🐶' },
  { word: 'sun', emoji: '☀️' },
  { word: 'hat', emoji: '🎩' },
  { word: 'bus', emoji: '🚌' },
  { word: 'cup', emoji: '🥤' },
  { word: 'hen', emoji: '🐔' },
  { word: 'pig', emoji: '🐷' },
  { word: 'map', emoji: '🗺️' },
  { word: 'fan', emoji: '🌀' },
  { word: 'ant', emoji: '🐜' },
  { word: 'bee', emoji: '🐝' },
  { word: 'fox', emoji: '🦊' },
  { word: 'owl', emoji: '🦉' },
  { word: 'log', emoji: '🪵' },
  { word: 'bat', emoji: '🦇' },
  { word: 'bed', emoji: '🛏️' },
  { word: 'box', emoji: '📦' },
  { word: 'bug', emoji: '🐛' },
  { word: 'dot', emoji: '🔵' },
  { word: 'egg', emoji: '🥚' },
  { word: 'fig', emoji: '🍑' },
  { word: 'jam', emoji: '🍓' },
  { word: 'jet', emoji: '✈️' },
  { word: 'net', emoji: '🥅' },
];

export function getShuffledWords(): WordEntry[] {
  return shuffle(WORDS_RAW).map((w) => ({
    word: w.word,
    emoji: w.emoji,
    scrambled: shuffle(w.word.split('')),
  }));
}
