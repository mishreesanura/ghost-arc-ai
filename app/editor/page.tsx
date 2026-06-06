import React from "react";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getProjectsForUser } from "@/lib/projects";
import { EditorHomeClient } from "./editor-home-client";
import { Project } from "@/app/generated/prisma";

export default async function Page() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const user = await currentUser();
  const emails = user?.emailAddresses.map((e) => e.emailAddress) || [];

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
