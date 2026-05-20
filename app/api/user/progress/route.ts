import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get streak data
    const streak = await prisma.userStreak.findUnique({
      where: { userId: user.userId },
    });

    // Get overall progress stats
    const progressStats = await prisma.userProgress.aggregate({
      where: { userId: user.userId },
      _avg: { masteryLevel: true },
      _sum: { correctCount: true, incorrectCount: true, partialCount: true },
      _count: true,
    });

    // Get recent sessions
    const recentSessions = await prisma.flashcardSession.findMany({
      where: { userId: user.userId },
      orderBy: { startedAt: "desc" },
      take: 5,
      select: {
        id: true,
        sessionType: true,
        totalCards: true,
        completedCards: true,
        scoreTotal: true,
        status: true,
        startedAt: true,
        endedAt: true,
      },
    });

    // Count weak words
    const weakWordsCount = await prisma.userProgress.count({
      where: {
        userId: user.userId,
        incorrectCount: { gt: prisma.userProgress.fields.correctCount },
      },
    });

    // Count words due for review
    const reviewDueCount = await prisma.userProgress.count({
      where: {
        userId: user.userId,
        nextReviewAt: { lte: new Date() },
      },
    });

    // Total vocab studied
    const totalStudied = await prisma.userProgress.count({
      where: { userId: user.userId },
    });

    return NextResponse.json({
      streak: streak
        ? {
            currentStreak: streak.currentStreak,
            longestStreak: streak.longestStreak,
            totalDaysActive: streak.totalDaysActive,
            lastActivityDate: streak.lastActivityDate,
          }
        : { currentStreak: 0, longestStreak: 0, totalDaysActive: 0 },
      stats: {
        totalStudied,
        averageMastery: Math.round(progressStats._avg.masteryLevel || 0),
        totalCorrect: progressStats._sum.correctCount || 0,
        totalIncorrect: progressStats._sum.incorrectCount || 0,
        totalPartial: progressStats._sum.partialCount || 0,
        weakWordsCount,
        reviewDueCount,
      },
      recentSessions,
    });
  } catch (error) {
    console.error("[User Progress Error]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
