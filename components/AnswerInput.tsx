"use client";

import { useState, useRef, useEffect } from "react";

interface AnswerInputProps {
  onSubmit: (answer: string, timeTakenMs: number) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function AnswerInput({
  onSubmit,
  disabled = false,
  placeholder = "Type the English meaning...",
}: AnswerInputProps) {
  const [value, setValue] = useState("");
  const [startTime] = useState(Date.now());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || disabled) return;

    const timeTakenMs = Date.now() - startTime;
    onSubmit(value.trim(), timeTakenMs);
    setValue("");
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-lg mx-auto mt-6">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full rounded-xl border border-zinc-700 bg-zinc-800/50 px-5 py-4 text-lg text-zinc-100 placeholder-zinc-500 outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!value.trim() || disabled}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Submit
        </button>
      </div>
      <p className="mt-2 text-center text-xs text-zinc-500">
        Press Enter to submit your answer
      </p>
    </form>
  );
}
