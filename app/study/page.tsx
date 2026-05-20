"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";

interface Level {
  id: string;
  code: string;
  name: string;
  _count: { modules: number; vocabulary: number };
}

interface Module {
  id: string;
  moduleNumber: number;
  title: string;
  description: string | null;
  _count: { vocabulary: number };
}

export default function StudyPage() {
  const { user, isLoading, authFetch } = useAuth();
  const router = useRouter();

  const [levels, setLevels] = useState<Level[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [sessionType, setSessionType] = useState<"PRACTICE" | "TEST">("PRACTICE");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  // Load levels
  useEffect(() => {
    if (user) {
      authFetch("/api/levels")
        .then((res) => res.json())
        .then((d) => setLevels(d.levels || []))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [user, authFetch]);

  // Load modules when level selected
  useEffect(() => {
    if (selectedLevel) {
      setModules([]);
      setSelectedModules([]);
      authFetch(`/api/levels/${selectedLevel.id}/modules`)
        .then((res) => res.json())
        .then((d) => setModules(d.modules || []))
        .catch(console.error);
    }
  }, [selectedLevel, authFetch]);

  const toggleModule = (moduleId: string) => {
    setSelectedModules((prev) =>
      prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const selectAll = () => {
    if (selectedModules.length === modules.length) {
      setSelectedModules([]);
    } else {
      setSelectedModules(modules.map((m) => m.id));
    }
  };

  const startSession = async () => {
    if (selectedModules.length === 0) return;
    setCreating(true);

    try {
      const res = await authFetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleIds: selectedModules, sessionType }),
      });

      const data = await res.json();
      if (data.session?.id) {
        router.push(`/session/${data.session.id}`);
      }
    } catch (error) {
      console.error("Failed to create session:", error);
    } finally {
      setCreating(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-indigo-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-2 text-3xl font-bold text-zinc-100">Study</h1>
      <p className="mb-8 text-zinc-400">Select a level and modules to begin your flashcard session</p>

      {/* Step 1: Level Picker */}
      <div className="mb-8">
        <h2 className="mb-4 text-sm font-medium text-zinc-400 uppercase tracking-wider">
          Step 1 — Choose JLPT Level
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {levels.map((level) => (
            <button
              key={level.id}
              onClick={() => setSelectedLevel(level)}
              className={`rounded-2xl border p-6 text-left transition-all duration-200 ${
                selectedLevel?.id === level.id
                  ? "border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/10"
                  : "border-zinc-700 bg-zinc-800 hover:border-zinc-600 hover:bg-zinc-700/50"
              }`}
            >
              <span className="text-2xl font-bold text-zinc-100">{level.code}</span>
              <p className="mt-1 text-xs text-zinc-400">{level.name}</p>
              <div className="mt-3 flex gap-3 text-xs text-zinc-500">
                <span>{level._count.modules} modules</span>
                <span>{level._count.vocabulary} words</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Step 2: Module Selector */}
      {selectedLevel && (
        <div className="mb-8 animate-fade-in-up">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
              Step 2 — Select Modules
            </h2>
            <button
              onClick={selectAll}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
            >
              {selectedModules.length === modules.length ? "Deselect All" : "Select All"}
            </button>
          </div>

          {modules.length === 0 ? (
            <p className="text-zinc-500 text-sm">Loading modules...</p>
          ) : (
            <div className="space-y-3">
              {modules.map((mod) => (
                <button
                  key={mod.id}
                  onClick={() => toggleModule(mod.id)}
                  className={`w-full rounded-xl border p-4 text-left transition-all duration-200 ${
                    selectedModules.includes(mod.id)
                      ? "border-indigo-500 bg-indigo-500/10"
                      : "border-zinc-700 bg-zinc-800 hover:border-zinc-600"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-md border text-xs font-bold ${
                          selectedModules.includes(mod.id)
                            ? "border-indigo-500 bg-indigo-500 text-white"
                            : "border-zinc-600 text-zinc-400"
                        }`}
                      >
                        {selectedModules.includes(mod.id) ? "✓" : mod.moduleNumber}
                      </span>
                      <div>
                        <p className="font-medium text-zinc-200">{mod.title}</p>
                        {mod.description && (
                          <p className="text-xs text-zinc-500 mt-0.5">{mod.description}</p>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-zinc-500">{mod._count.vocabulary} words</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 3: Session Type + Start */}
      {selectedModules.length > 0 && (
        <div className="animate-fade-in-up">
          <h2 className="mb-4 text-sm font-medium text-zinc-400 uppercase tracking-wider">
            Step 3 — Session Type
          </h2>

          <div className="flex gap-3 mb-6">
            {(["PRACTICE", "TEST"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setSessionType(type)}
                className={`rounded-xl border px-6 py-3 text-sm font-medium transition-all ${
                  sessionType === type
                    ? "border-indigo-500 bg-indigo-500/10 text-indigo-400"
                    : "border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600"
                }`}
              >
                {type === "PRACTICE" ? "📝 Practice" : "📋 Test"}
              </button>
            ))}
          </div>

          <button
            onClick={startSession}
            disabled={creating}
            className="w-full rounded-xl bg-indigo-600 py-4 text-lg font-semibold text-white transition-all hover:bg-indigo-500 disabled:opacity-50"
          >
            {creating ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Creating session...
              </span>
            ) : (
              `Start Session (${selectedModules.length} module${selectedModules.length > 1 ? "s" : ""})`
            )}
          </button>
        </div>
      )}
    </div>
  );
}
