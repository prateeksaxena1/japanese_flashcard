import "dotenv/config";
import prisma from "../lib/db";

async function main() {
  console.log("🧹 Cleaning up seeded N5 placeholder data and correcting nomenclature...");

  // 1. Find the N5 Level
  const n5Level = await prisma.jlptLevel.findFirst({
    where: { code: "N5" },
  });

  if (!n5Level) {
    console.error("❌ N5 level not found in database.");
    return;
  }

  // 2. Identify N5 Modules 1, 2, and 3
  const modulesToFix = [
    { number: 1, title: "minna no nihongo lesson.1" },
    { number: 2, title: "minna no nihongo lesson 2" },
    { number: 3, title: "minna no nihongo lesson 3" },
  ];

  for (const mod of modulesToFix) {
    const dbModule = await prisma.module.findFirst({
      where: {
        jlptLevelId: n5Level.id,
        moduleNumber: mod.number,
      },
    });

    if (dbModule) {
      console.log(`Updating Module ${mod.number} title to "${mod.title}"...`);
      // Update the module title and description
      await prisma.module.update({
        where: { id: dbModule.id },
        data: {
          title: mod.title,
          description: `N5 Vocabulary - ${mod.title}`,
        },
      });

      // Delete all vocabulary in this module (so we can re-import cleanly from the CSVs)
      const deleteResult = await prisma.vocabulary.deleteMany({
        where: {
          moduleId: dbModule.id,
        },
      });
      console.log(`Deleted ${deleteResult.count} vocabulary items from Module ${mod.number}.`);
    }
  }

  console.log("✨ Clean up complete! Please run the N5 CSV importer again to populate the modules correctly.");
}

main()
  .catch((e) => {
    console.error("❌ Error running cleanup script:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
