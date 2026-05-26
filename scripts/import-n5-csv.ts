import "dotenv/config";
import fs from "fs";
import path from "path";
import csv from "csv-parser";
import prisma from "../lib/db";

const IMPORT_DIR = path.join(__dirname, "../import_data/minna-no-nihongo-lesson1-25");

interface CsvRow {
  kanji: string;
  hiragana: string;
  romaji: string;
  primary_meaning: string;
  accepted_meanings: string[];
  synonyms: string[];
  part_of_speech: string;
  difficulty_score: number;
  tags: string[];
}

function safeParseJson(value: string | undefined): string[] {
  if (!value) return [];
  const trimmed = value.trim();
  if (!trimmed) return [];
  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return parsed.map(v => String(v).trim());
    }
    return [String(parsed).trim()];
  } catch (e) {
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      const clean = trimmed.replace(/[\[\]"']/g, "");
      return clean.split(",").map(s => s.trim()).filter(Boolean);
    }
    return [trimmed];
  }
}

function mapRowToDatabase(row: any): CsvRow {
  return {
    kanji: row["kanji"] || row["Kanji"] || row["\ufeffkanji"] || "",
    hiragana: row["hiragana"] || row["Hiragana"] || "",
    romaji: row["romaji"] || row["Romaji"] || "",
    primary_meaning: row["primary_meaning"] || row["Meaning"] || row["meaning"] || "",
    accepted_meanings: safeParseJson(row["accepted_meanings"] || row["AcceptedMeanings"]),
    synonyms: safeParseJson(row["synonyms"] || row["Synonyms"]),
    part_of_speech: row["part_of_speech"] || row["PartOfSpeech"] || "noun",
    difficulty_score: parseInt(row["difficulty_score"] || row["DifficultyScore"] || "1", 10),
    tags: safeParseJson(row["tags"] || row["Tags"]),
  };
}

async function processFile(filePath: string, n5LevelId: string) {
  const fileName = path.basename(filePath, ".csv");
  console.log(`\n📄 Processing file: ${fileName}.csv`);

  // Extract a number from the filename (e.g. "Lesson 5" -> 5)
  const numberMatch = fileName.match(/\d+/);
  const moduleNumber = numberMatch ? parseInt(numberMatch[0], 10) : Math.floor(Math.random() * 1000) + 100;
  const moduleTitle = fileName.replace(/_/g, " ").replace(/-/g, " ").trim();

  // Find or create the Module for this specific CSV file
  const module = await prisma.module.upsert({
    where: {
      jlptLevelId_moduleNumber: {
        jlptLevelId: n5LevelId,
        moduleNumber: moduleNumber,
      },
    },
    update: {},
    create: {
      jlptLevelId: n5LevelId,
      moduleNumber: moduleNumber,
      title: moduleTitle,
      description: `N5 Vocabulary - ${moduleTitle}`,
    },
  });

  const rows: CsvRow[] = [];

  // Read the CSV file into memory
  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => rows.push(mapRowToDatabase(data)))
      .on("end", () => resolve())
      .on("error", (error) => reject(error));
  });

  let addedCount = 0;
  let updatedCount = 0;

  for (const row of rows) {
    if (!row.primary_meaning || !row.hiragana) continue;

    const existing = await prisma.vocabulary.findFirst({
      where: { moduleId: module.id, hiragana: row.hiragana.trim(), primaryMeaning: row.primary_meaning.trim() },
    });

    if (!existing) {
      await prisma.vocabulary.create({
        data: {
          moduleId: module.id,
          jlptLevelId: n5LevelId,
          kanji: row.kanji.trim() || null,
          hiragana: row.hiragana.trim(),
          romaji: row.romaji.trim() || row.hiragana.trim(),
          primaryMeaning: row.primary_meaning.trim(),
          acceptedMeanings: row.accepted_meanings,
          synonyms: row.synonyms,
          partOfSpeech: row.part_of_speech.trim(),
          difficultyScore: row.difficulty_score || 1,
          tags: row.tags,
        },
      });
      addedCount++;
    } else {
      // Update existing if we want to enrich the fields
      await prisma.vocabulary.update({
        where: { id: existing.id },
        data: {
          kanji: row.kanji.trim() || existing.kanji,
          romaji: row.romaji.trim() || existing.romaji,
          acceptedMeanings: row.accepted_meanings.length > 0 ? row.accepted_meanings : (existing.acceptedMeanings as any),
          synonyms: row.synonyms.length > 0 ? row.synonyms : (existing.synonyms as any),
          partOfSpeech: row.part_of_speech.trim() || existing.partOfSpeech,
          difficultyScore: row.difficulty_score || existing.difficultyScore,
          tags: row.tags.length > 0 ? row.tags : (existing.tags as any),
        },
      });
      updatedCount++;
    }
  }

  console.log(`✅ Module "${moduleTitle}": Added ${addedCount} words, updated ${updatedCount} words.`);
  return { addedCount, updatedCount };
}

async function main() {
  console.log(`Starting bulk CSV import from directory: ${IMPORT_DIR}...`);

  if (!fs.existsSync(IMPORT_DIR)) {
    console.error(`❌ The folder "${IMPORT_DIR}" does not exist!`);
    process.exit(1);
  }

  const files = fs.readdirSync(IMPORT_DIR).filter(file => file.endsWith(".csv"));

  if (files.length === 0) {
    console.error(`❌ No .csv files found inside the import folder!`);
    process.exit(1);
  }

  // Ensure N5 Level exists
  const n5Level = await prisma.jlptLevel.upsert({
    where: { code: "N5" },
    update: {},
    create: { code: "N5", name: "JLPT N5 — Beginner", isActive: true },
  });

  let totalAdded = 0;
  let totalUpdated = 0;

  // Sort files by lesson number if possible
  files.sort((a, b) => {
    const numA = a.match(/\d+/);
    const numB = b.match(/\d+/);
    if (numA && numB) {
      return parseInt(numA[0], 10) - parseInt(numB[0], 10);
    }
    return a.localeCompare(b);
  });

  for (const file of files) {
    const filePath = path.join(IMPORT_DIR, file);
    const { addedCount, updatedCount } = await processFile(filePath, n5Level.id);
    totalAdded += addedCount;
    totalUpdated += updatedCount;
  }

  console.log(`\n🎉 Bulk Import complete! Successfully added ${totalAdded} and updated ${totalUpdated} total words across ${files.length} modules.`);
}

main()
  .catch((e) => {
    console.error("❌ Fatal Error during import:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
