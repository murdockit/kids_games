// Play-time limit and bedtime, set on the Grown-ups screen.
// When time is up, Sparkle gets sleepy and the games rest until a grown-up answers a question.
import { load, save } from './storage.js';
import { hush } from './music.js';

const LIMITS = 'lg.limits'; // { minutes: 0 | 15 | 20 | 30 | 45 | 60, bedtime: '' | 'HH:MM' }
const PLAY = 'lg.playtime'; // { day, ms, extra, bedOff }
const TICK = 10000;
const MORNING = 6; // bedtime lasts until 6 in the morning

const dayKey = (d = new Date()) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
export const getLimits = () => ({ minutes: 0, bedtime: '', ...load(LIMITS, {}) });
export const setLimits = (patch) => save(LIMITS, { ...getLimits(), ...patch });

export function playToday() {
  const p = load(PLAY, null);
  return p && p.day === dayKey() ? { extra: 0, bedOff: false, ...p } : { day: dayKey(), ms: 0, extra: 0, bedOff: false };
}
const setPlay = (p) => save(PLAY, p);

function pastBedtime(bedtime, now = new Date()) {
  if (!bedtime) return false;
  const [h, m] = bedtime.split(':').map(Number);
  const mins = now.getHours() * 60 + now.getMinutes();
  return mins >= h * 60 + m || now.getHours() < MORNING;
}

// Why the games should rest right now: 'time', 'bedtime', or null.
export function restReason() {
  const lim = getLimits();
  const p = playToday();
  if (pastBedtime(lim.bedtime) && !p.bedOff) return 'bedtime';
  if (lim.minutes && p.ms >= (lim.minutes + p.extra) * 60000) return 'time';
  return null;
}
export function minutesLeft() {
  const lim = getLimits();
  if (!lim.minutes) return null;
  const p = playToday();
  return Math.max(0, lim.minutes + p.extra - p.ms / 60000);
}

let screen = null;
let warned = false;

function showRest(reason, say) {
  if (screen) return;
  hush(true);
  screen = document.createElement('div');
  screen.className = 'rest-screen';
  screen.innerHTML = `
    <div class="zz">💤</div>
    <div class="mascot"></div>
    <h2></h2>
    <p></p>
    <button class="grownup-btn" data-gate>Grown-ups ⚙️</button>`;
  const title = reason === 'bedtime' ? 'Time for bed!' : 'Time for a rest!';
  screen.querySelector('h2').textContent = title;
  screen.querySelector('p').textContent = reason === 'bedtime' ? 'Sparkle is going to sleep. Good night!' : 'Sparkle is sleepy. Let’s play again later!';
  document.body.appendChild(screen);
  import('./mascot.js').then(({ unicornSVG }) => {
    const spot = screen?.querySelector('.mascot');
    if (spot) spot.innerHTML = unicornSVG();
  });
  say?.(reason === 'bedtime' ? 'Sparkle is sleepy. It is time for bed. Good night!' : 'Sparkle is sleepy. Time for a rest! Let’s play again later.');
  screen.querySelector('[data-gate]').addEventListener('click', () => gate(reason));
}

// A grown-up can give more time after answering a times-table question.
function gate(reason) {
  const a = 6 + Math.floor(Math.random() * 4);
  const b = 6 + Math.floor(Math.random() * 4);
  const box = document.createElement('div');
  box.className = 'row';
  box.innerHTML = `<p style="width:100%">Grown-ups: ${a} × ${b} = ?</p>
    <input type="number" inputmode="numeric" aria-label="Answer">
    <button class="btn" data-more>+15 minutes</button>
    <button class="btn" data-off>Done for today</button>`;
  screen.querySelector('[data-gate]').replaceWith(box);
  const check = () => Number(box.querySelector('input').value) === a * b;
  const unlock = (patch) => {
    if (!check()) {
      box.querySelector('input').value = '';
      box.querySelector('p').textContent = `Try again: ${a} × ${b} = ?`;
      return;
    }
    const p = playToday();
    setPlay({ ...p, ...patch(p) });
    screen.remove();
    screen = null;
    warned = false;
    hush(false);
  };
  box.querySelector('[data-more]').addEventListener('click', () =>
    unlock((p) => (reason === 'bedtime' ? { bedOff: true, extra: p.extra } : { extra: p.extra + 15 })),
  );
  box.querySelector('[data-off]').addEventListener('click', () =>
    unlock((p) => (reason === 'bedtime' ? { bedOff: true } : { extra: p.extra + 24 * 60 })),
  );
}

// Starts counting play time on this page.
export function watchPlayTime(say) {
  const check = () => {
    const why = restReason();
    if (why) return showRest(why, say);
    const left = minutesLeft();
    if (left !== null && left <= 2 && !warned) {
      warned = true;
      say?.('Two more minutes, then Sparkle needs a rest.');
    }
  };
  setInterval(() => {
    if (document.visibilityState !== 'visible' || screen) return;
    const p = playToday();
    p.ms += TICK;
    setPlay(p);
    check();
  }, TICK);
  check();
}
