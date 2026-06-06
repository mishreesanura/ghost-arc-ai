import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export interface ClerkUserIdentity {
  userId: string | null;
  primaryEmail: string | null;
  emails: string[];
}

/**
 * Helper to fetch the currently authenticated user's Clerk ID and email addresses.
 */
export async function getClerkUserIdentity(): Promise<ClerkUserIdentity> {
  const { userId } = await auth();
  if (!userId) {
    return { userId: null, primaryEmail: null, emails: [] };
  }
  const user = await currentUser();
  const primaryEmail = user?.primaryEmailAddress?.emailAddress || null;
  const emails = user?.emailAddresses.map((e) => e.emailAddress) || [];
  return { userId, primaryEmail, emails };
}

/**
 * Checks if a user has access to a project.
 * Access is granted if the user is the owner OR a listed collaborator.
 */
export async function checkProjectAccess(
  projectId: string,
  userId: string,
  emails: string[]
): Promise<boolean> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      collaborators: true,
    },
  });

  if (!project) {
    return false;
  }

  // If the user is the owner, access is granted
  if (project.ownerId === userId) {
    return true;
  }

  // If the user's primary email or any associated email is a collaborator, access is granted
  const isCollaborator = project.collaborators.some((collab) =>
    emails.includes(collab.email)
  );

  return isCollaborator;
}
