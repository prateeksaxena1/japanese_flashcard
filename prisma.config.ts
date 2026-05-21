import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_wiu87LRFtSIg@ep-fancy-band-aqt1t5jk.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require",
  },
});
