import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { moduleIds, sessionType = "PRACTICE", displayMode = "kanji" } = body;

    if (!moduleIds || !Array.isArray(moduleIds) || moduleIds.length === 0) {
      return NextResponse.json(
        { error: "At least one module must be selected" },
        { status: 400 }
      );
    }

    // Validate session type
    const validTypes = ["PRACTICE", "TEST", "REVIEW"];
    if (!validTypes.includes(sessionType)) {
      return NextResponse.json(
        { error: "Invalid session type" },
        { status: 400 }
      );
    }
    
    // Validate display mode
    const validDisplayModes = ["kanji", "hiragana", "romaji"];
    const modes = displayMode.split(",");
    const isValidDisplayMode = modes.length > 0 && modes.every((m: string) => validDisplayModes.includes(m));
    if (!isValidDisplayMode) {
      return NextResponse.json(
        { error: "Invalid display mode" },
        { status: 400 }
      );
    }

    // Count total vocab across selected modules
    const totalCards = await prisma.vocabulary.count({
      where: { moduleId: { in: moduleIds } },
    });

    if (totalCards === 0) {
      return NextResponse.json(
        { error: "No vocabulary found in selected modules" },
        { status: 400 }
      );
    }

    // Create session
    const session = await prisma.flashcardSession.create({
      data: {
        userId: user.userId,
        sessionType: sessionType as "PRACTICE" | "TEST" | "REVIEW",
        displayMode,
        selectedModules: moduleIds,
        totalCards,
      },
    });

    return NextResponse.json({ session }, { status: 201 });
  } catch (error) {
    console.error("[Create Session Error]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
