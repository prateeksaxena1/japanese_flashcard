"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LandingPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.push("/dashboard");
    }
  }, [user, isLoading, router]);

  const features = [
    {
      icon: "🎴",
      title: "Smart Flashcards",
      description: "Interactive flashcard sessions with kanji, hiragana, and romaji display.",
    },
    {
      icon: "🧠",
      title: "Spaced Repetition",
      description: "SM-2 algorithm schedules reviews at optimal intervals for long-term retention.",
    },
    {
      icon: "📊",
      title: "Intelligent Scoring",
      description: "6-layer answer evaluation with fuzzy matching, synonyms, and stemming.",
    },
    {
      icon: "🔥",
      title: "Streak Tracking",
      description: "Build daily study habits with streak counting and progress milestones.",
    },
    {
      icon: "📈",
      title: "Mastery Metrics",
      description: "Track your progress per module with detailed mastery levels and weak word analysis.",
    },
    {
      icon: "🎯",
      title: "JLPT Focused",
      description: "Curated vocabulary organized by JLPT levels — N5 through N1.",
    },
  ];

  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 py-24 sm:py-32">
        {/* Background gradient orbs */}
        <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-violet-500/10 blur-3xl" />

        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-800/50 px-4 py-1.5 text-sm text-zinc-400">
            <span className="text-indigo-400">●</span>
            Now supporting N5 & N4 levels
          </div>

          <h1 className="mb-6 text-5xl font-bold tracking-tight sm:text-7xl">
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
              Master Japanese
            </span>
            <br />
            <span className="text-zinc-100">Vocabulary</span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg text-zinc-400 leading-relaxed">
            The intelligent JLPT vocabulary learning platform with spaced repetition,
            smart scoring, and beautiful flashcards. Build lasting memory, one word at a time.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="group relative rounded-xl bg-indigo-600 px-8 py-4 text-lg font-semibold text-white transition-all hover:bg-indigo-500 hover:shadow-xl hover:shadow-indigo-500/20 animate-pulse-glow"
            >
              Start Learning Free
              <span className="ml-2 inline-block transition-transform group-hover:translate-x-1">
                →
              </span>
            </Link>
            <Link
              href="/login"
              className="rounded-xl border border-zinc-700 bg-zinc-800/50 px-8 py-4 text-lg font-medium text-zinc-300 transition-all hover:bg-zinc-700/50 hover:text-zinc-100"
            >
              Sign In
            </Link>
          </div>

          {/* Japanese decorative text */}
          <div className="mt-16 flex items-center justify-center gap-8 text-4xl opacity-20">
            <span>漢字</span>
            <span className="text-indigo-400">•</span>
            <span>言葉</span>
            <span className="text-violet-400">•</span>
            <span>学ぶ</span>
            <span className="text-purple-400">•</span>
            <span>覚える</span>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-12 text-center text-3xl font-bold text-zinc-100">
            Everything you need to{" "}
            <span className="text-indigo-400">ace the JLPT</span>
          </h2>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className="group rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 transition-all duration-300 hover:border-zinc-700 hover:bg-zinc-800/50 hover:shadow-xl hover:shadow-indigo-500/5"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <span className="mb-4 block text-3xl">{feature.icon}</span>
                <h3 className="mb-2 text-lg font-semibold text-zinc-100 group-hover:text-indigo-400 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-2xl rounded-3xl border border-zinc-800 bg-gradient-to-br from-indigo-500/5 to-violet-500/5 p-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-zinc-100">
            Ready to begin?
          </h2>
          <p className="mb-8 text-zinc-400">
            Join thousands of students mastering JLPT vocabulary with spaced repetition.
          </p>
          <Link
            href="/register"
            className="inline-block rounded-xl bg-indigo-600 px-8 py-4 text-lg font-semibold text-white transition-all hover:bg-indigo-500"
          >
            Create Free Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 px-4 py-8">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <span className="text-sm text-zinc-500">
            © 2024 JLPT Master. Built for learners.
          </span>
          <span className="text-sm text-zinc-600">v1.0</span>
        </div>
      </footer>
    </div>
  );
}
