import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // ─── JLPT Levels ─────────────────────────────────────
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

  console.log("✅ Levels created:", n5.code, n4.code);

  // ─── N5 Modules ──────────────────────────────────────
  const mod1 = await prisma.module.upsert({
    where: { jlptLevelId_moduleNumber: { jlptLevelId: n5.id, moduleNumber: 1 } },
    update: {},
    create: {
      jlptLevelId: n5.id, moduleNumber: 1,
      title: "Basic Nouns", description: "Common everyday nouns",
      sourceBook: "Minna no Nihongo", chapterRef: "Ch. 1-3",
    },
  });

  const mod2 = await prisma.module.upsert({
    where: { jlptLevelId_moduleNumber: { jlptLevelId: n5.id, moduleNumber: 2 } },
    update: {},
    create: {
      jlptLevelId: n5.id, moduleNumber: 2,
      title: "People & Family", description: "Words for people and family members",
      sourceBook: "Minna no Nihongo", chapterRef: "Ch. 4-6",
    },
  });

  const mod3 = await prisma.module.upsert({
    where: { jlptLevelId_moduleNumber: { jlptLevelId: n5.id, moduleNumber: 3 } },
    update: {},
    create: {
      jlptLevelId: n5.id, moduleNumber: 3,
      title: "Time & Numbers", description: "Time expressions and basic numbers",
      sourceBook: "Minna no Nihongo", chapterRef: "Ch. 7-9",
    },
  });

  console.log("✅ Modules created:", mod1.title, mod2.title, mod3.title);

  // ─── Vocabulary: Module 1 — Basic Nouns ──────────────
  const vocabMod1 = [
    { kanji: "家", hiragana: "いえ", romaji: "ie", primaryMeaning: "house", acceptedMeanings: ["house", "home", "residence"], synonyms: ["dwelling", "abode"], partOfSpeech: "noun", difficulty: 1 },
    { kanji: "水", hiragana: "みず", romaji: "mizu", primaryMeaning: "water", acceptedMeanings: ["water"], synonyms: ["aqua"], partOfSpeech: "noun", difficulty: 1 },
    { kanji: "猫", hiragana: "ねこ", romaji: "neko", primaryMeaning: "cat", acceptedMeanings: ["cat", "kitty"], synonyms: ["feline", "kitten"], partOfSpeech: "noun", difficulty: 1 },
    { kanji: "犬", hiragana: "いぬ", romaji: "inu", primaryMeaning: "dog", acceptedMeanings: ["dog", "puppy"], synonyms: ["canine", "hound"], partOfSpeech: "noun", difficulty: 1 },
    { kanji: "本", hiragana: "ほん", romaji: "hon", primaryMeaning: "book", acceptedMeanings: ["book"], synonyms: ["text", "volume"], partOfSpeech: "noun", difficulty: 1 },
    { kanji: "車", hiragana: "くるま", romaji: "kuruma", primaryMeaning: "car", acceptedMeanings: ["car", "automobile", "vehicle"], synonyms: ["auto"], partOfSpeech: "noun", difficulty: 2 },
    { kanji: "花", hiragana: "はな", romaji: "hana", primaryMeaning: "flower", acceptedMeanings: ["flower", "blossom"], synonyms: ["bloom"], partOfSpeech: "noun", difficulty: 1 },
    { kanji: "魚", hiragana: "さかな", romaji: "sakana", primaryMeaning: "fish", acceptedMeanings: ["fish"], synonyms: [], partOfSpeech: "noun", difficulty: 2 },
    { kanji: "鳥", hiragana: "とり", romaji: "tori", primaryMeaning: "bird", acceptedMeanings: ["bird", "fowl"], synonyms: ["avian"], partOfSpeech: "noun", difficulty: 2 },
    { kanji: "木", hiragana: "き", romaji: "ki", primaryMeaning: "tree", acceptedMeanings: ["tree", "wood"], synonyms: ["timber"], partOfSpeech: "noun", difficulty: 1 },
  ];

  // ─── Vocabulary: Module 2 — People & Family ──────────
  const vocabMod2 = [
    { kanji: "人", hiragana: "ひと", romaji: "hito", primaryMeaning: "person", acceptedMeanings: ["person", "people", "human"], synonyms: ["individual"], partOfSpeech: "noun", difficulty: 1 },
    { kanji: "男", hiragana: "おとこ", romaji: "otoko", primaryMeaning: "man", acceptedMeanings: ["man", "male"], synonyms: ["guy", "gentleman"], partOfSpeech: "noun", difficulty: 1 },
    { kanji: "女", hiragana: "おんな", romaji: "onna", primaryMeaning: "woman", acceptedMeanings: ["woman", "female"], synonyms: ["lady"], partOfSpeech: "noun", difficulty: 1 },
    { kanji: "子", hiragana: "こ", romaji: "ko", primaryMeaning: "child", acceptedMeanings: ["child", "kid"], synonyms: ["youngster"], partOfSpeech: "noun", difficulty: 1 },
    { kanji: "友達", hiragana: "ともだち", romaji: "tomodachi", primaryMeaning: "friend", acceptedMeanings: ["friend", "companion"], synonyms: ["pal", "buddy"], partOfSpeech: "noun", difficulty: 2 },
    { kanji: "先生", hiragana: "せんせい", romaji: "sensei", primaryMeaning: "teacher", acceptedMeanings: ["teacher", "instructor", "professor"], synonyms: ["educator", "master"], partOfSpeech: "noun", difficulty: 1 },
    { kanji: "学生", hiragana: "がくせい", romaji: "gakusei", primaryMeaning: "student", acceptedMeanings: ["student", "pupil"], synonyms: ["learner"], partOfSpeech: "noun", difficulty: 1 },
    { kanji: "父", hiragana: "ちち", romaji: "chichi", primaryMeaning: "father", acceptedMeanings: ["father", "dad", "papa"], synonyms: ["daddy", "old man"], partOfSpeech: "noun", difficulty: 2 },
    { kanji: "母", hiragana: "はは", romaji: "haha", primaryMeaning: "mother", acceptedMeanings: ["mother", "mom", "mama"], synonyms: ["mommy"], partOfSpeech: "noun", difficulty: 2 },
    { kanji: "兄", hiragana: "あに", romaji: "ani", primaryMeaning: "older brother", acceptedMeanings: ["older brother", "big brother", "elder brother"], synonyms: ["brother"], partOfSpeech: "noun", difficulty: 2 },
  ];

  // ─── Vocabulary: Module 3 — Time & Numbers ───────────
  const vocabMod3 = [
    { kanji: "今", hiragana: "いま", romaji: "ima", primaryMeaning: "now", acceptedMeanings: ["now", "present", "current"], synonyms: ["currently", "at present"], partOfSpeech: "adverb", difficulty: 1 },
    { kanji: "日", hiragana: "ひ", romaji: "hi", primaryMeaning: "day", acceptedMeanings: ["day", "sun"], synonyms: [], partOfSpeech: "noun", difficulty: 1 },
    { kanji: "月", hiragana: "つき", romaji: "tsuki", primaryMeaning: "moon", acceptedMeanings: ["moon", "month"], synonyms: [], partOfSpeech: "noun", difficulty: 2 },
    { kanji: "年", hiragana: "ねん", romaji: "nen", primaryMeaning: "year", acceptedMeanings: ["year"], synonyms: ["annual"], partOfSpeech: "noun", difficulty: 1 },
    { kanji: "時", hiragana: "とき", romaji: "toki", primaryMeaning: "time", acceptedMeanings: ["time", "hour", "moment"], synonyms: ["when"], partOfSpeech: "noun", difficulty: 2 },
    { kanji: "分", hiragana: "ふん", romaji: "fun", primaryMeaning: "minute", acceptedMeanings: ["minute", "part"], synonyms: ["portion"], partOfSpeech: "noun", difficulty: 2 },
    { kanji: "一", hiragana: "いち", romaji: "ichi", primaryMeaning: "one", acceptedMeanings: ["one", "1"], synonyms: ["first"], partOfSpeech: "number", difficulty: 1 },
    { kanji: "二", hiragana: "に", romaji: "ni", primaryMeaning: "two", acceptedMeanings: ["two", "2"], synonyms: ["second"], partOfSpeech: "number", difficulty: 1 },
    { kanji: "三", hiragana: "さん", romaji: "san", primaryMeaning: "three", acceptedMeanings: ["three", "3"], synonyms: ["third"], partOfSpeech: "number", difficulty: 1 },
    { kanji: "四", hiragana: "よん", romaji: "yon", primaryMeaning: "four", acceptedMeanings: ["four", "4"], synonyms: ["fourth"], partOfSpeech: "number", difficulty: 1 },
  ];

  // Insert all vocab
  const allVocab = [
    { moduleId: mod1.id, data: vocabMod1 },
    { moduleId: mod2.id, data: vocabMod2 },
    { moduleId: mod3.id, data: vocabMod3 },
  ];

  for (const { moduleId, data } of allVocab) {
    for (const v of data) {
      await prisma.vocabulary.upsert({
        where: { id: `${moduleId}-${v.romaji}` },
        update: {},
        create: {
          moduleId,
          jlptLevelId: n5.id,
          kanji: v.kanji,
          hiragana: v.hiragana,
          romaji: v.romaji,
          primaryMeaning: v.primaryMeaning,
          acceptedMeanings: v.acceptedMeanings,
          synonyms: v.synonyms,
          partOfSpeech: v.partOfSpeech,
          difficultyScore: v.difficulty,
          tags: [],
        },
      });
    }
  }

  console.log("✅ Vocabulary seeded: 30 words across 3 modules");

  // ─── Test User ───────────────────────────────────────
  const passwordHash = await bcrypt.hash("test1234", 12);

  const testUser = await prisma.user.upsert({
    where: { email: "test@jlpt.dev" },
    update: {},
    create: {
      email: "test@jlpt.dev",
      username: "testuser",
      passwordHash,
      role: "STUDENT",
      timezone: "Asia/Tokyo",
    },
  });

  await prisma.userStreak.upsert({
    where: { userId: testUser.id },
    update: {},
    create: { userId: testUser.id },
  });

  console.log("✅ Test user created: test@jlpt.dev / test1234");
  console.log("🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
