"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import { ProjectDialogs } from "@/components/editor/project-dialogs";
import { useProjectDialogs, ProjectData, DialogType } from "@/hooks/use-project-dialogs";
import { generateSlug } from "@/lib/slug";

const INITIAL_MOCK_PROJECTS: ProjectData[] = [
  { id: "1", name: "E-commerce Monolith", slug: "e-commerce-monolith", isOwned: true },
  { id: "2", name: "Payment Gateway", slug: "payment-gateway", isOwned: true },
  { id: "3", name: "Auth Service", slug: "auth-service", isOwned: false },
];

export default function Home() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [projects, setProjects] = useState<ProjectData[]>(INITIAL_MOCK_PROJECTS);
  
  const dialogs = useProjectDialogs();

  const handleConfirm = (type: DialogType, name: string, project: ProjectData | null) => {
    if (type === "create") {
      const newProject: ProjectData = {
        id: Date.now().toString(),
        name,
        slug: generateSlug(name),
        isOwned: true,
      };
      setProjects([newProject, ...projects]);
    } else if (type === "rename" && project) {
      setProjects(projects.map(p => 
        p.id === project.id ? { ...p, name, slug: generateSlug(name) } : p
      ));
    } else if (type === "delete" && project) {
      setProjects(projects.filter(p => p.id !== project.id));
    }
  };

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
        projects={projects}
        onNewProject={() => {
          setIsSidebarOpen(false);
          dialogs.openDialog("create");
        }}
        onRenameProject={(p) => dialogs.openDialog("rename", p)}
        onDeleteProject={(p) => dialogs.openDialog("delete", p)}
      />

      <ProjectDialogs
        {...dialogs}
        onConfirm={handleConfirm}
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
            onClick={() => dialogs.openDialog("create")} 
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

