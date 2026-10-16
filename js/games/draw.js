// Drawing pad: brushes, rainbow & sparkle, paint bucket with magic patterns, stamps, coloring pages,
// undo, and saving.
import { say, sfx, el, askYesNo, confetti, addStar, pick } from '../common.js';
import { PAGES, CATEGORIES, findPage, pageImage, pageURL } from '../coloring-pages.js';
import { savePicture } from '../gallery-store.js';

// Named so picking one can say it out loud ("Light blue!").
const COLORS = [
  ['red', '#ef4444'], ['orange', '#f97316'], ['yellow', '#facc15'], ['green', '#22c55e'], ['blue', '#3b82f6'],
  ['purple', '#a855f7'], ['pink', '#f472b6'], ['brown', '#8b5a2b'], ['black', '#2b2d42'],
  ['dark red', '#b91c1c'], ['peach', '#fdba74'], ['light yellow', '#fef08a'], ['lime green', '#a3e635'],
  ['dark green', '#15803d'], ['mint green', '#6ee7b7'], ['teal', '#14b8a6'], ['light blue', '#7dd3fc'],
  ['navy blue', '#1e3a8a'], ['lavender', '#c4b5fd'], ['dark purple', '#6d28d9'], ['hot pink', '#ec4899'],
  ['light pink', '#fbcfe8'], ['tan', '#d2b48c'], ['beige', '#f5deb3'], ['gold', '#d4a017'],
  ['silver', '#c0c0c0'], ['gray', '#9ca3af'], ['white', '#ffffff'],
].map(([name, hex]) => ({ name, hex }));
const QUICK_COLORS = 9;
// Magic paint: the bucket fills with a pattern instead of a flat color.
const PATTERNS = [
  { id: 'rainbow', name: 'Rainbow' },
  { id: 'dots', name: 'Polka dots' },
  { id: 'stripes', name: 'Stripes' },
  { id: 'glitter', name: 'Glitter' },
  { id: 'hearts', name: 'Hearts' },
];
const STAMPS = ['⭐', '❤️', '🌸', '🐶', '🐱', '🦋', '🌈', '🍎', '🚀', '🦄'];
const SIZES = [8, 16, 32];
const UNDO_LIMIT = 10; // full-canvas snapshots are big; keep iPad memory in check
const FILL_TOLERANCE = 48;

// resume: a saved picture (from My Pictures) to keep working on.
export function draw({ main, bar, resume = null }) {
  bar.onRepeat(null);
  main.innerHTML = '';
  main.classList.add('drawing');

  // ---------- Layout ----------
  const colorRow = el('div', 'draw-tools');
  const toolRow = el('div', 'draw-tools');
  const wrap = el('div', 'draw-area');
  const paint = el('canvas');
  const lines = el('canvas', 'lines');
  wrap.append(paint, lines);
  main.append(colorRow, toolRow, wrap);
  const pctx = paint.getContext('2d', { willReadFrequently: true });
  const lctx = lines.getContext('2d', { willReadFrequently: true });

  let color = COLORS[4].hex;
  let recent = COLORS.slice(0, QUICK_COLORS);
  let pattern = PATTERNS[0].id;
  let size = SIZES[1];
  let tool = 'brush'; // brush | rainbow | sparkle | fill | stamp | eraser
  let stamp = STAMPS[0];
  let pageId = resume?.pageId || null;
  let pictureId = resume?.id || null;
  let dirty = false;
  let undo = [];

  function button(row, content, label, onPick, extraClass = '') {
    const b = el('button', `tool-btn ${extraClass}`);
    b.innerHTML = content;
    b.setAttribute('aria-label', label);
    b.addEventListener('click', () => {
      sfx('tap');
      onPick(b);
    });
    row.appendChild(b);
    return b;
  }
  const mark = (group, b) => {
    group.forEach((x) => x.classList.toggle('on', x === b));
  };

  // Row 1: the colors used most recently, plus 🎨 for all of them.
  function chooseColor(c) {
    color = c.hex;
    say(c.name);
    if (!recent.includes(c)) recent = [c, ...recent].slice(0, QUICK_COLORS);
    renderColors();
    if (toolBtns.magic?.style.backgroundImage) toolBtns.magic.style.background = `url(${patternPreview(pattern)}) center/cover`;
    // Picking a color means "paint with it": leave tools that ignore color.
    if (['stamp', 'eraser', 'rainbow'].includes(tool) || (tool === 'magic' && pattern === 'rainbow')) setTool('brush');
  }
  function renderColors() {
    colorRow.innerHTML = '';
    for (const c of recent) {
      const b = button(colorRow, '', c.name, () => chooseColor(c), 'swatch');
      b.style.background = c.hex;
      b.classList.toggle('on', c.hex === color);
    }
    button(colorRow, '🎨', 'more colors', openColorTray, 'action');
  }
  renderColors();

  // Row 2: sizes, tools, actions
  const sizeBtns = SIZES.map((s, i) =>
    button(toolRow, `<span class="dot" style="width:${s * 0.9 + 6}px;height:${s * 0.9 + 6}px"></span>`, ['small brush', 'medium brush', 'big brush'][i], (b) => {
      size = s;
      mark(sizeBtns, b);
    }),
  );
  mark(sizeBtns, sizeBtns[1]);

  const toolBtns = {};
  function setTool(t) {
    tool = t;
    mark(Object.values(toolBtns), toolBtns[t]);
  }
  toolBtns.brush = button(toolRow, '🖌️', 'brush', () => setTool('brush'));
  toolBtns.rainbow = button(toolRow, '🌈', 'rainbow brush', () => {
    setTool('rainbow');
    say('Rainbow brush!');
  });
  toolBtns.sparkle = button(toolRow, '✨', 'sparkle brush', () => {
    setTool('sparkle');
    say('Sparkle brush!');
  });
  toolBtns.fill = button(toolRow, '🪣', 'paint bucket', () => {
    setTool('fill');
    say('Paint bucket! Tap inside a shape.');
  });
  toolBtns.magic = button(toolRow, '🪄', 'magic paint', openPatternTray);
  toolBtns.stamp = button(toolRow, stamp, 'stamps', () => {
    setTool('stamp');
    openStampTray();
  });
  toolBtns.eraser = button(toolRow, '🧽', 'eraser', () => setTool('eraser'));
  setTool('brush');
  button(toolRow, '↩️', 'undo', undoLast, 'action');
  button(toolRow, '🗑️', 'start over', clearAll, 'action');
  button(toolRow, '📄', 'coloring pages', openPagePicker, 'action');
  button(toolRow, '💾', 'save picture', savePic, 'action');

  // ---------- Canvas sizing (keeps the picture when the iPad rotates) ----------
  const dpr = () => window.devicePixelRatio || 1;
  let cssW = 0;
  let cssH = 0;

  // Where the 400×400 coloring page sits in a w×h area (centered, small margin).
  function pageBox(w, h) {
    const pad = Math.min(w, h) * 0.04;
    const s = Math.min((w - pad * 2) / 400, (h - pad * 2) / 400);
    return { x: (w - 400 * s) / 2, y: (h - 400 * s) / 2, s };
  }

  // Draws a picture made in an oldW×oldH area so it lines up with the page in the current area.
  function drawRefit(img, oldW, oldH) {
    const from = pageBox(oldW, oldH);
    const to = pageBox(cssW, cssH);
    const k = to.s / from.s;
    pctx.drawImage(img, to.x - from.x * k, to.y - from.y * k, oldW * k, oldH * k);
  }

  function resize() {
    const r = wrap.getBoundingClientRect();
    const w = Math.max(1, Math.round(r.width * dpr()));
    const h = Math.max(1, Math.round(r.height * dpr()));
    if (w === paint.width && h === paint.height) return;
    const keep = document.createElement('canvas');
    keep.width = paint.width;
    keep.height = paint.height;
    if (cssW) keep.getContext('2d').drawImage(paint, 0, 0);
    for (const c of [paint, lines]) {
      c.width = w;
      c.height = h;
    }
    pctx.setTransform(dpr(), 0, 0, dpr(), 0, 0);
    const [oldW, oldH] = [cssW, cssH];
    cssW = r.width;
    cssH = r.height;
    if (oldW) drawRefit(keep, oldW, oldH);
    undo = []; // old snapshots no longer match the canvas size
    resetFills();
    drawPage();
  }

  async function drawPage() {
    lctx.setTransform(1, 0, 0, 1, 0, 0);
    lctx.clearRect(0, 0, lines.width, lines.height);
    const page = findPage(pageId);
    if (!page) return;
    const img = await pageImage(page);
    if (findPage(pageId) !== page) return; // changed while loading
    const box = pageBox(lines.width, lines.height);
    lctx.clearRect(0, 0, lines.width, lines.height);
    lctx.drawImage(img, box.x, box.y, 400 * box.s, 400 * box.s);
    linesOnly();
  }

  // Pages are drawn as white cut-out shapes with dark outlines. Keep only the outlines:
  // white becomes see-through so paint shows, dark stays solid so it works as a wall for the bucket.
  function linesOnly() {
    const img = lctx.getImageData(0, 0, lines.width, lines.height);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      if (!d[i + 3]) continue;
      const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      const dark = Math.min(1, Math.max(0, (255 - lum) / 200));
      d[i + 3] = Math.round(d[i + 3] * dark);
      d[i] = 43;
      d[i + 1] = 45;
      d[i + 2] = 66;
    }
    lctx.putImageData(img, 0, 0);
  }

  // ---------- Undo ----------
  function snapshot() {
    undo.push(pctx.getImageData(0, 0, paint.width, paint.height));
    if (undo.length > UNDO_LIMIT) undo.shift();
  }
  function undoLast() {
    const last = undo.pop();
    if (!last) {
      say('Nothing to undo.');
      return;
    }
    pctx.putImageData(last, 0, 0);
    dirty = true;
  }

  function wipePaint() {
    pctx.save();
    pctx.setTransform(1, 0, 0, 1, 0, 0);
    pctx.clearRect(0, 0, paint.width, paint.height);
    pctx.restore();
    resetFills();
  }

  async function clearAll() {
    if (!(await askYesNo('Start over?'))) return;
    snapshot();
    wipePaint();
    pictureId = null; // the next save is a new picture
    dirty = false;
    say('All clean! Tap undo if you want it back.');
  }

  // ---------- Pop-up trays ----------
  function overlayBox(title, wide = false) {
    const overlay = el('div', 'overlay');
    const box = el('div', `overlay-box${wide ? ' wide' : ''}`);
    box.appendChild(el('p', 'prompt-text', title));
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    const close = el('button', 'round-btn', '✖️');
    close.setAttribute('aria-label', 'Close');
    close.addEventListener('click', () => overlay.remove());
    return { overlay, box, close };
  }

  function tray(title, items, onPick, itemClass = 'tool-btn big') {
    const { overlay, box, close } = overlayBox(title);
    const grid = el('div', 'tray-grid');
    for (const item of items) {
      const b = el('button', itemClass);
      b.innerHTML = item.html;
      if (item.style) b.style.cssText = item.style;
      b.setAttribute('aria-label', item.label);
      b.addEventListener('click', () => {
        sfx('tap');
        overlay.remove();
        onPick(item);
      });
      grid.appendChild(b);
    }
    box.append(grid, close);
  }

  function openColorTray() {
    say('Pick a color!');
    tray(
      'Pick a color',
      COLORS.map((c) => ({ html: '', label: c.name, value: c, style: `background:${c.hex}` })),
      (item) => chooseColor(item.value),
      'tool-btn swatch big',
    );
  }

  function openPatternTray() {
    say('Magic paint! Pick a pattern.');
    tray(
      'Magic paint',
      PATTERNS.map((p) => ({ html: '', label: p.name, value: p, style: `background:url(${patternPreview(p.id)}) center/cover` })),
      (item) => {
        pattern = item.value.id;
        toolBtns.magic.style.background = `url(${patternPreview(pattern)}) center/cover`;
        toolBtns.magic.textContent = '';
        setTool('magic');
        say(`${item.value.name}! Tap inside a shape.`);
      },
      'tool-btn swatch big',
    );
  }

  function openStampTray() {
    tray('Pick a stamp', STAMPS.map((s) => ({ html: s, label: `stamp ${s}`, value: s })), (item) => {
      stamp = item.value;
      toolBtns.stamp.textContent = stamp;
      setTool('stamp');
    });
  }

  // Picture picker: a row of category buttons, then real previews of the pictures in that category.
  function openPagePicker() {
    say('Pick a picture to color!');
    const { overlay, box, close } = overlayBox('Pick a picture to color', true);
    const tabs = el('div', 'tray-grid');
    const grid = el('div', 'page-grid');
    box.append(tabs, grid, close);

    async function choose(id) {
      sfx('tap');
      overlay.remove();
      // Only ask when there's unsaved drawing; a saved picture is safe in My Pictures.
      if (dirty && !(await askYesNo('Start a new picture?'))) return;
      wipePaint();
      undo = []; // undoing onto a different page would be confusing
      pageId = id;
      pictureId = null;
      dirty = false;
      await drawPage();
      const page = findPage(pageId);
      say(page ? `Let's color ${page.name}! Try the paint bucket.` : 'A blank page. Draw anything you like!');
      if (page) setTool('fill');
    }

    function showCategory(catId) {
      tabs.querySelectorAll('[data-cat]').forEach((t) => t.classList.toggle('on', t.dataset.cat === catId));
      grid.innerHTML = '';
      for (const page of PAGES.filter((p) => p.cat === catId)) {
        const b = el('button', 'page-thumb');
        b.setAttribute('aria-label', page.name.replace('the ', ''));
        const img = el('img');
        img.src = pageURL(page);
        img.alt = '';
        b.appendChild(img);
        b.addEventListener('click', () => choose(page.id));
        grid.appendChild(b);
      }
    }

    for (const c of CATEGORIES) {
      const t = el('button', 'tool-btn big', c.emoji);
      t.dataset.cat = c.id;
      t.setAttribute('aria-label', c.name);
      t.addEventListener('click', () => {
        sfx('tap');
        say(c.name);
        showCategory(c.id);
      });
      tabs.appendChild(t);
    }
    const surprise = el('button', 'tool-btn big', '🎲');
    surprise.setAttribute('aria-label', 'surprise me');
    surprise.addEventListener('click', () => choose(pick(PAGES.filter((p) => p.id !== pageId)).id));
    const blank = el('button', 'tool-btn big', '⬜');
    blank.setAttribute('aria-label', 'blank page');
    blank.addEventListener('click', () => choose(null));
    tabs.append(surprise, blank);
    showCategory(findPage(pageId)?.cat || CATEGORIES[0].id);
  }

  // ---------- Painting ----------
  const strokes = new Map();
  let hue = 0;
  const pos = (e) => {
    const r = paint.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  };

  function lighten(hex) {
    const n = parseInt(hex.slice(1), 16);
    const mix = (v) => Math.round(v + (255 - v) * 0.55);
    return `rgb(${mix(n >> 16)}, ${mix((n >> 8) & 255)}, ${mix(n & 255)})`;
  }

  function dot(x, y, r, fill) {
    pctx.fillStyle = fill;
    pctx.beginPath();
    pctx.arc(x, y, r, 0, Math.PI * 2);
    pctx.fill();
  }

  function segment(from, to) {
    pctx.lineCap = 'round';
    pctx.lineJoin = 'round';
    pctx.lineWidth = size;
    if (tool === 'eraser') {
      pctx.globalCompositeOperation = 'destination-out';
      pctx.strokeStyle = '#000';
      pctx.lineWidth = size * 1.5;
    } else if (tool === 'rainbow') {
      hue = (hue + Math.hypot(to[0] - from[0], to[1] - from[1]) * 0.8) % 360;
      pctx.strokeStyle = `hsl(${hue}, 90%, 55%)`;
    } else {
      pctx.strokeStyle = color;
    }
    pctx.beginPath();
    pctx.moveTo(...from);
    pctx.lineTo(...to);
    pctx.stroke();
    pctx.globalCompositeOperation = 'source-over';
    if (tool === 'sparkle') {
      const n = 1 + Math.floor(Math.random() * 2);
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const d = size * (0.8 + Math.random() * 1.2);
        dot(to[0] + Math.cos(a) * d, to[1] + Math.sin(a) * d, 1.5 + Math.random() * (size / 6), Math.random() < 0.5 ? lighten(color) : '#ffd84d');
      }
    }
  }

  paint.addEventListener('pointerdown', (e) => {
    paint.setPointerCapture(e.pointerId);
    const [x, y] = pos(e);
    snapshot();
    dirty = true;
    if (tool === 'fill' || tool === 'magic') {
      const how = tool === 'magic' ? pattern : 'solid';
      if (!floodFill(Math.floor(x * dpr()), Math.floor(y * dpr()), color, how)) undo.pop();
      else sfx(how === 'solid' ? 'pop' : 'good');
      return;
    }
    if (tool === 'stamp') {
      pctx.font = `${size * 4}px serif`;
      pctx.textAlign = 'center';
      pctx.textBaseline = 'middle';
      pctx.fillText(stamp, x, y);
      sfx('pop');
      return;
    }
    strokes.set(e.pointerId, [x, y]);
    segment([x, y], [x + 0.01, y]); // a dot for a single tap
  });
  paint.addEventListener('pointermove', (e) => {
    const last = strokes.get(e.pointerId);
    if (!last) return;
    // Use every coalesced point so fast finger strokes stay smooth.
    const events = e.getCoalescedEvents?.() || [e];
    let from = last;
    for (const ce of events.length ? events : [e]) {
      const to = pos(ce);
      segment(from, to);
      from = to;
    }
    strokes.set(e.pointerId, from);
  });
  const end = (e) => strokes.delete(e.pointerId);
  paint.addEventListener('pointerup', end);
  paint.addEventListener('pointercancel', end);

  // ---------- Paint bucket ----------
  // Each fill gets an id, and fillMap remembers which fill last painted each pixel. That lets a
  // patterned area (rainbow, dots…) be refilled as one piece even though its pixels differ in color.
  // A pixel only counts as part of its fill while it still looks the way that fill painted it,
  // so brush strokes on top, undo and erasing are all handled without extra bookkeeping.
  let fills = [null];
  let fillMap = new Uint16Array(0);
  function resetFills() {
    fills = [null];
    fillMap = new Uint16Array(paint.width * paint.height);
  }

  const hexRGB = (hex) => {
    const n = parseInt(hex.slice(1), 16);
    return [n >> 16, (n >> 8) & 255, n & 255];
  };
  const mixWhite = ([r, g, b], t) => [r + (255 - r) * t, g + (255 - g) * t, b + (255 - b) * t].map(Math.round);
  const hash = (x, y, seed) => {
    let h = (x * 374761393 + y * 668265263 + seed * 2147483647) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };
  const RAINBOW = Array.from({ length: 360 }, (_, h) => {
    const f = (n) => {
      const k = (n + h / 30) % 12;
      return Math.round(255 * (0.55 - 0.45 * Math.max(-1, Math.min(k - 3, 9 - k, 1))));
    };
    return [f(0), f(8), f(4)];
  });

  // The color a fill paints at pixel (x, y). `u` is device pixels per screen pixel.
  function patternColor(f, x, y, u) {
    const { how, rgb, light, seed } = f;
    switch (how) {
      case 'rainbow':
        return RAINBOW[Math.floor((x + y) / u) % 360];
      case 'dots': {
        const s = 26 * u;
        const shift = (Math.floor(y / s) % 2) * (s / 2); // every other row is offset
        const dx = ((x + shift) % s) - s / 2;
        const dy = (y % s) - s / 2;
        return dx * dx + dy * dy < (7.5 * u) ** 2 ? light : rgb;
      }
      case 'stripes':
        return (x + y) / u % 28 < 14 ? rgb : light;
      case 'glitter': {
        const c = 3 * u;
        const r = hash(Math.floor(x / c), Math.floor(y / c), seed);
        return r < 0.07 ? [255, 255, 255] : r < 0.14 ? [255, 216, 77] : r < 0.3 ? light : rgb;
      }
      case 'hearts': {
        const s = 30 * u;
        const px = ((x % s) / s) * 2 - 1;
        const py = ((y % s) / s) * 2.2 - 1.2;
        // A little heart shape: (x² + y² − 1)³ − x²y³ < 0, scaled to the tile.
        const hx = px * 1.6;
        const hy = -py * 1.6;
        const v = (hx * hx + hy * hy - 1) ** 3 - hx * hx * hy ** 3;
        return v < 0 ? light : rgb;
      }
      default:
        return rgb;
    }
  }

  function makeFill(hex, how) {
    const rgb = hexRGB(hex);
    // Light colors get a darker pattern accent so dots/stripes still show.
    const lum = 0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2];
    const light = lum > 200 ? rgb.map((v) => Math.round(v * 0.7)) : mixWhite(rgb, 0.6);
    return { how, hex, rgb, light, seed: Math.floor(Math.random() * 1e6) };
  }

  function patternPreview(how) {
    const c = document.createElement('canvas');
    c.width = c.height = 96;
    const x = c.getContext('2d');
    const img = x.createImageData(96, 96);
    const f = makeFill(how === 'rainbow' ? '#ffffff' : color, how);
    for (let y = 0; y < 96; y++) {
      for (let xx = 0; xx < 96; xx++) {
        const [r, g, b] = patternColor(f, xx, y, 1);
        const i = (y * 96 + xx) * 4;
        img.data[i] = r;
        img.data[i + 1] = g;
        img.data[i + 2] = b;
        img.data[i + 3] = 255;
      }
    }
    x.putImageData(img, 0, 0);
    return c.toDataURL();
  }

  // Paint-bucket fill in device pixels. Lines on the coloring-page layer are walls; the fill
  // spreads over paint that matches the tapped color, or over the whole earlier fill that was tapped.
  function floodFill(sx, sy, hex, how = 'solid') {
    const w = paint.width;
    const h = paint.height;
    if (sx < 0 || sy < 0 || sx >= w || sy >= h) return false;
    if (fillMap.length !== w * h) resetFills();
    const u = dpr();
    const img = pctx.getImageData(0, 0, w, h);
    const d = img.data;
    const wall = lctx.getImageData(0, 0, w, h).data;
    const startK = sy * w + sx;
    const start = startK * 4;
    if (wall[start + 3] >= 128) return false; // tapped right on a line

    const T = FILL_TOLERANCE;
    // Does pixel k still look the way its fill painted it?
    const intact = (k) => {
      const f = fills[fillMap[k]];
      if (!f) return false;
      const [r, g, b] = patternColor(f, k % w, (k / w) | 0, u);
      const i = k * 4;
      return d[i + 3] === 255 && Math.abs(d[i] - r) <= 24 && Math.abs(d[i + 1] - g) <= 24 && Math.abs(d[i + 2] - b) <= 24;
    };
    const seedFill = intact(startK) ? fillMap[startK] : 0;
    const prev = fills[seedFill];
    if (prev && prev.how === how && prev.hex === hex && how === 'solid') return false; // already this color
    const [sr, sg, sb, sa] = [d[start], d[start + 1], d[start + 2], d[start + 3]];
    if (!seedFill && how === 'solid' && sa === 255) {
      const [fr, fg, fb] = hexRGB(hex);
      if (sr === fr && sg === fg && sb === fb) return false;
    }

    if (fills.length >= 65535) resetFills();
    const id = fills.length;
    const f = makeFill(hex, how);
    fills.push(f);

    // Decide every pixel's membership before painting, so painting can't change the answer.
    const seen = new Uint8Array(w * h);
    const ok = (k) => {
      if (seen[k]) return false;
      const i = k * 4;
      if (wall[i + 3] >= 128) return false;
      if (seedFill && fillMap[k] === seedFill && intact(k)) return true;
      return (
        Math.abs(d[i] - sr) <= T &&
        Math.abs(d[i + 1] - sg) <= T &&
        Math.abs(d[i + 2] - sb) <= T &&
        Math.abs(d[i + 3] - sa) <= T
      );
    };
    const region = [];
    const stack = [sx, sy];
    while (stack.length) {
      const y = stack.pop();
      let x = stack.pop();
      let k = y * w + x;
      if (!ok(k)) continue;
      while (x > 0 && ok(k - 1)) {
        x--;
        k--;
      }
      let up = false;
      let down = false;
      for (; x < w && ok(k); x++, k++) {
        seen[k] = 1;
        region.push(k);
        if (y > 0) {
          const v = ok(k - w);
          if (v && !up) stack.push(x, y - 1);
          up = v;
        }
        if (y < h - 1) {
          const v = ok(k + w);
          if (v && !down) stack.push(x, y + 1);
          down = v;
        }
      }
    }
    for (const k of region) {
      const [r, g, b] = patternColor(f, k % w, (k / w) | 0, u);
      const i = k * 4;
      d[i] = r;
      d[i + 1] = g;
      d[i + 2] = b;
      d[i + 3] = 255;
      fillMap[k] = id;
    }
    pctx.putImageData(img, 0, 0);
    return true;
  }

  // ---------- Save ----------
  function flatten(maxWidth) {
    const s = Math.min(1, maxWidth / paint.width);
    const c = document.createElement('canvas');
    c.width = Math.round(paint.width * s);
    c.height = Math.round(paint.height * s);
    const x = c.getContext('2d');
    x.fillStyle = '#fff';
    x.fillRect(0, 0, c.width, c.height);
    x.drawImage(paint, 0, 0, c.width, c.height);
    x.drawImage(lines, 0, 0, c.width, c.height);
    return c;
  }

  async function savePic() {
    if (!dirty && !pictureId && !pageId) {
      say('Draw something first!');
      return;
    }
    try {
      const wasNew = !pictureId;
      pictureId = await savePicture({
        id: pictureId,
        pageId,
        width: cssW,
        height: cssH,
        image: flatten(2048).toDataURL('image/png'),
        thumb: flatten(360).toDataURL('image/jpeg', 0.85),
        paint: paint.toDataURL('image/png'),
      });
      confetti(20);
      sfx('win');
      // A star for each new picture (not for re-saving the same one).
      if (wasNew && dirty) addStar(1);
      dirty = false;
      say('Saved to your pictures!');
    } catch {
      say("Oops, I couldn't save that one.");
    }
  }

  // ---------- Start ----------
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(wrap);

  if (resume?.paint) {
    const img = new Image();
    img.onload = () => {
      // It may have been drawn with the iPad turned the other way.
      drawRefit(img, resume.width || cssW, resume.height || cssH);
    };
    img.src = resume.paint;
    if (pageId) setTool('fill');
    say("Let's keep drawing!");
  } else {
    say('Draw anything you like! Tap the page button for pictures to color.');
  }

  return () => {
    ro.disconnect();
    main.classList.remove('drawing');
    document.querySelectorAll('.overlay').forEach((o) => o.remove());
  };
}
