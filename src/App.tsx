import { useContext } from 'react';
import { GameProvider, GameContext } from './context/GameContext';
import { HomeScreen } from './components/common/HomeScreen';
import { ReadingGame } from './components/reading/ReadingGame';
import { MemoryGame } from './components/memory/MemoryGame';
import { PuzzleGame } from './components/puzzle/PuzzleGame';
import { DrawingGame } from './components/drawing/DrawingGame';
import { MathGame } from './components/math/MathGame';
import { ErrorBoundary } from './components/common/ErrorBoundary';

function GameRouter() {
  const { currentGame } = useContext(GameContext);
  switch (currentGame) {
    case 'reading': return <ReadingGame />;
    case 'memory':  return <MemoryGame />;
    case 'puzzle':  return <PuzzleGame />;
    case 'drawing': return <DrawingGame />;
    case 'math':    return <MathGame />;
    default:        return <HomeScreen />;
  }
}

export default function App() {
  return (
    <GameProvider>
      <ErrorBoundary>
        <GameRouter />
      </ErrorBoundary>
    </GameProvider>
  );
}
