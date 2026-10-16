// Jigsaw puzzles: pick a picture (her own drawings, or a built-in one) and a size,
// then drag the pieces onto the board. Pieces snap into place when they're close.
import { say, sfx, cheer, doneScreen, el, shuffle, burstAt } from '../common.js';
import { listPictures } from '../gallery-store.js';
import { unicornSVG } from '../mascot.js';
import { logRound } from '../activity.js';

// Built-in pictures, drawn on a canvas: a background and some big emoji.
const SCENES = [
  { id: 'unicorn', name: 'Sparkle', sky: ['#c4b5fd', '#fbcfe8'], unicorn: true, items: [['🌈', 0.2, 0.2, 0.22], ['⭐', 0.82, 0.16, 0.12], ['✨', 0.72, 0.3, 0.1], ['🌸', 0.12, 0.85, 0.12], ['🌸', 0.88, 0.86, 0.12]] },
  { id: 'farm', name: 'the farm', sky: ['#7dd3fc', '#bbf7d0'], ground: '#4ade80', items: [['☀️', 0.15, 0.15, 0.18], ['🏠', 0.72, 0.42, 0.3], ['🐮', 0.25, 0.68, 0.24], ['🐷', 0.55, 0.78, 0.18], ['🐔', 0.85, 0.8, 0.14], ['🌳', 0.1, 0.45, 0.24]] },
  { id: 'ocean', name: 'the ocean', sky: ['#38bdf8', '#1e3a8a'], items: [['🐳', 0.3, 0.3, 0.3], ['🐠', 0.75, 0.25, 0.16], ['🐙', 0.7, 0.66, 0.24], ['🐡', 0.2, 0.7, 0.16], ['🦀', 0.45, 0.88, 0.14], ['🫧', 0.88, 0.5, 0.12]] },
  { id: 'space', name: 'outer space', sky: ['#1e1b4b', '#6d28d9'], items: [['🚀', 0.3, 0.55, 0.32], ['🪐', 0.75, 0.25, 0.26], ['🌙', 0.18, 0.15, 0.16], ['⭐', 0.6, 0.6, 0.1], ['⭐', 0.88, 0.75, 0.12], ['👽', 0.75, 0.8, 0.16]] },
  { id: 'garden', name: 'the garden', sky: ['#fef3c7', '#bbf7d0'], ground: '#86efac', items: [['🌻', 0.18, 0.55, 0.28], ['🌷', 0.45, 0.72, 0.2], ['🦋', 0.7, 0.25, 0.2], ['🐝', 0.35, 0.2, 0.14], ['🐞', 0.8, 0.75, 0.16], ['🌈', 0.78, 0.5, 0.16]] },
];

const SIZES = [
  { label: '4', cols: 2, rows: 2 },
  { label: '6', cols: 3, rows: 2 },
  { label: '9', cols: 3, rows: 3 },
  { label: '12', cols: 4, rows: 3 },
];

async function sceneImage(scene, w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, scene.sky[0]);
  grad.addColorStop(1, scene.sky[1]);
  g.fillStyle = grad;
  g.fillRect(0, 0, w, h);
  if (scene.ground) {
    g.fillStyle = scene.ground;
    g.beginPath();
    g.ellipse(w / 2, h * 1.05, w * 0.8, h * 0.42, 0, 0, Math.PI * 2);
    g.fill();
  }
  if (scene.unicorn) {
    const img = new Image();
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(unicornSVG().replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"'))}`;
    await img.decode().catch(() => {});
    const s = Math.min(w, h) * 0.75;
    if (img.naturalWidth) g.drawImage(img, (w - s) / 2, (h - s) / 2 + h * 0.05, s, s);
  }
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  for (const [emoji, x, y, size] of scene.items) {
    g.font = `${Math.min(w, h) * size}px sans-serif`;
    g.fillText(emoji, x * w, y * h);
  }
  return c;
}

export function puzzles({ main, bar }) {
  let cleanup = null;
  chooser();
  return () => cleanup?.();

  async function chooser() {
    bar.onRepeat(null);
    bar.setTitle('Puzzles');
    main.innerHTML = '';
    say('Pick a picture for your puzzle!');
    const grid = el('div', 'gallery');
    const add = (thumbSrc, label, make) => {
      const b = el('button', 'gallery-item');
      b.setAttribute('aria-label', label);
      const img = el('img');
      img.alt = '';
      img.src = thumbSrc;
      b.appendChild(img);
      b.addEventListener('click', () => {
        sfx('tap');
        pickSize(make, label);
      });
      grid.appendChild(b);
    };
    for (const scene of SCENES) {
      const c = await sceneImage(scene, 320, 240);
      add(c.toDataURL(), scene.name, () => sceneImage(scene, 800, 600));
    }
    // Her own saved drawings make puzzles too.
    for (const pic of (await listPictures().catch(() => [])).slice(0, 12)) {
      add(pic.thumb, 'my picture', async () => {
        const img = new Image();
        img.src = pic.image;
        await img.decode().catch(() => {});
        return img;
      });
    }
    main.appendChild(grid);
  }

  function pickSize(make, label) {
    main.innerHTML = '';
    say('How many pieces?');
    const row = el('div', 'tiles');
    SIZES.forEach((s, i) => {
      const b = el('button', `tile ${['green', 'blue', 'purple', 'orange'][i]}`);
      b.innerHTML = `<span class="emoji">🧩</span><span>${s.label} pieces</span>`;
      b.addEventListener('click', async () => {
        sfx('tap');
        play(await make(), s, label);
      });
      row.appendChild(b);
    });
    main.appendChild(row);
    bar.onBack(() => chooser());
  }

  function play(picture, size, label) {
    cleanup?.();
    main.innerHTML = '';
    const { cols, rows } = size;
    const area = el('div', 'puzzle-area');
    main.appendChild(area);
    const areaW = area.clientWidth;
    const areaH = Math.max(420, innerHeight - 140); // everything below the top bar
    area.style.height = `${areaH}px`;

    // The board on top, the scattered pieces below it.
    const srcW = picture.naturalWidth || picture.width;
    const srcH = picture.naturalHeight || picture.height;
    const ratio = srcW / srcH;
    let bw = Math.min(areaW * 0.7, areaH * 0.38 * ratio);
    let bh = bw / ratio;
    const bx = (areaW - bw) / 2;
    const by = 8;
    const board = el('div', 'puzzle-board');
    Object.assign(board.style, { left: `${bx}px`, top: `${by}px`, width: `${bw}px`, height: `${bh}px` });
    const ghost = el('img');
    ghost.src = picture.toDataURL ? picture.toDataURL() : picture.src;
    board.appendChild(ghost);
    area.appendChild(board);

    const pw = bw / cols;
    const ph = bh / rows;
    const m = Math.min(pw, ph) * 0.24; // room for the knobs
    // Each inside edge gets a knob that sticks out one way or the other.
    const hEdge = Array.from({ length: rows + 1 }, (_, r) => Array.from({ length: cols }, () => (r === 0 || r === rows ? 0 : Math.random() < 0.5 ? 1 : -1)));
    const vEdge = Array.from({ length: rows }, () => Array.from({ length: cols + 1 }, (_, c) => (c === 0 || c === cols ? 0 : Math.random() < 0.5 ? 1 : -1)));

    // Draw one edge from (x0,y0) to (x1,y1); bump > 0 pokes out to the left of the direction.
    function edge(g, x0, y0, x1, y1, bump) {
      if (!bump) return g.lineTo(x1, y1);
      const dx = x1 - x0, dy = y1 - y0;
      const nx = dy, ny = -dx; // left-hand normal (screen y points down)
      const P = (u, v) => [x0 + dx * u + nx * v * bump, y0 + dy * u + ny * v * bump];
      g.lineTo(...P(0.35, 0));
      g.bezierCurveTo(...P(0.45, 0), ...P(0.3, 0.25), ...P(0.5, 0.25));
      g.bezierCurveTo(...P(0.7, 0.25), ...P(0.55, 0), ...P(0.65, 0));
      g.lineTo(x1, y1);
    }

    const dpr = window.devicePixelRatio || 1;
    const pieces = [];
    const trayTop = by + bh + 24;
    const slots = shuffle(Array.from({ length: rows * cols }, (_, i) => i));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cv = el('canvas', 'puzzle-piece');
        const w = pw + 2 * m, h = ph + 2 * m;
        cv.width = Math.round(w * dpr);
        cv.height = Math.round(h * dpr);
        cv.style.width = `${w}px`;
        cv.style.height = `${h}px`;
        const g = cv.getContext('2d');
        g.scale(dpr, dpr);
        g.beginPath();
        g.moveTo(m, m);
        // Clockwise: top (knob up = out), right, bottom, left.
        edge(g, m, m, m + pw, m, hEdge[r][c]);
        edge(g, m + pw, m, m + pw, m + ph, vEdge[r][c + 1]);
        edge(g, m + pw, m + ph, m, m + ph, -hEdge[r + 1][c]);
        edge(g, m, m + ph, m, m, -vEdge[r][c]);
        g.closePath();
        g.save();
        g.clip();
        g.drawImage(picture, (c * pw - m) * (srcW / bw), (r * ph - m) * (srcH / bh), w * (srcW / bw), h * (srcH / bh), 0, 0, w, h);
        g.restore();
        g.lineWidth = 2;
        g.strokeStyle = 'rgba(255,255,255,.9)';
        g.stroke();

        const home = { x: bx + c * pw - m, y: by + r * ph - m };
        // Spread out over the tray below the board, in a loose grid.
        const slot = slots[r * cols + c];
        const count = rows * cols;
        const trayH = areaH - trayTop;
        const per = Math.max(2, Math.ceil(Math.sqrt((count * areaW) / trayH)));
        const lines = Math.ceil(count / per);
        const sx = ((slot % per) + 0.5) * (areaW / per) - w / 2 + (Math.random() - 0.5) * 16;
        const sy = trayTop + (Math.floor(slot / per) + 0.5) * (trayH / lines) - h / 2 + (Math.random() - 0.5) * 12;
        const piece = { cv, home, x: Math.max(0, Math.min(areaW - w, sx)), y: Math.max(trayTop - m, Math.min(areaH - h, sy)), placed: false };
        place(piece);
        area.appendChild(cv);
        pieces.push(piece);
        drag(piece);
      }
    }
    say(`Put the puzzle together! Drag the pieces onto the picture.`);
    bar.onRepeat(() => say('Drag the pieces onto the picture.'));
    bar.onBack(() => pickSize(() => Promise.resolve(picture), label));
    window.__puzzle = { pieces, area };

    function place(p) {
      p.cv.style.transform = `translate(${p.x}px, ${p.y}px)`;
    }

    let z = 10;
    function drag(p) {
      let start = null;
      p.cv.addEventListener('pointerdown', (e) => {
        if (p.placed) return;
        p.cv.setPointerCapture?.(e.pointerId);
        p.cv.style.zIndex = ++z;
        p.cv.classList.add('lifted');
        start = { px: e.clientX, py: e.clientY, x: p.x, y: p.y };
        sfx('tap');
      });
      p.cv.addEventListener('pointermove', (e) => {
        if (!start) return;
        p.x = start.x + e.clientX - start.px;
        p.y = start.y + e.clientY - start.py;
        place(p);
      });
      const drop = () => {
        if (!start) return;
        start = null;
        p.cv.classList.remove('lifted');
        if (Math.hypot(p.x - p.home.x, p.y - p.home.y) < Math.min(pw, ph) * 0.35) {
          p.x = p.home.x;
          p.y = p.home.y;
          p.placed = true;
          p.cv.classList.add('placed');
          p.cv.style.zIndex = 1;
          place(p);
          sfx('clink');
          const r = p.cv.getBoundingClientRect();
          burstAt(r.left + r.width / 2, r.top + r.height / 2);
          if (pieces.every((q) => q.placed)) finish();
        }
      };
      p.cv.addEventListener('pointerup', drop);
      p.cv.addEventListener('pointercancel', drop);
    }

    async function finish() {
      board.classList.add('complete');
      await cheer('You did the puzzle!', { big: true });
      logRound('play');
      doneScreen(main, { onAgain: () => play(picture, size, label), onBack: chooser, message: 'Puzzle done!' });
    }
  }
}
