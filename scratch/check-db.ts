import { prisma } from "../lib/prisma";

async function main() {
  try {
    const projects = await prisma.project.findMany();
    console.log("Projects in Database:", JSON.stringify(projects, null, 2));
  } catch (error) {
    console.error("Database query failed:", error);
  }
}

main();
