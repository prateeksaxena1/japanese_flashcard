import "dotenv/config";
import fs from "fs";
import path from "path";
import csv from "csv-parser";
import prisma from "../lib/db";

// =========================================================================
// ⚠️ HOW TO USE THIS SCRIPT:
// 1. Create a folder named "import_data" in your project root.
// 2. Put all your 25 CSV files inside the "import_data" folder.
//    (Tip: Name them something like "Lesson 1.csv", "Lesson_2.csv", etc.
//     so the script can automatically detect the lesson number!)
// 3. Open your terminal and run: `npx tsx scripts/import-csv.ts`
// =========================================================================

const IMPORT_DIR = path.join(__dirname, "../import_data/minna-no-nihonga-lesson.26-50/minna-no-nihonga-lesson.26-50");

interface CsvRow {
  Kanji: string;
  Hiragana: string;
  Romaji: string;
  Meaning: string;
  PartOfSpeech: string;
}

function mapRowToDatabase(row: any): CsvRow {
  return {
    Kanji: row["kanji"] || row["Kanji"] || row["\ufeffkanji"] || "",
    Hiragana: row["hiragana"] || row["Hiragana"] || "",
    Romaji: row["romaji"] || row["Romaji"] || "",
    Meaning: row["primary_meaning"] || row["Meaning"] || row["meaning"] || "",
    PartOfSpeech: row["part_of_speech"] || row["PartOfSpeech"] || "noun",
  };
}

async function processFile(filePath: string, n4LevelId: string) {
  const fileName = path.basename(filePath, ".csv");
  console.log(`\n📄 Processing file: ${fileName}.csv`);

  // Try to extract a number from the filename (e.g. "Lesson 5" -> 5)
  const numberMatch = fileName.match(/\d+/);
  const moduleNumber = numberMatch ? parseInt(numberMatch[0], 10) : Math.floor(Math.random() * 1000) + 100;
  const moduleTitle = fileName.replace(/_/g, " ").trim();

  // Find or create the Module for this specific CSV file
  const module = await prisma.module.upsert({
    where: {
      jlptLevelId_moduleNumber: {
        jlptLevelId: n4LevelId,
        moduleNumber: moduleNumber,
      },
    },
    update: {},
    create: {
      jlptLevelId: n4LevelId,
      moduleNumber: moduleNumber,
      title: moduleTitle,
      description: `N4 Vocabulary - ${moduleTitle}`,
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

  for (const row of rows) {
    if (!row.Meaning || !row.Hiragana) continue;

    const existing = await prisma.vocabulary.findFirst({
      where: { moduleId: module.id, primaryMeaning: row.Meaning.trim() },
    });

    if (!existing) {
      await prisma.vocabulary.create({
        data: {
          moduleId: module.id,
          jlptLevelId: n4LevelId,
          kanji: row.Kanji.trim() || null,
          hiragana: row.Hiragana.trim(),
          romaji: row.Romaji.trim() || row.Hiragana.trim(),
          primaryMeaning: row.Meaning.trim(),
          partOfSpeech: row.PartOfSpeech.trim(),
          acceptedMeanings: [],
        },
      });
      addedCount++;
    }
  }

  console.log(`✅ Added ${addedCount} words into Module: "${moduleTitle}"`);
  return addedCount;
}

async function main() {
  console.log(`Starting bulk CSV import from directory: ${IMPORT_DIR}...`);

  if (!fs.existsSync(IMPORT_DIR)) {
    fs.mkdirSync(IMPORT_DIR);
    console.error(`❌ The folder "import_data" did not exist, so I created it!`);
    console.log(`Please put your 25 CSV files inside the "import_data" folder and run the script again.`);
    process.exit(1);
  }

  const files = fs.readdirSync(IMPORT_DIR).filter(file => file.endsWith(".csv"));

  if (files.length === 0) {
    console.error(`❌ No .csv files found inside the "import_data" folder!`);
    process.exit(1);
  }

  // Ensure N4 Level exists
  const n4Level = await prisma.jlptLevel.upsert({
    where: { code: "N4" },
    update: {},
    create: { code: "N4", name: "JLPT N4 — Elementary", isActive: true },
  });

  let totalAdded = 0;

  for (const file of files) {
    const filePath = path.join(IMPORT_DIR, file);
    const count = await processFile(filePath, n4Level.id);
    totalAdded += count;
  }

  console.log(`\n🎉 Bulk Import complete! Successfully added ${totalAdded} total new words across ${files.length} modules.`);
}

main()
  .catch((e) => {
    console.error("❌ Fatal Error during import:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
