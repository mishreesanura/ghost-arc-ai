"use client";

import React, { useState } from "react";
import { Network, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WorkspaceNavbar } from "@/components/editor/workspace-navbar";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import { ProjectDialogs } from "@/components/editor/project-dialogs";
import { useProjectActions, ProjectData } from "@/hooks/use-project-actions";
import { useUser } from "@clerk/nextjs";
import { ShareDialog } from "@/components/editor/share-dialog";

interface WorkspaceClientProps {
  project: {
    id: string;
    name: string;
    ownerId: string;
    description: string | null;
  };
  ownedProjects: ProjectData[];
  sharedProjects: ProjectData[];
}

export function WorkspaceClient({
  project,
  ownedProjects,
  sharedProjects,
}: WorkspaceClientProps) {
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);

  const { user } = useUser();
  const isOwner = user?.id === project.ownerId;

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

  const handleShare = () => {
    setIsShareDialogOpen(true);
  };

  return (
    <div className="flex min-h-screen flex-col bg-base text-text-primary font-sans antialiased overflow-hidden">
      {/* Workspace Navbar */}
      <WorkspaceNavbar
        projectName={project.name}
        isLeftSidebarOpen={isLeftSidebarOpen}
        onToggleLeftSidebar={() => setIsLeftSidebarOpen((prev) => !prev)}
        isRightSidebarOpen={isRightSidebarOpen}
        onToggleRightSidebar={() => setIsRightSidebarOpen((prev) => !prev)}
        onShare={handleShare}
      />

      {/* Workspace Body container */}
      <div className="flex-1 flex flex-row overflow-hidden relative w-full h-[calc(100vh-64px)]">
        
        {/* Project Sidebar (Collapsible Left overlay) */}
        <ProjectSidebar
          isOpen={isLeftSidebarOpen}
          onClose={() => setIsLeftSidebarOpen(false)}
          ownedProjects={ownedProjects}
          sharedProjects={sharedProjects}
          activeProjectId={project.id}
          onNewProject={() => {
            setIsLeftSidebarOpen(false);
            openDialog("create");
          }}
          onRenameProject={(p) => {
            setIsLeftSidebarOpen(false);
            openDialog("rename", p);
          }}
          onDeleteProject={(p) => {
            setIsLeftSidebarOpen(false);
            openDialog("delete", p);
          }}
        />

        {/* Project CRUD Action Dialogs */}
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

        {/* Share Dialog */}
        <ShareDialog
          isOpen={isShareDialogOpen}
          onClose={() => setIsShareDialogOpen(false)}
          projectId={project.id}
          projectName={project.name}
          isOwner={isOwner}
        />

        {/* Central Canvas Workspace Area */}
        <main className="flex-1 flex flex-col items-center justify-center p-8 bg-base relative overflow-hidden">
          {/* Grid visual styling background pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f1f2e1a_1px,transparent_1px),linear-gradient(to_bottom,#1f1f2e1a_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
          
          <div className="flex flex-col items-center justify-center text-center space-y-6 max-w-md z-10">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-primary-dim text-accent-primary border border-accent-primary/20 shadow-[0_0_20px_rgba(0,200,212,0.1)]">
              <Network className="h-8 w-8 animate-pulse" strokeWidth={1.5} />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-bold tracking-tight text-text-primary">Interactive Canvas Area</h2>
              <p className="text-text-muted text-sm max-w-sm leading-relaxed">
                This area will house the collaborative React Flow canvas, allowing nodes, relationships, and AI design generation.
              </p>
            </div>
          </div>
        </main>

        {/* Right Collapsible AI Chat Sidebar Placeholder */}
        <aside
          className={`fixed top-16 right-0 bottom-0 z-20 flex w-80 flex-col border-l border-default bg-surface/95 backdrop-blur-md text-text-primary transition-transform duration-300 ease-in-out shadow-2xl ${
            isRightSidebarOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* AI Header */}
          <div className="flex h-16 items-center justify-between border-b border-default px-6 shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent-ai" />
              <span className="text-sm font-semibold text-text-primary">AI Assistant</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsRightSidebarOpen(false)}
              className="text-text-muted hover:text-text-primary hover:bg-subtle/50 h-8 w-8 rounded-lg"
              aria-label="Close AI panel"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* AI Scrollable Workspace Panel */}
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4 overflow-y-auto">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-ai/10 text-accent-ai-text border border-accent-ai/20 shadow-[0_0_15px_rgba(100,87,249,0.1)]">
              <Sparkles className="h-6 w-6" strokeWidth={1.5} />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-text-primary">AI Chat Placeholder</h3>
              <p className="text-xs text-text-muted max-w-[200px] leading-normal">
                Prompted system architectures and technical specification generators will integrate here.
              </p>
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
}
