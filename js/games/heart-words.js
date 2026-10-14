// Heart Words: sight words Lydia learns to know "by heart".
import { topBar, modePicker, say, sfx, shuffle, sample, cheer, tryAgain, wiggle, doneScreen, el } from '../common.js';
import { runQuiz } from '../quiz.js';
import { getWords, pickPracticeWord, recordAnswer } from '../words-store.js';

const main = document.getElementById('app');
const bar = topBar({ title: 'Heart Words' });

const esc = (s) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

let words = [];

const showPicker = modePicker({
  main,
  bar,
  title: 'Heart Words',
  intro: 'Heart words! Pick a game.',
  modes: [
    { emoji: '👂', name: 'Find the Word', color: 'pink', start: () => withWords(findTheWord) },
    { emoji: '🃏', name: 'Flash Cards', color: 'purple', start: () => withWords(flashCards) },
    { emoji: '🔠', name: 'Build the Word', color: 'blue', start: () => withWords(buildTheWord) },
  ],
});

async function withWords(game) {
  words = await getWords();
  if (words.length < 2) {
    main.innerHTML = '<p class="note">Ask a grown-up to add some heart words first! ❤️</p>';
    say('Ask a grown-up to add some heart words first!');
    return;
  }
  game();
}

// Listen and tap the word she hears.
function findTheWord() {
  let last = null;
  runQuiz({
    main,
    bar,
    count: Math.min(8, Math.max(5, words.length)),
    makeQuestion: () => {
      const word = pickPracticeWord(words, last);
      last = word;
      const others = sample(words.filter((w) => w.toLowerCase() !== word.toLowerCase()), words.length >= 6 ? 3 : 2);
      return {
        say: `Find the word: ${word}.`,
        text: 'Find the word you hear 👂',
        choices: shuffle([word, ...others]).map((w) => ({ value: w, html: esc(w), className: 'word' })),
        answer: word,
        praise: `Yes! ${word}! ${pick2()}`,
      };
    },
    onAnswer: (q, right, firstTry) => {
      if (right && firstTry) recordAnswer(q.answer, true);
      if (!right && firstTry) recordAnswer(q.answer, false);
    },
    onExit: showPicker,
  });
}

function pick2() {
  return shuffle(['Great job!', 'You know it!', 'Super reading!', 'Way to go, Lydia!'])[0];
}

// Big word on a card. Tap to hear it. Arrows to move. Good for reading together.
function flashCards() {
  const deck = shuffle(words);
  let i = 0;
  bar.onRepeat(() => say(deck[i]));

  main.innerHTML = '';
  const card = el('button', 'choice word');
  card.style.cssText = 'min-width:min(80vw,560px);min-height:300px;font-size:clamp(72px,14vw,140px)';
  const count = el('p', 'note');
  const row = el('div', 'choices');
  const prev = el('button', 'round-btn', '⬅️');
  const next = el('button', 'round-btn', '➡️');
  prev.style.cssText = next.style.cssText = 'width:110px;height:110px;font-size:52px';
  prev.setAttribute('aria-label', 'Previous word');
  next.setAttribute('aria-label', 'Next word');
  row.append(prev, next);
  main.append(card, count, row);

  function show() {
    card.textContent = deck[i];
    count.textContent = `${i + 1} of ${deck.length} · tap the card to hear it`;
  }
  card.addEventListener('click', () => {
    sfx('tap');
    say(deck[i]);
  });
  prev.addEventListener('click', () => {
    sfx('tap');
    i = (i - 1 + deck.length) % deck.length;
    show();
  });
  next.addEventListener('click', () => {
    sfx('tap');
    i++;
    if (i >= deck.length) {
      doneScreen(main, { onAgain: flashCards, onBack: showPicker, message: 'You read them all!' });
      bar.onRepeat(null);
      return;
    }
    show();
  });
  show();
}

// Tap the letters in order to build the word she hears.
function buildTheWord() {
  const ROUND = 5;
  let round = 0;
  let last = null;

  function next() {
    // Single letters ("I", "a") are too easy to build; prefer longer words when there are some.
    const longer = words.filter((w) => w.replace(/\s/g, '').length >= 2);
    const word = pickPracticeWord(longer.length >= 2 ? longer : words, last);
    last = word;
    const letters = [...word.replace(/\s/g, '')];
    let pos = 0;

    main.innerHTML = '';
    const progress = el('div', 'progress');
    for (let i = 0; i < ROUND; i++) progress.appendChild(el('span', i < round ? 'done' : ''));
    const prompt = el('p', 'prompt-text', 'Build the word you hear 🔠');
    const slots = el('div', 'choices');
    const slotEls = letters.map(() => {
      const s = el('div', 'choice word', ' ');
      s.style.cssText = 'min-width:110px;min-height:120px;background:#f3ead9;box-shadow:none';
      slots.appendChild(s);
      return s;
    });
    const tiles = el('div', 'choices');
    for (const letter of shuffle(letters)) {
      const t = el('button', 'choice word', letter);
      t.style.cssText = 'min-width:110px;min-height:110px';
      t.addEventListener('click', () => tap(t, letter));
      tiles.appendChild(t);
    }
    main.append(progress, prompt, slots, tiles);

    const spoken = `Build the word: ${word}.`;
    bar.onRepeat(() => say(spoken));
    say(spoken);

    let firstTry = true;
    async function tap(tile, letter) {
      if (tile.disabled) return;
      if (letter.toLowerCase() !== letters[pos].toLowerCase()) {
        firstTry = false;
        say(tryAgain(tile));
        wiggle(slotEls[pos]);
        return;
      }
      sfx('tap');
      tile.disabled = true;
      tile.style.visibility = 'hidden';
      slotEls[pos].textContent = letters[pos];
      slotEls[pos].style.background = '#dff7e4';
      pos++;
      if (pos < letters.length) return;
      recordAnswer(word, firstTry);
      await cheer(`${word}! You built it!`);
      round++;
      if (round >= ROUND) {
        doneScreen(main, { onAgain: buildTheWord, onBack: showPicker });
        bar.onRepeat(null);
      } else next();
    }
  }
  next();
}
