import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ levelId: string }> }
) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { levelId } = await params;

    const modules = await prisma.module.findMany({
      where: {
        jlptLevelId: levelId,
        isActive: true,
      },
      orderBy: { moduleNumber: "asc" },
      select: {
        id: true,
        moduleNumber: true,
        title: true,
        description: true,
        sourceBook: true,
        chapterRef: true,
        _count: {
          select: { vocabulary: true },
        },
      },
    });

    return NextResponse.json({ modules });
  } catch (error) {
    console.error("[Modules Error]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
