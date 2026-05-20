"use client";

interface MasteryBarProps {
  level: number; // 0-100
  label?: string;
  showPercentage?: boolean;
  size?: "sm" | "md" | "lg";
}

export default function MasteryBar({
  level,
  label,
  showPercentage = true,
  size = "md",
}: MasteryBarProps) {
  const clampedLevel = Math.min(100, Math.max(0, level));

  const heights = { sm: "h-1.5", md: "h-2.5", lg: "h-4" };
  const barHeight = heights[size];

  const getColor = (level: number) => {
    if (level >= 80) return "from-emerald-500 to-emerald-400";
    if (level >= 60) return "from-indigo-500 to-violet-500";
    if (level >= 30) return "from-amber-500 to-orange-500";
    return "from-red-500 to-red-400";
  };

  return (
    <div className="w-full">
      {(label || showPercentage) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && (
            <span className="text-sm font-medium text-zinc-300">{label}</span>
          )}
          {showPercentage && (
            <span className="text-sm font-bold text-zinc-400">
              {clampedLevel}%
            </span>
          )}
        </div>
      )}
      <div
        className={`w-full rounded-full bg-zinc-700/50 ${barHeight} overflow-hidden`}
      >
        <div
          className={`${barHeight} rounded-full bg-gradient-to-r ${getColor(clampedLevel)} transition-all duration-700 ease-out`}
          style={{ width: `${clampedLevel}%` }}
        />
      </div>
    </div>
  );
}
