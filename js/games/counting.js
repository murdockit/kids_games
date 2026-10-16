// Counting & Numbers: count things, which has more, add and take away (all within 10).
import { topBar, modePicker, pick, randInt, say, sfx, el } from '../common.js';
import { runQuiz, numberChoices } from '../quiz.js';

const main = document.getElementById('app');
const bar = topBar({ title: 'Counting' });

const THINGS = [
  ['🍎', 'apples'], ['🐶', 'puppies'], ['⭐', 'stars'], ['🦆', 'ducks'], ['🍪', 'cookies'],
  ['🎈', 'balloons'], ['🐟', 'fish'], ['🌸', 'flowers'], ['🚗', 'cars'], ['🐞', 'ladybugs'],
  ['🍓', 'strawberries'], ['🦋', 'butterflies'],
].map(([emoji, name]) => ({ emoji, name }));

const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];

const showPicker = modePicker({
  main,
  bar,
  title: 'Counting',
  intro: 'Counting! Pick a game.',
  modes: [
    { emoji: '🔢', name: 'How Many?', color: 'yellow', start: howMany },
    { emoji: '⚖️', name: 'Which Has More?', color: 'green', start: whichMore },
    { emoji: '➕', name: 'Add & Take Away', color: 'blue', start: addTake },
    { emoji: '🔟', name: 'Ten Frame', color: 'purple', start: tenFrame },
    { emoji: '🐰', name: 'Bunny Hop', color: 'pink', start: bunnyHop },
  ],
});

const numberChoice = (n) => ({ value: n, html: String(n), label: String(n) });

// Objects she can tap to count out loud; each tap says the next number.
function countable(thing, n) {
  const box = el('div');
  box.style.cssText = 'display:flex;flex-wrap:wrap;justify-content:center;gap:8px;max-width:760px';
  let counted = 0;
  for (let i = 0; i < n; i++) {
    const b = el('button', '', thing.emoji);
    b.style.cssText = 'background:none;font-size:clamp(52px,9vw,80px);line-height:1;padding:4px;border-radius:20px';
    b.setAttribute('aria-label', thing.name);
    b.addEventListener('click', () => {
      if (b.dataset.counted) return;
      counted++;
      b.dataset.counted = '1';
      b.style.background = '#ffe8a3';
      sfx('tap');
      say(NUMBER_WORDS[counted] || String(counted));
    });
    box.appendChild(b);
  }
  return box;
}

function howMany() {
  let last = 0;
  runQuiz({
    main,
    bar,
    makeQuestion: () => {
      let n;
      do n = randInt(1, 10);
      while (n === last);
      last = n;
      const thing = pick(THINGS);
      return {
        say: `How many ${thing.name}? Tap them to count.`,
        show: countable(thing, n),
        choices: numberChoices(n, { min: 1, max: 10 }).map(numberChoice),
        answer: n,
        praise: `Yes! ${n} ${thing.name}!`,
      };
    },
    onExit: showPicker,
  });
}

function whichMore() {
  runQuiz({
    main,
    bar,
    makeQuestion: () => {
      const thing = pick(THINGS);
      let a, b;
      do {
        a = randInt(1, 8);
        b = randInt(1, 8);
      } while (a === b);
      const group = (n) => `<span style="font-size:.75em;display:flex;flex-wrap:wrap;justify-content:center;gap:4px;max-width:300px">${thing.emoji.repeat(n)}</span>`;
      const moreFew = Math.random() < 0.75 ? 'more' : 'fewer';
      const answer = (moreFew === 'more') === a > b ? 'left' : 'right';
      return {
        say: `Which group has ${moreFew} ${thing.name}?`,
        text: moreFew === 'more' ? 'Which has MORE? ⬆️' : 'Which has FEWER? ⬇️',
        choices: [
          { value: 'left', html: group(a), label: `${a} ${thing.name}`, className: 'wide' },
          { value: 'right', html: group(b), label: `${b} ${thing.name}`, className: 'wide' },
        ],
        answer,
        praise:
          moreFew === 'more'
            ? `Yes! ${Math.max(a, b)} is more than ${Math.min(a, b)}!`
            : `Yes! ${Math.min(a, b)} is fewer than ${Math.max(a, b)}!`,
      };
    },
    onExit: showPicker,
  });
}

function addTake() {
  runQuiz({
    main,
    bar,
    makeQuestion: () => {
      const thing = pick(THINGS);
      const show = el('div');
      show.style.cssText = 'display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:12px';
      if (Math.random() < 0.5) {
        const a = randInt(1, 5);
        const b = randInt(1, Math.min(5, 10 - a));
        show.append(countable(thing, a), el('span', '', '➕'), countable(thing, b));
        return {
          say: `${a} ${thing.name}, and ${b} more. How many ${thing.name} in all?`,
          show,
          choices: numberChoices(a + b, { min: 1, max: 10 }).map(numberChoice),
          answer: a + b,
          praise: `Yes! ${a} plus ${b} is ${a + b}!`,
        };
      }
      const total = randInt(2, 8);
      const gone = randInt(1, total - 1);
      const group = countable(thing, total - gone);
      for (let i = 0; i < gone; i++) {
        const away = el('span', '', thing.emoji);
        away.style.cssText = 'font-size:clamp(52px,9vw,80px);opacity:.25;filter:grayscale(1);position:relative';
        away.innerHTML += '<span style="position:absolute;inset:0;display:grid;place-items:center;font-size:.8em">❌</span>';
        group.appendChild(away);
      }
      show.appendChild(group);
      return {
        say: `There were ${total} ${thing.name}. ${gone} went away. How many are left?`,
        show,
        choices: numberChoices(total - gone, { min: 0, max: 10 }).map(numberChoice),
        answer: total - gone,
        praise: `Yes! ${total} take away ${gone} is ${total - gone}!`,
      };
    },
    onExit: showPicker,
  });
}

// A ten frame: two rows of five boxes, the first n filled with dots.
function frame(n, color) {
  const box = el('div', 'ten-frame');
  for (let i = 0; i < 10; i++) {
    const cell = el('span', i < n ? 'on' : '');
    if (i < n) {
      cell.style.setProperty('--dot', color);
      cell.style.animationDelay = `${i * 0.06}s`;
    }
    box.appendChild(cell);
  }
  return box;
}

// "How many dots?" and "How many more make 10?", taking turns.
function tenFrame() {
  let last = 0;
  runQuiz({
    main,
    bar,
    makeQuestion: (index) => {
      let n;
      do n = randInt(index % 2 ? 1 : 2, 9);
      while (n === last);
      last = n;
      const color = pick(['#ff6b8b', '#4d96ff', '#4cc261', '#a66bff', '#ff8c42']);
      if (index % 2 === 0) {
        return {
          say: 'How many dots?',
          text: 'How many dots?',
          show: frame(n, color),
          choices: numberChoices(n, { min: 1, max: 10 }).map(numberChoice),
          answer: n,
          praise: `Yes! ${n}!`,
        };
      }
      return {
        say: `How many more dots make ten?`,
        text: 'How many more make 10? 🔟',
        show: frame(n, color),
        choices: numberChoices(10 - n, { min: 1, max: 9 }).map(numberChoice),
        answer: 10 - n,
        praise: `Yes! ${n} and ${10 - n} make ten!`,
      };
    },
    onExit: showPicker,
  });
}

// The bunny sits on a number line and hops forward (or back). Where does it land?
function bunnyHop() {
  runQuiz({
    main,
    bar,
    makeQuestion: () => {
      const forward = Math.random() < 0.7;
      const hops = randInt(1, 4);
      const start = forward ? randInt(0, 10 - hops) : randInt(hops, 10);
      const end = forward ? start + hops : start - hops;
      const line = el('div', 'number-line');
      line.style.setProperty('--n', 11);
      for (let i = 0; i <= 10; i++) line.appendChild(el('span', 'tick', String(i)));
      // Little arcs show each hop to count along.
      for (let h = 0; h < hops; h++) {
        const arc = el('span', 'hop-arc');
        const from = forward ? start + h : start - h - 1;
        arc.style.left = `calc(${from} * var(--step) + var(--step) / 2)`;
        line.appendChild(arc);
      }
      const bunny = el('span', 'bunny', '🐰');
      bunny.style.left = `calc(${start} * var(--step) + var(--step) / 2)`;
      line.appendChild(bunny);
      return {
        say: `Bunny is on ${start}. Bunny hops ${hops} ${forward ? 'more' : 'back'}. Where does bunny land?`,
        text: `${start} ${forward ? '+' : '−'} ${hops} = ?`,
        show: line,
        choices: numberChoices(end, { min: 0, max: 10 }).map(numberChoice),
        answer: end,
        praise: `Yes! ${start} ${forward ? 'plus' : 'take away'} ${hops} is ${end}!`,
        land: () => {
          bunny.style.left = `calc(${end} * var(--step) + var(--step) / 2)`;
          sfx('boing');
        },
      };
    },
    onAnswer: (q, right) => right && q.land?.(),
    onExit: showPicker,
  });
}
