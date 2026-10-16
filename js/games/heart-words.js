// Heart Words: sight words Lydia learns to know "by heart".
import { topBar, modePicker, say, sfx, shuffle, sample, cheer, tryAgain, wiggle, doneScreen, el, KID } from '../common.js';
import { runQuiz } from '../quiz.js';
import { getWords, pickPracticeWord, recordAnswer } from '../words-store.js';
import { hush } from '../music.js';

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
    { emoji: '🎤', name: 'Say It!', color: 'orange', start: () => withWords(sayIt) },
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
  return shuffle(['Great job!', 'You know it!', 'Super reading!', `Way to go, ${KID}!`])[0];
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

// Say It: she reads the word into the microphone, hears herself, then hears Sparkle say it.
// The microphone only works on the secure (https) address; see Grown-ups.
const canRecord = () => window.isSecureContext && navigator.mediaDevices?.getUserMedia && 'MediaRecorder' in window;

function sayIt() {
  if (!canRecord()) {
    main.innerHTML = `<p class="note">🎤 The microphone needs the secure address.<br>Grown-ups: open <b>Grown-ups ⚙️ → Microphone</b> to set it up.</p>`;
    say('Ask a grown-up to turn on the microphone!');
    return;
  }
  const ROUND = 5;
  let round = 0;
  let last = null;
  next();

  function next() {
    if (round >= ROUND) {
      bar.onRepeat(null);
      doneScreen(main, { onAgain: sayIt, onBack: showPicker, message: 'Great reading out loud!' });
      return;
    }
    const word = pickPracticeWord(words, last);
    last = word;
    main.innerHTML = '';
    const progress = el('div', 'progress');
    for (let i = 0; i < ROUND; i++) progress.appendChild(el('span', i < round ? 'done' : ''));
    const card = el('div', 'choice word say-card', word);
    const meter = el('div', 'mic-meter');
    meter.appendChild(el('i'));
    const mic = el('button', 'mic-btn', '🎤');
    mic.setAttribute('aria-label', 'Record');
    const after = el('div', 'choices');
    after.hidden = true;
    const again = el('button', 'round-btn big-action', '🔁');
    again.setAttribute('aria-label', 'Try again');
    const go = el('button', 'round-btn big-action', '➡️');
    go.setAttribute('aria-label', 'Next word');
    after.append(again, go);
    main.append(progress, card, meter, mic, after);

    const prompt = 'Can you read this word? Tap the microphone and say it!';
    bar.onRepeat(() => say(prompt));
    say(prompt);

    let recording = null;
    mic.addEventListener('click', async () => {
      if (recording) return recording.stop();
      try {
        recording = await record(meter, mic);
      } catch {
        main.querySelector('.note')?.remove();
        main.appendChild(el('p', 'note', '🎤 The microphone is off. Grown-ups: allow the microphone for this site in Safari.'));
        say('Hmm, I can\'t hear you. Ask a grown-up to turn on the microphone.');
        return;
      }
      const clip = await recording.done;
      recording = null;
      sfx('pop');
      await say('Here is you!');
      await play(clip);
      await say(`Sparkle says: ${word}.`);
      recordAnswer(word, true);
      after.hidden = false;
    });
    again.addEventListener('click', () => {
      sfx('tap');
      after.hidden = true;
      say('Tap the microphone and say it again!');
    });
    go.addEventListener('click', async () => {
      await cheer(pick2());
      round++;
      next();
    });
  }
}

// Records up to 3 seconds (or until tapped again). Resolves with { stop, done: Promise<Blob URL> }.
async function record(meter, mic) {
  hush(true);
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const type = ['audio/mp4', 'audio/webm', ''].find((t) => !t || MediaRecorder.isTypeSupported(t));
  const rec = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
  const chunks = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  // A bouncing bar shows she's being heard.
  const AC = window.AudioContext || window.webkitAudioContext;
  const ac = new AC();
  const an = ac.createAnalyser();
  an.fftSize = 512;
  ac.createMediaStreamSource(stream).connect(an);
  const buf = new Uint8Array(an.fftSize);
  const fill = meter.firstChild;
  let raf;
  (function level() {
    an.getByteTimeDomainData(buf);
    let peak = 0;
    for (const v of buf) peak = Math.max(peak, Math.abs(v - 128));
    fill.style.width = `${Math.min(100, (peak / 64) * 100)}%`;
    raf = requestAnimationFrame(level);
  })();
  mic.classList.add('recording');
  mic.textContent = '⏹️';
  const done = new Promise((resolve) => {
    rec.onstop = () => {
      cancelAnimationFrame(raf);
      fill.style.width = "0%";
      stream.getTracks().forEach((t) => t.stop());
      ac.close();
      mic.classList.remove('recording');
      mic.textContent = '🎤';
      hush(false);
      resolve(URL.createObjectURL(new Blob(chunks, { type: rec.mimeType || type || 'audio/mp4' })));
    };
  });
  rec.start();
  const timer = setTimeout(() => rec.state === 'recording' && rec.stop(), 3000);
  return {
    stop: () => {
      clearTimeout(timer);
      if (rec.state === 'recording') rec.stop();
    },
    done,
  };
}

function play(url) {
  return new Promise((resolve) => {
    const a = new Audio(url);
    a.onended = a.onerror = () => resolve();
    a.play().catch(resolve);
    setTimeout(resolve, 4000);
  });
}
