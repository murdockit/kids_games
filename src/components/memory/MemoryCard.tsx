interface MemoryCardProps {
  emoji: string;
  label: string;
  isFlipped: boolean;
  isMatched: boolean;
  onClick: () => void;
}

export function MemoryCard({ emoji, label, isFlipped, isMatched, onClick }: MemoryCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={isFlipped || isMatched}
      aria-label={isFlipped || isMatched ? label : 'Hidden card'}
      className="relative w-full aspect-square"
      style={{ perspective: '600px' }}
    >
      <div
        className="w-full h-full relative transition-transform duration-500 preserve-3d"
        style={{ transform: isFlipped || isMatched ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
      >
        {/* Back face */}
        <div className={`absolute inset-0 rounded-2xl flex items-center justify-center backface-hidden shadow-md
          ${isMatched ? 'bg-kidgreen' : 'bg-kidblue'}`}>
          <span className="text-3xl text-white font-extrabold">?</span>
        </div>
        {/* Front face */}
        <div
          className={`absolute inset-0 rounded-2xl flex items-center justify-center backface-hidden shadow-md rotate-y-180
            ${isMatched ? 'bg-green-100 ring-4 ring-kidgreen' : 'bg-white'}`}
        >
          <span className="text-4xl">{emoji}</span>
        </div>
      </div>
    </button>
  );
}
