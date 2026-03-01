const PAIRS = [
  { emoji: '🐱', label: 'Cat' },
  { emoji: '🐶', label: 'Dog' },
  { emoji: '🐸', label: 'Frog' },
  { emoji: '🦊', label: 'Fox' },
  { emoji: '🐻', label: 'Bear' },
  { emoji: '🐧', label: 'Penguin' },
  { emoji: '🦁', label: 'Lion' },
  { emoji: '🦋', label: 'Butterfly' },
];

export function buildMemoryDeck() {
  const cards = PAIRS.flatMap((p, i) => [
    { id: i * 2,     pairId: i, emoji: p.emoji, label: p.label },
    { id: i * 2 + 1, pairId: i, emoji: p.emoji, label: p.label },
  ]);
  // Fisher-Yates shuffle
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}
