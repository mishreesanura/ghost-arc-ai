import { auth, currentUser, clerkClient, User } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { checkProjectAccess } from "@/lib/project-access";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  // Verify access (owner or collaborator)
  const user = await currentUser();
  const emails = user?.emailAddresses.map((e) => e.emailAddress) || [];
  const hasAccess = await checkProjectAccess(projectId, userId, emails);
  if (!hasAccess) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const client = await clerkClient();

  // Fetch owner details from Clerk
  let ownerInfo = {
    id: project.ownerId,
    email: "",
    name: null as string | null,
    avatar: null as string | null,
  };
  try {
    const ownerUser = await client.users.getUser(project.ownerId);
    ownerInfo = {
      id: project.ownerId,
      email: ownerUser.emailAddresses?.[0]?.emailAddress || "",
      name: [ownerUser.firstName, ownerUser.lastName].filter(Boolean).join(" ") || ownerUser.username || null,
      avatar: ownerUser.imageUrl || null,
    };
  } catch (err) {
    console.error("Failed to fetch owner details from Clerk", err);
  }

  // Fetch collaborators from database
  const collaborators = await prisma.projectCollaborator.findMany({
    where: { projectId },
    orderBy: { createdAt: "asc" },
  });

  // Enrich with Clerk details
  const collabEmails = collaborators.map((c) => c.email);
  let clerkUsers: User[] = [];
  if (collabEmails.length > 0) {
    try {
      const listResponse = await client.users.getUserList({
        emailAddress: collabEmails,
      });
      clerkUsers = listResponse.data;
    } catch (err) {
      console.error("Failed to fetch Clerk users for collaborators", err);
    }
  }

  const enrichedCollaborators = collaborators.map((collab) => {
    const matchedUser = clerkUsers.find((u) =>
      u.emailAddresses?.some(
        (e) => e.emailAddress.toLowerCase() === collab.email.toLowerCase()
      )
    );

    if (matchedUser) {
      const name =
        [matchedUser.firstName, matchedUser.lastName].filter(Boolean).join(" ") ||
        matchedUser.username ||
        null;
      return {
        id: collab.id,
        email: collab.email,
        name,
        avatar: matchedUser.imageUrl || null,
        createdAt: collab.createdAt.toISOString(),
      };
    }

    return {
      id: collab.id,
      email: collab.email,
      name: null,
      avatar: null,
      createdAt: collab.createdAt.toISOString(),
    };
  });

  return Response.json({
    owner: ownerInfo,
    collaborators: enrichedCollaborators,
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  // Only the owner can invite collaborators
  if (project.ownerId !== userId) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { email?: string } = {};
  try {
    body = await request.json();
  } catch {
    // Malformed request
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email) {
    return Response.json({ error: "Email address is required" }, { status: 400 });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return Response.json({ error: "Invalid email format" }, { status: 400 });
  }

  const client = await clerkClient();

  // Prevent owner from inviting themselves
  let ownerEmail = "";
  try {
    const ownerUser = await client.users.getUser(project.ownerId);
    ownerEmail = ownerUser.emailAddresses?.[0]?.emailAddress?.toLowerCase() || "";
    if (!ownerEmail) {
      return Response.json(
        { error: "Could not retrieve project owner's email from identity provider." },
        { status: 500 }
      );
    }
  } catch (err: unknown) {
    console.error("Failed to fetch project owner's details from Clerk:", err);
    return Response.json(
      { error: "Failed to verify project owner identity. Please try again later." },
      { status: 503 }
    );
  }

  if (email === ownerEmail) {
    return Response.json({ error: "You cannot invite the project owner" }, { status: 400 });
  }

  // Check if collaborator already exists
  const existing = await prisma.projectCollaborator.findUnique({
    where: {
      projectId_email: {
        projectId,
        email,
      },
    },
  });

  if (existing) {
    return Response.json({ error: "This email is already a collaborator" }, { status: 400 });
  }

  const newCollab = await prisma.projectCollaborator.create({
    data: {
      projectId,
      email,
    },
  });

  return Response.json(newCollab, { status: 201 });
}
