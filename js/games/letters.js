// Letters & Sounds: hear-and-tap letters, big/little match, beginning sounds.
import { topBar, modePicker, pick, sample, shuffle } from '../common.js';
import { runQuiz } from '../quiz.js';
import { logMix } from '../activity.js';

// Remember which letters she mixes up (e.g. b and d) for the Grown-ups progress page.
const noteMix = (q, right, firstTry, choice) => {
  if (!right) logMix('letters', q.answer, choice.value);
};

const main = document.getElementById('app');
const bar = topBar({ title: 'Letters' });

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

// Pictures with a clear first letter. Skips Q and X (no good kid pictures).
const PICTURES = [
  ['A', 'apple', '🍎'], ['A', 'ant', '🐜'],
  ['B', 'bear', '🐻'], ['B', 'banana', '🍌'], ['B', 'bee', '🐝'],
  ['C', 'cat', '🐱'], ['C', 'car', '🚗'], ['C', 'cake', '🎂'],
  ['D', 'dog', '🐶'], ['D', 'duck', '🦆'],
  ['E', 'egg', '🥚'], ['E', 'elephant', '🐘'],
  ['F', 'fish', '🐟'], ['F', 'frog', '🐸'],
  ['G', 'grapes', '🍇'], ['G', 'goat', '🐐'],
  ['H', 'hat', '🎩'], ['H', 'house', '🏠'], ['H', 'horse', '🐴'],
  ['I', 'ice cream', '🍦'],
  ['J', 'juice', '🧃'], ['J', 'jellyfish', '🪼'],
  ['K', 'kite', '🪁'], ['K', 'key', '🔑'],
  ['L', 'lion', '🦁'], ['L', 'lemon', '🍋'],
  ['M', 'moon', '🌙'], ['M', 'monkey', '🐵'],
  ['N', 'nose', '👃'],
  ['O', 'octopus', '🐙'], ['O', 'orange', '🍊'],
  ['P', 'pig', '🐷'], ['P', 'pizza', '🍕'],
  ['R', 'rabbit', '🐰'], ['R', 'rainbow', '🌈'],
  ['S', 'sun', '☀️'], ['S', 'snake', '🐍'],
  ['T', 'tiger', '🐯'], ['T', 'tree', '🌳'],
  ['U', 'umbrella', '☂️'],
  ['V', 'volcano', '🌋'],
  ['W', 'whale', '🐳'], ['W', 'watermelon', '🍉'],
  ['Y', 'yo-yo', '🪀'],
  ['Z', 'zebra', '🦓'],
].map(([letter, word, emoji]) => ({ letter, word, emoji }));

// TTS reads a lone "A" as the word "a", so spell out how to say each letter name.
const LETTER_NAME = { A: 'ay', I: 'eye', O: 'oh', U: 'you' };
const letterName = (l) => LETTER_NAME[l.toUpperCase()] || l.toUpperCase();

const showPicker = modePicker({
  main,
  bar,
  title: 'Letters',
  intro: 'Letters! Pick a game.',
  modes: [
    { emoji: '🔤', name: 'Find the Letter', color: 'blue', start: findLetter },
    { emoji: '🅰️', name: 'Big & Little', color: 'purple', start: bigLittle },
    { emoji: '🐻', name: 'First Sounds', color: 'orange', start: firstSounds },
  ],
});

function findLetter() {
  let last = null;
  runQuiz({
    main,
    bar,
    makeQuestion: () => {
      const letter = pick(ALPHABET.filter((l) => l !== last));
      last = letter;
      const others = sample(ALPHABET.filter((l) => l !== letter), 3);
      return {
        say: `Find the letter, ${letterName(letter)}.`,
        text: 'Find the letter you hear 👂',
        choices: shuffle([letter, ...others]).map((l) => ({ value: l, html: l, label: `Letter ${l}` })),
        answer: letter,
        praise: `Yes! That's ${letterName(letter)}!`,
      };
    },
    onAnswer: noteMix,
    onExit: showPicker,
  });
}

function bigLittle() {
  let last = null;
  runQuiz({
    main,
    bar,
    makeQuestion: () => {
      const letter = pick(ALPHABET.filter((l) => l !== last));
      last = letter;
      const others = sample(ALPHABET.filter((l) => l !== letter), 2);
      return {
        say: `This is big ${letterName(letter)}. Find little ${letterName(letter)}.`,
        text: 'Find the little letter',
        show: `<span style="font-size:1.6em;font-weight:800">${letter}</span>`,
        choices: shuffle([letter, ...others]).map((l) => ({
          value: l,
          html: l.toLowerCase(),
          label: `little ${l.toLowerCase()}`,
        })),
        answer: letter,
        praise: `Yes! Big ${letterName(letter)}, little ${letterName(letter)}!`,
      };
    },
    onAnswer: noteMix,
    onExit: showPicker,
  });
}

function firstSounds() {
  let last = null;
  runQuiz({
    main,
    bar,
    makeQuestion: () => {
      const target = pick(PICTURES.filter((p) => p.letter !== last));
      last = target.letter;
      // Other pictures must start with different letters (and not C/K, which sound alike).
      const soundAlike = { C: 'K', K: 'C' };
      const otherLetters = [...new Set(PICTURES.map((p) => p.letter))].filter(
        (l) => l !== target.letter && l !== soundAlike[target.letter],
      );
      const others = sample(otherLetters, 2).map((l) => pick(PICTURES.filter((p) => p.letter === l)));
      return {
        say: `Which picture starts with ${letterName(target.letter)}?`,
        text: 'Which one starts with…',
        show: `<span style="font-size:1.5em;font-weight:800">${target.letter} ${target.letter.toLowerCase()}</span>`,
        choices: shuffle([target, ...others]).map((p) => ({
          value: p.word,
          html: `<span style="font-size:1.4em">${p.emoji}</span>`,
          label: p.word,
        })),
        answer: target.word,
        praise: `Yes! ${target.word} starts with ${letterName(target.letter)}!`,
      };
    },
    onExit: showPicker,
  });
}
