import { useContext } from 'react';
import { GameContext } from '../../context/GameContext';

export function SoundToggle() {
  const { soundEnabled, toggleSound } = useContext(GameContext);
  return (
    <button
      onClick={toggleSound}
      className="bg-white rounded-2xl px-3 py-2 shadow-md text-2xl hover:bg-gray-50 active:scale-95 transition-transform min-h-[44px] min-w-[44px]"
      aria-label={soundEnabled ? 'Mute sound' : 'Enable sound'}
    >
      {soundEnabled ? '🔊' : '🔇'}
    </button>
  );
}
