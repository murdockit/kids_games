// A small multiple-choice round runner shared by most games.
//
// makeQuestion(index) returns:
//   { say: 'Find the word the',          // spoken prompt (also the 🔊 repeat)
//     text: 'Find the word',             // optional big text above the picture
//     show: Node | string,               // optional picture/content for the prompt (string = HTML)
//     choices: [{ value, html, label?, className? }],
//     answer: value,
//     praise: 'The!' }                   // optional thing to say when right (instead of a random cheer)
//
// Wrong taps wiggle and let her try again; no timers, no losing.
import { cheer, tryAgain, say, doneScreen, sfx, shuffle, prefetch } from './common.js';

export function runQuiz({ main, bar, count = 6, makeQuestion, onAnswer, onFinish, onExit }) {
  let index = 0;
  let current = null;
  let firstTry = true;

  function render() {
    current = makeQuestion(index);
    firstTry = true;
    main.innerHTML = '';

    const progress = document.createElement('div');
    progress.className = 'progress';
    for (let i = 0; i < count; i++) {
      const dot = document.createElement('span');
      if (i < index) dot.className = 'done';
      progress.appendChild(dot);
    }

    const prompt = document.createElement('div');
    prompt.className = 'prompt';
    if (current.text) {
      const p = document.createElement('p');
      p.className = 'prompt-text';
      p.textContent = current.text;
      prompt.appendChild(p);
    }
    if (current.show) {
      const show = document.createElement('div');
      show.className = 'prompt-show';
      if (typeof current.show === 'string') show.innerHTML = current.show;
      else show.appendChild(current.show);
      prompt.appendChild(show);
    }

    const choices = document.createElement('div');
    choices.className = 'choices';
    for (const choice of current.choices) {
      const btn = document.createElement('button');
      btn.className = `choice ${choice.className || ''}`;
      btn.innerHTML = choice.html;
      btn.setAttribute('aria-label', choice.label || String(choice.value));
      btn.addEventListener('click', () => answer(btn, choice));
      choices.appendChild(btn);
    }

    main.append(progress, prompt, choices);
    bar.onRepeat(() => say(current.say));
    say(current.say);
    prefetch([current.praise]);
  }

  let busy = false;
  async function answer(btn, choice) {
    if (busy || btn.classList.contains('wrong')) return;
    const right = choice.value === current.answer;
    onAnswer?.(current, right, firstTry);
    if (!right) {
      firstTry = false;
      btn.classList.add('wrong');
      const again = tryAgain(btn);
      await say(again);
      return;
    }
    busy = true;
    btn.classList.add('right');
    main.querySelectorAll('.choice').forEach((b) => (b.disabled = true));
    await cheer(current.praise);
    busy = false;
    index++;
    if (index >= count) {
      onFinish?.();
      doneScreen(main, {
        onAgain: () => {
          sfx('tap');
          index = 0;
          render();
        },
        onBack: () => onExit(),
      });
      bar.onRepeat(null);
    } else {
      render();
    }
  }

  render();
}

// Builds number choices near the answer, e.g. 5 → [4, 5, 7] shuffled.
export function numberChoices(answer, { n = 3, min = 0, max = 20 } = {}) {
  const set = new Set([answer]);
  let spread = 1;
  while (set.size < n) {
    const candidate = answer + (Math.random() < 0.5 ? -1 : 1) * Math.ceil(Math.random() * spread);
    if (candidate >= min && candidate <= max) set.add(candidate);
    spread = Math.min(spread + 1, 4);
  }
  return shuffle([...set]);
}
