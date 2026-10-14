// Drawing pad: brushes, rainbow & sparkle, paint bucket, stamps, coloring pages, undo, and saving.
import { say, sfx, el, askYesNo, confetti, addStar } from '../common.js';
import { PAGES, findPage, pageImage } from '../coloring-pages.js';
import { savePicture } from '../gallery-store.js';

const PAINT = ['#ef4444', '#f97316', '#facc15', '#22c55e', '#3b82f6', '#a855f7', '#f472b6', '#8b5a2b', '#2b2d42'];
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

  let color = PAINT[4];
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

  // Row 1: colors
  const colorBtns = PAINT.map((c, i) =>
    button(colorRow, '', `color ${i + 1}`, (b) => {
      color = c;
      mark(colorBtns, b);
      // Picking a color means "paint with it": leave tools that ignore color.
      if (['stamp', 'eraser', 'rainbow'].includes(tool)) setTool('brush');
    }),
  );
  colorBtns.forEach((b, i) => (b.style.background = PAINT[i]));
  mark(colorBtns, colorBtns[4]);

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
  function tray(title, items, onPick) {
    const overlay = el('div', 'overlay');
    const box = el('div', 'overlay-box');
    box.appendChild(el('p', 'prompt-text', title));
    const grid = el('div', 'tray-grid');
    for (const item of items) {
      const b = el('button', 'tool-btn big');
      b.innerHTML = item.html;
      b.setAttribute('aria-label', item.label);
      b.addEventListener('click', () => {
        sfx('tap');
        overlay.remove();
        onPick(item);
      });
      grid.appendChild(b);
    }
    const close = el('button', 'round-btn', '✖️');
    close.setAttribute('aria-label', 'Close');
    close.addEventListener('click', () => overlay.remove());
    box.append(grid, close);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
  }

  function openStampTray() {
    tray('Pick a stamp', STAMPS.map((s) => ({ html: s, label: `stamp ${s}`, value: s })), (item) => {
      stamp = item.value;
      toolBtns.stamp.textContent = stamp;
      setTool('stamp');
    });
  }

  function openPagePicker() {
    say('Pick a picture to color!');
    const items = [{ html: '⬜', label: 'blank page', value: null }].concat(
      PAGES.map((p) => ({ html: p.emoji, label: p.name.replace('the ', ''), value: p.id })),
    );
    tray('Pick a picture to color', items, async (item) => {
      // Only ask when there's unsaved drawing; a saved picture is safe in My Pictures.
      if (dirty && !(await askYesNo('Start a new picture?'))) return;
      wipePaint();
      undo = []; // undoing onto a different page would be confusing
      pageId = item.value;
      pictureId = null;
      dirty = false;
      await drawPage();
      const page = findPage(pageId);
      say(page ? `Let's color ${page.name}! Try the paint bucket.` : 'A blank page. Draw anything you like!');
      if (page) setTool('fill');
    });
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
    if (tool === 'fill') {
      if (!floodFill(Math.floor(x * dpr()), Math.floor(y * dpr()), color)) undo.pop();
      else sfx('pop');
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

  // Paint-bucket fill in device pixels. Lines on the coloring-page layer are walls;
  // the fill spreads over paint that matches the tapped color.
  function floodFill(sx, sy, hex) {
    const w = paint.width;
    const h = paint.height;
    if (sx < 0 || sy < 0 || sx >= w || sy >= h) return false;
    const img = pctx.getImageData(0, 0, w, h);
    const d = img.data;
    const wall = lctx.getImageData(0, 0, w, h).data;
    const start = (sy * w + sx) * 4;
    if (wall[start + 3] >= 128) return false; // tapped right on a line
    const [sr, sg, sb, sa] = [d[start], d[start + 1], d[start + 2], d[start + 3]];
    const n = parseInt(hex.slice(1), 16);
    const [fr, fg, fb] = [n >> 16, (n >> 8) & 255, n & 255];
    if (sa === 255 && sr === fr && sg === fg && sb === fb) return false; // already this color

    const T = FILL_TOLERANCE;
    const seen = new Uint8Array(w * h);
    const ok = (k) => {
      if (seen[k]) return false;
      const i = k * 4;
      return (
        wall[i + 3] < 128 &&
        Math.abs(d[i] - sr) <= T &&
        Math.abs(d[i + 1] - sg) <= T &&
        Math.abs(d[i + 2] - sb) <= T &&
        Math.abs(d[i + 3] - sa) <= T
      );
    };
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
        const i = k * 4;
        d[i] = fr;
        d[i + 1] = fg;
        d[i + 2] = fb;
        d[i + 3] = 255;
        if (y > 0) {
          const u = ok(k - w);
          if (u && !up) stack.push(x, y - 1);
          up = u;
        }
        if (y < h - 1) {
          const v = ok(k + w);
          if (v && !down) stack.push(x, y + 1);
          down = v;
        }
      }
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
