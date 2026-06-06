import dotenv from "dotenv";
import path from "path";
import { defineConfig } from "prisma/config";

// Load .env then override with .env.local
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

export default defineConfig({
  schema: "prisma/",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
