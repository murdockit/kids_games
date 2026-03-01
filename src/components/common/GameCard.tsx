import { useContext } from 'react';
import { GameContext } from '../../context/GameContext';
import { getProgress } from '../../utils/storageUtils';
import type { GameId } from '../../types';

interface GameCardProps {
  id: GameId;
  emoji: string;
  title: string;
  description: string;
  bgColor: string;
}

export function GameCard({ id, emoji, title, description, bgColor }: GameCardProps) {
  const { goTo } = useContext(GameContext);
  const progress = getProgress(id);

  return (
    <button
      onClick={() => goTo(id)}
      className={`${bgColor} rounded-3xl p-5 shadow-lg flex flex-col items-center gap-2 active:scale-95 transition-transform hover:shadow-xl w-full text-center no-select min-h-[140px]`}
    >
      <span className="text-5xl">{emoji}</span>
      <span className="text-xl font-extrabold text-white drop-shadow">{title}</span>
      <span className="text-sm font-semibold text-white/80">{description}</span>
      {progress.stars > 0 && (
        <span className="text-sm font-bold text-yellow-200">
          {'⭐'.repeat(Math.min(progress.stars, 5))}
        </span>
      )}
    </button>
  );
}
