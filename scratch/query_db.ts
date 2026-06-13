import * as dotenv from "dotenv";
import * as path from "path";

// Load dotenv before importing prisma so DATABASE_URL is set
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import { prisma } from "../lib/prisma";

async function main() {
  console.log("Database URL used:", process.env.DATABASE_URL);
  const projects = await prisma.project.findMany({
    include: {
      collaborators: true,
    },
  });
  console.log("Projects in DB:", JSON.stringify(projects, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
