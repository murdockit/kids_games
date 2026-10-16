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
import { logRound, logAnswer, currentGame } from './activity.js';

// onComplete (optional) replaces the end-of-round celebration, e.g. for the Daily Adventure.
export function runQuiz({ main, bar, count = 6, makeQuestion, onAnswer, onFinish, onExit, onComplete }) {
  let index = 0;
  let current = null;
  let firstTry = true;
  let wrongs = 0;
  let choicesEl = null;
  let idle = null;

  // If she goes quiet, say the question again (once), in case she missed it.
  function waitForTap() {
    clearTimeout(idle);
    const el = choicesEl;
    idle = setTimeout(() => {
      if (el && main.contains(el) && !busy) say(current.say);
    }, 12000);
  }

  function render() {
    current = makeQuestion(index);
    firstTry = true;
    wrongs = 0;
    main.innerHTML = '';

    // Treasure jar: fills up with a gem for every right answer this round.
    const progress = document.createElement('div');
    progress.className = 'progress';
    progress.innerHTML = `
      <div class="jar" aria-label="treasure jar">
        <div class="jar-lid"></div>
        <div class="jar-fill" style="height:${(index / count) * 100}%"></div>
        <span class="jar-count">${index} / ${count}</span>
      </div>`;

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
    for (const [i, choice] of current.choices.entries()) {
      const btn = document.createElement('button');
      btn.className = `choice pop-in ${choice.className || ''}`;
      btn.style.animationDelay = `${0.15 + i * 0.12}s`; // answers bounce in one by one
      btn.innerHTML = choice.html;
      btn.setAttribute('aria-label', choice.label || String(choice.value));
      btn.addEventListener('click', () => answer(btn, choice));
      choices.appendChild(btn);
    }

    main.append(progress, prompt, choices);
    choicesEl = choices;
    bar.onRepeat(() => say(current.say));
    say(current.say);
    prefetch([current.praise]);
    waitForTap();
  }

  let busy = false;
  async function answer(btn, choice) {
    if (busy || btn.classList.contains('wrong')) return;
    const right = choice.value === current.answer;
    onAnswer?.(current, right, firstTry, choice);
    if (firstTry) logAnswer(currentGame(), right);
    waitForTap();
    if (!right) {
      firstTry = false;
      wrongs++;
      btn.classList.add('wrong');
      // After two misses, the right answer bounces so she's never stuck.
      if (wrongs >= 2) {
        const i = current.choices.findIndex((c) => c.value === current.answer);
        choicesEl.children[i]?.classList.add('help');
      }
      const again = tryAgain(btn);
      await say(again);
      return;
    }
    clearTimeout(idle);
    busy = true;
    btn.classList.add('right');
    main.querySelectorAll('.choice').forEach((b) => (b.disabled = true));
    gemToJar(btn, (index + 1) / count);
    await cheer(current.praise);
    busy = false;
    index++;
    if (index >= count) {
      logRound(currentGame());
      onFinish?.();
      if (onComplete) {
        bar.onRepeat(null);
        onComplete();
        return;
      }
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

  // A gem flies from the right answer into the treasure jar.
  function gemToJar(btn, level) {
    const jar = main.querySelector('.jar');
    if (!jar) return;
    const a = btn.getBoundingClientRect();
    const b = jar.getBoundingClientRect();
    const gem = document.createElement('div');
    gem.className = 'flying-gem';
    gem.textContent = ['💎', '💖', '⭐', '🔮'][index % 4];
    gem.style.left = `${a.left + a.width / 2}px`;
    gem.style.top = `${a.top + a.height / 2}px`;
    document.body.appendChild(gem);
    requestAnimationFrame(() => {
      gem.style.transform = `translate(${b.left + b.width / 2 - (a.left + a.width / 2)}px, ${b.top + b.height / 2 - (a.top + a.height / 2)}px) scale(.5)`;
    });
    setTimeout(() => {
      gem.remove();
      sfx('clink');
      const fill = jar.querySelector('.jar-fill');
      if (fill) fill.style.height = `${level * 100}%`;
      jar.classList.remove('jiggle');
      void jar.offsetWidth;
      jar.classList.add('jiggle');
    }, 650);
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
