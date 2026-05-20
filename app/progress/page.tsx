"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import MasteryBar from "@/components/MasteryBar";

interface WeakWord {
  vocabularyId: string;
  kanji: string | null;
  hiragana: string;
  romaji: string;
  primaryMeaning: string;
  partOfSpeech: string | null;
  module: string;
  correctCount: number;
  incorrectCount: number;
  masteryLevel: number;
}

export default function ProgressPage() {
  const { user, isLoading, authFetch } = useAuth();
  const router = useRouter();
  const [weakWords, setWeakWords] = useState<WeakWord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) router.push("/login");
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      authFetch("/api/user/progress/weak-words")
        .then((r) => r.json())
        .then((d) => setWeakWords(d.weakWords || []))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [user, authFetch]);

  if (isLoading || loading) {
    return (<div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-indigo-500" /></div>);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-2 text-3xl font-bold text-zinc-100">Progress</h1>
      <p className="mb-8 text-zinc-400">Track your vocabulary mastery and identify weak areas</p>

      <div className="rounded-2xl border border-zinc-700 bg-zinc-800 p-6">
        <h2 className="mb-4 text-lg font-semibold text-zinc-100 flex items-center gap-2">
          <span className="text-red-400">⚠</span> Weak Words
          <span className="ml-auto text-sm font-normal text-zinc-500">{weakWords.length} words</span>
        </h2>

        {weakWords.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-4xl mb-4 block">🎯</span>
            <p className="text-zinc-400">No weak words! Keep up the great work.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {weakWords.map((w) => (
              <div key={w.vocabularyId} className="flex items-center gap-4 rounded-xl bg-zinc-900/50 p-4">
                <div className="flex-shrink-0 text-center w-16">
                  <p className="text-2xl font-bold text-zinc-100">{w.kanji || w.hiragana}</p>
                  <p className="text-xs text-zinc-500 mt-1">{w.romaji}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-zinc-200 truncate">{w.primaryMeaning}</p>
                  <p className="text-xs text-zinc-500">{w.module} · {w.partOfSpeech || "—"}</p>
                  <MasteryBar level={w.masteryLevel} size="sm" showPercentage={false} />
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="text-sm"><span className="text-emerald-400">{w.correctCount}</span> / <span className="text-red-400">{w.incorrectCount}</span></p>
                  <p className="text-xs text-zinc-500">correct / wrong</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
