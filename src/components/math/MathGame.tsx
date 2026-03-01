import { useState, useMemo } from 'react';
import { BackButton } from '../common/BackButton';
import { SoundToggle } from '../common/SoundToggle';
import { StarReward } from '../common/StarReward';
import { useSound } from '../../hooks/useSound';
import { addStar } from '../../utils/storageUtils';
import { generateProblem } from '../../data/mathData';
import type { MathProblem } from '../../types';

const GOAL = 10;

export function MathGame() {
  const { play } = useSound();
  const [problem, setProblem] = useState<MathProblem>(() => generateProblem());
  const [correct, setCorrect] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [totalStars, setTotalStars] = useState(0);
  const [won, setWon] = useState(false);

  const emojiRow = useMemo(
    () => Array.from({ length: problem.a }, (_, i) => ({ id: i, emoji: problem.emoji })),
    [problem]
  );
  const emojiRowB = useMemo(
    () =>
      problem.op === '+'
        ? Array.from({ length: problem.b }, (_, i) => ({ id: i, emoji: problem.emoji }))
        : [],
    [problem]
  );

  const handleAnswer = (choice: number) => {
    if (feedback) return;
    if (choice === problem.answer) {
      play('correct');
      setFeedback('correct');
      const nextCorrect = correct + 1;
      setTimeout(() => {
        if (nextCorrect >= GOAL) {
          play('star');
          const progress = addStar('math');
          setTotalStars(progress.stars);
          setWon(true);
        } else {
          setCorrect(nextCorrect);
          setProblem(generateProblem());
          setFeedback(null);
        }
      }, 900);
    } else {
      play('incorrect');
      setFeedback('wrong');
      setTimeout(() => setFeedback(null), 600);
    }
  };

  const reset = () => {
    setCorrect(0);
    setProblem(generateProblem());
    setFeedback(null);
    setWon(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-violet-50 flex flex-col">
      <header className="flex items-center justify-between px-4 pt-6 pb-2">
        <BackButton />
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-kidpurple">⭐ {totalStars}</span>
          <SoundToggle />
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 gap-6">
        {won ? (
          <div className="flex flex-col items-center gap-6">
            <StarReward count={3} message="Math Star! 🌟" />
            <button
              onClick={reset}
              className="bg-kidpurple text-white font-extrabold text-xl rounded-2xl px-8 py-4 shadow-lg active:scale-95 transition-transform"
            >
              Play Again 🔄
            </button>
          </div>
        ) : (
          <>
            {/* Progress bar */}
            <div className="w-full max-w-sm">
              <div className="flex justify-between text-sm font-bold text-kidpurple mb-1">
                <span>Progress</span>
                <span>{correct} / {GOAL}</span>
              </div>
              <div className="bg-purple-100 rounded-full h-4 overflow-hidden">
                <div
                  className="bg-kidpurple h-4 rounded-full transition-all"
                  style={{ width: `${(correct / GOAL) * 100}%` }}
                />
              </div>
            </div>

            {/* Problem */}
            <div className="bg-white rounded-3xl shadow-lg p-6 flex flex-col items-center gap-4 w-full max-w-sm">
              <p className="text-4xl font-extrabold text-gray-800">
                {problem.a} {problem.op} {problem.b} = ?
              </p>

              {/* Visual aid */}
              <div className="flex flex-col gap-2 items-center">
                <div className="flex flex-wrap gap-1 justify-center">
                  {emojiRow.map((e) => (
                    <span key={e.id} className="text-2xl">{e.emoji}</span>
                  ))}
                </div>
                {problem.op === '+' && emojiRowB.length > 0 && (
                  <>
                    <span className="text-xl font-bold text-gray-400">+</span>
                    <div className="flex flex-wrap gap-1 justify-center">
                      {emojiRowB.map((e) => (
                        <span key={e.id} className="text-2xl">{e.emoji}</span>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Answer choices */}
            <div className={`grid grid-cols-2 gap-3 w-full max-w-sm ${feedback === 'wrong' ? 'animate-shake' : ''}`}>
              {problem.choices.map((choice) => {
                const isCorrectChoice = choice === problem.answer;
                let bg = 'bg-kidpurple';
                if (feedback === 'correct' && isCorrectChoice) bg = 'bg-kidgreen';
                if (feedback === 'wrong' && isCorrectChoice) bg = 'bg-kidred';
                return (
                  <button
                    key={choice}
                    onClick={() => handleAnswer(choice)}
                    className={`${bg} text-white text-4xl font-extrabold rounded-2xl py-5 shadow-md active:scale-95 transition-all`}
                  >
                    {choice}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
