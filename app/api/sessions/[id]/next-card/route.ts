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

    // Get the session
    const session = await prisma.flashcardSession.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.userId !== user.userId) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    if (session.status !== "IN_PROGRESS") {
      return NextResponse.json(
        { error: "Session is already completed", status: session.status },
        { status: 400 }
      );
    }

    const moduleIds = session.selectedModules as string[];

    // Get all vocab IDs already attempted in this session
    const attemptedVocabIds = await prisma.flashcardAttempt.findMany({
      where: { sessionId },
      select: { vocabularyId: true },
    });
    const attemptedIds = attemptedVocabIds.map((a) => a.vocabularyId);

    // Get next unattempted vocab card
    const nextCard = await prisma.vocabulary.findFirst({
      where: {
        moduleId: { in: moduleIds },
        id: { notIn: attemptedIds.length > 0 ? attemptedIds : ["__none__"] },
      },
      select: {
        id: true,
        kanji: true,
        hiragana: true,
        katakana: true,
        romaji: true,
        partOfSpeech: true,
        difficultyScore: true,
        tags: true,
        audioUrl: true,
        module: {
          select: { title: true, moduleNumber: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    if (!nextCard) {
      // All cards done — complete the session
      await prisma.flashcardSession.update({
        where: { id: sessionId },
        data: { status: "COMPLETED", endedAt: new Date() },
      });

      return NextResponse.json({
        completed: true,
        message: "All cards have been reviewed",
        totalCards: session.totalCards,
        completedCards: session.completedCards,
      });
    }

    return NextResponse.json({
      completed: false,
      card: nextCard,
      progress: {
        current: attemptedIds.length + 1,
        total: session.totalCards,
      },
    });
  } catch (error) {
    console.error("[Next Card Error]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
