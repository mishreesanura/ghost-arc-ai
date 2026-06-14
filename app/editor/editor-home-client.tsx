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
        <div className="flex flex-col items-center justify-center text-center space-y-6 max-w-md bg-surface/50 border border-default p-8 rounded-3xl backdrop-blur-md shadow-2xl relative overflow-hidden group">
          {/* Subtle top glow line */}
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-accent-primary/50 to-transparent" />
          
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-primary/10 text-accent-primary border border-accent-primary/20 shadow-[0_0_20px_rgba(0,200,212,0.15)] mb-2">
            <Plus className="h-6 w-6" strokeWidth={1.5} />
          </div>

          <div className="space-y-2.5">
            <h1 className="text-xl font-bold tracking-tight text-text-primary">Create a project or open an existing one</h1>
            <p className="text-text-muted text-xs leading-relaxed max-w-[280px] mx-auto">
              Start a new architecture workspace, or choose a project from the sidebar to begin designing.
            </p>
          </div>
          <Button 
            onClick={() => openDialog("create")} 
            className="bg-accent-primary text-black hover:bg-accent-primary/95 font-semibold h-11 px-6 gap-2 rounded-xl border-none shadow-[0_4px_12px_rgba(0,200,212,0.2)] transition-all duration-200"
          >
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>
      </main>
    </div>
  );
}
