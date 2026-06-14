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
import { CollaborativeCanvasWrapper } from "@/components/editor/collaborative-canvas-wrapper";
import { AiSidebar } from "@/components/editor/ai-sidebar";
import { SaveStatus } from "@/hooks/use-canvas-autosave";
import { LiveblocksProvider, RoomProvider } from "@liveblocks/react";

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
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

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

  const [canvasNodes, setCanvasNodes] = useState<any[]>([]);
  const [canvasEdges, setCanvasEdges] = useState<any[]>([]);

  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      <RoomProvider
        id={project.id}
        initialPresence={{
          cursor: null,
          isThinking: false,
          thinking: false,
        }}
      >
        <div className="flex min-h-screen flex-col bg-base text-text-primary font-sans antialiased overflow-hidden">
          {/* Workspace Navbar */}
          <WorkspaceNavbar
            projectName={project.name}
            isLeftSidebarOpen={isLeftSidebarOpen}
            onToggleLeftSidebar={() => setIsLeftSidebarOpen((prev) => !prev)}
            isRightSidebarOpen={isRightSidebarOpen}
            onToggleRightSidebar={() => setIsRightSidebarOpen((prev) => !prev)}
            onShare={handleShare}
            onOpenTemplates={() => setIsTemplatesOpen(true)}
            saveStatus={saveStatus}
            showUserButton={false}
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
            <main className="flex-grow bg-base relative overflow-hidden" style={{ height: "calc(100vh - 64px)", width: "100%" }}>
              <div style={{ height: "100%", width: "100%", position: "relative" }}>
                <CollaborativeCanvasWrapper
                  projectId={project.id}
                  isTemplatesOpen={isTemplatesOpen}
                  onCloseTemplates={() => setIsTemplatesOpen(false)}
                  onSaveStatusChange={setSaveStatus}
                  onSyncState={(nodes, edges) => {
                    setCanvasNodes(nodes);
                    setCanvasEdges(edges);
                  }}
                />
              </div>
            </main>

            {/* Right Collapsible AI Chat Sidebar */}
            <AiSidebar
              isOpen={isRightSidebarOpen}
              onClose={() => setIsRightSidebarOpen(false)}
              roomId={project.id}
              nodes={canvasNodes}
              edges={canvasEdges}
            />

          </div>
        </div>
      </RoomProvider>
    </LiveblocksProvider>
  );
}
