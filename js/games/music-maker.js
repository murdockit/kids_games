// Music Maker: a rainbow xylophone to play freely, and a little song grid that loops.
import { say, el, tone, slide, noise, pick } from '../common.js';
import { hush } from '../music.js';

// A pentatonic scale, so any notes she picks sound nice together.
const BARS = [
  { f: 523, color: '#ef4444' }, { f: 587, color: '#f97316' }, { f: 659, color: '#facc15' },
  { f: 784, color: '#22c55e' }, { f: 880, color: '#14b8a6' }, { f: 1047, color: '#3b82f6' },
  { f: 1175, color: '#8b5cf6' }, { f: 1319, color: '#ec4899' },
];

const xylo = (f) => {
  tone(f, 0, 0.7, 'sine', 0.22);
  tone(f * 4, 0, 0.06, 'sine', 0.04); // the mallet's click
};
const DRUMS = {
  kick: () => slide(150, 45, 0, 0.3, 'sine', 0.5),
  clap: () => {
    noise(0, 0.03, { freq: 1500, q: 0.8, gain: 0.28 });
    noise(0.03, 0.12, { freq: 1300, q: 0.8, gain: 0.22 });
  },
};

// Song grid rows, top to bottom: five notes, then clap and drum.
const ROWS = [
  { label: '🟣', play: () => xylo(1175), color: '#8b5cf6' },
  { label: '🔵', play: () => xylo(880), color: '#3b82f6' },
  { label: '🟢', play: () => xylo(784), color: '#22c55e' },
  { label: '🟡', play: () => xylo(659), color: '#facc15' },
  { label: '🔴', play: () => xylo(523), color: '#ef4444' },
  { label: '👏', play: DRUMS.clap, color: '#f97316' },
  { label: '🥁', play: DRUMS.kick, color: '#64748b' },
];
const STEPS = 8;
const STEP_MS = 270;

export function musicMaker({ main, bar }) {
  bar.onRepeat(null);
  main.innerHTML = '';
  hush(true); // background music gets quiet so her song is the star
  say('Make some music! Tap the rainbow, or tap boxes to make a song.');

  // Xylophone
  const xy = el('div', 'xylophone');
  BARS.forEach((b, i) => {
    const key = el('button', 'xylo-bar');
    key.style.background = b.color;
    key.style.height = `${100 - i * 6}%`;
    key.setAttribute('aria-label', `note ${i + 1}`);
    key.addEventListener('pointerdown', () => {
      xylo(b.f);
      key.classList.remove('hit');
      void key.offsetWidth;
      key.classList.add('hit');
    });
    xy.appendChild(key);
  });

  // Song grid
  const grid = el('div', 'song-grid');
  grid.style.setProperty('--steps', STEPS);
  const cells = ROWS.map((row, r) => {
    grid.appendChild(el('span', 'song-label', row.label));
    return Array.from({ length: STEPS }, (_, c) => {
      const cell = el('button', 'song-cell');
      cell.style.setProperty('--on', row.color);
      cell.setAttribute('aria-label', `row ${r + 1} beat ${c + 1}`);
      cell.addEventListener('click', () => {
        cell.classList.toggle('on');
        if (cell.classList.contains('on')) row.play();
      });
      grid.appendChild(cell);
      return cell;
    });
  });

  const controls = el('div', 'choices');
  const playBtn = el('button', 'round-btn big-action', '▶️');
  playBtn.setAttribute('aria-label', 'Play my song');
  const dice = el('button', 'round-btn big-action', '🎲');
  dice.setAttribute('aria-label', 'Surprise song');
  const clear = el('button', 'round-btn big-action', '🧽');
  clear.setAttribute('aria-label', 'Clear song');
  controls.append(playBtn, dice, clear);
  main.append(xy, grid, controls);

  let timer = null;
  let step = 0;
  const stop = () => {
    clearInterval(timer);
    timer = null;
    playBtn.textContent = '▶️';
    grid.querySelectorAll('.now').forEach((c) => c.classList.remove('now'));
  };
  const tick = () => {
    grid.querySelectorAll('.now').forEach((c) => c.classList.remove('now'));
    ROWS.forEach((row, r) => {
      const cell = cells[r][step];
      cell.classList.add('now');
      if (cell.classList.contains('on')) row.play();
    });
    step = (step + 1) % STEPS;
  };
  playBtn.addEventListener('click', () => {
    if (timer) return stop();
    step = 0;
    tick();
    timer = setInterval(tick, STEP_MS);
    playBtn.textContent = '⏹️';
  });
  dice.addEventListener('click', () => {
    cells.flat().forEach((c) => c.classList.remove('on'));
    // A simple tune: one note per beat, with a drum on 1 and 5 and claps on 3 and 7.
    let r = 2;
    for (let c = 0; c < STEPS; c++) {
      r = Math.max(0, Math.min(4, r + pick([-1, 0, 1, 1, -1, 2, -2])));
      if (c % 4 !== 3 || Math.random() < 0.5) cells[r][c].classList.add('on');
      if (c % 4 === 0) cells[6][c].classList.add('on');
      if (c % 4 === 2) cells[5][c].classList.add('on');
    }
    if (!timer) playBtn.click();
  });
  clear.addEventListener('click', () => {
    stop();
    cells.flat().forEach((c) => c.classList.remove('on'));
  });

  return () => {
    stop();
    hush(false);
  };
}
