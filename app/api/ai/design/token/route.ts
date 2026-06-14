import { prisma } from "@/lib/prisma";
import { getClerkUserIdentity } from "@/lib/project-access";
import { auth } from "@trigger.dev/sdk";

export async function POST(request: Request) {
  const identity = await getClerkUserIdentity();
  if (!identity.userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { runId?: string } = {};
  try {
    body = await request.json();
  } catch {
    // Malformed request
  }

  const runId = typeof body.runId === "string" ? body.runId.trim() : "";
  if (!runId) {
    return Response.json({ error: "Run ID is required" }, { status: 400 });
  }

  // Find the TaskRun record
  const taskRun = await prisma.taskRun.findUnique({
    where: { runId },
  });

  if (!taskRun) {
    return Response.json({ error: "Task run not found" }, { status: 404 });
  }

  // Verify ownership
  if (taskRun.userId !== identity.userId) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    // Generate Trigger.dev public access token scoped to the run ID
    const publicToken = await auth.createPublicToken({
      scopes: {
        read: {
          runs: [runId],
        },
      },
    });

    return Response.json({ token: publicToken });
  } catch (err: any) {
    console.error("Failed to generate public token:", err);
    return Response.json({ error: "Failed to generate token" }, { status: 500 });
  }
}
