import React from "react";
import { redirect } from "next/navigation";
import { getClerkUserIdentity, checkProjectAccess } from "@/lib/project-access";
import { prisma } from "@/lib/prisma";
import { getProjectsForUser } from "@/lib/projects";
import { Project } from "@/app/generated/prisma";
import { WorkspaceClient } from "./workspace-client";
import { AccessDenied } from "@/components/editor/access-denied";

interface PageProps {
  params: Promise<{ roomId: string }>;
}

export default async function Page({ params }: PageProps) {
  const { roomId } = await params;

  // 1. Retrieve authenticated Clerk identity and associated email addresses
  const { userId, emails } = await getClerkUserIdentity();
  if (!userId) {
    redirect("/sign-in");
  }

  // 2. Fetch project metadata to confirm existence
  const project = await prisma.project.findUnique({
    where: { id: roomId },
  });

  if (!project) {
    return <AccessDenied />;
  }

  // 3. Confirm that the current user has access permission to the project
  const hasAccess = await checkProjectAccess(roomId, userId, emails);
  if (!hasAccess) {
    return <AccessDenied />;
  }

  // 4. Fetch the owned and shared project list to populate the workspace sidebar
  const { owned, shared } = await getProjectsForUser(userId, emails);

  // Map database dates to plain JSON strings to prevent Next.js RSC serialization issues
  const serializeProjectList = (list: Project[]) =>
    list.map((proj) => ({
      ...proj,
      createdAt: proj.createdAt.toISOString(),
      updatedAt: proj.updatedAt?.toISOString() || null,
    }));

  return (
    <WorkspaceClient
      project={{
        id: project.id,
        name: project.name,
        ownerId: project.ownerId,
        description: project.description,
      }}
      ownedProjects={serializeProjectList(owned)}
      sharedProjects={serializeProjectList(shared)}
    />
  );
}
