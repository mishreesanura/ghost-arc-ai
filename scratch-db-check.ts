import { prisma } from "./lib/prisma";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

async function main() {
  console.log("Checking DB records...");
  const taskRuns = await prisma.taskRun.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  console.log("Task Runs in DB:", taskRuns);

  const specs = await prisma.projectSpec.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  console.log("Project Specs in DB:", specs);
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
