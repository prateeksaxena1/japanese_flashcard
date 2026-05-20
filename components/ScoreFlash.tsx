"use client";

import { useEffect, useState } from "react";

interface ScoreFlashProps {
  score: number;
  verdict: "correct" | "partial" | "wrong";
  explanation: string;
  correctAnswer: string;
  onContinue: () => void;
}

export default function ScoreFlash({
  score,
  verdict,
  explanation,
  correctAnswer,
  onContinue,
}: ScoreFlashProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const colors = {
    correct: {
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/30",
      text: "text-emerald-400",
      glow: "shadow-emerald-500/20",
      icon: "✓",
      label: "Correct!",
    },
    partial: {
      bg: "bg-amber-500/10",
      border: "border-amber-500/30",
      text: "text-amber-400",
      glow: "shadow-amber-500/20",
      icon: "~",
      label: "Partial",
    },
    wrong: {
      bg: "bg-red-500/10",
      border: "border-red-500/30",
      text: "text-red-400",
      glow: "shadow-red-500/20",
      icon: "✗",
      label: "Incorrect",
    },
  };

  const c = colors[verdict];

  return (
    <div
      className={`w-full max-w-lg mx-auto mt-4 transition-all duration-500 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      <div
        className={`rounded-2xl border ${c.border} ${c.bg} p-6 shadow-xl ${c.glow}`}
      >
        <div className="flex items-center gap-3 mb-3">
          <span
            className={`flex h-10 w-10 items-center justify-center rounded-full ${c.bg} ${c.text} text-xl font-bold border ${c.border}`}
          >
            {c.icon}
          </span>
          <div>
            <span className={`text-lg font-bold ${c.text}`}>{c.label}</span>
            <span className="ml-2 text-sm text-zinc-400">Score: {score}/100</span>
          </div>
        </div>

        <p className="text-sm text-zinc-300 mb-2">{explanation}</p>

        {verdict !== "correct" && (
          <p className="text-sm text-zinc-400">
            Correct answer: <span className="font-medium text-zinc-200">{correctAnswer}</span>
          </p>
        )}

        <button
          onClick={onContinue}
          className="mt-4 w-full rounded-lg bg-zinc-700 py-2.5 text-sm font-medium text-zinc-200 transition-all hover:bg-zinc-600"
        >
          Next Card →
        </button>
      </div>
    </div>
  );
}
