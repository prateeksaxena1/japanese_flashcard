/**
 * Answer Evaluation Engine
 *
 * Pure function that evaluates a user's answer against vocabulary data.
 * Returns score (0-100), verdict, evaluation method, and explanation.
 */

export interface VocabularyForEval {
  primaryMeaning: string;
  acceptedMeanings: string[];
  synonyms: string[];
}

export interface EvaluationResult {
  score: number;
  verdict: "correct" | "partial" | "wrong";
  method: "EXACT" | "SYNONYM" | "FUZZY" | "STEM";
  explanation: string;
}

// ─── Layer 1: Normalize ────────────────────────────────

function normalize(input: string): string {
  return input.toLowerCase().trim().replace(/\s+/g, " ");
}

// ─── Layer 5: Simple Stemming ──────────────────────────

function stem(word: string): string {
  // Strip common English suffixes
  if (word.endsWith("ing")) return word.slice(0, -3);
  if (word.endsWith("ed")) return word.slice(0, -2);
  if (word.endsWith("es")) return word.slice(0, -2);
  if (word.endsWith("s") && !word.endsWith("ss")) return word.slice(0, -1);
  return word;
}

function stemPhrase(phrase: string): string {
  return phrase
    .split(" ")
    .map((w) => stem(w))
    .join(" ");
}

// ─── Layer 6: Levenshtein Distance ─────────────────────

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= a.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= b.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[a.length][b.length];
}

function similarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshteinDistance(a, b) / maxLen;
}

// ─── Main Evaluation Function ──────────────────────────

export function evaluateAnswer(
  userInput: string,
  vocabulary: VocabularyForEval
): EvaluationResult {
  const normalizedInput = normalize(userInput);
  const normalizedPrimary = normalize(vocabulary.primaryMeaning);
  const normalizedAccepted = (vocabulary.acceptedMeanings || []).map(normalize);
  const normalizedSynonyms = (vocabulary.synonyms || []).map(normalize);

  // Collect all valid meanings for fuzzy matching later
  const allMeanings = [normalizedPrimary, ...normalizedAccepted];

  // ─── Layer 2: Exact match against primaryMeaning ─────
  if (normalizedInput === normalizedPrimary) {
    return {
      score: 100,
      verdict: "correct",
      method: "EXACT",
      explanation: "Perfect match!",
    };
  }

  // ─── Layer 3: Check acceptedMeanings ─────────────────
  if (normalizedAccepted.includes(normalizedInput)) {
    return {
      score: 100,
      verdict: "correct",
      method: "EXACT",
      explanation: "Matched an accepted meaning.",
    };
  }

  // ─── Layer 4: Check synonyms ─────────────────────────
  if (normalizedSynonyms.includes(normalizedInput)) {
    return {
      score: 95,
      verdict: "correct",
      method: "SYNONYM",
      explanation: "Matched a synonym — close enough!",
    };
  }

  // ─── Layer 5: Stemming + recheck ─────────────────────
  const stemmedInput = stemPhrase(normalizedInput);

  if (stemmedInput === stemPhrase(normalizedPrimary)) {
    return {
      score: 98,
      verdict: "correct",
      method: "STEM",
      explanation: "Matched after stemming (e.g. plural/tense form).",
    };
  }

  for (const meaning of normalizedAccepted) {
    if (stemmedInput === stemPhrase(meaning)) {
      return {
        score: 98,
        verdict: "correct",
        method: "STEM",
        explanation: "Matched an accepted meaning after stemming.",
      };
    }
  }

  for (const syn of normalizedSynonyms) {
    if (stemmedInput === stemPhrase(syn)) {
      return {
        score: 95,
        verdict: "correct",
        method: "STEM",
        explanation: "Matched a synonym after stemming.",
      };
    }
  }

  // ─── Layer 6: Levenshtein (fuzzy) ────────────────────
  let bestScore = 0;
  let bestMatch = "";

  for (const meaning of allMeanings) {
    const sim = similarity(normalizedInput, meaning);
    const score =
      sim >= 0.9 ? 90 : sim >= 0.7 ? 70 : sim >= 0.5 ? 50 : Math.round(sim * 100);

    if (score > bestScore) {
      bestScore = score;
      bestMatch = meaning;
    }
  }

  // Also check synonyms with fuzzy
  for (const syn of normalizedSynonyms) {
    const sim = similarity(normalizedInput, syn);
    // Cap synonym fuzzy score slightly lower
    const score =
      sim >= 0.9
        ? 88
        : sim >= 0.7
          ? 68
          : sim >= 0.5
            ? 48
            : Math.round(sim * 100);

    if (score > bestScore) {
      bestScore = score;
      bestMatch = syn;
    }
  }

  // Determine verdict
  const verdict: EvaluationResult["verdict"] =
    bestScore >= 80 ? "correct" : bestScore >= 50 ? "partial" : "wrong";

  const explanation =
    bestScore >= 80
      ? `Close match to "${bestMatch}" — good enough!`
      : bestScore >= 50
        ? `Partially matches "${bestMatch}". The correct answer is "${vocabulary.primaryMeaning}".`
        : `Not close enough. The correct answer is "${vocabulary.primaryMeaning}".`;

  return {
    score: bestScore,
    verdict,
    method: "FUZZY",
    explanation,
  };
}
