import { put, get } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { getClerkUserIdentity, checkProjectAccess } from "@/lib/project-access";
import fs from "fs/promises";
import path from "path";

export async function PUT(
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

  // 2. Parse request body
  let body: any;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { nodes, edges } = body;
  if (!Array.isArray(nodes) || !Array.isArray(edges)) {
    return Response.json({ error: "nodes and edges must be arrays" }, { status: 400 });
  }

  try {
    // 3. Upload JSON to Vercel Blob, falling back to local file storage if it fails
    const jsonString = JSON.stringify({ nodes, edges });
    let canvasJsonPath = "";

    try {
      const blob = await put(`canvas/${projectId}.json`, jsonString, {
        access: "private",
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: "application/json",
      });
      canvasJsonPath = blob.url;
    } catch (blobError: any) {
      console.warn("Vercel Blob storage failed; falling back to local filesystem storage:", blobError);
      
      const scratchDir = path.join(process.cwd(), "scratch");
      await fs.mkdir(scratchDir, { recursive: true });
      const localFilePath = path.join(scratchDir, `canvas-${projectId}.json`);
      await fs.writeFile(localFilePath, jsonString, "utf8");
      
      canvasJsonPath = `local-file://${projectId}`;
    }

    // 4. Update the project's canvasJsonPath in Prisma
    await prisma.project.update({
      where: { id: projectId },
      data: {
        canvasJsonPath,
      },
    });

    return Response.json({ success: true, url: canvasJsonPath });
  } catch (error: any) {
    console.error("Failed to save canvas state:", error);
    return Response.json({ error: error.message || "Failed to save canvas" }, { status: 500 });
  }
}

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
    // 2. Read the project's saved blob URL from Prisma
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { canvasJsonPath: true },
    });

    if (!project || !project.canvasJsonPath) {
      return Response.json({ nodes: [], edges: [] });
    }

    let canvasData: any = null;

    if (project.canvasJsonPath.startsWith("local-file://")) {
      const scratchDir = path.join(process.cwd(), "scratch");
      const localFilePath = path.join(scratchDir, `canvas-${projectId}.json`);
      try {
        const fileContent = await fs.readFile(localFilePath, "utf8");
        canvasData = JSON.parse(fileContent);
      } catch (fileError: any) {
        console.error("Failed to read local canvas fallback file:", fileError);
        throw new Error("Failed to read local canvas storage file");
      }
    } else {
      try {
        // 3. Fetch the saved canvas JSON securely from the private Vercel Blob store
        const blob = await get(project.canvasJsonPath, { access: "private" });
        if (!blob || !blob.stream) {
          throw new Error("Failed to retrieve private canvas blob content");
        }

        const response = new Response(blob.stream);
        canvasData = await response.json();
      } catch (blobError: any) {
        console.warn("Failed to retrieve from Vercel Blob, checking local fallback file:", blobError);
        const scratchDir = path.join(process.cwd(), "scratch");
        const localFilePath = path.join(scratchDir, `canvas-${projectId}.json`);
        try {
          const fileContent = await fs.readFile(localFilePath, "utf8");
          canvasData = JSON.parse(fileContent);
        } catch {
          // If local fallback also fails (e.g. file doesn't exist yet), rethrow the original error
          throw blobError;
        }
      }
    }

    return Response.json(canvasData);
  } catch (error: any) {
    console.error("Failed to retrieve canvas state:", error);
    return Response.json({ error: error.message || "Failed to retrieve canvas" }, { status: 500 });
  }
}
