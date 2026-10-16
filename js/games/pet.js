// My Pet: a pet to feed, wash, play with, put to bed, and dress up.
// Its needs go down slowly while she's away (never all the way), so there's always something to do.
import { topBar, say, sfx, cheer, el, load, save, pick, burstAt, addStar, KID, tone, slide, noise } from '../common.js';
import { logRound, today } from '../activity.js';
import { hush } from '../music.js';

const KEY = 'lg.pet';
const PETS = {
  puppy: { emoji: '🐶', name: 'Biscuit', foods: ['🦴', '🍖', '🥕', '🍪'], sound: () => { slide(520, 330, 0, 0.12, 'square', 0.06); slide(560, 360, 0.18, 0.12, 'square', 0.06); } },
  kitty: { emoji: '🐱', name: 'Mittens', foods: ['🐟', '🥛', '🍗', '🍪'], sound: () => { slide(500, 900, 0, 0.25, 'triangle', 0.1); slide(900, 520, 0.22, 0.3, 'triangle', 0.08); } },
  bunny: { emoji: '🐰', name: 'Clover', foods: ['🥕', '🥬', '🍓', '🍪'], sound: () => { tone(1300, 0, 0.06, 'sine', 0.1); tone(1500, 0.09, 0.06, 'sine', 0.1); } },
  dragon: { emoji: '🐲', name: 'Ember', foods: ['🌶️', '🍕', '🍎', '🍪'], sound: () => { noise(0, 0.5, { type: 'lowpass', freq: 500, gain: 0.25 }); slide(220, 110, 0, 0.5, 'sawtooth', 0.04); } },
};
const NEEDS = [
  { id: 'food', icon: '🍎', perHour: 6, words: 'hungry' },
  { id: 'clean', icon: '🛁', perHour: 3, words: 'messy' },
  { id: 'fun', icon: '⚽', perHour: 5, words: 'bored' },
  { id: 'energy', icon: '😴', perHour: 4, words: 'sleepy' },
];
const HATS = ['🎀', '👑', '🎩', '🧢', '🌸', '🎓'];

const main = document.getElementById('app');
const bar = topBar({ title: 'My Pet' });
main.classList.add('pet-page');

let state = load(KEY, null);

// Needs drift down while she's away (but never below 15).
function catchUp() {
  if (!state) return;
  const hours = Math.min(48, (Date.now() - (state.at || Date.now())) / 3600000);
  for (const n of NEEDS) state[n.id] = Math.max(15, Math.min(100, (state[n.id] ?? 80) - n.perHour * hours));
  state.at = Date.now();
}
const store = () => {
  state.at = Date.now();
  save(KEY, state);
};
window.__pet = () => state;

catchUp();
state ? room() : choose();

function choose() {
  bar.setTitle('Pick a Pet');
  bar.onRepeat(() => say('Pick a pet to take care of!'));
  main.innerHTML = '';
  say(`Hi ${KID}! Pick a pet to take care of!`);
  const tiles = el('div', 'tiles');
  Object.entries(PETS).forEach(([kind, p], i) => {
    const b = el('button', `tile ${['orange', 'yellow', 'pink', 'green'][i]}`);
    b.innerHTML = `<span class="emoji">${p.emoji}</span><span>${p.name}</span>`;
    b.addEventListener('click', () => {
      p.sound();
      state = { kind, food: 70, clean: 70, fun: 70, energy: 70, hat: null, at: Date.now() };
      store();
      room(true);
    });
    tiles.appendChild(b);
  });
  main.appendChild(tiles);
}

function room(isNew = false) {
  const pet = PETS[state.kind];
  bar.setTitle(pet.name);
  main.innerHTML = '';

  const meters = el('div', 'pet-meters');
  const fills = {};
  for (const n of NEEDS) {
    const m = el('div', 'pet-meter');
    m.innerHTML = `<span>${n.icon}</span><div class="pet-meter-bar"><i></i></div>`;
    fills[n.id] = m.querySelector('i');
    meters.appendChild(m);
  }

  const scene = el('div', 'pet-room');
  const critter = el('div', 'pet');
  critter.setAttribute('aria-label', pet.name);
  const body = el('span', 'pet-body', pet.emoji);
  const hat = el('span', 'pet-hat');
  const thought = el('span', 'pet-thought');
  critter.append(thought, hat, body);
  const dark = el('div', 'pet-night');
  dark.innerHTML = '<span>🌙</span><span class="z">💤</span>';
  scene.append(critter, dark);

  const tray = el('div', 'pet-tray');
  const actions = el('div', 'pet-actions');
  const act = (emoji, label, fn) => {
    const b = el('button', 'round-btn big-action', emoji);
    b.setAttribute('aria-label', label);
    b.addEventListener('click', () => {
      sfx('tap');
      fn();
    });
    actions.appendChild(b);
  };
  act('🍎', 'Feed', feed);
  act('🧽', 'Wash', wash);
  act('⚽', 'Play', play);
  act('🌙', 'Sleep', sleep);
  act('🎀', 'Dress up', dress);
  main.append(meters, scene, tray, actions);

  const swap = el('button', 'pet-swap', '🔁 new pet');
  swap.addEventListener('click', choose);
  main.appendChild(swap);

  function render() {
    for (const n of NEEDS) {
      const v = Math.round(state[n.id]);
      fills[n.id].style.width = `${v}%`;
      fills[n.id].style.background = v < 35 ? '#f87171' : v < 65 ? '#facc15' : '#4ade80';
    }
    hat.textContent = state.hat || '';
    const low = NEEDS.filter((n) => state[n.id] < 40).sort((a, b) => state[a.id] - state[b.id])[0];
    thought.textContent = low ? low.icon : '';
    thought.classList.toggle('show', Boolean(low));
    critter.classList.toggle('sad', Boolean(low));
  }
  render();

  const greet = () => {
    const low = NEEDS.filter((n) => state[n.id] < 40).sort((a, b) => state[a.id] - state[b.id])[0];
    if (isNew) return `This is ${pet.name}! ${pet.name} is your new pet. Take good care of ${pet.name}!`;
    if (low) return `${pet.name} missed you, ${KID}! ${pet.name} is ${low.words}.`;
    return `${pet.name} missed you, ${KID}! Pet ${pet.name} to say hi.`;
  };
  say(greet());
  bar.onRepeat(() => say(greet()));
  setTimeout(pet.sound, 300);

  const bump = (need, amount) => {
    state[need] = Math.min(100, state[need] + amount);
    store();
    render();
    checkHappy();
  };
  const happyHop = () => {
    critter.classList.remove('hop');
    void critter.offsetWidth;
    critter.classList.add('hop');
  };
  const centerOf = (node) => {
    const r = node.getBoundingClientRect();
    return [r.left + r.width / 2, r.top + r.height / 2];
  };

  // When everything is full, she earns a star (once a day).
  function checkHappy() {
    if (NEEDS.some((n) => state[n.id] < 90) || state.starDay === today()) return;
    state.starDay = today();
    store();
    logRound('pet');
    happyHop();
    pet.sound();
    cheer(`${pet.name} is so happy! You earned a star!`, { big: true });
    addStar(1);
  }

  // Petting: rub the pet to make hearts.
  let lastHeart = 0;
  let rubbing = false;
  critter.addEventListener('pointerdown', (e) => {
    rubbing = true;
    critter.setPointerCapture?.(e.pointerId);
  });
  critter.addEventListener('pointerup', () => (rubbing = false));
  critter.addEventListener('pointercancel', () => (rubbing = false));
  critter.addEventListener('pointermove', (e) => {
    if (!rubbing || mode) return;
    if (performance.now() - lastHeart < 280) return;
    lastHeart = performance.now();
    floatAt(e.clientX, e.clientY, pick(['💕', '💖', '💗']));
    slide(300, 260, 0, 0.18, 'sine', 0.08);
    bump('fun', 1);
  });

  function floatAt(x, y, emoji, cls = 'pet-float') {
    const f = el('span', cls, emoji);
    f.style.left = `${x}px`;
    f.style.top = `${y}px`;
    document.body.appendChild(f);
    setTimeout(() => f.remove(), 1200);
    return f;
  }

  let mode = null;
  const setMode = (m) => {
    mode = m;
    tray.innerHTML = '';
    scene.classList.toggle('washing', m === 'wash');
  };

  function feed() {
    setMode('feed');
    say(`Tap some food for ${pet.name}!`);
    for (const food of pet.foods) {
      const b = el('button', 'pet-item', food);
      b.setAttribute('aria-label', 'food');
      b.addEventListener('click', () => {
        if (state.food >= 100) {
          say(`${pet.name} is full!`);
          critter.classList.add('shake');
          setTimeout(() => critter.classList.remove('shake'), 600);
          return;
        }
        const [fx, fy] = centerOf(b);
        const [tx, ty] = centerOf(body);
        const f = floatAt(fx, fy, food, 'pet-flying');
        requestAnimationFrame(() => (f.style.transform = `translate(${tx - fx}px, ${ty - fy}px) scale(.4)`));
        setTimeout(() => {
          f.remove();
          noise(0, 0.08, { type: 'highpass', freq: 2500, gain: 0.2 });
          noise(0.12, 0.08, { type: 'highpass', freq: 2200, gain: 0.2 });
          critter.classList.remove('chomp');
          void critter.offsetWidth;
          critter.classList.add('chomp');
          burstAt(tx, ty + 30, ['✨', '😋', '💛']);
          bump('food', 25);
          if (state.food >= 100) say(`Yum! ${pet.name} is full!`);
        }, 500);
      });
      tray.appendChild(b);
    }
  }

  // Wash: rub to make bubbles, then they rinse away.
  let bubbles = [];
  function wash() {
    setMode('wash');
    say(`Rub ${pet.name} to make bubbles!`);
    bubbles = [];
    let last = 0;
    const onMove = (e) => {
      if (mode !== 'wash' || !e.buttons && e.pointerType === 'mouse') return;
      if (performance.now() - last < 90) return;
      last = performance.now();
      const r = scene.getBoundingClientRect();
      const bub = el('span', 'pet-bubble', '🫧');
      bub.style.left = `${e.clientX - r.left}px`;
      bub.style.top = `${e.clientY - r.top}px`;
      scene.appendChild(bub);
      bubbles.push(bub);
      sfx('bubble');
      if (bubbles.length >= 18) rinse();
    };
    critter.onpointermove = onMove;
  }
  function rinse() {
    critter.onpointermove = null;
    setMode(null);
    noise(0, 1.2, { freq: 4000, q: 0.5, gain: 0.12 });
    scene.classList.add('shower');
    bubbles.forEach((b, i) => setTimeout(() => b.remove(), 300 + i * 40));
    setTimeout(() => {
      scene.classList.remove('shower');
      const [x, y] = centerOf(body);
      burstAt(x, y, ['✨', '🌟', '💎']);
      happyHop();
      bump('clean', 100);
      say(`${pet.name} is so clean and shiny!`);
    }, 1300);
  }

  // Play: tap the ball and the pet chases it.
  function play() {
    setMode('play');
    say(`Throw the ball for ${pet.name}! Tap the ball.`);
    const ball = el('button', 'pet-item', '⚽');
    ball.setAttribute('aria-label', 'ball');
    ball.addEventListener('click', () => {
      const r = scene.getBoundingClientRect();
      const x = (Math.random() - 0.5) * r.width * 0.6;
      const toy = el('span', 'pet-ball', '⚽');
      scene.appendChild(toy);
      requestAnimationFrame(() => (toy.style.transform = `translate(${x}px, -140px) rotate(540deg)`));
      sfx('whee');
      setTimeout(() => {
        critter.style.transform = `translateX(${x}px)`;
        sfx('boing');
      }, 350);
      setTimeout(() => {
        toy.remove();
        critter.style.transform = '';
        happyHop();
        pet.sound();
        bump('fun', 20);
      }, 1100);
    });
    tray.appendChild(ball);
  }

  // Sleep: lights out, a lullaby hum, and energy fills up. Tap to wake up early.
  function sleep() {
    setMode('sleep');
    scene.classList.add('night');
    say(`Night night, ${pet.name}.`);
    hush(true);
    [392, 330, 349, 294, 330, 262].forEach((f, i) => tone(f, 0.6 + i * 0.55, 0.6, 'sine', 0.08));
    const timer = setInterval(() => bump('energy', 10), 400);
    const wake = () => {
      clearInterval(timer);
      clearTimeout(auto);
      scene.classList.remove('night');
      dark.removeEventListener('click', wake);
      hush(false);
      setMode(null);
      happyHop();
      pet.sound();
      say(`Good morning, ${pet.name}!`);
    };
    const auto = setTimeout(wake, 4500);
    dark.addEventListener('click', wake);
  }

  function dress() {
    setMode('dress');
    say(`Pick something for ${pet.name} to wear!`);
    for (const h of HATS) {
      const b = el('button', 'pet-item', h);
      b.setAttribute('aria-label', 'hat');
      b.classList.toggle('on', state.hat === h);
      b.addEventListener('click', () => {
        state.hat = state.hat === h ? null : h;
        store();
        render();
        tray.querySelectorAll('.pet-item').forEach((x) => x.classList.toggle('on', x.textContent === state.hat));
        if (state.hat) {
          happyHop();
          sfx('boing');
        }
      });
      tray.appendChild(b);
    }
  }
}
