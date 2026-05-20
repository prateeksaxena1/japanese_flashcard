import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { cacheGet, cacheSet } from "@/lib/redis";

const CACHE_TTL = 3600; // 1 hour

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ moduleId: string }> }
) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { moduleId } = await params;
    const cacheKey = `vocab:module:${moduleId}`;

    // Try Redis cache first
    const cached = await cacheGet(cacheKey);
    if (cached) {
      return NextResponse.json(JSON.parse(cached));
    }

    // Fetch from DB
    const vocabulary = await prisma.vocabulary.findMany({
      where: { moduleId },
      orderBy: { createdAt: "asc" },
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
        tags: true,
        audioUrl: true,
      },
    });

    const result = { vocabulary };

    // Cache in Redis (1 hour TTL)
    await cacheSet(cacheKey, JSON.stringify(result), CACHE_TTL);

    return NextResponse.json(result);
  } catch (error) {
    console.error("[Vocabulary Error]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
