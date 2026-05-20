"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import Link from "next/link";
import StreakDisplay from "@/components/StreakDisplay";
import MasteryBar from "@/components/MasteryBar";

interface DashboardData {
  streak: {
    currentStreak: number;
    longestStreak: number;
    totalDaysActive: number;
  };
  stats: {
    totalStudied: number;
    averageMastery: number;
    totalCorrect: number;
    totalIncorrect: number;
    totalPartial: number;
    weakWordsCount: number;
    reviewDueCount: number;
  };
  recentSessions: Array<{
    id: string;
    sessionType: string;
    totalCards: number;
    completedCards: number;
    scoreTotal: number;
    status: string;
    startedAt: string;
  }>;
}

export default function DashboardPage() {
  const { user, isLoading, authFetch } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      authFetch("/api/user/progress")
        .then((res) => res.json())
        .then((d) => setData(d))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [user, authFetch]);

  if (isLoading || loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-indigo-500" />
      </div>
    );
  }

  if (!data) return null;

  const totalAnswers = data.stats.totalCorrect + data.stats.totalIncorrect + data.stats.totalPartial;
  const accuracy = totalAnswers > 0 ? Math.round((data.stats.totalCorrect / totalAnswers) * 100) : 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-100">
          Welcome back, <span className="text-indigo-400">{user?.username || "Student"}</span>
        </h1>
        <p className="mt-1 text-zinc-400">Here&apos;s your learning progress</p>
      </div>

      {/* Quick Actions */}
      <div className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/study"
          className="group rounded-2xl border border-zinc-700 bg-gradient-to-br from-indigo-500/10 to-violet-500/10 p-6 transition-all hover:border-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/10"
        >
          <span className="text-3xl mb-3 block">📚</span>
          <h3 className="font-semibold text-zinc-100 group-hover:text-indigo-400 transition-colors">Study New Words</h3>
          <p className="text-sm text-zinc-500 mt-1">Start a flashcard session</p>
        </Link>

        <Link
          href="/review"
          className="group rounded-2xl border border-zinc-700 bg-gradient-to-br from-amber-500/10 to-orange-500/10 p-6 transition-all hover:border-amber-500/30 hover:shadow-xl hover:shadow-amber-500/10"
        >
          <span className="text-3xl mb-3 block">🔄</span>
          <h3 className="font-semibold text-zinc-100 group-hover:text-amber-400 transition-colors">Review Queue</h3>
          <p className="text-sm text-zinc-500 mt-1">
            {data.stats.reviewDueCount > 0
              ? `${data.stats.reviewDueCount} words due`
              : "All caught up!"}
          </p>
        </Link>

        <Link
          href="/progress"
          className="group rounded-2xl border border-zinc-700 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 p-6 transition-all hover:border-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/10"
        >
          <span className="text-3xl mb-3 block">📊</span>
          <h3 className="font-semibold text-zinc-100 group-hover:text-emerald-400 transition-colors">View Progress</h3>
          <p className="text-sm text-zinc-500 mt-1">{data.stats.totalStudied} words studied</p>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Streak */}
        <StreakDisplay
          currentStreak={data.streak.currentStreak}
          longestStreak={data.streak.longestStreak}
          totalDaysActive={data.streak.totalDaysActive}
        />

        {/* Mastery */}
        <div className="rounded-2xl border border-zinc-700 bg-zinc-800 p-6">
          <h3 className="mb-4 text-sm font-medium text-zinc-400 uppercase tracking-wider">Mastery</h3>
          <MasteryBar level={data.stats.averageMastery} label="Overall" size="lg" />
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-zinc-900/50 p-3">
              <p className="text-lg font-bold text-emerald-400">{accuracy}%</p>
              <p className="text-xs text-zinc-500">Accuracy</p>
            </div>
            <div className="rounded-lg bg-zinc-900/50 p-3">
              <p className="text-lg font-bold text-zinc-100">{data.stats.totalStudied}</p>
              <p className="text-xs text-zinc-500">Words Studied</p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="rounded-2xl border border-zinc-700 bg-zinc-800 p-6">
          <h3 className="mb-4 text-sm font-medium text-zinc-400 uppercase tracking-wider">Performance</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">Correct</span>
              <span className="font-bold text-emerald-400">{data.stats.totalCorrect}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">Partial</span>
              <span className="font-bold text-amber-400">{data.stats.totalPartial}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">Incorrect</span>
              <span className="font-bold text-red-400">{data.stats.totalIncorrect}</span>
            </div>
            <hr className="border-zinc-700" />
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">Weak Words</span>
              <span className="font-bold text-orange-400">{data.stats.weakWordsCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">Review Due</span>
              <span className="font-bold text-indigo-400">{data.stats.reviewDueCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="rounded-2xl border border-zinc-700 bg-zinc-800 p-6">
        <h3 className="mb-4 text-sm font-medium text-zinc-400 uppercase tracking-wider">Recent Sessions</h3>
        {data.recentSessions.length === 0 ? (
          <p className="text-zinc-500 text-sm">No sessions yet. Start studying to see your history!</p>
        ) : (
          <div className="space-y-3">
            {data.recentSessions.map((session) => (
              <Link
                key={session.id}
                href={`/session/${session.id}`}
                className="flex items-center justify-between rounded-xl bg-zinc-900/50 p-4 transition-all hover:bg-zinc-700/50"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 text-sm">
                    {session.sessionType === "PRACTICE" ? "📝" : session.sessionType === "REVIEW" ? "🔄" : "📋"}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-zinc-200">{session.sessionType} Session</p>
                    <p className="text-xs text-zinc-500">
                      {new Date(session.startedAt).toLocaleDateString()} · {session.completedCards}/{session.totalCards} cards
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-zinc-200">
                    {session.completedCards > 0
                      ? Math.round(session.scoreTotal / session.completedCards)
                      : 0}%
                  </p>
                  <p className={`text-xs ${session.status === "COMPLETED" ? "text-emerald-400" : "text-amber-400"}`}>
                    {session.status}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
