import { useContext } from 'react';
import { GameContext } from '../../context/GameContext';

export function BackButton() {
  const { goTo } = useContext(GameContext);
  return (
    <button
      onClick={() => goTo('home')}
      className="flex items-center gap-2 bg-white rounded-2xl px-4 py-2 shadow-md text-gray-700 font-bold text-lg hover:bg-gray-50 active:scale-95 transition-transform min-h-[44px]"
      aria-label="Back to home"
    >
      ← Home
    </button>
  );
}
