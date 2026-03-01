import { GameCard } from './GameCard';
import { SoundToggle } from './SoundToggle';

const GAMES = [
  {
    id: 'reading' as const,
    emoji: '📖',
    title: 'Word Fun',
    description: 'Spell 3-letter words!',
    bgColor: 'bg-kidblue',
  },
  {
    id: 'memory' as const,
    emoji: '🐘',
    title: 'Memory Match',
    description: 'Find the matching pairs!',
    bgColor: 'bg-kidgreen',
  },
  {
    id: 'puzzle' as const,
    emoji: '🧩',
    title: 'Picture Puzzle',
    description: 'Put the pieces together!',
    bgColor: 'bg-kidorange',
  },
  {
    id: 'drawing' as const,
    emoji: '🎨',
    title: 'Draw & Color',
    description: 'Create your masterpiece!',
    bgColor: 'bg-kidpink',
  },
  {
    id: 'math' as const,
    emoji: '🔢',
    title: 'Math Stars',
    description: 'Count and calculate!',
    bgColor: 'bg-kidpurple',
  },
];

export function HomeScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-yellow-50 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 pt-6 pb-2">
        <div>
          <h1 className="text-3xl font-extrabold text-kidblue leading-tight">Lydia's Games</h1>
          <p className="text-base font-semibold text-gray-500">Hi Lydia! Pick a game 🌟</p>
        </div>
        <SoundToggle />
      </header>

      {/* Welcome card */}
      <div className="px-4 pt-3">
        <div className="bg-white rounded-3xl px-6 py-4 shadow text-center max-w-md mx-auto w-full">
          <p className="text-2xl font-extrabold text-kidblue">Hi Lydia! 👋</p>
          <p className="text-gray-500 font-semibold">Ready to play and learn?</p>
        </div>
      </div>

      {/* Hero emoji */}
      <div className="flex justify-center py-3">
        <span className="text-7xl animate-bounce2">🌟</span>
      </div>

      {/* Game grid */}
      <main className="flex-1 px-4 pb-8">
        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
          {GAMES.map((g) => (
            <div key={g.id} className={g.id === 'drawing' ? 'col-span-2' : ''}>
              <GameCard {...g} />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
