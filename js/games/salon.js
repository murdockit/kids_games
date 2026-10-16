// Hair Salon: pick a friend, then cut, comb, grow, color, curl, wash and dry their hair.
// Every hair is a bendy strand (a chain of points with simple physics), so it swings, droops and
// drapes around the head. Scissors really cut strands, and the cut piece falls away.
import { topBar, say, sfx, el, pick, randInt, askYesNo, confetti, addStar, stopSpeech, KID } from '../common.js';
import { savePicture } from '../gallery-store.js';

const main = document.getElementById('app');
const bar = topBar({ title: 'Hair Salon' });

// The scene is drawn in a 600×700 box, scaled to fit the screen.
const W = 600;
const H = 700;
const HEAD = { x: 300, y: 330, rx: 130, ry: 150 };
const SEG = 9; // length of one hair segment
const MAX_SEGS = 60;

// ---------- Friends ----------
const FRIENDS = [
  { id: 'mia', name: 'Mia', kind: 'girl', skin: '#f6d0b1', hair: '#7a4a2a', eyes: '#3b2a1a', cape: '#f472b6', style: 'long' },
  { id: 'leo', name: 'Leo', kind: 'boy', skin: '#b07650', hair: '#2a211c', eyes: '#2a1a10', cape: '#3b82f6', style: 'curls' },
  { id: 'zuzu', name: 'Zuzu', kind: 'monster', skin: '#7bd389', hair: '#a855f7', eyes: '#1e3a8a', cape: '#facc15', style: 'spiky' },
  { id: 'kiki', name: 'Kiki', kind: 'cat', skin: '#f59e5b', hair: '#fff3e0', eyes: '#166534', cape: '#22c55e', style: 'tuft' },
  { id: 'bob', name: 'Grandpa Bob', kind: 'grandpa', skin: '#eab48f', hair: '#d1d5db', eyes: '#1f2937', cape: '#a855f7', style: 'grandpa' },
  { id: 'bella', name: 'Bella', kind: 'girl', skin: '#6b4226', hair: '#24170f', eyes: '#1a0f08', cape: '#14b8a6', style: 'afro' },
];

const HAIR_COLORS = [
  ['black', '#24170f'], ['brown', '#7a4a2a'], ['blonde', '#f2d16b'], ['red', '#c2410c'], ['white', '#f8fafc'],
  ['gray', '#9ca3af'], ['pink', '#f472b6'], ['hot pink', '#ec4899'], ['purple', '#a855f7'], ['blue', '#3b82f6'],
  ['teal', '#14b8a6'], ['green', '#22c55e'], ['orange', '#f97316'], ['yellow', '#facc15'], ['rainbow', 'rainbow'],
].map(([name, hex]) => ({ name, hex }));

const STICKERS = ['🎀', '👑', '🕶️', '🌸', '🎩', '⭐', '🦋', '🧢', '💎', '🌈', '🍓', '❤️'];

const LINES = {
  hello: (f) => [`Hi! I'm ${f.name}. Can you do my hair?`, `Hello ${KID}! I'm ${f.name}. Let's make my hair fancy!`],
  scissors: ['Snip snip!', 'Ooh, a haircut!', 'Not too short!'],
  comb: ['That tickles!', 'Ahh, nice and neat.', 'Hee hee!'],
  grow: ['Wow, it is growing!', 'So long!', 'Whoa!'],
  color: ['Ooh, pretty color!', 'I love it!', 'So colorful!'],
  dryer: ['Whoosh!', 'So windy!', 'Warm and toasty!'],
  curl: ['Curly curly!', 'Boing boing!'],
  straight: ['Nice and smooth!', 'So straight!'],
  shampoo: ['Bubbles!', 'Bubble bubble!', 'It smells so good!'],
  water: ['Splash!', 'That is wet!', 'Brrr, cold!'],
  sticker: ['So fancy!', 'I look great!'],
};

// ---------- Hair ----------
// Point on the head outline at angle a (radians; -π/2 is the top), pushed in a little.
const onHead = (a, inset = 0.93) => ({ x: HEAD.x + Math.cos(a) * HEAD.rx * inset, y: HEAD.y + Math.sin(a) * HEAD.ry * inset });
const deg = (d) => (d * Math.PI) / 180;

function makeStrand(root, angle, segs, color, o = {}) {
  const pts = [];
  for (let i = 0; i < segs + 1; i++) {
    const x = root.x + Math.cos(angle) * SEG * i;
    const y = root.y + Math.sin(angle) * SEG * i;
    pts.push({ x, y, px: x, py: y, c: color });
  }
  return {
    pts,
    angle, // direction the hair grows out of the head
    bends: new Array(MAX_SEGS + 1).fill(0), // extra bend at each joint (combing reshapes these)
    stiff: o.stiff ?? 0.1,
    curl: o.curl ?? 0,
    phase: Math.random() * Math.PI * 2,
    width: o.width ?? 12,
    noCollide: !!o.noCollide,
    hang: !!o.hang, // long hair: wraps around the head, then hangs down
    bang: !!o.bang, // bangs: lie down over the forehead
    side: Math.cos(angle) < -0.05 ? -1 : Math.cos(angle) > 0.05 ? 1 : pick([-1, 1]),
    wet: 0,
  };
}

function arc(list, from, to, n, color, len, o = {}) {
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0.5 : i / (n - 1);
    const a = deg(from + (to - from) * t) + (Math.random() - 0.5) * 0.02;
    const root = onHead(a, o.inset ?? 0.93);
    const outward = Math.atan2(Math.sin(a) / HEAD.ry, Math.cos(a) / HEAD.rx) + (o.tilt ?? 0);
    const segs = typeof len === 'function' ? len(a) : randInt(len[0], len[1]);
    list.push(makeStrand(root, outward, segs, color, o));
  }
}

function buildHair(f) {
  const s = [];
  const c = f.hair;
  switch (f.style) {
    case 'long':
      // Bangs in front, long hair everywhere else.
      arc(s, -112, -68, 16, c, [7, 9], { stiff: 0.3, curl: 0.05, bang: true, noCollide: true });
      arc(s, -174, -102, 30, c, [44, 52], { stiff: 0.16, curl: 0.04, hang: true });
      arc(s, -78, -6, 30, c, [44, 52], { stiff: 0.16, curl: 0.04, hang: true });
      break;
    case 'curls':
      arc(s, -168, -12, 70, c, [6, 8], { stiff: 0.35, curl: 0.9, width: 13 });
      break;
    case 'spiky':
      arc(s, -150, -30, 26, c, [9, 13], { stiff: 0.6, width: 18 });
      break;
    case 'tuft':
      arc(s, -125, -55, 26, c, [6, 9], { stiff: 0.35, curl: 0.6, width: 13 });
      break;
    case 'grandpa': {
      arc(s, -178, -138, 12, c, [5, 7], { stiff: 0.25, curl: 0.3, width: 12 });
      arc(s, -42, -2, 12, c, [5, 7], { stiff: 0.25, curl: 0.3, width: 12 });
      // A mustache you can trim and color, too.
      for (let i = 0; i < 14; i++) {
        const t = i / 13;
        const root = { x: 262 + t * 76, y: 392 - Math.sin(t * Math.PI) * 6 };
        const angle = deg(90 + (t - 0.5) * -110);
        s.push(makeStrand(root, angle, randInt(4, 5), c, { stiff: 0.45, width: 10, noCollide: true }));
      }
      break;
    }
    case 'afro':
      arc(s, -176, -4, 92, c, [12, 16], { stiff: 0.5, curl: 1, width: 14 });
      break;
  }
  return s;
}

function newState(f) {
  const strands = buildHair(f);
  // Let the hair settle into place before anyone sees it.
  for (let i = 0; i < 200; i++) strands.forEach((s) => stepStrand(s, 0.35));
  return { friend: f, strands, falling: [], stickers: [], bubbles: [], drops: [] };
}

// ---------- Physics ----------
// Where long hair wants to go from point a: around the side of the head, then straight down.
function hangDir(s, a) {
  if (a.y > HEAD.y + HEAD.ry * 0.25) return Math.PI / 2 - s.side * 0.08;
  const n = Math.atan2((a.y - HEAD.y) / (HEAD.ry * HEAD.ry), (a.x - HEAD.x) / (HEAD.rx * HEAD.rx));
  return n + s.side * (Math.PI / 2 - 0.3);
}

function stepStrand(s, gravity) {
  const p = s.pts;
  const g = gravity * (1 + s.wet * 1.5);
  for (let i = 1; i < p.length; i++) {
    const q = p[i];
    const vx = (q.x - q.px) * 0.94;
    const vy = (q.y - q.py) * 0.94;
    q.px = q.x;
    q.py = q.y;
    q.x += vx;
    q.y += vy + g;
  }
  const stiff = s.stiff * (1 - s.wet * 0.6);
  for (let iter = 0; iter < 3; iter++) {
    let dir = s.angle;
    for (let i = 1; i < p.length; i++) {
      const a = p[i - 1];
      const b = p[i];
      // Bend toward the hair's shape (its direction plus curl and any combed-in bend)…
      const curl = s.curl * (1 - s.wet * 0.5) * Math.sin(i * 0.95 + s.phase) * 0.95;
      const base = s.hang && i > 2 ? hangDir(s, a) : s.bang && i > 1 ? Math.PI / 2 + s.side * 0.15 : dir;
      const want = base + s.bends[i] + curl;
      const k = stiff * (1 - (i / p.length) * 0.6);
      b.x += (a.x + Math.cos(want) * SEG - b.x) * k;
      b.y += (a.y + Math.sin(want) * SEG - b.y) * k;
      // …then keep each segment the same length.
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d = Math.hypot(dx, dy) || 1;
      b.x = a.x + (dx / d) * SEG;
      b.y = a.y + (dy / d) * SEG;
      dir = Math.atan2(dy, dx);
      // Hair drapes around the head instead of going through the face.
      if (!s.noCollide && i >= 2) {
        const nx = (b.x - HEAD.x) / (HEAD.rx * 1.02);
        const ny = (b.y - HEAD.y) / (HEAD.ry * 1.02);
        const r = nx * nx + ny * ny;
        if (r < 1) {
          const f = 1 / Math.sqrt(r);
          b.x = HEAD.x + (b.x - HEAD.x) * f;
          b.y = HEAD.y + (b.y - HEAD.y) * f;
        }
      }
    }
  }
}

function stepFalling(st) {
  for (const piece of st.falling) {
    piece.life -= 1;
    for (const q of piece.pts) {
      const vx = (q.x - q.px) * 0.98;
      const vy = (q.y - q.py) * 0.98;
      q.px = q.x;
      q.py = q.y;
      q.x += vx;
      q.y += vy + 0.5;
    }
    for (let i = 1; i < piece.pts.length; i++) {
      const a = piece.pts[i - 1];
      const b = piece.pts[i];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d = Math.hypot(dx, dy) || 1;
      const fix = (d - SEG) / d / 2;
      a.x += dx * fix;
      a.y += dy * fix;
      b.x -= dx * fix;
      b.y -= dy * fix;
    }
  }
  st.falling = st.falling.filter((p) => p.life > 0);
}

// ---------- Drawing ----------
function shade(hex, t) {
  if (!hex.startsWith('#')) return hex;
  const n = parseInt(hex.slice(1), 16);
  const f = (v) => Math.max(0, Math.min(255, Math.round(v * (1 - t))));
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
}

function drawStrands(g, list, alpha = 1) {
  g.lineCap = 'round';
  g.lineJoin = 'round';
  g.globalAlpha = alpha;
  // Dark outline first, then the colors on top, for a cartoon look.
  for (const s of list) {
    const p = s.pts;
    if (p.length < 2) continue;
    g.strokeStyle = 'rgba(43,45,66,0.55)';
    g.lineWidth = s.width + 4;
    g.beginPath();
    g.moveTo(p[0].x, p[0].y);
    for (let i = 1; i < p.length; i++) g.lineTo(p[i].x, p[i].y);
    g.stroke();
  }
  for (const s of list) {
    const p = s.pts;
    g.lineWidth = s.width;
    for (let i = 1; i < p.length; i++) {
      g.strokeStyle = s.wet > 0.05 ? shade(p[i].c, s.wet * 0.35) : p[i].c;
      g.beginPath();
      g.moveTo(p[i - 1].x, p[i - 1].y);
      g.lineTo(p[i].x, p[i].y);
      g.stroke();
    }
  }
  g.globalAlpha = 1;
}

function ellipse(g, x, y, rx, ry, fill, stroke = '#2b2d42', lw = 5) {
  g.beginPath();
  g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  if (fill) {
    g.fillStyle = fill;
    g.fill();
  }
  if (stroke) {
    g.lineWidth = lw;
    g.strokeStyle = stroke;
    g.stroke();
  }
}

// face: { look: {x,y} where the eyes point, blink: bool, mood: 'happy'|'wow'|'squint'|'giggle' }
function drawFriend(g, st, face) {
  const f = st.friend;
  // Mirror background
  g.fillStyle = '#e0f2fe';
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#fff';
  g.globalAlpha = 0.5;
  g.beginPath();
  g.moveTo(60, 0);
  g.lineTo(140, 0);
  g.lineTo(20, 200);
  g.lineTo(20, 70);
  g.fill();
  g.globalAlpha = 1;

  // Cape and neck
  g.fillStyle = f.cape;
  g.strokeStyle = '#2b2d42';
  g.lineWidth = 5;
  g.beginPath();
  g.moveTo(90, H + 10);
  g.quadraticCurveTo(110, 520, 300, 505);
  g.quadraticCurveTo(490, 520, 510, H + 10);
  g.closePath();
  g.fill();
  g.stroke();
  g.fillStyle = 'rgba(255,255,255,0.35)';
  for (let x = 130; x < 480; x += 60) {
    g.beginPath();
    g.arc(x, 600, 10, 0, Math.PI * 2);
    g.fill();
  }
  g.fillStyle = f.skin;
  g.fillRect(262, 440, 76, 75);
  g.strokeRect(262, 440, 76, 75);
  ellipse(g, 300, 512, 52, 14, '#fff');

  // Ears (behind the head) and monster horns
  if (f.kind === 'cat') {
    for (const sgn of [-1, 1]) {
      g.fillStyle = f.skin;
      g.beginPath();
      g.moveTo(300 + sgn * 120, 255);
      g.lineTo(300 + sgn * 128, 150);
      g.lineTo(300 + sgn * 55, 200);
      g.closePath();
      g.fill();
      g.stroke();
      g.fillStyle = '#fbcfe8';
      g.beginPath();
      g.moveTo(300 + sgn * 108, 235);
      g.lineTo(300 + sgn * 114, 175);
      g.lineTo(300 + sgn * 72, 205);
      g.closePath();
      g.fill();
    }
  } else if (f.kind === 'monster') {
    for (const sgn of [-1, 1]) {
      g.fillStyle = '#fef3c7';
      g.beginPath();
      g.moveTo(300 + sgn * 60, 205);
      g.quadraticCurveTo(300 + sgn * 110, 160, 300 + sgn * 120, 110);
      g.quadraticCurveTo(300 + sgn * 70, 150, 300 + sgn * 30, 190);
      g.closePath();
      g.fill();
      g.stroke();
    }
  } else {
    ellipse(g, HEAD.x - HEAD.rx + 2, 345, 22, 30, f.skin);
    ellipse(g, HEAD.x + HEAD.rx - 2, 345, 22, 30, f.skin);
  }

  // Head
  ellipse(g, HEAD.x, HEAD.y, HEAD.rx, HEAD.ry, f.skin);

  // Eyes follow her finger
  const look = face.look || { x: 300, y: 420 };
  for (const ex of [248, 352]) {
    const ey = 320;
    if (face.blink || face.mood === 'giggle' || face.mood === 'squint') {
      g.lineWidth = 6;
      g.beginPath();
      if (face.mood === 'squint') {
        g.moveTo(ex - 20, ey);
        g.lineTo(ex + 20, ey);
      } else {
        g.arc(ex, ey + 8, 18, Math.PI * 1.15, Math.PI * 1.85);
      }
      g.stroke();
      continue;
    }
    const big = f.kind === 'monster' ? 30 : 24;
    ellipse(g, ex, ey, big, big + 4, '#fff', '#2b2d42', 4);
    const dx = look.x - ex;
    const dy = look.y - ey;
    const d = Math.hypot(dx, dy) || 1;
    const m = Math.min(big - 13, d / 10);
    ellipse(g, ex + (dx / d) * m, ey + (dy / d) * m, 12, 13, f.eyes, null);
    ellipse(g, ex + (dx / d) * m - 4, ey + (dy / d) * m - 5, 4, 4, '#fff', null);
  }
  // Brows
  g.lineWidth = 6;
  g.strokeStyle = shade(f.hair, 0.3);
  for (const ex of [248, 352]) {
    g.beginPath();
    const lift = face.mood === 'wow' ? -14 : 0;
    g.moveTo(ex - 20, 282 + lift);
    g.quadraticCurveTo(ex, 272 + lift, ex + 20, 282 + lift);
    g.stroke();
  }
  g.strokeStyle = '#2b2d42';

  // Cheeks, nose, mouth
  g.globalAlpha = 0.35;
  ellipse(g, 220, 375, 22, 13, '#f43f5e', null);
  ellipse(g, 380, 375, 22, 13, '#f43f5e', null);
  g.globalAlpha = 1;
  if (f.kind === 'cat') {
    g.fillStyle = '#f472b6';
    g.beginPath();
    g.moveTo(288, 362);
    g.lineTo(312, 362);
    g.lineTo(300, 376);
    g.closePath();
    g.fill();
    g.lineWidth = 3;
    for (const sgn of [-1, 1]) {
      for (const dy of [-6, 6]) {
        g.beginPath();
        g.moveTo(300 + sgn * 40, 380 + dy);
        g.lineTo(300 + sgn * 110, 372 + dy * 2.5);
        g.stroke();
      }
    }
  } else {
    g.lineWidth = 5;
    g.beginPath();
    g.moveTo(300, 345);
    g.quadraticCurveTo(312, 368, 296, 372);
    g.stroke();
  }
  g.lineWidth = 6;
  g.beginPath();
  if (face.mood === 'wow') {
    ellipse(g, 300, 418, 16, 20, '#7f1d1d');
  } else {
    g.fillStyle = '#7f1d1d';
    g.moveTo(262, 405);
    g.quadraticCurveTo(300, face.mood === 'giggle' ? 460 : 445, 338, 405);
    g.closePath();
    g.fill();
    g.stroke();
  }

  // Hair, falling cut pieces, bubbles, stickers
  drawStrands(g, st.strands);
  for (const piece of st.falling) drawStrands(g, [piece], Math.max(0, piece.life / 60));
  for (const b of st.bubbles) {
    ellipse(g, b.x, b.y, b.r, b.r, 'rgba(255,255,255,0.85)', '#93c5fd', 3);
    ellipse(g, b.x - b.r / 3, b.y - b.r / 3, b.r / 4, b.r / 4, '#fff', null);
  }
  g.fillStyle = '#60a5fa';
  for (const d of st.drops) {
    g.beginPath();
    g.ellipse(d.x, d.y, 3, 7, 0, 0, Math.PI * 2);
    g.fill();
  }
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  for (const s of st.stickers) {
    g.font = `${s.size}px serif`;
    g.fillText(s.e, s.x, s.y);
  }
}

// ---------- Screens ----------
const saved = new Map(); // each friend keeps their hairdo while the page is open
let stopLoop = null;

function chooseFriend() {
  stopLoop?.();
  stopLoop = null;
  bar.setTitle('Hair Salon');
  bar.onBack(null);
  bar.onRepeat(() => say('Who wants a new hairdo? Pick a friend!'));
  main.className = '';
  main.innerHTML = '<div class="tiles"></div>';
  const tiles = main.querySelector('.tiles');
  for (const f of FRIENDS) {
    const btn = el('button', 'tile friend-tile');
    btn.setAttribute('aria-label', f.name);
    const c = document.createElement('canvas');
    c.width = 300;
    c.height = 300;
    const g = c.getContext('2d');
    g.scale(0.5, 0.5);
    g.translate(0, -60);
    const st = saved.get(f.id) || newState(f);
    saved.set(f.id, st);
    drawFriend(g, st, { mood: 'happy' });
    const img = el('img');
    img.src = c.toDataURL();
    img.alt = '';
    btn.append(img, el('span', '', f.name));
    btn.addEventListener('click', () => {
      sfx('tap');
      salon(f);
    });
    tiles.appendChild(btn);
  }
  say('Who wants a new hairdo? Pick a friend!');
}

function salon(friend) {
  const st = saved.get(friend.id) || newState(friend);
  saved.set(friend.id, st);
  window.__salon = st; // handy for tests
  bar.setTitle(friend.name);
  bar.onBack(chooseFriend);
  bar.onRepeat(() => say(pick(LINES.hello(friend))));
  main.className = 'salon';
  main.innerHTML = '';

  const stage = el('div', 'salon-stage');
  const canvas = el('canvas');
  stage.appendChild(canvas);
  const tools = el('div', 'salon-tools');
  main.append(stage, tools);
  const g = canvas.getContext('2d');

  let tool = 'scissors';
  let color = HAIR_COLORS[6];
  let sticker = STICKERS[0];
  let hue = 0;
  const face = { look: null, blink: false, mood: 'happy' };
  let moodUntil = 0;
  let lastTalk = 0;
  const setMood = (m, ms = 700) => {
    face.mood = m;
    moodUntil = performance.now() + ms;
  };
  const talk = (key) => {
    const now = performance.now();
    if (now - lastTalk < 6000 || Math.random() > 0.6) return;
    lastTalk = now;
    say(pick(LINES[key]));
  };

  // --- tool buttons ---
  const btns = {};
  function addTool(id, emoji, label, onPick) {
    const b = el('button', 'tool-btn salon-tool');
    b.innerHTML = emoji;
    b.setAttribute('aria-label', label);
    b.addEventListener('click', () => {
      sfx('tap');
      onPick ? onPick() : setTool(id, label);
    });
    tools.appendChild(b);
    btns[id] = b;
    return b;
  }
  function setTool(id, label) {
    tool = id;
    Object.entries(btns).forEach(([k, b]) => b.classList.toggle('on', k === id));
    if (label) say(label);
  }
  addTool('scissors', '✂️', 'Scissors');
  addTool('comb', '🪮', 'Comb');
  addTool('grow', '🧪', 'Hair grow potion');
  addTool('color', '🎨', 'Hair color', openColors);
  addTool('dryer', '💨', 'Hair dryer');
  addTool('curl', '🌀', 'Curler');
  addTool('straight', '〰️', 'Straightener');
  addTool('shampoo', '🫧', 'Shampoo');
  addTool('water', '🚿', 'Water');
  addTool('sticker', '🎀', 'Stickers', openStickers);
  const photoBtn = addTool('photo', '📸', 'Take a picture', takePhoto);
  addTool('reset', '🔄', 'New hair', resetHair);
  photoBtn.classList.add('action');
  btns.reset.classList.add('action');
  delete btns.photo;
  delete btns.reset;
  setTool('scissors');

  function trayOf(title, items, onPick) {
    const overlay = el('div', 'overlay');
    const box = el('div', 'overlay-box');
    box.appendChild(el('p', 'prompt-text', title));
    const grid = el('div', 'tray-grid');
    for (const it of items) {
      const b = el('button', 'tool-btn big swatch');
      b.innerHTML = it.html || '';
      if (it.style) b.style.cssText = it.style;
      b.setAttribute('aria-label', it.label);
      b.addEventListener('click', () => {
        sfx('tap');
        overlay.remove();
        onPick(it);
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

  function openColors() {
    say('Pick a hair color!');
    trayOf(
      'Hair color',
      HAIR_COLORS.map((c) => ({
        label: c.name,
        value: c,
        style:
          c.hex === 'rainbow'
            ? 'background:linear-gradient(135deg,#ef4444,#f97316,#facc15,#22c55e,#3b82f6,#a855f7)'
            : `background:${c.hex}`,
      })),
      (it) => {
        color = it.value;
        btns.color.innerHTML = '';
        btns.color.style.background = it.style.replace('background:', '');
        setTool('color');
        say(`${color.name}! Paint the hair.`);
      },
    );
  }

  function openStickers() {
    say('Pick something fancy!');
    trayOf('Stickers', STICKERS.map((s) => ({ html: s, label: `sticker ${s}`, value: s })), (it) => {
      sticker = it.value;
      btns.sticker.textContent = sticker;
      setTool('sticker');
      say('Tap to put it on. Drag it to move it.');
    });
  }

  async function resetHair() {
    if (!(await askYesNo('Start over with new hair?'))) return;
    const fresh = newState(friend);
    Object.assign(st, fresh);
    say(pick(LINES.hello(friend)));
  }

  async function takePhoto() {
    sfx('camera');
    const flash = el('div', 'flash');
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 450);
    const shot = document.createElement('canvas');
    shot.width = 900;
    shot.height = 1050;
    const sg = shot.getContext('2d');
    sg.scale(1.5, 1.5);
    drawFriend(sg, st, { ...face, mood: 'happy', blink: false, look: { x: 300, y: 400 } });
    const thumb = document.createElement('canvas');
    thumb.width = 300;
    thumb.height = 350;
    thumb.getContext('2d').drawImage(shot, 0, 0, 300, 350);
    try {
      await savePicture({
        image: shot.toDataURL('image/png'),
        thumb: thumb.toDataURL('image/jpeg', 0.85),
        paint: shot.toDataURL('image/png'),
        width: 600,
        height: 700,
        pageId: null,
      });
      addStar(1);
      confetti(24);
      say(`Cheese! I saved the picture of ${friend.name}.`);
    } catch {
      say("Oops, I couldn't save that one.");
    }
  }

  // --- canvas sizing ---
  let scale = 1;
  let ox = 0;
  let oy = 0;
  function resize() {
    const r = stage.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(r.width * dpr);
    canvas.height = Math.round(r.height * dpr);
    scale = Math.min(r.width / W, r.height / H);
    ox = (r.width - W * scale) / 2;
    oy = (r.height - H * scale) / 2;
  }
  const ro = new ResizeObserver(resize);
  ro.observe(stage);
  resize();

  // --- pointer ---
  let down = false;
  let last = null;
  let dragSticker = null;
  const toScene = (e) => {
    const r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left - ox) / scale, y: (e.clientY - r.top - oy) / scale };
  };

  canvas.addEventListener('pointerdown', (e) => {
    canvas.setPointerCapture(e.pointerId);
    down = true;
    const p = toScene(e);
    last = p;
    face.look = p;
    if (tool === 'sticker') {
      dragSticker = [...st.stickers].reverse().find((s) => Math.hypot(s.x - p.x, s.y - p.y) < s.size / 2);
      if (!dragSticker) {
        dragSticker = { e: sticker, x: p.x, y: p.y, size: 80 };
        st.stickers.push(dragSticker);
        sfx('pop');
        talk('sticker');
      }
      return;
    }
    const key = { scissors: 'scissors', comb: 'comb', grow: 'grow', color: 'color', dryer: 'dryer', curl: 'curl', straight: 'straight', shampoo: 'shampoo', water: 'water' }[tool];
    if (key) talk(key);
    apply(p, p);
  });
  canvas.addEventListener('pointermove', (e) => {
    const p = toScene(e);
    face.look = p;
    if (!down) return;
    if (dragSticker) {
      dragSticker.x = p.x;
      dragSticker.y = p.y;
    } else {
      apply(last, p);
    }
    last = p;
  });
  const up = () => {
    down = false;
    // A sticker dragged off the picture goes away.
    if (dragSticker && (dragSticker.x < 0 || dragSticker.x > W || dragSticker.y < 0 || dragSticker.y > H)) {
      st.stickers = st.stickers.filter((s) => s !== dragSticker);
      sfx('pop');
    }
    dragSticker = null;
  };
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', up);

  // --- tools ---
  let soundAt = 0;
  const throttle = (kind, ms) => {
    const now = performance.now();
    if (now - soundAt > ms) {
      soundAt = now;
      sfx(kind);
    }
  };
  const near = (q, p, r) => (q.x - p.x) ** 2 + (q.y - p.y) ** 2 < r * r;

  function segHit(a, b, c, d) {
    const r = (b.x - a.x) * (d.y - c.y) - (b.y - a.y) * (d.x - c.x);
    if (Math.abs(r) < 1e-9) return false;
    const t = ((c.x - a.x) * (d.y - c.y) - (c.y - a.y) * (d.x - c.x)) / r;
    const u = ((c.x - a.x) * (b.y - a.y) - (c.y - a.y) * (b.x - a.x)) / r;
    return t >= 0 && t <= 1 && u >= 0 && u <= 1;
  }

  function apply(from, p) {
    const dx = p.x - from.x;
    const dy = p.y - from.y;
    switch (tool) {
      case 'scissors': {
        let cut = false;
        for (const s of st.strands) {
          for (let i = 1; i < s.pts.length; i++) {
            if (segHit(from, p, s.pts[i - 1], s.pts[i]) || (i > 1 && near(s.pts[i], p, 10) && dx === 0 && dy === 0)) {
              const piece = s.pts.slice(i - 1).map((q) => ({ ...q, px: q.x - (Math.random() - 0.5) * 3, py: q.y - 1 }));
              s.pts = s.pts.slice(0, Math.max(1, i));
              if (piece.length > 1) st.falling.push({ pts: piece, width: s.width, wet: s.wet, life: 70 });
              cut = true;
              break;
            }
          }
        }
        if (cut) {
          throttle('snip', 120);
          setMood('wow', 500);
        }
        break;
      }
      case 'comb': {
        const len = Math.hypot(dx, dy);
        if (!len) break;
        for (const s of st.strands) {
          let touched = false;
          for (let i = 1; i < s.pts.length; i++) {
            const q = s.pts[i];
            const d = Math.hypot(q.x - p.x, q.y - p.y);
            if (d < 50) {
              const k = (1 - d / 50) * 0.8;
              q.x += dx * k;
              q.y += dy * k;
              touched = true;
            }
          }
          // Combing reshapes the hair: it remembers the new direction a little.
          if (touched) {
            let dir = s.angle;
            for (let i = 1; i < s.pts.length; i++) {
              const a = Math.atan2(s.pts[i].y - s.pts[i - 1].y, s.pts[i].x - s.pts[i - 1].x);
              let rel = a - dir;
              rel = Math.atan2(Math.sin(rel), Math.cos(rel));
              s.bends[i] += (rel - s.bends[i]) * 0.12;
              dir = a;
            }
          }
        }
        setMood('giggle', 400);
        break;
      }
      case 'grow': {
        let grew = false;
        for (const s of st.strands) {
          if (s.pts.length > MAX_SEGS) continue;
          if (!s.pts.some((q) => near(q, p, 45))) continue;
          if (Math.random() < 0.5) continue;
          const n = s.pts.length;
          const a = s.pts[n - 1];
          const b = n > 1 ? s.pts[n - 2] : { x: a.x - Math.cos(s.angle), y: a.y - Math.sin(s.angle) };
          const d = Math.hypot(a.x - b.x, a.y - b.y) || 1;
          const x = a.x + ((a.x - b.x) / d) * SEG;
          const y = a.y + ((a.y - b.y) / d) * SEG;
          s.pts.push({ x, y, px: x, py: y, c: a.c });
          grew = true;
        }
        if (grew) throttle('bubble', 140);
        break;
      }
      case 'color': {
        let painted = false;
        hue = (hue + 6) % 360;
        const c = color.hex === 'rainbow' ? `hsl(${hue}, 85%, 55%)` : color.hex;
        for (const s of st.strands) {
          for (let i = 1; i < s.pts.length; i++) {
            if (near(s.pts[i], p, 34)) {
              s.pts[i].c = c;
              painted = true;
            }
          }
        }
        if (painted) throttle('spray', 280);
        break;
      }
      case 'dryer': {
        for (const s of st.strands) {
          for (let i = 1; i < s.pts.length; i++) {
            const q = s.pts[i];
            const ddx = q.x - p.x;
            const ddy = q.y - p.y;
            const d = Math.hypot(ddx, ddy);
            if (d < 140 && d > 0.1) {
              const k = (1 - d / 140) * 5;
              q.x += (ddx / d) * k + (Math.random() - 0.5) * 2;
              q.y += (ddy / d) * k + (Math.random() - 0.5) * 2;
            }
          }
          if (s.pts.some((q) => near(q, p, 140))) s.wet = Math.max(0, s.wet - 0.02);
        }
        st.bubbles = st.bubbles.filter((b) => !near(b, p, 70) || Math.random() < 0.9);
        setMood('squint', 300);
        throttle('whoosh', 300);
        break;
      }
      case 'curl':
      case 'straight': {
        for (const s of st.strands) {
          if (!s.pts.some((q) => near(q, p, 45))) continue;
          s.curl = tool === 'curl' ? Math.min(1.2, s.curl + 0.06) : Math.max(0, s.curl - 0.08);
          if (tool === 'straight') s.bends = s.bends.map((b) => b * 0.9);
        }
        throttle('tap', 200);
        break;
      }
      case 'shampoo': {
        if (st.bubbles.length < 160 && Math.random() < 0.7) {
          st.bubbles.push({ x: p.x + (Math.random() - 0.5) * 50, y: p.y + (Math.random() - 0.5) * 50, r: 7 + Math.random() * 12, t: Math.random() * 6 });
          throttle('bubble', 90);
        }
        setMood('giggle', 400);
        break;
      }
      case 'water': {
        for (let i = 0; i < 3; i++) st.drops.push({ x: p.x + (Math.random() - 0.5) * 40, y: p.y - 30, vy: 6 + Math.random() * 4 });
        for (const s of st.strands) if (s.pts.some((q) => near(q, p, 70))) s.wet = Math.min(1, s.wet + 0.05);
        st.bubbles = st.bubbles.filter((b) => !near(b, p, 80));
        throttle('splash', 260);
        break;
      }
    }
  }

  // --- animation loop ---
  let frame;
  let blinkAt = performance.now() + 2500;
  function loop(now) {
    for (const s of st.strands) {
      stepStrand(s, 0.35);
      if (!down && s.wet > 0) s.wet = Math.max(0, s.wet - 0.0008);
    }
    stepFalling(st);
    for (const b of st.bubbles) {
      b.t += 0.05;
      b.x += Math.sin(b.t) * 0.2;
    }
    for (const d of st.drops) d.y += d.vy;
    st.drops = st.drops.filter((d) => d.y < H + 20);
    if (now > moodUntil && face.mood !== 'happy') face.mood = 'happy';
    face.blink = now > blinkAt && now < blinkAt + 140;
    if (now > blinkAt + 140) blinkAt = now + 2500 + Math.random() * 3000;

    const dpr = window.devicePixelRatio || 1;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = '#fff7e8';
    g.fillRect(0, 0, canvas.width, canvas.height);
    g.translate(ox, oy);
    g.scale(scale, scale);
    g.save();
    g.beginPath();
    g.roundRect ? g.roundRect(0, 0, W, H, 36) : g.rect(0, 0, W, H);
    g.clip();
    drawFriend(g, st, face);
    g.restore();
    frame = requestAnimationFrame(loop);
  }
  frame = requestAnimationFrame(loop);
  say(pick(LINES.hello(friend)));

  stopLoop = () => {
    cancelAnimationFrame(frame);
    ro.disconnect();
    stopSpeech();
    document.querySelectorAll('.overlay').forEach((o) => o.remove());
  };
}

chooseFriend();
