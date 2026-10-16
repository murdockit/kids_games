// Story Time: picture books read aloud. Each word lights up as it's read; tap any word to hear it.
// Her heart words are underlined in pink, so she can spot the ones she knows.
import { topBar, say, sfx, doneScreen, el, prefetch } from '../common.js';
import { getWords } from '../words-store.js';
import { logRound } from '../activity.js';
import { STORIES } from '../stories.js';

const main = document.getElementById('app');
const bar = topBar({ title: 'Story Time' });
let heart = new Set();
getWords().then((w) => (heart = new Set(w.map((x) => x.toLowerCase()))));

shelf();

function shelf() {
  bar.setTitle('Story Time');
  bar.onBack(null);
  bar.onRepeat(() => say('Pick a story!'));
  main.innerHTML = '';
  say('Pick a story!');
  const tiles = el('div', 'tiles');
  for (const story of STORIES) {
    const b = el('button', `tile ${story.color} book`);
    b.innerHTML = `<span class="emoji">${story.cover}</span><span></span>`;
    b.lastChild.textContent = story.title;
    b.addEventListener('click', () => {
      sfx('tap');
      read(story);
    });
    tiles.appendChild(b);
  }
  main.appendChild(tiles);
}

function read(story) {
  let page = -1; // the cover
  bar.setTitle(story.title);
  bar.onBack(shelf);
  prefetch([story.title, ...story.pages.map((p) => p.text)]);

  main.innerHTML = '';
  const book = el('div', 'book-page');
  const scene = el('div', 'story-scene');
  scene.style.background = `linear-gradient(${story.bg[0]}, ${story.bg[1]})`;
  const text = el("p", "story-text");
  book.append(scene, text);
  const nav = el('div', 'choices');
  const prev = el('button', 'round-btn big-action', '⬅️');
  prev.setAttribute('aria-label', 'Previous page');
  const next = el('button', 'round-btn big-action', '➡️');
  next.setAttribute('aria-label', 'Next page');
  nav.append(prev, next);
  const count = el('p', 'note');
  main.append(book, count, nav);

  let readId = 0;
  async function readAloud(words, line) {
    const id = ++readId;
    // Light up words in step with the voice (an estimate: longer words take longer).
    const spans = [...text.querySelectorAll('.w')];
    const total = words.reduce((n, w) => n + w.length + 3, 0);
    const msPerChar = 62;
    let t = 0;
    spans.forEach((s, i) => {
      setTimeout(() => {
        if (id !== readId) return;
        spans.forEach((x) => x.classList.remove('reading'));
        s.classList.add('reading');
      }, t);
      t += (words[i].length + 3) * msPerChar;
    });
    await say(line);
    if (id === readId) setTimeout(() => spans.forEach((x) => x.classList.remove('reading')), Math.max(0, total * msPerChar - t));
  }

  function show() {
    readId++;
    const isCover = page < 0;
    const p = isCover ? { text: story.title, scene: [[story.cover, 50, 52, 46, 'bob']] } : story.pages[page];
    scene.innerHTML = '';
    for (const [emoji, x, y, size, anim] of p.scene) {
      const s = el('span', `scene-item ${anim || ''}`, emoji);
      s.style.left = `${x}%`;
      s.style.top = `${y}%`;
      s.style.fontSize = `${size}cqw`;
      s.style.animationDelay = `${-Math.random() * 2}s`;
      scene.appendChild(s);
    }
    text.innerHTML = '';
    text.classList.toggle('title', isCover);
    const words = p.text.split(' ');
    words.forEach((w, i) => {
      const bare = w.replace(/[^A-Za-z']/g, '').toLowerCase();
      const s = el('span', `w${heart.has(bare) ? ' heart' : ''}`, w);
      s.addEventListener('click', () => {
        sfx('tap');
        readId++;
        text.querySelectorAll('.reading').forEach((x) => x.classList.remove('reading'));
        s.classList.add('reading');
        say(bare || w);
      });
      text.appendChild(s);
      if (i < words.length - 1) text.appendChild(document.createTextNode(' '));
    });
    count.textContent = isCover ? 'Tap ➡️ to start' : `Page ${page + 1} of ${story.pages.length} · tap a word to hear it`;
    prev.style.visibility = isCover ? 'hidden' : 'visible';
    book.classList.remove('turn');
    void book.offsetWidth;
    book.classList.add('turn');
    readAloud(words, p.text);
    bar.onRepeat(() => readAloud(words, p.text));
  }

  prev.addEventListener('click', () => {
    sfx('whoosh');
    page = Math.max(-1, page - 1);
    show();
  });
  next.addEventListener('click', () => {
    sfx('whoosh');
    page++;
    if (page >= story.pages.length) {
      readId++;
      logRound('stories');
      bar.onRepeat(null);
      doneScreen(main, { onAgain: () => read(story), onBack: shelf, message: 'The end!' });
      return;
    }
    show();
  });
  show();
}
