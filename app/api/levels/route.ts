import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const levels = await prisma.jlptLevel.findMany({
      where: { isActive: true },
      orderBy: { code: "desc" }, // N5 first, then N4, etc.
      select: {
        id: true,
        code: true,
        name: true,
        _count: {
          select: { modules: true, vocabulary: true },
        },
      },
    });

    return NextResponse.json({ levels });
  } catch (error) {
    console.error("[Levels Error]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
