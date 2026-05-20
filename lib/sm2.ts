/**
 * SM-2 Spaced Repetition Algorithm
 *
 * Updates user progress based on answer quality.
 * Maps raw scores to quality (1-5), then applies SM-2 rules.
 */

export interface SM2Progress {
  easeFactor: number;
  intervalDays: number;
  repetitionNumber: number;
  masteryLevel: number;
}

export interface SM2Result {
  easeFactor: number;
  intervalDays: number;
  repetitionNumber: number;
  masteryLevel: number;
  nextReviewAt: Date;
}

/**
 * Map raw score (0-100) to SM-2 quality score (1-5)
 */
function mapQuality(rawScore: number): number {
  if (rawScore >= 100) return 5;
  if (rawScore >= 80) return 4;
  if (rawScore >= 60) return 3;
  if (rawScore >= 50) return 2;
  return 1;
}

/**
 * Calculate mastery level from interval
 */
function calculateMastery(intervalDays: number): number {
  if (intervalDays >= 21) return 90;
  if (intervalDays >= 7) return 60;
  if (intervalDays >= 2) return 30;
  return 10;
}

/**
 * Update SM-2 progress based on answer quality
 */
export function updateSM2(progress: SM2Progress, rawScore: number): SM2Result {
  const q = mapQuality(rawScore);

  let { easeFactor, intervalDays, repetitionNumber } = progress;

  if (q < 3) {
    // Failed — reset
    intervalDays = 1;
    repetitionNumber = 0;
    easeFactor = Math.max(1.3, easeFactor - 0.2);
  } else {
    // Passed — advance
    repetitionNumber += 1;

    if (repetitionNumber === 1) {
      intervalDays = 1;
    } else if (repetitionNumber === 2) {
      intervalDays = 6;
    } else {
      intervalDays = Math.round(intervalDays * easeFactor);
    }

    // Update ease factor
    easeFactor =
      easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));

    // Clamp ease factor minimum
    easeFactor = Math.max(1.3, easeFactor);
  }

  // Calculate next review date
  const nextReviewAt = new Date();
  nextReviewAt.setDate(nextReviewAt.getDate() + intervalDays);

  // Calculate mastery level
  const masteryLevel = calculateMastery(intervalDays);

  return {
    easeFactor: Math.round(easeFactor * 100) / 100, // 2 decimal places
    intervalDays,
    repetitionNumber,
    masteryLevel,
    nextReviewAt,
  };
}
