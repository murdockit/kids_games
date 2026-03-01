import type { PuzzleConfig } from '../types';

export const PUZZLES: PuzzleConfig[] = [
  { id: 'sun',      emoji: '☀️🌈🌸🌻', label: 'Sunny Day',   cols: 2, rows: 2 },
  { id: 'animals',  emoji: '🐘🦒🐯🦓', label: 'Zoo Friends', cols: 2, rows: 2 },
  { id: 'space',    emoji: '🚀🌙⭐🪐',  label: 'Outer Space', cols: 2, rows: 2 },
  { id: 'ocean',    emoji: '🐬🐠🦀🐙', label: 'Ocean Life',  cols: 2, rows: 2 },
];

export interface PuzzlePiece {
  id: number;
  correctSlot: number;
  currentSlot: number;
  emoji: string;
}

export function buildPuzzle(config: PuzzleConfig): PuzzlePiece[] {
  const emojis = config.emoji.split(/(?<=\p{Emoji})/u).filter(Boolean);
  const total = config.cols * config.rows;
  const pieces: PuzzlePiece[] = Array.from({ length: total }, (_, i) => ({
    id: i,
    correctSlot: i,
    currentSlot: i,
    emoji: emojis[i % emojis.length],
  }));

  // Shuffle by swapping currentSlots
  for (let i = pieces.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = pieces[i].currentSlot;
    pieces[i].currentSlot = pieces[j].currentSlot;
    pieces[j].currentSlot = tmp;
  }
  return pieces;
}
