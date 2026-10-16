// The tracing board used by Tracing and the Daily Adventure: one letter or number, traced stroke by
// stroke in the right order. A green dot shows where to start, an arrow which way to go, and a star
// runs along the stroke to show how.
import { say, sfx, cheer, el, burstAt, KID } from './common.js';
import { GLYPHS, strokePoints } from './trace-paths.js';

const TOL = 14; // how far (in letter units, 100 = letter width) her finger can wander and still count

// TTS reads a lone "A" as the word "a", so spell out letter names.
const LETTER_NAME = { A: 'ay', I: 'eye', O: 'oh', U: 'you' };
export const letterName = (g) => LETTER_NAME[g.toUpperCase()] || g.toUpperCase();
export function spoken(g, kind) {
  if (/\d/.test(g)) return `the number ${g}`;
  if (kind === 'name') return letterName(g);
  return g === g.toUpperCase() ? `big ${letterName(g)}` : `little ${letterName(g)}`;
}

export function traceOne({ main, bar, list, n, kind, onDone }) {
  const g = list[n];
  const strokes = GLYPHS[g].map((d) => strokePoints(d));
  main.innerHTML = '';

  // Chips across the top: the letters in this round, colored in as she finishes them.
  const chips = el('div', 'trace-chips');
  list.forEach((c, i) => chips.appendChild(el('span', i < n ? 'done' : i === n ? 'now' : '', kind === 'name' || i <= n ? c : '?')));
  const pad = el('div', 'trace-pad');
  const canvas = el('canvas');
  pad.appendChild(canvas);
  main.append(chips, pad);

  // Size the pad to fit the screen, keeping the letter's 100 × 140 shape.
  // (Room left after the top bar and the letter chips.)
  const H = Math.max(260, Math.min(innerHeight - 250, (Math.min(main.clientWidth, 640) - 8) * 1.4));
  const W = H / 1.4;
  const k = W / 100;
  const dpr = window.devicePixelRatio || 1;
  canvas.style.width = `${W}px`;
  canvas.style.height = `${H}px`;
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  const g2 = canvas.getContext('2d');

  let s = 0; // current stroke
  let i = 0; // how far along it she has traced
  let finger = null;
  let lastProgress = performance.now();
  let demo = null; // { start } while the guide star runs along the stroke
  let finished = false;
  const hues = [330, 200, 45, 140, 270];

  const prompt =
    kind === 'name' && n === 0
      ? `Let's write your name, ${KID}! Trace ${spoken(g, kind)}. Start at the green dot.`
      : `Trace ${spoken(g, kind)}. Start at the green dot.`;
  const showMe = () => {
    say(prompt);
    demo = { start: performance.now() + 300 };
  };
  bar.onRepeat(showMe);
  showMe();

  // For tests: where each point of the letter is on screen.
  window.__trace = {
    glyph: g,
    strokes,
    toClient: (x, y) => {
      const r = canvas.getBoundingClientRect();
      return [r.left + x * k, r.top + y * k];
    },
  };

  function line(pts, from = 0, to = pts.length - 1) {
    g2.beginPath();
    g2.moveTo(pts[from][0] * k, pts[from][1] * k);
    for (let j = from + 1; j <= to; j++) g2.lineTo(pts[j][0] * k, pts[j][1] * k);
    if (from === to) g2.lineTo(pts[from][0] * k + 0.1, pts[from][1] * k);
    g2.stroke();
  }

  function starShape(x, y, r, color) {
    g2.fillStyle = color;
    g2.beginPath();
    for (let j = 0; j < 10; j++) {
      const a = (j / 10) * Math.PI * 2 - Math.PI / 2;
      const rr = j % 2 ? r * 0.45 : r;
      g2.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    g2.fill();
  }

  function draw(now) {
    if (!canvas.isConnected) return;
    g2.setTransform(dpr, 0, 0, dpr, 0, 0);
    g2.clearRect(0, 0, W, H);
    g2.lineCap = g2.lineJoin = 'round';

    // Handwriting-paper lines.
    g2.lineWidth = 2;
    g2.setLineDash([]);
    g2.strokeStyle = '#c7d7fe';
    for (const y of [10, 110]) {
      g2.beginPath();
      g2.moveTo(0, y * k);
      g2.lineTo(W, y * k);
      g2.stroke();
    }
    g2.strokeStyle = '#fecaca';
    g2.setLineDash([10, 10]);
    g2.beginPath();
    g2.moveTo(0, 50 * k);
    g2.lineTo(W, 50 * k);
    g2.stroke();
    g2.setLineDash([]);

    // The wide track for every stroke.
    g2.strokeStyle = '#efe7ff';
    g2.lineWidth = 18 * k;
    strokes.forEach((pts) => line(pts));

    // Dotted middle line for strokes still to do.
    g2.strokeStyle = '#b9a7e6';
    g2.lineWidth = 2.2 * k;
    g2.setLineDash([2.5 * k, 5 * k]);
    strokes.forEach((pts, j) => j >= s && line(pts, j === s ? i : 0));
    g2.setLineDash([]);

    // What she has traced so far, in bright colors.
    g2.lineWidth = 13 * k;
    strokes.forEach((pts, j) => {
      g2.strokeStyle = `hsl(${hues[j % hues.length]} 85% 60%)`;
      if (j < s) line(pts);
      else if (j === s && i > 0) line(pts, 0, i);
    });

    if (!finished) {
      const pts = strokes[s];
      // Green "start here" dot with the stroke number, and an arrow showing which way to go.
      const [x, y] = pts[i];
      const pulse = 1 + Math.sin(now / 250) * 0.08;
      g2.fillStyle = '#22c55e';
      g2.beginPath();
      g2.arc(x * k, y * k, 8.5 * k * pulse, 0, Math.PI * 2);
      g2.fill();
      if (i === 0) {
        g2.fillStyle = '#fff';
        g2.font = `700 ${11 * k}px Fredoka, sans-serif`;
        g2.textAlign = 'center';
        g2.textBaseline = 'middle';
        g2.fillText(String(s + 1), x * k, y * k + 0.5);
      }
      const ahead = pts[Math.min(pts.length - 1, i + 6)];
      if (ahead !== pts[i]) {
        const a = Math.atan2(ahead[1] - y, ahead[0] - x);
        const ax = (x + Math.cos(a) * 15) * k, ay = (y + Math.sin(a) * 15) * k;
        g2.fillStyle = '#16a34a';
        g2.beginPath();
        g2.moveTo(ax + Math.cos(a) * 5 * k, ay + Math.sin(a) * 5 * k);
        g2.lineTo(ax + Math.cos(a + 2.4) * 4.5 * k, ay + Math.sin(a + 2.4) * 4.5 * k);
        g2.lineTo(ax + Math.cos(a - 2.4) * 4.5 * k, ay + Math.sin(a - 2.4) * 4.5 * k);
        g2.fill();
      }

      // If she hasn't moved for a while, the star shows the way again.
      if (!demo && !finger && now - lastProgress > 6000) demo = { start: now };
      if (demo) {
        const t = (now - demo.start) / 1600;
        if (t > 1.25) demo = null;
        else if (t >= 0) {
          const p = pts[Math.min(pts.length - 1, Math.floor(Math.min(1, t) * (pts.length - 1)))];
          starShape(p[0] * k, p[1] * k, 9 * k, '#facc15');
        }
      }
    }
    if (finger) starShape(finger[0] * k, finger[1] * k, 5 * k, 'rgba(250,204,21,.9)');
    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);

  function toGlyph(e) {
    const r = canvas.getBoundingClientRect();
    return [(e.clientX - r.left) / k, (e.clientY - r.top) / k];
  }

  function step(px, py) {
    if (finished) return;
    const pts = strokes[s];
    const near = (p) => Math.hypot(p[0] - px, p[1] - py) < TOL;
    if (pts.length <= 3) {
      // A dot (on i or j): just tap it.
      if (near(pts[0])) strokeDone();
      return;
    }
    let best = i;
    for (let j = i + 1; j < Math.min(pts.length, i + 10); j++) if (near(pts[j])) best = j;
    if (i === 0 && !near(pts[0]) && best === 0) return;
    if (best > i) {
      if (Math.floor(best / 8) > Math.floor(i / 8)) sfx('bubble');
      i = best;
      lastProgress = performance.now();
      demo = null;
    }
    if (i >= pts.length - 3) strokeDone();
  }

  function strokeDone() {
    const end = strokes[s][strokes[s].length - 1];
    const [cx, cy] = window.__trace.toClient(end[0], end[1]);
    burstAt(cx, cy);
    s++;
    i = 0;
    lastProgress = performance.now();
    if (s < strokes.length) {
      sfx('pop');
      return;
    }
    finished = true;
    finger = null;
    chips.children[n].className = 'done';
    chips.children[n].textContent = g;
    const praise = kind === 'name' ? `${letterName(g)}!` : `${spoken(g, kind).replace('the number ', '')}! Beautiful!`;
    cheer(praise).then(onDone);
  }

  let last = null;
  canvas.addEventListener('pointerdown', (e) => {
    canvas.setPointerCapture?.(e.pointerId);
    last = toGlyph(e);
    finger = last;
    step(...last);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!last) return;
    const p = toGlyph(e);
    // Fill in fast swipes so quick fingers still count.
    const d = Math.hypot(p[0] - last[0], p[1] - last[1]);
    const n2 = Math.max(1, Math.ceil(d / 2));
    for (let j = 1; j <= n2; j++) step(last[0] + ((p[0] - last[0]) * j) / n2, last[1] + ((p[1] - last[1]) * j) / n2);
    last = p;
    if (!finished) finger = p;
  });
  const up = () => {
    last = null;
    finger = null;
  };
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', up);
}
