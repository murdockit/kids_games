interface StarRewardProps {
  count?: number;
  message?: string;
}

export function StarReward({ count = 1, message = 'Great job!' }: StarRewardProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex gap-1">
        {Array.from({ length: count }).map((_, i) => (
          <span
            key={i}
            className="text-5xl animate-star-pop"
            style={{ animationDelay: `${i * 0.12}s` }}
          >
            ⭐
          </span>
        ))}
      </div>
      <p className="text-2xl font-extrabold text-kidpurple">{message}</p>
    </div>
  );
}
