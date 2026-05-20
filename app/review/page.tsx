"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import FlashCard from "@/components/FlashCard";
import AnswerInput from "@/components/AnswerInput";
import ScoreFlash from "@/components/ScoreFlash";
import Link from "next/link";

interface ReviewItem {
  vocabularyId: string;
  kanji: string | null;
  hiragana: string;
  romaji: string;
  primaryMeaning: string;
  partOfSpeech: string | null;
  module: string;
  masteryLevel: number;
}

interface AttemptResult {
  score: number;
  verdict: "correct" | "partial" | "wrong";
  method: string;
  explanation: string;
  correctAnswer: string;
}

export default function ReviewPage() {
  const { user, isLoading, authFetch } = useAuth();
  const router = useRouter();
  const [queue, setQueue] = useState<ReviewItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !user) router.push("/login");
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      authFetch("/api/user/review-queue")
        .then((r) => r.json())
        .then((d) => setQueue(d.reviewQueue || []))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [user, authFetch]);

  // Create a review session when queue loads
  const createSession = useCallback(async () => {
    if (queue.length === 0) return;
    try {
      // Get unique module IDs from the review queue
      const moduleIds = [...new Set(queue.map((q) => q.vocabularyId))];
      const res = await authFetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleIds: moduleIds.slice(0, 1), sessionType: "REVIEW" }),
      });
      const data = await res.json();
      if (data.session?.id) setSessionId(data.session.id);
    } catch (e) { console.error(e); }
  }, [queue, authFetch]);

  useEffect(() => { createSession(); }, [createSession]);

  const current = queue[currentIndex];

  const handleSubmit = async (answer: string, timeTakenMs: number) => {
    if (!current || submitting || !sessionId) return;
    setSubmitting(true);
    try {
      const res = await authFetch(`/api/sessions/${sessionId}/attempt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vocabularyId: current.vocabularyId, userInput: answer, timeTakenMs }),
      });
      setResult(await res.json());
    } catch (e) { console.error(e); }
    finally { setSubmitting(false); }
  };

  const handleContinue = () => {
    setResult(null);
    if (currentIndex < queue.length - 1) setCurrentIndex(currentIndex + 1);
    else setCurrentIndex(-1); // done
  };

  if (isLoading || loading) {
    return (<div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-indigo-500" /></div>);
  }

  if (queue.length === 0 || currentIndex === -1) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <span className="mb-4 block text-6xl">{queue.length === 0 ? "✨" : "🎉"}</span>
          <h1 className="mb-2 text-3xl font-bold text-zinc-100">
            {queue.length === 0 ? "All Caught Up!" : "Review Complete!"}
          </h1>
          <p className="mb-8 text-zinc-400">
            {queue.length === 0 ? "No words due for review right now." : "You reviewed all due words."}
          </p>
          <Link href="/dashboard" className="inline-block rounded-xl bg-indigo-600 px-8 py-3 font-semibold text-white hover:bg-indigo-500">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-zinc-100">🔄 Spaced Review</h1>
        <span className="text-sm text-zinc-400">{currentIndex + 1} / {queue.length}</span>
      </div>
      <div className="mb-8 h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
        <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
          style={{ width: `${((currentIndex + 1) / queue.length) * 100}%` }} />
      </div>

      <FlashCard kanji={current.kanji} hiragana={current.hiragana} katakana={null} romaji={current.romaji} partOfSpeech={current.partOfSpeech} />

      {result ? (
        <ScoreFlash score={result.score} verdict={result.verdict} explanation={result.explanation} correctAnswer={result.correctAnswer} onContinue={handleContinue} />
      ) : (
        <AnswerInput onSubmit={handleSubmit} disabled={submitting} />
      )}
    </div>
  );
}
