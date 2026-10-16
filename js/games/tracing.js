// Tracing: trace big letters, little letters, numbers, and her name with a finger.
// Each letter is drawn stroke by stroke in the right order: a green dot shows where to start,
// a little star shows the way, and the line fills with color as her finger follows it.
import { topBar, modePicker, doneScreen, shuffle, KID } from '../common.js';
import { traceOne } from '../trace-pad.js';
import { GLYPHS } from '../trace-paths.js';
import { logRound } from '../activity.js';

const main = document.getElementById('app');
const bar = topBar({ title: 'Tracing' });

const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const LOWER = 'abcdefghijklmnopqrstuvwxyz'.split('');
const DIGITS = '0123456789'.split('');
const ROUND = 5;

const showPicker = modePicker({
  main,
  bar,
  title: 'Tracing',
  intro: 'Tracing! Pick what to write.',
  modes: [
    { emoji: '🅰️', name: 'Big Letters', color: 'blue', start: () => round(shuffle(UPPER).slice(0, ROUND), 'upper') },
    { emoji: '🔡', name: 'Little Letters', color: 'purple', start: () => round(shuffle(LOWER).slice(0, ROUND), 'lower') },
    { emoji: '🔢', name: 'Numbers', color: 'yellow', start: () => round(shuffle(DIGITS).slice(0, ROUND), 'numbers') },
    { emoji: '✍️', name: 'My Name', color: 'pink', start: () => round([...KID].filter((c) => GLYPHS[c]), 'name') },
  ],
});

function round(list, kind) {
  let n = 0;
  const again = () => round(kind === 'name' ? list : shuffle(kind === 'upper' ? UPPER : kind === 'lower' ? LOWER : DIGITS).slice(0, ROUND), kind);
  const next = () => {
    if (n < list.length) {
      traceOne({ main, bar, list, n, kind, onDone: () => {
        n++;
        next();
      } });
      return;
    }
    logRound('tracing');
    bar.onRepeat(null);
    doneScreen(main, {
      onAgain: again,
      onBack: showPicker,
      message: kind === 'name' ? `You wrote your name, ${KID}!` : `Great tracing, ${KID}!`,
    });
  };
  next();
}
