import type { ProgressData } from '../types';

export function getProgress(gameId: string): ProgressData {
  try {
    const raw = localStorage.getItem(`progress_${gameId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed?.stars === 'number' && typeof parsed?.bestStreak === 'number') {
        return parsed as ProgressData;
      }
    }
  } catch {/* ignore */}
  return { stars: 0, bestStreak: 0 };
}

export function saveProgress(gameId: string, data: ProgressData): void {
  try {
    localStorage.setItem(`progress_${gameId}`, JSON.stringify(data));
  } catch {/* ignore */}
}

export function addStar(gameId: string): ProgressData {
  const p = getProgress(gameId);
  const updated = { ...p, stars: p.stars + 1 };
  saveProgress(gameId, updated);
  return updated;
}

export function updateBestStreak(gameId: string, streak: number): ProgressData {
  const p = getProgress(gameId);
  if (streak <= p.bestStreak) return p;
  const updated = { ...p, bestStreak: streak };
  saveProgress(gameId, updated);
  return updated;
}
