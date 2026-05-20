import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getAuthUser, isRateLimited } from "@/lib/auth";
import { evaluateAnswer } from "@/lib/evaluate";
import { updateSM2 } from "@/lib/sm2";
import { updateStreak } from "@/lib/streak";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit check
    if (isRateLimited(user.userId)) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429 }
      );
    }

    const { id: sessionId } = await params;
    const body = await request.json();
    const { vocabularyId, userInput, timeTakenMs = 0 } = body;

    if (!vocabularyId || userInput === undefined) {
      return NextResponse.json(
        { error: "vocabularyId and userInput are required" },
        { status: 400 }
      );
    }

    // Verify session belongs to user and is active
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
        { error: "Session is no longer active" },
        { status: 400 }
      );
    }

    // Get vocabulary with meanings
    const vocab = await prisma.vocabulary.findUnique({
      where: { id: vocabularyId },
    });

    if (!vocab) {
      return NextResponse.json(
        { error: "Vocabulary not found" },
        { status: 404 }
      );
    }

    // ─── Evaluate Answer ────────────────────────────────
    const evaluation = evaluateAnswer(userInput, {
      primaryMeaning: vocab.primaryMeaning,
      acceptedMeanings: (vocab.acceptedMeanings as string[]) || [],
      synonyms: (vocab.synonyms as string[]) || [],
    });

    // ─── Create Attempt Record ──────────────────────────
    await prisma.flashcardAttempt.create({
      data: {
        sessionId,
        userId: user.userId,
        vocabularyId,
        userInput,
        correctAnswer: vocab.primaryMeaning,
        rawScore: evaluation.score,
        evaluationMethod: evaluation.method as "EXACT" | "SYNONYM" | "FUZZY" | "STEM",
        timeTakenMs,
      },
    });

    // ─── Update Session Progress ────────────────────────
    await prisma.flashcardSession.update({
      where: { id: sessionId },
      data: {
        completedCards: { increment: 1 },
        scoreTotal: { increment: evaluation.score },
      },
    });

    // ─── Update SM-2 Progress ───────────────────────────
    let progress = await prisma.userProgress.findUnique({
      where: {
        userId_vocabularyId: {
          userId: user.userId,
          vocabularyId,
        },
      },
    });

    if (!progress) {
      progress = await prisma.userProgress.create({
        data: {
          userId: user.userId,
          vocabularyId,
        },
      });
    }

    const sm2Result = updateSM2(
      {
        easeFactor: progress.easeFactor,
        intervalDays: progress.intervalDays,
        repetitionNumber: progress.repetitionNumber,
        masteryLevel: progress.masteryLevel,
      },
      evaluation.score
    );

    // Update progress counts based on verdict
    const countUpdate =
      evaluation.verdict === "correct"
        ? { correctCount: { increment: 1 } }
        : evaluation.verdict === "partial"
          ? { partialCount: { increment: 1 } }
          : { incorrectCount: { increment: 1 } };

    const streakUpdate =
      evaluation.verdict === "correct"
        ? { streakCount: { increment: 1 } }
        : { streakCount: 0 };

    await prisma.userProgress.update({
      where: {
        userId_vocabularyId: {
          userId: user.userId,
          vocabularyId,
        },
      },
      data: {
        ...countUpdate,
        ...streakUpdate,
        lastReviewedAt: new Date(),
        nextReviewAt: sm2Result.nextReviewAt,
        easeFactor: sm2Result.easeFactor,
        intervalDays: sm2Result.intervalDays,
        repetitionNumber: sm2Result.repetitionNumber,
        masteryLevel: sm2Result.masteryLevel,
      },
    });

    // ─── Update Streak ──────────────────────────────────
    const streakData = await updateStreak(user.userId);

    // ─── Return Result ──────────────────────────────────
    return NextResponse.json({
      score: evaluation.score,
      verdict: evaluation.verdict,
      method: evaluation.method,
      explanation: evaluation.explanation,
      correctAnswer: vocab.primaryMeaning,
      acceptedMeanings: vocab.acceptedMeanings,
      streak: streakData,
    });
  } catch (error) {
    console.error("[Attempt Error]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
