/**
 * Streak Tracking
 *
 * Updates the user's streak based on activity dates.
 * Compares today (in user's timezone) vs lastActivityDate.
 */

import prisma from "./db";

/**
 * Get today's date string in the user's timezone
 */
function getTodayInTimezone(timezone: string): string {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(now); // Returns YYYY-MM-DD
  } catch {
    // Fallback to UTC
    return new Date().toISOString().split("T")[0];
  }
}

/**
 * Get date string from a Date object in the user's timezone
 */
function dateToString(date: Date, timezone: string): string {
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(date);
  } catch {
    return date.toISOString().split("T")[0];
  }
}

/**
 * Calculate the difference in days between two date strings (YYYY-MM-DD)
 */
function dayDifference(dateA: string, dateB: string): number {
  const a = new Date(dateA + "T00:00:00Z");
  const b = new Date(dateB + "T00:00:00Z");
  return Math.round((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Update streak for a user after completing a session
 */
export async function updateStreak(userId: string): Promise<{
  currentStreak: number;
  longestStreak: number;
  totalDaysActive: number;
}> {
  // Get user's timezone
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { timezone: true },
  });

  const timezone = user?.timezone || "Asia/Tokyo";
  const today = getTodayInTimezone(timezone);

  // Get or create streak record
  let streak = await prisma.userStreak.findUnique({
    where: { userId },
  });

  if (!streak) {
    // First activity ever
    streak = await prisma.userStreak.create({
      data: {
        userId,
        currentStreak: 1,
        longestStreak: 1,
        lastActivityDate: new Date(today + "T00:00:00Z"),
        totalDaysActive: 1,
      },
    });

    return {
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      totalDaysActive: streak.totalDaysActive,
    };
  }

  // Compare today vs last activity
  const lastDate = streak.lastActivityDate
    ? dateToString(streak.lastActivityDate, timezone)
    : null;

  let { currentStreak, longestStreak, totalDaysActive } = streak;

  if (lastDate) {
    const diff = dayDifference(today, lastDate);

    if (diff === 0) {
      // Already recorded today — no change
      return { currentStreak, longestStreak, totalDaysActive };
    } else if (diff === 1) {
      // Yesterday — extend streak
      currentStreak += 1;
    } else {
      // Missed days — reset streak
      currentStreak = 1;
    }
  } else {
    currentStreak = 1;
  }

  totalDaysActive += 1;
  longestStreak = Math.max(longestStreak, currentStreak);

  // Update in DB
  const updated = await prisma.userStreak.update({
    where: { userId },
    data: {
      currentStreak,
      longestStreak,
      lastActivityDate: new Date(today + "T00:00:00Z"),
      totalDaysActive,
    },
  });

  return {
    currentStreak: updated.currentStreak,
    longestStreak: updated.longestStreak,
    totalDaysActive: updated.totalDaysActive,
  };
}
