"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter, useParams } from "next/navigation";
import FlashCard from "@/components/FlashCard";
import AnswerInput from "@/components/AnswerInput";
import ScoreFlash from "@/components/ScoreFlash";
import Link from "next/link";

interface CardData {
  id: string;
  kanji: string | null;
  hiragana: string;
  katakana: string | null;
  romaji: string;
  partOfSpeech: string | null;
  module: { title: string; moduleNumber: number } | null;
}

interface AttemptResult {
  score: number;
  verdict: "correct" | "partial" | "wrong";
  method: string;
  explanation: string;
  correctAnswer: string;
  acceptedMeanings: string[];
}

export default function SessionPage() {
  const { user, isLoading, authFetch } = useAuth();
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;

  const [card, setCard] = useState<CardData | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) router.push("/login");
  }, [user, isLoading, router]);

  const fetchNextCard = useCallback(async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await authFetch(`/api/sessions/${sessionId}/next-card`);
      const data = await res.json();
      
      if (!res.ok) {
        if (data.status === "COMPLETED") {
          setCompleted(true);
        } else {
          router.push("/dashboard");
        }
        return;
      }
      
      if (data.completed) setCompleted(true);
      else { setCard(data.card); setProgress(data.progress || { current: 0, total: 0 }); }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [sessionId, authFetch]);

  useEffect(() => { if (user && sessionId) fetchNextCard(); }, [user, sessionId, fetchNextCard]);

  const handleSubmit = async (answer: string, timeTakenMs: number) => {
    if (!card || submitting) return;
    setSubmitting(true);
    try {
      const res = await authFetch(`/api/sessions/${sessionId}/attempt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vocabularyId: card.id, userInput: answer, timeTakenMs }),
      });
      setResult(await res.json());
    } catch (e) { console.error(e); }
    finally { setSubmitting(false); }
  };

  if (isLoading || loading) {
    return (<div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-indigo-500" /></div>);
  }

  if (completed) {
    return (<div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <span className="mb-4 block text-6xl">🎉</span>
        <h1 className="mb-2 text-3xl font-bold text-zinc-100">Session Complete!</h1>
        <p className="mb-8 text-zinc-400">Great job finishing all the cards.</p>
        <div className="flex flex-col gap-3">
          <Link href="/study" className="rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-500">Start New Session</Link>
          <Link href="/dashboard" className="rounded-xl border border-zinc-700 bg-zinc-800 py-3 text-sm font-medium text-zinc-300 hover:bg-zinc-700">Dashboard</Link>
        </div>
      </div></div>);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-zinc-400">Card {progress.current} of {progress.total}</span>
          <span className="text-sm font-medium text-indigo-400">{Math.round((progress.current / progress.total) * 100)}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
            style={{ width: `${(progress.current / progress.total) * 100}%` }} />
        </div>
      </div>
      {card && <FlashCard kanji={card.kanji} hiragana={card.hiragana} katakana={card.katakana} romaji={card.romaji} partOfSpeech={card.partOfSpeech} module={card.module} />}
      {result ? (
        <ScoreFlash score={result.score} verdict={result.verdict} explanation={result.explanation} correctAnswer={result.correctAnswer} onContinue={fetchNextCard} />
      ) : (
        <AnswerInput onSubmit={handleSubmit} disabled={submitting} />
      )}
    </div>
  );
}
