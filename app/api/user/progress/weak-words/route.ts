import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get weak words: where incorrectCount > correctCount
    const weakWords = await prisma.userProgress.findMany({
      where: {
        userId: user.userId,
        incorrectCount: { gt: 0 },
      },
      orderBy: { incorrectCount: "desc" },
      take: 50,
      include: {
        vocabulary: {
          select: {
            id: true,
            kanji: true,
            hiragana: true,
            romaji: true,
            primaryMeaning: true,
            partOfSpeech: true,
            difficultyScore: true,
            module: {
              select: { title: true, moduleNumber: true },
            },
          },
        },
      },
    });

    // Filter in memory for words where incorrect > correct
    const filtered = weakWords
      .filter((w) => w.incorrectCount > w.correctCount)
      .map((w) => ({
        vocabularyId: w.vocabularyId,
        kanji: w.vocabulary.kanji,
        hiragana: w.vocabulary.hiragana,
        romaji: w.vocabulary.romaji,
        primaryMeaning: w.vocabulary.primaryMeaning,
        partOfSpeech: w.vocabulary.partOfSpeech,
        module: w.vocabulary.module.title,
        correctCount: w.correctCount,
        incorrectCount: w.incorrectCount,
        masteryLevel: w.masteryLevel,
      }));

    return NextResponse.json({ weakWords: filtered });
  } catch (error) {
    console.error("[Weak Words Error]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
