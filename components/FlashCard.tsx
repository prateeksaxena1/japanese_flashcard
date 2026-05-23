"use client";

import { useState } from "react";

interface FlashCardProps {
  kanji?: string | null;
  hiragana: string;
  katakana?: string | null;
  romaji: string;
  partOfSpeech?: string | null;
  module?: { title: string; moduleNumber: number } | null;
  showReading?: boolean;
  displayModes?: string[];
}

export default function FlashCard({
  kanji,
  hiragana,
  katakana,
  romaji,
  partOfSpeech,
  module,
  showReading = false,
  displayModes = ["kanji"],
}: FlashCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div
      className="perspective-1000 w-full max-w-lg mx-auto cursor-pointer"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <div
        className={`relative w-full min-h-[320px] transition-transform duration-500 transform-style-3d ${
          isFlipped ? "rotate-y-180" : ""
        }`}
      >
        {/* Front */}
        <div className="absolute inset-0 backface-hidden rounded-2xl border border-zinc-700 bg-zinc-800 p-8 flex flex-col items-center justify-center shadow-2xl shadow-indigo-500/5">
          {module && (
            <span className="absolute top-4 left-4 text-xs font-medium text-zinc-500">
              {module.title}
            </span>
          )}

          {partOfSpeech && (
            <span className="mb-4 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-400">
              {partOfSpeech}
            </span>
          )}

          <div className="flex flex-col items-center gap-4 mb-4">
            {displayModes.includes("kanji") && (kanji || hiragana) && (
              <span className="text-6xl sm:text-7xl font-bold text-zinc-100 leading-tight">
                {kanji || hiragana}
              </span>
            )}
            {displayModes.includes("hiragana") && (
              <span className={`${displayModes.length > 1 ? "text-4xl text-indigo-300" : "text-6xl sm:text-7xl font-bold text-zinc-100"} leading-tight`}>
                {hiragana}
              </span>
            )}
            {displayModes.includes("romaji") && (
              <span className={`${displayModes.length > 1 ? "text-2xl text-zinc-400 italic" : "text-6xl sm:text-7xl font-bold text-zinc-100"} leading-tight`}>
                {romaji}
              </span>
            )}
          </div>

          {showReading && kanji && (
            <span className="text-xl text-zinc-400 mb-2">{hiragana}</span>
          )}

          <span className="text-sm text-zinc-500 mt-2">
            Click to reveal reading
          </span>
        </div>

        {/* Back */}
        <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-2xl border border-zinc-700 bg-zinc-800 p-8 flex flex-col items-center justify-center shadow-2xl shadow-violet-500/5">
          <span className="text-4xl font-bold text-zinc-100 mb-3">
            {kanji || hiragana}
          </span>

          <div className="flex flex-col items-center gap-2 mb-4">
            <span className="text-xl text-indigo-400">{hiragana}</span>
            {katakana && (
              <span className="text-lg text-zinc-400">{katakana}</span>
            )}
            <span className="text-lg text-zinc-500 italic">{romaji}</span>
          </div>

          <span className="text-sm text-zinc-500">
            Click to flip back
          </span>
        </div>
      </div>
    </div>
  );
}
