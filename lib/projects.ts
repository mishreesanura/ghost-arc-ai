import { prisma } from "@/lib/prisma";

export async function getProjectsForUser(userId: string, emails: string[]) {
  // Query owned projects
  const owned = await prisma.project.findMany({
    where: { ownerId: userId },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Query shared projects where user is collaborator
  const shared = await prisma.project.findMany({
    where: {
      ownerId: { not: userId },
      collaborators: {
        some: {
          email: { in: emails },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return { owned, shared };
}
