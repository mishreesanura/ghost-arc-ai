import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get current user details from Clerk to match collaborator email
  const user = await currentUser();
  const emails = user?.emailAddresses.map((e) => e.emailAddress) || [];

  // Query projects where user is owner OR collaborator
  const projects = await prisma.project.findMany({
    where: {
      OR: [
        { ownerId: userId },
        {
          collaborators: {
            some: {
              email: { in: emails },
            },
          },
        },
      ],
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return Response.json(projects);
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { name?: string; description?: string; id?: string } = {};
  try {
    body = await request.json();
  } catch {
    // Body is empty or malformed
  }

  const name =
    typeof body.name === "string" && body.name.trim() !== ""
      ? body.name.trim()
      : "Untitled Project";

  const description =
    typeof body.description === "string" ? body.description.trim() : null;

  let id: string | undefined = undefined;
  if (typeof body.id === "string") {
    const trimmedId = body.id.trim();
    if (trimmedId !== "") {
      const idPattern = /^[A-Za-z0-9-]+$/;
      if (!idPattern.test(trimmedId) || trimmedId.length > 50) {
        return Response.json(
          { error: "Invalid project ID. Must contain only letters, numbers, and hyphens, and be up to 50 characters long." },
          { status: 400 }
        );
      }
      id = trimmedId;
    }
  }

  const project = await prisma.project.create({
    data: {
      id,
      ownerId: userId,
      name,
      description,
    },
  });

  return Response.json(project, { status: 201 });
}
