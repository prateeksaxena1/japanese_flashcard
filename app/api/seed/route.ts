import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    // 1. Create Levels
    const n5 = await prisma.jlptLevel.upsert({
      where: { code: "N5" },
      update: {},
      create: { code: "N5", name: "JLPT N5 — Beginner", isActive: true },
    });

    const n4 = await prisma.jlptLevel.upsert({
      where: { code: "N4" },
      update: {},
      create: { code: "N4", name: "JLPT N4 — Elementary", isActive: true },
    });

    // 2. Create Modules
    const mod1 = await prisma.module.upsert({
      where: { jlptLevelId_moduleNumber: { jlptLevelId: n5.id, moduleNumber: 1 } },
      update: {},
      create: {
        jlptLevelId: n5.id, moduleNumber: 1,
        title: "Basic Nouns", description: "Common everyday nouns",
      },
    });

    const mod2 = await prisma.module.upsert({
      where: { jlptLevelId_moduleNumber: { jlptLevelId: n5.id, moduleNumber: 2 } },
      update: {},
      create: {
        jlptLevelId: n5.id, moduleNumber: 2,
        title: "People & Family", description: "Terms for people and family members",
      },
    });

    const mod3 = await prisma.module.upsert({
      where: { jlptLevelId_moduleNumber: { jlptLevelId: n5.id, moduleNumber: 3 } },
      update: {},
      create: {
        jlptLevelId: n5.id, moduleNumber: 3,
        title: "Time & Numbers", description: "Time expressions and numbers",
      },
    });

    // 3. Create Vocabulary
    const vocabToCreate = [
      { moduleId: mod1.id, jlptLevelId: n5.id, kanji: "家", hiragana: "いえ", romaji: "ie", primaryMeaning: "House", acceptedMeanings: ["Home"], partOfSpeech: "noun" },
      { moduleId: mod1.id, jlptLevelId: n5.id, kanji: "水", hiragana: "みず", romaji: "mizu", primaryMeaning: "Water", acceptedMeanings: [], partOfSpeech: "noun" },
      { moduleId: mod2.id, jlptLevelId: n5.id, kanji: "人", hiragana: "ひと", romaji: "hito", primaryMeaning: "Person", acceptedMeanings: ["People"], partOfSpeech: "noun" },
      { moduleId: mod2.id, jlptLevelId: n5.id, kanji: "先生", hiragana: "せんせい", romaji: "sensei", primaryMeaning: "Teacher", acceptedMeanings: ["Professor"], partOfSpeech: "noun" },
      { moduleId: mod3.id, jlptLevelId: n5.id, kanji: "今", hiragana: "いま", romaji: "ima", primaryMeaning: "Now", acceptedMeanings: ["Currently"], partOfSpeech: "noun" },
    ];

    for (const v of vocabToCreate) {
      const existing = await prisma.vocabulary.findFirst({ where: { romaji: v.romaji, kanji: v.kanji } });
      if (!existing) {
        await prisma.vocabulary.create({ data: v });
      }
    }

    // 4. Create User
    const existingUser = await prisma.user.findUnique({ where: { email: "test@jlpt.dev" } });
    if (!existingUser) {
      await prisma.user.create({
        data: {
          email: "test@jlpt.dev",
          passwordHash: await bcrypt.hash("test1234", 10),
          username: "testuser",
        },
      });
    }

    return NextResponse.json({ message: "Seed successful!" });
  } catch (error) {
    console.error("Seed error", error);
    return NextResponse.json({ error: "Seed failed" }, { status: 500 });
  }
}
