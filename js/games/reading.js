// Reading: sound out short words, build sentences from heart words, and find rhymes.
import { topBar, modePicker, say, sfx, pick, shuffle, sample, cheer, tryAgain, wiggle, doneScreen, el, prefetch } from '../common.js';
import { runQuiz } from '../quiz.js';
import { getWords } from '../words-store.js';
import { logRound, logAnswer } from '../activity.js';

const main = document.getElementById('app');
const bar = topBar({ title: 'Reading' });

const showPicker = modePicker({
  main,
  bar,
  title: 'Reading',
  intro: 'Reading! Pick a game.',
  modes: [
    { emoji: '🐱', name: 'Sound It Out', color: 'orange', start: soundItOut },
    { emoji: '📝', name: 'Make a Sentence', color: 'blue', start: sentences },
    { emoji: '🎩', name: 'Rhyme Time', color: 'green', start: rhymeTime },
  ],
});

// ---------- Letter sounds ----------
// The natural voice can say exact speech sounds (phonemes in [[ ]]); the iPad's voice gets a
// spelled-out version instead. Stretchy sounds (m, s, f…) are doubled so they last a moment.
const SOUNDS = {
  a: ['ˈæ', 'aah'], b: ['bə', 'buh'], c: ['kə', 'kuh'], d: ['də', 'duh'], e: ['ˈɛ', 'eh'],
  f: ['ff', 'fff'], g: ['ɡə', 'guh'], h: ['hə', 'huh'], i: ['ˈɪ', 'ih'], j: ['dʒə', 'juh'],
  k: ['kə', 'kuh'], l: ['ll', 'lll'], m: ['mm', 'mmm'], n: ['nn', 'nnn'], o: ['ˈɑ', 'ah'],
  p: ['pə', 'puh'], r: ['ɹɹ', 'rrr'], s: ['ss', 'sss'], t: ['tə', 'tuh'], u: ['ˈʌ', 'uh'],
  v: ['vv', 'vvv'], w: ['wə', 'wuh'], x: ['ks', 'ks'], y: ['jə', 'yuh'], z: ['zz', 'zzz'],
};
const soundText = (l) => `[[ ${SOUNDS[l][0]} ]]`;
const saySound = (l) => say(soundText(l), { ipad: SOUNDS[l][1] });

// Short words she can sound out, each with a picture.
const CVC = [
  ['cat', '🐱'], ['dog', '🐶'], ['pig', '🐷'], ['bug', '🐛'], ['sun', '☀️'], ['bus', '🚌'],
  ['hat', '🎩'], ['bed', '🛏️'], ['box', '📦'], ['cup', '🥤'], ['fox', '🦊'], ['hen', '🐔'],
  ['map', '🗺️'], ['pen', '🖊️'], ['web', '🕸️'], ['bat', '🦇'], ['rat', '🐀'], ['van', '🚐'],
  ['log', '🪵'], ['leg', '🦵'], ['lip', '👄'], ['can', '🥫'], ['nut', '🥜'], ['pan', '🍳'],
  ['pin', '📌'], ['six', '6️⃣'], ['ten', '🔟'], ['tub', '🛁'], ['hug', '🤗'], ['bag', '👜'],
  ['mug', '☕'], ['sad', '😢'], ['net', '🥅'], ['kid', '🧒'], ['red', '🟥'],
].map(([word, emoji]) => ({ word, emoji }));

// Other pictures that share letters with the word, so she has to blend all three sounds.
function lookAlikes(target, n = 2) {
  const shared = (w) => [...w.word].filter((c, i) => c === target.word[i]).length;
  const others = shuffle(CVC.filter((w) => w.word !== target.word));
  others.sort((a, b) => shared(b) - shared(a));
  return sample(others.slice(0, 6), n);
}

function soundItOut() {
  let last = null;
  runQuiz({
    main,
    bar,
    count: 6,
    makeQuestion: () => {
      const target = pick(CVC.filter((w) => w.word !== last));
      last = target.word;
      const letters = [...target.word];
      prefetch(letters.map(soundText));

      const box = el('div', 'blend');
      const row = el('div', 'blend-letters');
      const tiles = letters.map((l) => {
        const t = el('button', 'blend-letter', l);
        t.setAttribute('aria-label', `sound ${l}`);
        t.addEventListener('click', () => {
          sfx('tap');
          light(t);
          saySound(l);
        });
        row.appendChild(t);
        return t;
      });
      // Slide a finger under the word (or tap the arrow) to hear the sounds one after another.
      const slide = el('button', 'blend-slide', '👉');
      slide.setAttribute('aria-label', 'Sound it out');
      let sliding = false;
      const blend = async () => {
        if (sliding) return;
        sliding = true;
        for (const [j, l] of letters.entries()) {
          light(tiles[j]);
          await saySound(l);
          await new Promise((r) => setTimeout(r, 120));
        }
        sliding = false;
      };
      slide.addEventListener('click', blend);
      slide.addEventListener('pointermove', (e) => e.buttons && blend());
      box.append(row, slide);
      return {
        say: 'Sound it out! Tap each letter, then find the picture.',
        show: box,
        choices: shuffle([target, ...lookAlikes(target)]).map((w) => ({
          value: w.word,
          html: `<span style="font-size:1.5em">${w.emoji}</span>`,
          label: w.word,
        })),
        answer: target.word,
        praise: `Yes! ${target.word}!`,
      };
    },
    onExit: showPicker,
  });
}

function light(tile) {
  tile.classList.remove('lit');
  void tile.offsetWidth;
  tile.classList.add('lit');
}

// ---------- Make a Sentence ----------
// Short sentences made mostly of heart words. She hears one, then taps the words in order.
const SENTENCES = [
  ['I see a cat', '🐱'], ['I like the dog', '🐶'], ['We can go', '🚗'], ['Look at me', '🙋‍♀️'],
  ['I can see the sun', '☀️'], ['My cat is big', '🐈'], ['I like you', '💖'], ['He can run', '🏃'],
  ['She can hop', '🐰'], ['It is a bug', '🐛'], ['I have a hat', '🎩'], ['We like to play', '🛝'],
  ['You can see me', '👀'], ['The dog said woof', '🐕'], ['Look at the bus', '🚌'], ['Go to bed', '🛏️'],
  ['I see my mom', '👩'], ['The fish is red', '🐟'], ['We go up', '🎈'], ['I like to read', '📚'],
].map(([text, emoji]) => ({ text, emoji, words: text.split(' ') }));

async function sentences() {
  const known = new Set((await getWords()).map((w) => w.toLowerCase()));
  // Favor sentences where most words are ones she's practicing.
  const score = (s) => s.words.filter((w) => known.has(w.toLowerCase())).length / s.words.length + Math.random() * 0.4;
  const list = [...SENTENCES].sort((a, b) => score(b) - score(a)).slice(0, 5);
  let n = 0;

  function next() {
    if (n >= list.length) {
      logRound('reading');
      bar.onRepeat(null);
      doneScreen(main, { onAgain: sentences, onBack: showPicker, message: 'Super reading!' });
      return;
    }
    const s = list[n];
    let pos = 0;
    let firstTry = true;
    main.innerHTML = '';
    const pic = el('div', 'sentence-pic', s.emoji);
    const slots = el('div', 'sentence-slots');
    const slotEls = s.words.map((w, j) => {
      const sl = el('span', 'sentence-slot', ' ');
      if (j === s.words.length - 1) sl.dataset.end = '.';
      slots.appendChild(sl);
      return sl;
    });
    const tiles = el('div', 'choices');
    for (const w of shuffle(s.words)) {
      // Tiles are lowercase so the capital letter doesn't give away the first word.
      const t = el('button', 'choice word', w === 'I' ? w : w.toLowerCase());
      t.dataset.word = w;
      t.style.minWidth = '120px';
      t.addEventListener('click', () => tap(t, w));
      tiles.appendChild(t);
    }
    main.append(el('p', 'prompt-text', 'Make the sentence 📝'), pic, slots, tiles);
    const prompt = `Make the sentence: ${s.text}.`;
    bar.onRepeat(() => say(prompt));
    say(prompt);

    let help = null;
    async function tap(tile, w) {
      if (tile.disabled) return;
      if (w !== s.words[pos]) {
        firstTry = false;
        say(tryAgain(tile));
        wiggle(slotEls[pos]);
        // After a miss, the right word gives a little bounce.
        clearTimeout(help);
        help = setTimeout(() => {
          const right = [...tiles.children].find((b) => !b.disabled && b.dataset.word === s.words[pos]);
          right?.classList.add('help');
        }, 1500);
        return;
      }
      clearTimeout(help);
      sfx('tap');
      tile.disabled = true;
      tile.style.visibility = 'hidden';
      tiles.querySelectorAll('.help').forEach((b) => b.classList.remove('help'));
      slotEls[pos].textContent = pos === 0 ? w[0].toUpperCase() + w.slice(1) : w;
      slotEls[pos].classList.add('filled');
      pos++;
      if (pos < s.words.length) return;
      logAnswer('reading', firstTry);
      // Read it back, lighting up each word.
      slotEls.forEach((sl, j) => setTimeout(() => sl.classList.add('read'), 250 + j * 330));
      await say(`${s.text}.`);
      await cheer(pick(['You read it!', 'Great reading!', 'You made a sentence!']));
      n++;
      next();
    }
  }
  next();
}

// ---------- Rhyme Time ----------
const RHYMES = [
  [['cat', '🐱'], ['hat', '🎩'], ['bat', '🦇'], ['rat', '🐀']],
  [['dog', '🐶'], ['frog', '🐸'], ['log', '🪵']],
  [['bee', '🐝'], ['tree', '🌳'], ['key', '🔑'], ['three', '3️⃣']],
  [['cake', '🎂'], ['snake', '🐍']],
  [['ring', '💍'], ['king', '🤴'], ['swing', '🛝']],
  [['car', '🚗'], ['star', '⭐'], ['jar', '🫙']],
  [['fish', '🐟'], ['dish', '🍽️']],
  [['sock', '🧦'], ['clock', '🕐'], ['rock', '🪨'], ['lock', '🔒']],
  [['goat', '🐐'], ['boat', '⛵'], ['coat', '🧥']],
  [['bug', '🐛'], ['mug', '☕'], ['hug', '🤗']],
  [['snail', '🐌'], ['mail', '📬'], ['pail', '🪣']],
  [['house', '🏠'], ['mouse', '🐭']],
  [['bear', '🐻'], ['pear', '🍐'], ['chair', '🪑']],
  [['van', '🚐'], ['pan', '🍳'], ['can', '🥫']],
  [['bed', '🛏️'], ['sled', '🛷'], ['red', '🟥']],
  [['fox', '🦊'], ['box', '📦']],
  [['moon', '🌙'], ['spoon', '🥄'], ['balloon', '🎈']],
  [['train', '🚂'], ['rain', '🌧️'], ['chain', '⛓️']],
  [['ship', '🚢'], ['lip', '👄']],
  [['sun', '☀️'], ['bun', '🍔']],
].map((fam) => fam.map(([word, emoji]) => ({ word, emoji })));

function rhymeTime() {
  let lastFam = -1;
  runQuiz({
    main,
    bar,
    makeQuestion: () => {
      let f;
      do f = Math.floor(Math.random() * RHYMES.length);
      while (f === lastFam);
      lastFam = f;
      const [target, match] = sample(RHYMES[f], 2);
      const others = sample(RHYMES.filter((_, j) => j !== f), 2).map((fam) => pick(fam));
      const choices = shuffle([match, ...others]);
      const names = choices.map((c) => c.word);
      return {
        say: `${target.word}. Which one rhymes with ${target.word}? ${names[0]}, ${names[1]}, or ${names[2]}?`,
        text: 'Which one rhymes? 🎵',
        show: `<span class="rhyme-target"><span>${target.emoji}</span><b>${target.word}</b></span>`,
        choices: choices.map((c) => ({
          value: c.word,
          html: `<span class="pic-word"><span>${c.emoji}</span><small>${c.word}</small></span>`,
          label: c.word,
        })),
        answer: match.word,
        praise: `Yes! ${target.word}, ${match.word}! They rhyme!`,
      };
    },
    onExit: showPicker,
  });
}
