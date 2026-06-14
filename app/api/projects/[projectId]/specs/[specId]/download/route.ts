import { get } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { getClerkUserIdentity, checkProjectAccess } from "@/lib/project-access";
import fs from "fs/promises";
import path from "path";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string; specId: string }> }
) {
  const { projectId, specId } = await params;

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
    // 2. Fetch the spec record from the database
    const spec = await prisma.projectSpec.findUnique({
      where: { id: specId },
      include: { project: true },
    });

    // 3. Verify it exists and belongs to the given project
    if (!spec || spec.projectId !== projectId) {
      return Response.json({ error: "Spec not found" }, { status: 404 });
    }

    const safeProjectName = spec.project.name.toLowerCase().replace(/[^a-z0-9_-]/g, "-") || "spec";
    const filename = `spec-${safeProjectName}-${specId.slice(0, 8)}.md`;

    // 4. Return the file content
    if (spec.filePath.startsWith("local-file://")) {
      const scratchDir = path.join(process.cwd(), "scratch");
      const localFilePath = path.join(scratchDir, `spec-${specId}.md`);
      try {
        const fileContent = await fs.readFile(localFilePath, "utf8");
        return new Response(fileContent, {
          headers: {
            "Content-Type": "text/markdown",
            "Content-Disposition": `attachment; filename="${filename}"`,
          },
        });
      } catch (fileError: any) {
        console.error("Failed to read local spec fallback file:", fileError);
        return Response.json({ error: "File content not found" }, { status: 404 });
      }
    } else {
      try {
        const blob = await get(spec.filePath, { access: "private" });
        if (!blob || !blob.stream) {
          throw new Error("Failed to retrieve private spec blob content");
        }

        return new Response(blob.stream, {
          headers: {
            "Content-Type": "text/markdown",
            "Content-Disposition": `attachment; filename="${filename}"`,
          },
        });
      } catch (blobError: any) {
        console.warn("Failed to retrieve spec from Vercel Blob, checking local fallback file:", blobError);
        const scratchDir = path.join(process.cwd(), "scratch");
        const localFilePath = path.join(scratchDir, `spec-${specId}.md`);
        try {
          const fileContent = await fs.readFile(localFilePath, "utf8");
          return new Response(fileContent, {
            headers: {
              "Content-Type": "text/markdown",
              "Content-Disposition": `attachment; filename="${filename}"`,
            },
          });
        } catch {
          // If local fallback also fails, return 404 or original error
          return Response.json({ error: "File content not found" }, { status: 404 });
        }
      }
    }
  } catch (error: any) {
    console.error("Failed to retrieve spec file:", error);
    return Response.json({ error: error.message || "Failed to retrieve spec" }, { status: 500 });
  }
}
