// Free Play: no wrong answers. Drawing pad, bubble pop, and animal memory match.
import { topBar, modePicker, pick, shuffle, say, sfx, cheer, doneScreen, el, randInt } from '../common.js';
import { getWords } from '../words-store.js';

const main = document.getElementById('app');
const bar = topBar({ title: 'Free Play' });

let cleanup = null;
function stopActivity() {
  cleanup?.();
  cleanup = null;
}

const showPicker = modePicker({
  main,
  bar,
  title: 'Free Play',
  intro: 'Free play! Pick something fun.',
  modes: [
    { emoji: '🎨', name: 'Draw', color: 'pink', start: () => run(draw) },
    { emoji: '🫧', name: 'Bubble Pop', color: 'blue', start: () => run(bubbles) },
    { emoji: '🐘', name: 'Memory Match', color: 'green', start: () => run(memory) },
  ],
});

function run(activity) {
  stopActivity();
  // Leaving the activity (Back) must stop its animation loop / listeners.
  bar.onBack(() => {
    stopActivity();
    showPicker();
  });
  cleanup = activity() || null;
}

// ---------- Drawing pad ----------
const PAINT = ['#ef4444', '#f97316', '#facc15', '#22c55e', '#3b82f6', '#a855f7', '#f472b6', '#8b5a2b', '#2b2d42'];
const STAMPS = ['⭐', '❤️', '🌸', '🐶', '🦋', '🌈'];

function draw() {
  say('Draw anything you like!');
  bar.onRepeat(null);
  main.innerHTML = '';
  main.style.justifyContent = 'flex-start';

  const tools = el('div');
  tools.style.cssText = 'display:flex;flex-wrap:wrap;justify-content:center;gap:10px';
  const wrap = el('div');
  wrap.style.cssText = 'flex:1;width:100%;min-height:300px;border-radius:28px;background:#fff;box-shadow:var(--shadow);overflow:hidden;position:relative';
  const canvas = el('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;touch-action:none';
  wrap.appendChild(canvas);
  main.append(tools, wrap);

  let color = PAINT[4];
  let size = 14;
  let stamp = null;
  const buttons = [];

  function toolButton(content, label, onPick, style = '') {
    const b = el('button', 'round-btn');
    b.innerHTML = content;
    b.setAttribute('aria-label', label);
    b.style.cssText = `width:64px;height:64px;font-size:30px;${style}`;
    b.addEventListener('click', () => {
      sfx('tap');
      onPick(b);
    });
    tools.appendChild(b);
    buttons.push(b);
    return b;
  }
  function select(b) {
    buttons.forEach((x) => (x.style.outline = ''));
    b.style.outline = '5px solid #2b2d42';
  }

  PAINT.forEach((c, i) => {
    const b = toolButton('', `paint color ${i + 1}`, (btn) => {
      color = c;
      stamp = null;
      select(btn);
    }, `background:${c}`);
    if (c === color) select(b);
  });
  STAMPS.forEach((s) => toolButton(s, `stamp ${s}`, (btn) => {
    stamp = s;
    select(btn);
  }));
  toolButton('🖌️', 'big or small brush', () => {
    size = size === 14 ? 30 : 14;
    say(size === 30 ? 'Big brush' : 'Small brush');
  });
  toolButton('🧽', 'eraser', (btn) => {
    color = '#ffffff';
    stamp = null;
    select(btn);
  });
  toolButton('🗑️', 'clear', () => {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    say('All clean!');
  });

  const ctx = canvas.getContext('2d');
  function resize() {
    // Keep the picture when the iPad rotates.
    const keep = document.createElement('canvas');
    keep.width = canvas.width;
    keep.height = canvas.height;
    if (canvas.width) keep.getContext('2d').drawImage(canvas, 0, 0);
    const dpr = window.devicePixelRatio || 1;
    const r = wrap.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(r.width * dpr));
    canvas.height = Math.max(1, Math.round(r.height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (keep.width) ctx.drawImage(keep, 0, 0, keep.width / dpr, keep.height / dpr);
  }
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(wrap);

  const strokes = new Map();
  const pos = (e) => {
    const r = canvas.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  };
  canvas.addEventListener('pointerdown', (e) => {
    canvas.setPointerCapture(e.pointerId);
    const [x, y] = pos(e);
    if (stamp) {
      ctx.font = `${size * 4}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(stamp, x, y);
      sfx('pop');
      return;
    }
    strokes.set(e.pointerId, [x, y]);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    ctx.fill();
  });
  canvas.addEventListener('pointermove', (e) => {
    const last = strokes.get(e.pointerId);
    if (!last) return;
    const [x, y] = pos(e);
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(...last);
    ctx.lineTo(x, y);
    ctx.stroke();
    strokes.set(e.pointerId, [x, y]);
  });
  const end = (e) => strokes.delete(e.pointerId);
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);

  return () => {
    ro.disconnect();
    main.style.justifyContent = '';
  };
}

// ---------- Bubble pop ----------
function bubbles() {
  say('Pop the bubbles!');
  bar.onRepeat(null);
  main.innerHTML = '';
  const field = el('div');
  field.style.cssText = 'position:fixed;inset:0;top:100px;overflow:hidden;touch-action:none';
  main.appendChild(field);

  // Some bubbles carry a letter, number, or one of her heart words, and say it when popped.
  let heartWords = [];
  getWords().then((w) => (heartWords = w));
  const content = () => {
    const r = Math.random();
    if (r < 0.3) return String.fromCharCode(65 + randInt(0, 25));
    if (r < 0.55) return String(randInt(1, 10));
    if (r < 0.75 && heartWords.length) return pick(heartWords);
    return '';
  };
  const tint = ['#ffd1dc', '#cde7ff', '#d8f5d0', '#fff1b8', '#e9d5ff'];

  const live = new Set();
  let popped = 0;
  function spawn() {
    if (live.size >= 9) return;
    const size = randInt(90, 150);
    const text = content();
    const b = el('button');
    b.textContent = text;
    b.setAttribute('aria-label', text ? `bubble ${text}` : 'bubble');
    b.style.cssText = `position:absolute;left:${randInt(0, Math.max(0, field.clientWidth - size))}px;top:0;width:${size}px;height:${size}px;border-radius:50%;
      background:radial-gradient(circle at 30% 30%, #fff 0 12%, ${pick(tint)} 40%, rgba(255,255,255,.4) 100%);
      box-shadow:inset 0 0 0 3px rgba(255,255,255,.8), 0 6px 16px rgba(0,0,0,.08);
      font-size:${text.length > 3 ? 26 : 40}px;font-weight:800;color:#2b2d42`;
    const bubble = { el: b, y: field.clientHeight + size, speed: 0.6 + Math.random() * 0.9, wobble: Math.random() * 6 };
    b.addEventListener('pointerdown', () => {
      if (!live.has(bubble)) return;
      live.delete(bubble);
      sfx('pop');
      if (text) say(text, { rate: 0.95 });
      b.style.transition = 'transform .15s, opacity .15s';
      b.style.transform += ' scale(1.4)';
      b.style.opacity = '0';
      setTimeout(() => b.remove(), 160);
      popped++;
      if (popped % 15 === 0) cheer(`${popped} bubbles! Wow!`);
    });
    live.add(bubble);
    field.appendChild(b);
  }

  let frame;
  let t = 0;
  function loop() {
    t++;
    if (t % 45 === 0) spawn();
    for (const bub of live) {
      bub.y -= bub.speed * 2;
      const x = Math.sin((t + bub.wobble * 40) / 40) * 10;
      bub.el.style.transform = `translate(${x}px, ${bub.y}px)`;
      if (bub.y < -200) {
        live.delete(bub);
        bub.el.remove();
      }
    }
    frame = requestAnimationFrame(loop);
  }
  spawn();
  loop();
  return () => cancelAnimationFrame(frame);
}

// ---------- Memory match ----------
const ANIMALS = [
  ['🐶', 'dog'], ['🐱', 'cat'], ['🐰', 'bunny'], ['🦁', 'lion'], ['🐸', 'frog'], ['🐵', 'monkey'],
  ['🐼', 'panda'], ['🐷', 'pig'], ['🐮', 'cow'], ['🦒', 'giraffe'], ['🐘', 'elephant'], ['🐧', 'penguin'],
].map(([emoji, name]) => ({ emoji, name }));

function memory() {
  say('Find the matching animals!');
  bar.onRepeat(null);
  const pairs = 6;
  const deck = shuffle(shuffle(ANIMALS).slice(0, pairs).flatMap((a) => [a, a]));
  main.innerHTML = '';
  const grid = el('div');
  grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:16px;width:100%;max-width:820px';
  main.appendChild(grid);

  let open = [];
  let matched = 0;
  let locked = false;
  const BACK = '❓';

  deck.forEach((animal) => {
    const card = el('button', 'choice', BACK);
    card.style.cssText = 'min-width:0;min-height:130px;background:var(--purple);font-size:64px;transition:transform .2s';
    card.setAttribute('aria-label', 'card');
    card.addEventListener('click', async () => {
      if (locked || card.dataset.up) return;
      card.dataset.up = '1';
      card.textContent = animal.emoji;
      card.style.background = '#fff';
      sfx('tap');
      say(animal.name, { rate: 1 });
      open.push({ card, animal });
      if (open.length < 2) return;
      const [a, b] = open;
      open = [];
      if (a.animal === b.animal) {
        matched++;
        a.card.style.outline = b.card.style.outline = '6px solid var(--good)';
        if (matched === pairs) {
          await cheer('You matched them all!', { big: true });
          doneScreen(main, { onAgain: () => run(memory), onBack: showPicker });
        } else {
          await cheer(`Two ${a.animal.name}s!`);
        }
        return;
      }
      locked = true;
      setTimeout(() => {
        for (const c of [a.card, b.card]) {
          delete c.dataset.up;
          c.textContent = BACK;
          c.style.background = 'var(--purple)';
        }
        locked = false;
      }, 1100);
    });
    grid.appendChild(card);
  });
}
