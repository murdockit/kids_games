// Rewards: every 3 stars unlocks a collectible sticker; every 10 stars unlocks a bonus
// (a salon outfit, hat or glasses, or a coloring page). Rewards only add extras; nothing
// she already has is ever locked. Unlocks follow "stars ever earned", which never goes down,
// so resetting the star counter in Grown-ups doesn't take stickers away.
const EVER_KEY = 'lg.starsEver';
const SEEN_KEY = 'lg.rewardsSeen';

export const STARS_PER_STICKER = 3;
export const STARS_PER_BONUS = 10;

export const COLLECTIBLES = [
  ['🦄', 'unicorn'], ['🐶', 'puppy'], ['🐱', 'kitty'], ['🐰', 'bunny'], ['🦋', 'butterfly'], ['🌈', 'rainbow'],
  ['🍦', 'ice cream'], ['🧁', 'cupcake'], ['🍓', 'strawberry'], ['🍩', 'donut'], ['🍭', 'lollipop'], ['🎂', 'birthday cake'],
  ['🚀', 'rocket'], ['🪐', 'planet'], ['🌙', 'moon'], ['⭐', 'star'], ['☀️', 'sun'], ['🌻', 'sunflower'],
  ['🐠', 'fish'], ['🐬', 'dolphin'], ['🐙', 'octopus'], ['🐢', 'turtle'], ['🦀', 'crab'], ['🐳', 'whale'],
  ['🦁', 'lion'], ['🐼', 'panda'], ['🐨', 'koala'], ['🦊', 'fox'], ['🐸', 'frog'], ['🐧', 'penguin'],
  ['👑', 'crown'], ['💎', 'gem'], ['🎀', 'bow'], ['🎈', 'balloon'], ['🧸', 'teddy bear'], ['🏰', 'castle'],
  ['🦖', 'dinosaur'], ['🐉', 'dragon'], ['🧜', 'mermaid'], ['🧚', 'fairy'], ['🌟', 'shining star'], ['💖', 'sparkle heart'],
].map(([emoji, name]) => ({ emoji, name }));

// Bonus unlocks, in order. `kind` tells the game which list it extends.
export const BONUSES = [
  { kind: 'outfit', id: 'fairy', name: 'a fairy dress with wings', emoji: '🧚' },
  { kind: 'page', id: 'sparkle', name: 'a coloring page of Sparkle the unicorn', emoji: '🦄' },
  { kind: 'hat', id: 'wizard', name: 'a wizard hat', emoji: '🧙' },
  { kind: 'page', id: 'mermaid', name: 'a mermaid coloring page', emoji: '🧜' },
  { kind: 'glasses', id: 'rainbow', name: 'rainbow glasses', emoji: '🌈' },
  { kind: 'outfit', id: 'astronaut', name: 'an astronaut suit', emoji: '🚀' },
  { kind: 'page', id: 'dragon', name: 'a friendly dragon coloring page', emoji: '🐉' },
  { kind: 'hat', id: 'chef', name: 'a chef hat', emoji: '👩‍🍳' },
  { kind: 'page', id: 'fairy', name: 'a fairy coloring page', emoji: '🧚' },
  { kind: 'outfit', id: 'onesie', name: 'a unicorn onesie', emoji: '🦄' },
];

function read(key, fallback) {
  try {
    const v = JSON.parse(localStorage.getItem(key));
    return v ?? fallback;
  } catch {
    return fallback;
  }
}
function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* not saved */
  }
}

export function starsEver() {
  return Number(read(EVER_KEY, 0)) || 0;
}

// Called whenever a star is earned (from addStar).
export function earnedStar(n = 1) {
  write(EVER_KEY, starsEver() + n);
}

export function unlockedStickers() {
  return COLLECTIBLES.slice(0, Math.min(COLLECTIBLES.length, Math.floor(starsEver() / STARS_PER_STICKER)));
}

export function unlockedBonuses() {
  return BONUSES.slice(0, Math.min(BONUSES.length, Math.floor(starsEver() / STARS_PER_BONUS)));
}

export function hasBonus(kind, id) {
  return unlockedBonuses().some((b) => b.kind === kind && b.id === id);
}

// How many more stars until the next sticker / bonus.
export function nextSticker() {
  const n = unlockedStickers().length;
  if (n >= COLLECTIBLES.length) return null;
  return { item: COLLECTIBLES[n], starsToGo: (n + 1) * STARS_PER_STICKER - starsEver() };
}
export function nextBonus() {
  const n = unlockedBonuses().length;
  if (n >= BONUSES.length) return null;
  return { item: BONUSES[n], starsToGo: (n + 1) * STARS_PER_BONUS - starsEver() };
}

// New unlocks she hasn't been shown yet; marks them as seen.
export function takeNewRewards() {
  const seen = read(SEEN_KEY, { stickers: 0, bonuses: 0 });
  const stickers = unlockedStickers();
  const bonuses = unlockedBonuses();
  const fresh = {
    stickers: stickers.slice(seen.stickers),
    bonuses: bonuses.slice(seen.bonuses),
  };
  write(SEEN_KEY, { stickers: stickers.length, bonuses: bonuses.length });
  return fresh;
}
