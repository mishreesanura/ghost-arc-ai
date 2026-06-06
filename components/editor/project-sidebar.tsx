"use client";

import React from "react";
import { X, Plus, Folder, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ProjectSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProjectSidebar({ isOpen, onClose }: ProjectSidebarProps) {
  return (
    <>
      {/* Backdrop overlay for the sidebar */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-80 flex-col border-r border-default bg-surface text-primary transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-default px-6">
          <h2 className="text-lg font-semibold text-text-primary">Projects</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary hover:bg-bg-subtle/50 h-8 w-8 rounded-lg"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content Area with Tabs */}
        <div className="flex-1 overflow-y-auto p-6">
          <Tabs defaultValue="my-projects" className="w-full h-full flex flex-col gap-4">
            <TabsList className="grid w-full grid-cols-2 bg-bg-base border border-default p-1 rounded-xl">
              <TabsTrigger
                value="my-projects"
                className="rounded-lg text-xs py-2 data-[state=active]:bg-bg-subtle data-[state=active]:text-accent-primary"
              >
                My Projects
              </TabsTrigger>
              <TabsTrigger
                value="shared"
                className="rounded-lg text-xs py-2 data-[state=active]:bg-bg-subtle data-[state=active]:text-accent-primary"
              >
                Shared
              </TabsTrigger>
            </TabsList>

            {/* My Projects Tab */}
            <TabsContent
              value="my-projects"
              className="flex-1 flex flex-col items-center justify-center text-center p-4 border border-dashed border-default rounded-2xl min-h-[250px]"
            >
              <Folder className="h-8 w-8 text-text-muted mb-3" />
              <h3 className="text-sm font-medium text-text-primary mb-1">No projects found</h3>
              <p className="text-xs text-text-muted max-w-[200px]">
                Create your first project to start designing collaborative architectures.
              </p>
            </TabsContent>

            {/* Shared Tab */}
            <TabsContent
              value="shared"
              className="flex-1 flex flex-col items-center justify-center text-center p-4 border border-dashed border-default rounded-2xl min-h-[250px]"
            >
              <Users className="h-8 w-8 text-text-muted mb-3" />
              <h3 className="text-sm font-medium text-text-primary mb-1">No shared projects</h3>
              <p className="text-xs text-text-muted max-w-[200px]">
                Projects shared with you by other collaborators will appear here.
              </p>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer with New Project Button */}
        <div className="border-t border-default p-6">
          <Button className="w-full bg-accent-primary text-bg-base hover:bg-accent-primary/90 font-medium py-5 gap-2 rounded-xl">
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>
      </aside>
    </>
  );
}
