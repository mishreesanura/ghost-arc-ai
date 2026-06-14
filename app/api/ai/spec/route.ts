import { prisma } from "@/lib/prisma";
import { getClerkUserIdentity, checkProjectAccess } from "@/lib/project-access";
import { tasks } from "@trigger.dev/sdk";
import type { generateSpecTask } from "@/trigger/generate-spec";
import { z } from "zod";
import { chatMessageSchema } from "@/types/tasks";

const specRequestSchema = z.object({
  roomId: z.string().min(1),
  chatHistory: z.array(chatMessageSchema),
  nodes: z.array(z.any()),
  edges: z.array(z.any()),
});

export async function POST(request: Request) {
  const identity = await getClerkUserIdentity();
  if (!identity.userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: any = {};
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Malformed JSON body" }, { status: 400 });
  }

  const result = specRequestSchema.safeParse(body);
  if (!result.success) {
    return Response.json({ error: "Invalid request payload", details: result.error.flatten() }, { status: 400 });
  }

  const { roomId, chatHistory, nodes, edges } = result.data;

  // Retrieve project from database to confirm existence
  const project = await prisma.project.findUnique({
    where: { id: roomId },
  });

  if (!project) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  // Verify access (owner or collaborator)
  const hasAccess = await checkProjectAccess(roomId, identity.userId, identity.emails);
  if (!hasAccess) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    // Trigger generate-spec task
    const handle = await tasks.trigger<typeof generateSpecTask>("generate-spec", {
      projectId: roomId,
      roomId,
      chatHistory,
      nodes,
      edges,
    });

    // Save task run metadata for access control
    const taskRun = await prisma.taskRun.create({
      data: {
        runId: handle.id,
        projectId: roomId,
        userId: identity.userId,
      },
    });

    return Response.json({ runId: taskRun.runId }, { status: 201 });
  } catch (err: any) {
    console.error("Failed to trigger task or save task run for spec:", err);
    return Response.json({ error: "Failed to trigger background task" }, { status: 500 });
  }
}
