import { useState, useCallback } from 'react';
import { BackButton } from '../common/BackButton';
import { SoundToggle } from '../common/SoundToggle';
import { StarReward } from '../common/StarReward';
import { MemoryCard } from './MemoryCard';
import { useSound } from '../../hooks/useSound';
import { addStar, getProgress } from '../../utils/storageUtils';
import { buildMemoryDeck } from '../../data/memoryData';

export function MemoryGame() {
  const { play } = useSound();
  const [cards, setCards] = useState(() => buildMemoryDeck());
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [checking, setChecking] = useState(false);
  const [totalStars, setTotalStars] = useState(() => getProgress('memory').stars);
  const [won, setWon] = useState(false);

  const handleCardClick = useCallback(
    (id: number, pairId: number) => {
      if (checking || flipped.includes(id) || matched.has(id)) return;
      play('flip');
      const nextFlipped = [...flipped, id];

      if (nextFlipped.length === 1) {
        setFlipped(nextFlipped);
        return;
      }

      // Second card flipped — check match
      setFlipped(nextFlipped);
      setChecking(true);
      const firstCard = cards.find((c) => c.id === nextFlipped[0]);

      setTimeout(() => {
        if (firstCard && firstCard.pairId === pairId) {
          // Match!
          play('correct');
          const nextMatched = new Set(matched);
          nextMatched.add(nextFlipped[0]);
          nextMatched.add(id);
          setMatched(nextMatched);
          setFlipped([]);
          setChecking(false);

          if (nextMatched.size === cards.length) {
            // All matched — win!
            play('star');
            const progress = addStar('memory');
            setTotalStars(progress.stars);
            setWon(true);
          }
        } else {
          // No match — flip back
          play('incorrect');
          setFlipped([]);
          setChecking(false);
        }
      }, 1400);
    },
    [flipped, matched, checking, cards, play]
  );

  const reset = () => {
    setCards(buildMemoryDeck());
    setFlipped([]);
    setMatched(new Set());
    setChecking(false);
    setWon(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-emerald-50 flex flex-col">
      <header className="flex items-center justify-between px-4 pt-6 pb-2">
        <BackButton />
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-kidgreen">⭐ {totalStars}</span>
          <SoundToggle />
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 gap-6">
        {won ? (
          <div className="flex flex-col items-center gap-6">
            <StarReward count={3} message="You matched them all, Lydia!" />
            <button
              onClick={reset}
              className="bg-kidgreen text-white font-extrabold text-xl rounded-2xl px-8 py-4 shadow-lg active:scale-95 transition-transform"
            >
              Play Again 🔄
            </button>
          </div>
        ) : (
          <>
            <div className="text-center">
              <h2 className="text-2xl font-extrabold text-kidgreen">Memory Match</h2>
              <p className="text-gray-500 font-semibold">
                {matched.size / 2} / {cards.length / 2} pairs found
              </p>
            </div>
            <div className="grid grid-cols-4 gap-2 w-full max-w-sm">
              {cards.map((card) => (
                <MemoryCard
                  key={card.id}
                  emoji={card.emoji}
                  label={card.label}
                  isFlipped={flipped.includes(card.id)}
                  isMatched={matched.has(card.id)}
                  onClick={() => handleCardClick(card.id, card.pairId)}
                />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
