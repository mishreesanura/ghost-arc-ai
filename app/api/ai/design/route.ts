import { prisma } from "@/lib/prisma";
import { getClerkUserIdentity, checkProjectAccess } from "@/lib/project-access";
import { tasks } from "@trigger.dev/sdk";
import type { designAgentTask } from "@/trigger/design-agent";

export async function POST(request: Request) {
  const identity = await getClerkUserIdentity();
  if (!identity.userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { prompt?: string; roomId?: string; projectId?: string } = {};
  try {
    body = await request.json();
  } catch {
    // Malformed request
  }

  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  const roomId = typeof body.roomId === "string" ? body.roomId.trim() : "";
  const projectId = typeof body.projectId === "string" ? body.projectId.trim() : "";

  if (!prompt) {
    return Response.json({ error: "Prompt is required" }, { status: 400 });
  }

  const resolvedProjectId = projectId || roomId;
  if (!resolvedProjectId) {
    return Response.json({ error: "Project ID or Room ID is required" }, { status: 400 });
  }

  // Check if project exists in database
  const project = await prisma.project.findUnique({
    where: { id: resolvedProjectId },
  });

  if (!project) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  // Verify access (owner or collaborator)
  const hasAccess = await checkProjectAccess(resolvedProjectId, identity.userId, identity.emails);
  if (!hasAccess) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    // Trigger design agent task
    const handle = await tasks.trigger<typeof designAgentTask>("design-agent", {
      prompt,
      roomId: resolvedProjectId,
    });

    // Create a TaskRun record in the database
    const taskRun = await prisma.taskRun.create({
      data: {
        runId: handle.id,
        projectId: resolvedProjectId,
        userId: identity.userId,
      },
    });

    return Response.json({ runId: taskRun.runId }, { status: 201 });
  } catch (err: any) {
    console.error("Failed to trigger task or save task run:", err);
    return Response.json({ error: "Failed to trigger background task" }, { status: 500 });
  }
}
