// Sticker Book: the stickers she has collected (one per 3 stars), what's coming next,
// and the bonus surprises (one per 10 stars).
import { topBar, say, sfx, el, KID, burstAt } from '../common.js';
import { mountMascot } from '../mascot.js';
import {
  COLLECTIBLES,
  BONUSES,
  STARS_PER_STICKER,
  unlockedStickers,
  unlockedBonuses,
  nextSticker,
  nextBonus,
} from '../rewards.js';

const main = document.getElementById('app');
main.classList.add('sticker-book');
topBar({ title: 'My Sticker Book' });

const have = unlockedStickers();
const bonuses = unlockedBonuses();
const next = nextSticker();
const nextB = nextBonus();

// Header: Sparkle and what's next
const hero = el('div', 'home-hero');
const bubble = el('p', 'speech');
bubble.textContent = next
  ? `${next.starsToGo} more ${next.starsToGo === 1 ? 'star' : 'stars'} for a new sticker!`
  : 'You collected every sticker!';
mountMascot(hero, { size: 130, talk: false }).addEventListener('click', () => say(bubble.textContent));
hero.appendChild(bubble);

// Progress toward the next sticker
const bar = el('div', 'reward-bar');
const fill = el('div', 'reward-fill');
const into = next ? STARS_PER_STICKER - next.starsToGo : STARS_PER_STICKER;
fill.style.width = `${(into / STARS_PER_STICKER) * 100}%`;
bar.append(fill, el('span', '', next ? `${'⭐'.repeat(into)}${'☆'.repeat(STARS_PER_STICKER - into)}` : '🎉'));

// The sticker grid: collected ones are big and tappable; the rest are mystery slots.
const grid = el('div', 'sticker-grid');
COLLECTIBLES.forEach((s, i) => {
  const got = i < have.length;
  const b = el('button', `sticker-slot${got ? ' got' : ''}`, got ? s.emoji : '?');
  b.setAttribute('aria-label', got ? s.name : 'mystery sticker');
  b.style.animationDelay = `${Math.min(i, 20) * 0.03}s`;
  b.addEventListener('click', () => {
    if (got) {
      sfx('boing');
      const r = b.getBoundingClientRect();
      burstAt(r.left + r.width / 2, r.top + r.height / 2);
      say(`The ${s.name}!`);
    } else {
      sfx('tap');
      const stars = (i + 1) * STARS_PER_STICKER;
      say(`A mystery sticker! Earn ${stars} stars to find out what it is.`);
    }
  });
  grid.appendChild(b);
});

// Bonus surprises
const surprises = el('section', 'surprises');
surprises.appendChild(el('h2', '', 'Surprises 🎁'));
const row = el('div', 'tray-grid');
BONUSES.forEach((bonus, i) => {
  const got = i < bonuses.length;
  const b = el('button', `sticker-slot surprise${got ? ' got' : ''}`, got ? bonus.emoji : '🎁');
  b.setAttribute('aria-label', got ? bonus.name : 'surprise present');
  b.addEventListener('click', () => {
    sfx('tap');
    if (got) {
      const where = { outfit: 'in the Hair Salon clothes', hat: 'in the Hair Salon hats', glasses: 'in the Hair Salon glasses', page: 'in the coloring pages' }[bonus.kind];
      say(`You unlocked ${bonus.name}! Find it ${where}.`);
    } else {
      say(`A surprise present! Earn ${(i + 1) * 10} stars to open it.`);
    }
  });
  row.appendChild(b);
});
surprises.appendChild(row);
if (nextB) surprises.appendChild(el('p', 'note', `${nextB.starsToGo} more stars to open the next present!`));

main.append(hero, bar, grid, surprises);
say(
  have.length
    ? `Here are your stickers, ${KID}! You have ${have.length}. ${bubble.textContent}`
    : `This is your sticker book, ${KID}! Earn stars in the games to collect stickers.`,
);
