import { useState } from 'react';
import { BackButton } from '../common/BackButton';
import { SoundToggle } from '../common/SoundToggle';
import { StarReward } from '../common/StarReward';
import { useSound } from '../../hooks/useSound';
import { addStar, getProgress } from '../../utils/storageUtils';
import { PUZZLES, buildPuzzle } from '../../data/puzzleData';
import type { PuzzlePiece } from '../../data/puzzleData';

export function PuzzleGame() {
  const { play } = useSound();
  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const config = PUZZLES[puzzleIndex % PUZZLES.length];
  const [pieces, setPieces] = useState<PuzzlePiece[]>(() => buildPuzzle(config));
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [won, setWon] = useState(false);
  const [totalStars, setTotalStars] = useState(() => getProgress('puzzle').stars);
  const [snappedSlots, setSnappedSlots] = useState<Set<number>>(new Set());

  const slots = config.cols * config.rows;

  // Get piece currently occupying a slot
  const pieceAtSlot = (slot: number) => pieces.find((p) => p.currentSlot === slot);

  const handleDragStart = (id: number) => {
    play('click');
    setDraggedId(id);
  };

  const handleDrop = (targetSlot: number) => {
    if (draggedId === null) return;
    const dragged = pieces.find((p) => p.id === draggedId);
    if (!dragged) return;
    const targetPiece = pieces.find((p) => p.currentSlot === targetSlot);

    setPieces((prev) =>
      prev.map((p) => {
        if (p.id === draggedId) return { ...p, currentSlot: targetSlot };
        if (targetPiece && p.id === targetPiece.id) return { ...p, currentSlot: dragged.currentSlot };
        return p;
      })
    );
    setDraggedId(null);

    // Check win after state update (use setTimeout to get updated state)
    setTimeout(() => {
      setPieces((prev) => {
        // Find newly snapped correct slots and animate them
        const newSnapped = new Set<number>();
        prev.forEach((p) => { if (p.currentSlot === p.correctSlot) newSnapped.add(p.currentSlot); });
        setSnappedSlots(newSnapped);
        setTimeout(() => setSnappedSlots(new Set()), 400);

        const solved = prev.every((p) => p.currentSlot === p.correctSlot);
        if (solved && !won) {
          play('star');
          const progress = addStar('puzzle');
          setTotalStars(progress.stars);
          setWon(true);
        }
        return prev;
      });
    }, 50);
  };

  const nextPuzzle = () => {
    const next = puzzleIndex + 1;
    const nextConfig = PUZZLES[next % PUZZLES.length];
    setPuzzleIndex(next);
    setPieces(buildPuzzle(nextConfig));
    setWon(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-amber-50 flex flex-col">
      <header className="flex items-center justify-between px-4 pt-6 pb-2">
        <BackButton />
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-kidorange">⭐ {totalStars}</span>
          <SoundToggle />
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 gap-6">
        {won ? (
          <div className="flex flex-col items-center gap-6">
            <StarReward count={2} message={`${config.label} done, Lydia! 🎉`} />
            <button
              onClick={nextPuzzle}
              className="bg-kidorange text-white font-extrabold text-xl rounded-2xl px-8 py-4 shadow-lg active:scale-95 transition-transform"
            >
              Next Puzzle ➡️
            </button>
          </div>
        ) : (
          <>
            <div className="text-center">
              <h2 className="text-2xl font-extrabold text-kidorange">{config.label}</h2>
              <p className="text-gray-500 font-semibold">Drag pieces into the correct spots!</p>
            </div>

            {/* Puzzle Board */}
            <div
              className="grid gap-2 bg-white rounded-3xl p-4 shadow-lg"
              style={{ gridTemplateColumns: `repeat(${config.cols}, 1fr)` }}
            >
              {Array.from({ length: slots }).map((_, slot) => {
                const piece = pieceAtSlot(slot);
                const isCorrect = piece && piece.correctSlot === slot;
                return (
                  <div
                    key={slot}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDrop(slot)}
                    className={`w-28 h-28 rounded-2xl border-4 flex items-center justify-center text-6xl transition-all duration-200
                      ${isCorrect ? 'border-kidgreen bg-green-50' : 'border-gray-200 bg-gray-50'}
                      ${snappedSlots.has(slot) ? 'scale-110' : 'scale-100'}`}
                  >
                    {piece ? (
                      <div
                        draggable
                        onDragStart={() => handleDragStart(piece.id)}
                        className="cursor-grab active:cursor-grabbing active:scale-110 transition-transform select-none"
                      >
                        {piece.emoji}
                      </div>
                    ) : (
                      <span className="text-gray-300 text-3xl">+</span>
                    )}
                  </div>
                );
              })}
            </div>

            <p className="text-sm text-gray-400 font-semibold">
              {pieces.filter((p) => p.currentSlot === p.correctSlot).length} / {slots} in place
            </p>
          </>
        )}
      </main>
    </div>
  );
}
