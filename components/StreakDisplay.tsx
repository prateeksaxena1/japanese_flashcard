"use client";

interface StreakDisplayProps {
  currentStreak: number;
  longestStreak: number;
  totalDaysActive: number;
}

export default function StreakDisplay({
  currentStreak,
  longestStreak,
  totalDaysActive,
}: StreakDisplayProps) {
  const fireIntensity = Math.min(currentStreak, 10); // Cap at 10 for animation
  
  return (
    <div className="rounded-2xl border border-zinc-700 bg-zinc-800 p-6">
      <div className="flex items-center gap-3 mb-4">
        <span
          className={`text-3xl ${
            currentStreak > 0 ? "animate-pulse" : "opacity-50"
          }`}
          style={{
            filter: currentStreak > 0
              ? `brightness(${1 + fireIntensity * 0.1})`
              : "grayscale(1)",
          }}
        >
          🔥
        </span>
        <div>
          <h3 className="text-2xl font-bold text-zinc-100">
            {currentStreak} {currentStreak === 1 ? "Day" : "Days"}
          </h3>
          <p className="text-sm text-zinc-400">Current Streak</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-zinc-900/50 p-3">
          <p className="text-lg font-bold text-indigo-400">{longestStreak}</p>
          <p className="text-xs text-zinc-500">Best Streak</p>
        </div>
        <div className="rounded-lg bg-zinc-900/50 p-3">
          <p className="text-lg font-bold text-violet-400">{totalDaysActive}</p>
          <p className="text-xs text-zinc-500">Days Active</p>
        </div>
      </div>
    </div>
  );
}
