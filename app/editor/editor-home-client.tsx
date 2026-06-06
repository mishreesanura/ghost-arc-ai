"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import { ProjectDialogs } from "@/components/editor/project-dialogs";
import { useProjectActions, ProjectData } from "@/hooks/use-project-actions";

interface EditorHomeClientProps {
  initialOwnedProjects: ProjectData[];
  initialSharedProjects: ProjectData[];
}

export function EditorHomeClient({
  initialOwnedProjects,
  initialSharedProjects,
}: EditorHomeClientProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const {
    activeDialog,
    selectedProject,
    projectName,
    setProjectName,
    suffix,
    isLoading,
    error,
    openDialog,
    closeDialog,
    handleCreate,
    handleRename,
    handleDelete,
  } = useProjectActions();

  return (
    <div className="flex min-h-screen flex-col bg-base text-primary font-sans antialiased">
      {/* Editor Layout Navigation & Sidebar */}
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
      />
      <ProjectSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        ownedProjects={initialOwnedProjects}
        sharedProjects={initialSharedProjects}
        onNewProject={() => {
          setIsSidebarOpen(false);
          openDialog("create");
        }}
        onRenameProject={(p) => openDialog("rename", p)}
        onDeleteProject={(p) => openDialog("delete", p)}
      />

      <ProjectDialogs
        activeDialog={activeDialog}
        selectedProject={selectedProject}
        projectName={projectName}
        setProjectName={setProjectName}
        suffix={suffix}
        isLoading={isLoading}
        error={error}
        closeDialog={closeDialog}
        onCreate={handleCreate}
        onRename={handleRename}
        onDelete={handleDelete}
      />

      {/* Main Area */}
      <main className="flex-1 flex items-center justify-center p-8 md:p-12 w-full">
        <div className="flex flex-col items-center justify-center text-center space-y-6 max-w-md">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">Create a project or open an existing one</h1>
            <p className="text-text-muted text-sm">
              Start a new architecture workspace, or choose a project from the sidebar.
            </p>
          </div>
          <Button 
            onClick={() => openDialog("create")} 
            className="bg-accent-primary text-bg-base hover:bg-accent-primary/90 gap-2 font-medium"
          >
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>
      </main>
    </div>
  );
}
