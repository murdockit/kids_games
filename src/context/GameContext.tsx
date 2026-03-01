import { createContext, useState, type ReactNode } from 'react';
import type { GameId, GameContextType } from '../types';

export const GameContext = createContext<GameContextType>({
  currentGame: 'home',
  goTo: () => {},
  soundEnabled: true,
  toggleSound: () => {},
});

export function GameProvider({ children }: { children: ReactNode }) {
  const [currentGame, setCurrentGame] = useState<GameId>('home');
  const [soundEnabled, setSoundEnabled] = useState(true);

  const goTo = (game: GameId) => setCurrentGame(game);
  const toggleSound = () => setSoundEnabled((s) => !s);

  return (
    <GameContext.Provider value={{ currentGame, goTo, soundEnabled, toggleSound }}>
      {children}
    </GameContext.Provider>
  );
}
