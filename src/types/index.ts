export type GameId = 'home' | 'reading' | 'memory' | 'puzzle' | 'drawing' | 'math';

export interface GameContextType {
  currentGame: GameId;
  goTo: (game: GameId) => void;
  soundEnabled: boolean;
  toggleSound: () => void;
}

export interface WordEntry {
  word: string;
  emoji: string;
  scrambled: string[];
}

export interface MemoryCardData {
  id: number;
  pairId: number;
  emoji: string;
  label: string;
}

export interface PuzzleConfig {
  id: string;
  emoji: string;
  label: string;
  cols: number;
  rows: number;
}

export interface MathProblem {
  a: number;
  b: number;
  op: '+' | '-';
  answer: number;
  choices: number[];
  emoji: string;
}

export interface ProgressData {
  stars: number;
  bestStreak: number;
}
