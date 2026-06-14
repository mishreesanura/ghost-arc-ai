import { prisma } from "@/lib/prisma";
import { getClerkUserIdentity, checkProjectAccess } from "@/lib/project-access";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;

  // 1. Authenticate user and verify access
  const { userId, emails } = await getClerkUserIdentity();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const hasAccess = await checkProjectAccess(projectId, userId, emails);
  if (!hasAccess) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    // 2. Query specs for the project
    const specs = await prisma.projectSpec.findMany({
      where: {
        projectId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return Response.json(specs);
  } catch (error: any) {
    console.error("Failed to fetch project specs:", error);
    return Response.json(
      { error: error.message || "Failed to fetch specs" },
      { status: 500 }
    );
  }
}
