import { useState, useCallback } from 'react';
import { BackButton } from '../common/BackButton';
import { SoundToggle } from '../common/SoundToggle';
import { StarReward } from '../common/StarReward';
import { useSound } from '../../hooks/useSound';
import { addStar } from '../../utils/storageUtils';
import { getShuffledWords } from '../../data/wordsData';
import type { WordEntry } from '../../types';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function ReadingGame() {
  const { play } = useSound();
  const [words] = useState<WordEntry[]>(() => getShuffledWords());
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [shaking, setShaking] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [totalStars, setTotalStars] = useState(0);
  const [availableLetters, setAvailableLetters] = useState<string[]>(() =>
    shuffle(getShuffledWords()[0].scrambled)
  );

  const currentWord = words[index];

  const handleLetterTap = useCallback(
    (letter: string, letterIndex: number) => {
      if (shaking || celebrating) return;
      play('click');
      const nextSelected = [...selected, letter];
      const expectedLetter = currentWord.word[selected.length];

      if (letter !== expectedLetter) {
        // Wrong letter
        play('incorrect');
        setShaking(true);
        setTimeout(() => setShaking(false), 500);
        return;
      }

      // Remove tapped letter from available pool
      const nextAvailable = [...availableLetters];
      nextAvailable.splice(letterIndex, 1);
      setAvailableLetters(nextAvailable);
      setSelected(nextSelected);

      if (nextSelected.length === currentWord.word.length) {
        // Word complete!
        play('star');
        setCelebrating(true);
        const progress = addStar('reading');
        setTotalStars(progress.stars);
        setTimeout(() => {
          setCelebrating(false);
          const nextIndex = (index + 1) % words.length;
          setIndex(nextIndex);
          setSelected([]);
          setAvailableLetters(shuffle(words[nextIndex].scrambled));
        }, 1800);
      }
    },
    [selected, shaking, celebrating, currentWord, availableLetters, index, words, play]
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-50 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 pt-6 pb-2">
        <BackButton />
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-kidblue">
            ⭐ {totalStars}
          </span>
          <SoundToggle />
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 gap-8">
        {celebrating ? (
          <StarReward message={`"${currentWord.word.toUpperCase()}" 🎉`} />
        ) : (
          <>
            {/* Word card with emoji */}
            <div className="bg-white rounded-3xl shadow-lg p-8 flex flex-col items-center gap-3 w-full max-w-sm">
              <span className="text-8xl">{currentWord.emoji}</span>
              <p className="text-lg font-semibold text-gray-500">Spell the word!</p>
            </div>

            {/* Spelling slots */}
            <div className={`flex gap-3 ${shaking ? 'animate-shake' : ''}`}>
              {currentWord.word.split('').map((_, i) => (
                <div
                  key={i}
                  className={`w-16 h-16 rounded-2xl border-4 flex items-center justify-center text-3xl font-extrabold shadow
                    ${i < selected.length
                      ? 'bg-kidblue border-kidblue text-white'
                      : 'bg-white border-gray-300 text-transparent'
                    }`}
                >
                  {i < selected.length ? selected[i].toUpperCase() : '_'}
                </div>
              ))}
            </div>

            {/* Letter buttons */}
            <div className="flex gap-3 flex-wrap justify-center">
              {availableLetters.map((letter, i) => (
                <button
                  key={i}
                  onClick={() => handleLetterTap(letter, i)}
                  className="w-16 h-16 rounded-2xl bg-kidyellow text-gray-800 text-3xl font-extrabold shadow-md active:scale-90 transition-transform hover:bg-yellow-300"
                >
                  {letter.toUpperCase()}
                </button>
              ))}
            </div>

            <p className="text-gray-400 text-sm font-semibold">
              Word {(index % words.length) + 1} of {words.length}
            </p>
          </>
        )}
      </main>
    </div>
  );
}
