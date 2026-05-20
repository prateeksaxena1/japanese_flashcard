import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: sessionId } = await params;

    const session = await prisma.flashcardSession.findUnique({
      where: { id: sessionId },
      include: {
        attempts: {
          include: {
            vocabulary: {
              select: {
                kanji: true,
                hiragana: true,
                romaji: true,
                primaryMeaning: true,
                acceptedMeanings: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!session || session.userId !== user.userId) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    const attempts = session.attempts.map((a) => ({
      vocabularyId: a.vocabularyId,
      kanji: a.vocabulary.kanji,
      hiragana: a.vocabulary.hiragana,
      romaji: a.vocabulary.romaji,
      primaryMeaning: a.vocabulary.primaryMeaning,
      userInput: a.userInput,
      correctAnswer: a.correctAnswer,
      score: a.rawScore,
      method: a.evaluationMethod,
      timeTakenMs: a.timeTakenMs,
    }));

    const correctCount = attempts.filter((a) => a.score >= 80).length;
    const partialCount = attempts.filter(
      (a) => a.score >= 50 && a.score < 80
    ).length;
    const wrongCount = attempts.filter((a) => a.score < 50).length;
    const averageScore =
      attempts.length > 0
        ? Math.round(
            attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length
          )
        : 0;
    const totalTimeMs = attempts.reduce((sum, a) => sum + a.timeTakenMs, 0);

    return NextResponse.json({
      session: {
        id: session.id,
        sessionType: session.sessionType,
        status: session.status,
        totalCards: session.totalCards,
        completedCards: session.completedCards,
        startedAt: session.startedAt,
        endedAt: session.endedAt,
      },
      summary: {
        averageScore,
        correctCount,
        partialCount,
        wrongCount,
        totalTimeMs,
        averageTimeMs:
          attempts.length > 0
            ? Math.round(totalTimeMs / attempts.length)
            : 0,
      },
      attempts,
    });
  } catch (error) {
    console.error("[Session Summary Error]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
