// Shapes, Colors & Patterns.
import { topBar, modePicker, pick, sample, shuffle, randInt } from '../common.js';
import { runQuiz } from '../quiz.js';

const main = document.getElementById('app');
const bar = topBar({ title: 'Shapes & Colors' });

const COLORS = {
  red: '#ef4444',
  blue: '#3b82f6',
  yellow: '#facc15',
  green: '#22c55e',
  orange: '#f97316',
  purple: '#a855f7',
  pink: '#f472b6',
};

const SHAPES = {
  circle: '<circle cx="50" cy="50" r="42"/>',
  square: '<rect x="12" y="12" width="76" height="76" rx="6"/>',
  triangle: '<polygon points="50,8 94,90 6,90" stroke-linejoin="round"/>',
  star: '<polygon points="50,5 61,38 96,38 68,59 78,93 50,72 22,93 32,59 4,38 39,38"/>',
  heart: '<path d="M50 88 C20 65 6 48 6 30 A20 20 0 0 1 50 22 A20 20 0 0 1 94 30 C94 48 80 65 50 88Z"/>',
  rectangle: '<rect x="4" y="26" width="92" height="48" rx="6"/>',
  diamond: '<polygon points="50,4 92,50 50,96 8,50"/>',
  oval: '<ellipse cx="50" cy="50" rx="44" ry="30"/>',
};
const SHAPE_NAMES = Object.keys(SHAPES);
const COLOR_NAMES = Object.keys(COLORS);
const plural = (s) => `${s}s`;

function svg(shape, color, { outline = false } = {}) {
  const fill = outline ? 'none' : COLORS[color];
  const stroke = outline ? '#6c6f86' : 'rgba(0,0,0,.15)';
  return `<svg viewBox="0 0 100 100" aria-hidden="true" fill="${fill}" stroke="${stroke}" stroke-width="${outline ? 6 : 3}">${SHAPES[shape]}</svg>`;
}

const showPicker = modePicker({
  main,
  bar,
  title: 'Shapes & Colors',
  intro: 'Shapes and colors! Pick a game.',
  modes: [
    { emoji: '🔺', name: 'Find It', color: 'green', start: findIt },
    { emoji: '🔴🔵', name: "What's Next?", color: 'purple', start: patterns },
    { emoji: '🧺', name: 'Sort It', color: 'orange', start: sortIt },
  ],
});

function findIt() {
  runQuiz({
    main,
    bar,
    makeQuestion: (i) => {
      const kind = ['shape', 'color', 'both'][i % 3];
      if (kind === 'shape') {
        const shapes = sample(SHAPE_NAMES, 3);
        const target = shapes[0];
        return {
          say: `Find the ${target}.`,
          text: 'Find the shape 👀',
          choices: shuffle(shapes).map((s) => ({ value: s, html: svg(s, pick(COLOR_NAMES)), label: s })),
          answer: target,
          praise: `Yes! That's the ${target}!`,
        };
      }
      if (kind === 'color') {
        const colors = sample(COLOR_NAMES, 3);
        const target = colors[0];
        const shape = pick(SHAPE_NAMES);
        return {
          say: `Find the ${target} one.`,
          text: 'Find the color 🎨',
          choices: shuffle(colors).map((c) => ({ value: c, html: svg(shape, c), label: `${c} ${shape}` })),
          answer: target,
          praise: `Yes! ${target}!`,
        };
      }
      // Both: same shapes in different colors plus different shapes in the same color, so she has to check both.
      const [shape, otherShape] = sample(SHAPE_NAMES, 2);
      const [color, otherColor] = sample(COLOR_NAMES, 2);
      const options = [
        [shape, color],
        [shape, otherColor],
        [otherShape, color],
      ];
      return {
        say: `Find the ${color} ${shape}.`,
        text: 'Find it 👀',
        choices: shuffle(options).map(([s, c]) => ({ value: `${c} ${s}`, html: svg(s, c), label: `${c} ${s}` })),
        answer: `${color} ${shape}`,
        praise: `Yes! The ${color} ${shape}!`,
      };
    },
    onExit: showPicker,
  });
}

const PATTERNS = ['AB', 'AAB', 'ABB', 'ABC'];

function patterns() {
  runQuiz({
    main,
    bar,
    makeQuestion: (i) => {
      const kind = PATTERNS[Math.min(PATTERNS.length - 1, Math.floor(i / 2) + randInt(0, 1))];
      // Pattern by color (same shape) or by shape (same color).
      const byColor = Math.random() < 0.5;
      const parts = byColor ? sample(COLOR_NAMES, 3) : sample(SHAPE_NAMES, 3);
      const fixed = byColor ? pick(SHAPE_NAMES) : pick(COLOR_NAMES);
      const draw = (p) => (byColor ? svg(fixed, p) : svg(p, fixed));
      const seq = [];
      while (seq.length < Math.max(6, kind.length * 2 + 1)) seq.push(...kind);
      const shown = seq.slice(0, Math.min(7, seq.length - 1));
      const next = kind[shown.length % kind.length];
      const letterToPart = { A: parts[0], B: parts[1], C: parts[2] };
      const used = [...new Set(kind)].map((l) => letterToPart[l]);
      const options = used.length >= 3 ? used : [...used, parts[2]];
      return {
        say: 'What comes next?',
        text: 'What comes next? 🤔',
        show: shown.map((l) => draw(letterToPart[l])).join('') + '<span style="font-size:.9em">❓</span>',
        choices: shuffle(options).map((p) => ({ value: p, html: draw(p), label: p })),
        answer: letterToPart[next],
        praise: pick(['Yes! You found the pattern!', 'Pattern power!', 'Great job, Lydia!']),
      };
    },
    onExit: showPicker,
  });
}

function sortIt() {
  runQuiz({
    main,
    bar,
    count: 8,
    makeQuestion: () => {
      const byColor = Math.random() < 0.5;
      if (byColor) {
        const [a, b] = sample(COLOR_NAMES, 2);
        const target = pick([a, b]);
        const shape = pick(SHAPE_NAMES);
        const bucket = (c) => ({
          value: c,
          html: `<span style="display:flex;flex-direction:column;align-items:center;font-size:.6em">🧺<span style="color:${COLORS[c]}">${c}</span></span>`,
          label: `${c} basket`,
          className: 'wide',
        });
        return {
          say: `Which basket does the ${target} ${shape} go in? ${a}, or ${b}?`,
          text: 'Which basket? 🧺',
          show: svg(shape, target),
          choices: [bucket(a), bucket(b)],
          answer: target,
          praise: `Yes! It's ${target}!`,
        };
      }
      const [a, b] = sample(SHAPE_NAMES, 2);
      const target = pick([a, b]);
      const bucket = (s) => ({
        value: s,
        html: `<span style="display:flex;flex-direction:column;align-items:center;font-size:.6em">${svg(s, null, { outline: true })}<span>${plural(s)}</span></span>`,
        label: `${plural(s)} basket`,
        className: 'wide',
      });
      return {
        say: `Is it a ${a}, or a ${b}? Put it in the right basket.`,
        text: 'Which basket? 🧺',
        show: svg(target, pick(COLOR_NAMES)),
        choices: [bucket(a), bucket(b)],
        answer: target,
        praise: `Yes! It's a ${target}!`,
      };
    },
    onExit: showPicker,
  });
}
