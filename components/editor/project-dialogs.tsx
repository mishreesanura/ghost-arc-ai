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
import { DialogType, ProjectData } from "@/hooks/use-project-actions";
import { generateSlug } from "@/lib/slug";

interface ProjectDialogsProps {
  activeDialog: DialogType;
  selectedProject: ProjectData | null;
  projectName: string;
  setProjectName: (name: string) => void;
  suffix: string;
  isLoading: boolean;
  error?: string | null;
  closeDialog: () => void;
  onCreate: () => Promise<void>;
  onRename: () => Promise<void>;
  onDelete: () => Promise<void>;
}

export function ProjectDialogs({
  activeDialog,
  selectedProject,
  projectName,
  setProjectName,
  suffix,
  isLoading,
  error,
  closeDialog,
  onCreate,
  onRename,
  onDelete,
}: ProjectDialogsProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const slugPreview = projectName && suffix ? `${generateSlug(projectName, { asciiOnly: true })}-${suffix}` : "";

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!projectName.trim() && activeDialog !== "delete") return;
    
    if (activeDialog === "create") {
      await onCreate();
    } else if (activeDialog === "rename") {
      await onRename();
    } else if (activeDialog === "delete") {
      await onDelete();
    }
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
                Room ID Preview: <span className="font-mono text-accent-primary">{slugPreview}</span>
              </div>
            )}
            {error && (
              <div className="text-xs text-state-error bg-state-error/10 border border-state-error/20 rounded-lg p-2 font-medium">
                {error}
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
            {error && (
              <div className="text-xs text-state-error bg-state-error/10 border border-state-error/20 rounded-lg p-2 font-medium">
                {error}
              </div>
            )}
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
          {error && (
            <div className="text-xs text-state-error bg-state-error/10 border border-state-error/20 rounded-lg p-2 mt-2 font-medium">
              {error}
            </div>
          )}
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
