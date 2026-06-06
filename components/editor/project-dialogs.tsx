import React, { useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DialogType, ProjectData } from "@/hooks/use-project-dialogs";
import { generateSlug } from "@/lib/slug";

interface ProjectDialogsProps {
  activeDialog: DialogType;
  selectedProject: ProjectData | null;
  projectName: string;
  setProjectName: (name: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  closeDialog: () => void;
  onConfirm: (type: DialogType, name: string, project: ProjectData | null) => void;
}

export function ProjectDialogs({
  activeDialog,
  selectedProject,
  projectName,
  setProjectName,
  isLoading,
  setIsLoading,
  closeDialog,
  onConfirm,
}: ProjectDialogsProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const slugPreview = generateSlug(projectName);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!projectName.trim() && activeDialog !== "delete") return;
    
    setIsLoading(true);
    // Simulate short delay
    setTimeout(() => {
      onConfirm(activeDialog, projectName, selectedProject);
      closeDialog();
    }, 400);
  };

  useEffect(() => {
    if (activeDialog === "rename" || activeDialog === "create") {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [activeDialog]);

  return (
    <>
      <Dialog open={activeDialog === "create"} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="bg-surface border-default text-text-primary rounded-xl">
          <DialogHeader>
            <DialogTitle>Create Project</DialogTitle>
            <DialogDescription className="text-text-muted">
              Start a new architecture workspace.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-2">
              <label htmlFor="create-name" className="text-sm font-medium">Project Name</label>
              <Input 
                id="create-name"
                ref={inputRef}
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g. E-commerce Microservices"
                className="bg-base border-default text-text-primary focus-visible:ring-accent-primary"
                disabled={isLoading}
              />
            </div>
            {projectName && (
              <div className="text-xs text-text-muted">
                Slug: <span className="font-mono text-accent-primary">{slugPreview}</span>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={closeDialog} disabled={isLoading} className="text-text-secondary hover:text-text-primary">
                Cancel
              </Button>
              <Button type="submit" className="bg-accent-primary text-bg-base hover:bg-accent-primary/90" disabled={isLoading || !projectName.trim()}>
                {isLoading ? "Creating..." : "Create Project"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={activeDialog === "rename"} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="bg-surface border-default text-text-primary rounded-xl">
          <DialogHeader>
            <DialogTitle>Rename Project</DialogTitle>
            <DialogDescription className="text-text-muted">
              Current name: <span className="font-medium text-text-primary">{selectedProject?.name}</span>
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-2">
              <label htmlFor="rename-name" className="text-sm font-medium">New Name</label>
              <Input 
                id="rename-name"
                ref={inputRef}
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="bg-base border-default text-text-primary focus-visible:ring-accent-primary"
                disabled={isLoading}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={closeDialog} disabled={isLoading} className="text-text-secondary hover:text-text-primary">
                Cancel
              </Button>
              <Button type="submit" className="bg-accent-primary text-bg-base hover:bg-accent-primary/90" disabled={isLoading || !projectName.trim() || projectName === selectedProject?.name}>
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={activeDialog === "delete"} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="bg-surface border-default text-text-primary rounded-xl">
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription className="text-text-muted">
              Are you sure you want to delete <span className="font-medium text-text-primary">{selectedProject?.name}</span>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button type="button" variant="ghost" onClick={closeDialog} disabled={isLoading} className="text-text-secondary hover:text-text-primary">
              Cancel
            </Button>
            <Button type="button" variant="destructive" className="bg-state-error text-text-primary hover:bg-state-error/90" onClick={() => handleSubmit()} disabled={isLoading}>
              {isLoading ? "Deleting..." : "Delete Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
