// Free Play: no wrong answers. Drawing, saved pictures, bubbles, memory match, music, puzzles,
// dot-to-dot and mazes.
import { topBar, modePicker, pick, shuffle, say, sfx, cheer, doneScreen, el, randInt, askYesNo, KID } from '../common.js';
import { getWords } from '../words-store.js';
import { draw } from './draw.js';
import { listPictures, deletePicture } from '../gallery-store.js';
import { musicMaker } from './music-maker.js';
import { puzzles } from './puzzle.js';
import { dotToDot } from './dots.js';
import { mazes } from './maze.js';

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
    { emoji: '🎨', name: 'Draw', color: 'pink', start: () => run(() => draw({ main, bar })) },
    { emoji: '🖼️', name: 'My Pictures', color: 'orange', start: () => run(pictures) },
    { emoji: '🫧', name: 'Bubble Pop', color: 'blue', start: () => run(bubbles) },
    { emoji: '🐘', name: 'Memory Match', color: 'green', start: () => run(memory) },
    { emoji: '🎹', name: 'Music Maker', color: 'yellow', start: () => run(() => musicMaker({ main, bar })) },
    { emoji: '🧩', name: 'Puzzles', color: 'teal', start: () => run(() => puzzles({ main, bar })) },
    { emoji: '✏️', name: 'Dot to Dot', color: 'purple', start: () => run(() => dotToDot({ main, bar, exit: showPicker })) },
    { emoji: '🌀', name: 'Mazes', color: 'blue', start: () => run(() => mazes({ main, bar, exit: showPicker })) },
  ],
});

function run(activity) {
  stopActivity();
  // Leaving the activity (Back) must stop its animation loop / listeners.
  bar.onBack(() => {
    stopActivity();
    showPicker();
  });
  const stop = activity();
  cleanup = typeof stop === 'function' ? stop : null;
}

// ---------- My Pictures ----------
async function pictures() {
  bar.onRepeat(null);
  main.innerHTML = '';
  const all = await listPictures();
  if (!all.length) {
    main.innerHTML = '<p class="note">No pictures yet. Draw one and tap 💾 to save it!</p>';
    say('No pictures yet. Draw one, and tap the save button!');
    return;
  }
  say('Your pictures! Tap one to look at it.');
  const grid = el('div', 'gallery');
  for (const pic of all) {
    const b = el('button', 'gallery-item');
    b.setAttribute('aria-label', 'picture');
    const img = el('img');
    img.src = pic.thumb;
    img.alt = '';
    b.appendChild(img);
    b.addEventListener('click', () => {
      sfx('tap');
      preview(pic);
    });
    grid.appendChild(b);
  }
  main.appendChild(grid);
}

function preview(pic) {
  bar.onBack(() => run(pictures));
  main.innerHTML = '';
  const img = el('img', 'saveable');
  img.src = pic.image;
  img.alt = `${KID}'s picture`;
  const hint = el('p', 'note', 'Grown-ups: press and hold the picture to save it to Photos.');
  const row = el('div', 'choices');
  const edit = el('button', 'round-btn big-action', '✏️');
  edit.setAttribute('aria-label', 'Keep drawing');
  const del = el('button', 'round-btn big-action', '🗑️');
  del.setAttribute('aria-label', 'Delete picture');
  row.append(edit, del);
  // A frame that twinkles with glitter, like a picture on the fridge.
  const frame = el('div', 'glitter-frame');
  frame.appendChild(img);
  for (let i = 0; i < 14; i++) {
    const g = el('span', 'glint', pick(['✨', '⭐', '💫']));
    g.style.left = `${(i * 37) % 100}%`;
    g.style.top = `${(i * 53) % 100}%`;
    g.style.animationDelay = `${(i % 7) * 0.35}s`;
    frame.appendChild(g);
  }
  main.append(frame, hint, row);
  edit.addEventListener('click', () => {
    sfx('tap');
    bar.setTitle('Draw');
    run(() => draw({ main, bar, resume: pic }));
  });
  del.addEventListener('click', async () => {
    if (!(await askYesNo('Throw this picture away?'))) return;
    await deletePicture(pic.id);
    run(pictures);
  });
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
      if (text) say(text);
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
      say(animal.name);
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
