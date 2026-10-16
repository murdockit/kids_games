// A small activity log for the Grown-ups progress page: rounds played per day and game,
// right/wrong taps, and which letters/numbers she mixes up. Stays on this iPad (localStorage).
const KEY = 'lg.activity';
const KEEP_DAYS = 60;

// Which game page this is, e.g. 'letters' for games/letters.html.
export const currentGame = () => location.pathname.split('/').pop().replace(/\.html$/, '') || 'home';

export const GAME_NAMES = {
  'heart-words': 'Heart Words',
  letters: 'Letters',
  counting: 'Counting',
  shapes: 'Shapes & Colors',
  play: 'Free Play',
  salon: 'Hair Salon',
  reading: 'Reading',
  tracing: 'Tracing',
  pet: 'My Pet',
  stories: 'Story Time',
};

function read() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY));
    return v && typeof v === 'object' ? { days: {}, misses: {}, ...v } : { days: {}, misses: {} };
  } catch {
    return { days: {}, misses: {} };
  }
}
function write(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* not saved */
  }
}

export const today = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function trim(data) {
  const keys = Object.keys(data.days).sort();
  for (const k of keys.slice(0, Math.max(0, keys.length - KEEP_DAYS))) delete data.days[k];
}

function bump(game, field, n = 1) {
  const data = read();
  const day = (data.days[today()] ||= {});
  const g = (day[game] ||= { rounds: 0, right: 0, wrong: 0 });
  g[field] = (g[field] || 0) + n;
  trim(data);
  write(data);
}

export const logRound = (game) => bump(game, 'rounds');
export const logAnswer = (game, right) => bump(game, right ? 'right' : 'wrong');

// e.g. logMix('letters', 'b', 'd'): asked for b, she tapped d.
export function logMix(game, wanted, tapped) {
  const data = read();
  const m = (data.misses[game] ||= {});
  const key = `${wanted}→${tapped}`;
  m[key] = (m[key] || 0) + 1;
  write(data);
}

// Last `n` days, oldest first: [{ date, total, games: {game: rounds} }]
export function lastDays(n = 7) {
  const data = read();
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = today(d);
    const day = data.days[key] || {};
    const games = Object.fromEntries(Object.entries(day).map(([g, v]) => [g, v.rounds || 0]));
    out.push({ date: d, total: Object.values(games).reduce((a, b) => a + b, 0), games });
  }
  return out;
}

export function totals(days = 7) {
  const sum = {};
  for (const d of lastDays(days)) {
    for (const [g, rounds] of Object.entries(d.games)) sum[g] = (sum[g] || 0) + rounds;
  }
  return sum;
}

export function accuracy(days = 7) {
  const data = read();
  const out = {};
  for (const d of lastDays(days)) {
    const day = data.days[today(d.date)] || {};
    for (const [g, v] of Object.entries(day)) {
      const o = (out[g] ||= { right: 0, wrong: 0 });
      o.right += v.right || 0;
      o.wrong += v.wrong || 0;
    }
  }
  return out;
}

// The mix-ups she makes most often, e.g. [['b→d', 4], ...]
export function topMixups(game, n = 6) {
  const m = read().misses[game] || {};
  return Object.entries(m)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n);
}

export function clearActivity() {
  write({ days: {}, misses: {} });
}
