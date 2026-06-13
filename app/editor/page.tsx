import React from "react";
import { getClerkUserIdentity } from "@/lib/project-access";
import { redirect } from "next/navigation";
import { getProjectsForUser } from "@/lib/projects";
import { EditorHomeClient } from "./editor-home-client";
import { Project } from "@/app/generated/prisma";

export default async function Page() {
  const { userId, emails } = await getClerkUserIdentity();
  if (!userId) {
    redirect("/sign-in");
  }

  // Fetch owned and shared projects server-side
  const { owned, shared } = await getProjectsForUser(userId, emails);

  // Map database dates to plain JSON values to avoid serialization issues
  const serializeProjectList = (list: Project[]) =>
    list.map((proj) => ({
      ...proj,
      createdAt: proj.createdAt.toISOString(),
      updatedAt: proj.updatedAt?.toISOString() || null,
    }));

  return (
    <EditorHomeClient
      initialOwnedProjects={serializeProjectList(owned)}
      initialSharedProjects={serializeProjectList(shared)}
    />
  );
}
