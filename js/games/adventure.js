// Today's Adventure: a short trip with Sparkle, a little of everything each day:
// a heart word, a letter, some counting, one letter to trace, and a treasure chest at the end.
import { topBar, say, sfx, el, pick, sample, shuffle, randInt, doneScreen, load, save, KID, burstAt } from '../common.js';
import { runQuiz, numberChoices } from '../quiz.js';
import { getWords, pickPracticeWord, recordAnswer } from '../words-store.js';
import { traceOne } from '../trace-pad.js';
import { unicornSVG } from '../mascot.js';
import { logRound, today } from '../activity.js';

const KEY = 'lg.adventure';
const main = document.getElementById('app');
const bar = topBar({ title: "Today's Adventure" });

const STOPS = [
  { emoji: '❤️', name: 'Heart Word Hill', play: heartWords },
  { emoji: '🔤', name: 'Letter Lake', play: letters },
  { emoji: '🔢', name: 'Counting Cave', play: counting },
  { emoji: '✏️', name: 'Tracing Tower', play: tracing },
  { emoji: '🎁', name: 'Treasure!', play: treasure },
];
// Where each stop sits on the map (percent of the map box).
const SPOTS = [[16, 82], [44, 64], [78, 72], [70, 34], [30, 18]];

const esc = (s) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
function progress() {
  const p = load(KEY, null);
  return p && p.day === today() ? p : { day: today(), done: 0 };
}

map();

function map(justDone = false) {
  const p = progress();
  bar.setTitle("Today's Adventure");
  bar.onBack(null);
  main.innerHTML = '';
  const box = el('div', 'adventure-map');
  box.innerHTML = `<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
    <path d="M${SPOTS.map((s) => s.join(' ')).join(' L')}" class="trail"/></svg>`;
  STOPS.forEach((stop, i) => {
    const b = el('button', `stop${i < p.done ? ' done' : i === p.done ? ' now' : ' later'}`);
    b.style.left = `${SPOTS[i][0]}%`;
    b.style.top = `${SPOTS[i][1]}%`;
    b.innerHTML = `<span class="stop-emoji">${stop.emoji}</span><span class="stop-name"></span>`;
    b.querySelector('.stop-name').textContent = stop.name;
    b.setAttribute('aria-label', stop.name);
    b.addEventListener('click', () => {
      if (i < p.done) return say(`You did ${stop.name} already!`);
      if (i > p.done) return say(`First, ${STOPS[p.done].name}!`);
      sfx('tap');
      bar.setTitle(stop.name);
      bar.onBack(() => map());
      stop.play(() => finishStop(i));
    });
    box.appendChild(b);
  });
  const sparkle = el('div', 'adventure-unicorn');
  sparkle.innerHTML = unicornSVG();
  const at = SPOTS[Math.min(p.done, STOPS.length - 1)];
  const from = SPOTS[Math.max(0, Math.min(p.done, STOPS.length - 1) - (justDone ? 1 : 0))];
  sparkle.style.left = `${from[0]}%`;
  sparkle.style.top = `${from[1]}%`;
  box.appendChild(sparkle);
  if (justDone) {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      sparkle.style.left = `${at[0]}%`;
      sparkle.style.top = `${at[1]}%`;
      sfx('whee');
    }));
  }
  main.appendChild(box);

  let line;
  if (p.done >= STOPS.length) line = `You finished today's adventure, ${KID}! Come back tomorrow for a new one!`;
  else if (p.done === 0) line = `Let's go on an adventure, ${KID}! Tap ${STOPS[0].name} to start.`;
  else if (p.done === STOPS.length - 1) line = 'You made it! Tap the treasure!';
  else line = `Great job! Next stop: ${STOPS[p.done].name}!`;
  main.appendChild(el('p', 'speech adventure-speech', line));
  bar.onRepeat(() => say(line));
  say(line);
}

function finishStop(i) {
  const p = progress();
  p.done = Math.max(p.done, i + 1);
  save(KEY, p);
  map(true);
}

function heartWords(done) {
  getWords().then((words) => {
    if (words.length < 2) return done();
    let last = null;
    runQuiz({
      main,
      bar,
      count: 2,
      makeQuestion: () => {
        const word = pickPracticeWord(words, last);
        last = word;
        const others = sample(words.filter((w) => w.toLowerCase() !== word.toLowerCase()), 2);
        return {
          say: `Find the word: ${word}.`,
          text: 'Find the word you hear 👂',
          choices: shuffle([word, ...others]).map((w) => ({ value: w, html: esc(w), className: 'word' })),
          answer: word,
          praise: `Yes! ${word}!`,
        };
      },
      onAnswer: (q, right, firstTry) => firstTry && recordAnswer(q.answer, right),
      onExit: () => map(),
      onComplete: done,
    });
  });
}

const LETTER_NAME = { A: 'ay', I: 'eye', O: 'oh', U: 'you' };
function letters(done) {
  const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  runQuiz({
    main,
    bar,
    count: 2,
    makeQuestion: () => {
      const letter = pick(ABC);
      const name = LETTER_NAME[letter] || letter;
      return {
        say: `Find the letter, ${name}.`,
        text: 'Find the letter you hear 👂',
        choices: shuffle([letter, ...sample(ABC.filter((l) => l !== letter), 2)]).map((l) => ({ value: l, html: l, label: `Letter ${l}` })),
        answer: letter,
        praise: `Yes! That's ${name}!`,
      };
    },
    onExit: () => map(),
    onComplete: done,
  });
}

function counting(done) {
  const THINGS = [['🍎', 'apples'], ['⭐', 'stars'], ['🐟', 'fish'], ['🎈', 'balloons'], ['🦋', 'butterflies']];
  runQuiz({
    main,
    bar,
    count: 2,
    makeQuestion: () => {
      const [emoji, name] = pick(THINGS);
      const n = randInt(2, 9);
      return {
        say: `How many ${name}?`,
        show: `<span style="display:flex;flex-wrap:wrap;justify-content:center;gap:8px;max-width:620px;font-size:clamp(52px,9vw,76px)">${emoji.repeat(n)}</span>`,
        choices: numberChoices(n, { min: 1, max: 10 }).map((v) => ({ value: v, html: String(v), label: String(v) })),
        answer: n,
        praise: `Yes! ${n} ${name}!`,
      };
    },
    onExit: () => map(),
    onComplete: done,
  });
}

function tracing(done) {
  const letter = pick('ABCDEFHILMNOPTUVWXZ'.split(''));
  traceOne({ main, bar, list: [letter], n: 0, kind: 'upper', onDone: done });
}

function treasure() {
  main.innerHTML = '';
  const chest = el('button', 'treasure-chest', '🎁');
  chest.setAttribute('aria-label', 'Open the treasure');
  main.append(el('p', 'prompt-text', 'Tap to open the treasure!'), chest);
  say('Tap to open the treasure!');
  chest.addEventListener('click', () => {
    sfx('win');
    const r = chest.getBoundingClientRect();
    burstAt(r.left + r.width / 2, r.top + r.height / 2, ['💎', '⭐', '👑', '💖']);
    const p = progress();
    p.done = STOPS.length;
    save(KEY, p);
    logRound('adventure');
    doneScreen(main, {
      onAgain: () => map(),
      onBack: () => map(),
      message: `Adventure complete, ${KID}!`,
    });
  });
}
