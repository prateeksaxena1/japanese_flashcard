import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get vocab where nextReviewAt <= now, ordered by urgency (oldest first)
    const reviewQueue = await prisma.userProgress.findMany({
      where: {
        userId: user.userId,
        nextReviewAt: { lte: new Date() },
      },
      orderBy: { nextReviewAt: "asc" },
      take: 50,
      include: {
        vocabulary: {
          select: {
            id: true,
            kanji: true,
            hiragana: true,
            katakana: true,
            romaji: true,
            primaryMeaning: true,
            acceptedMeanings: true,
            synonyms: true,
            partOfSpeech: true,
            difficultyScore: true,
            audioUrl: true,
            moduleId: true,
            module: {
              select: { title: true, moduleNumber: true },
            },
          },
        },
      },
    });

    const items = reviewQueue.map((r) => ({
      progressId: r.id,
      vocabularyId: r.vocabularyId,
      kanji: r.vocabulary.kanji,
      hiragana: r.vocabulary.hiragana,
      romaji: r.vocabulary.romaji,
      primaryMeaning: r.vocabulary.primaryMeaning,
      partOfSpeech: r.vocabulary.partOfSpeech,
      module: r.vocabulary.module.title,
      masteryLevel: r.masteryLevel,
      nextReviewAt: r.nextReviewAt,
      intervalDays: r.intervalDays,
      repetitionNumber: r.repetitionNumber,
    }));

    return NextResponse.json({
      reviewQueue: items,
      totalDue: items.length,
    });
  } catch (error) {
    console.error("[Review Queue Error]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
