import type { MathProblem } from '../types';

const COUNT_EMOJIS = ['🍎','🌟','🐤','🎈','🍭','🌸','🚂','🦋'];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function uniqueChoices(correct: number, count = 4): number[] {
  const set = new Set<number>([correct]);
  while (set.size < count) {
    const delta = Math.floor(Math.random() * 5) - 2;
    const candidate = correct + delta;
    if (candidate >= 0 && candidate !== correct) set.add(candidate);
  }
  return shuffle([...set]);
}

export function generateProblem(): MathProblem {
  const op = Math.random() < 0.6 ? '+' : '-';
  let a: number, b: number;
  if (op === '+') {
    a = Math.floor(Math.random() * 9) + 1;
    b = Math.floor(Math.random() * (10 - a)) + 1;
  } else {
    a = Math.floor(Math.random() * 8) + 2;
    b = Math.floor(Math.random() * (a - 1)) + 1;
  }
  const answer = op === '+' ? a + b : a - b;
  return {
    a, b, op, answer,
    choices: uniqueChoices(answer),
    emoji: COUNT_EMOJIS[Math.floor(Math.random() * COUNT_EMOJIS.length)],
  };
}
