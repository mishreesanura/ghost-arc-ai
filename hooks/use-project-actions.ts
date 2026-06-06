import { useState } from "react";
import { useRouter, usePathname, useParams } from "next/navigation";
import { generateSlug } from "@/lib/slug";

export type DialogType = "create" | "rename" | "delete" | null;

export interface ProjectData {
  id: string;
  name: string;
  ownerId: string;
  description?: string | null;
  createdAt: Date | string;
}

export function useProjectActions() {
  const [activeDialog, setActiveDialog] = useState<DialogType>(null);
  const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);
  const [projectName, setProjectName] = useState("");
  const [suffix, setSuffix] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();

  const openDialog = (type: DialogType, project?: ProjectData) => {
    setActiveDialog(type);
    setError(null);
    if (project) {
      setSelectedProject(project);
      setProjectName(project.name);
      setSuffix("");
    } else {
      setSelectedProject(null);
      setProjectName("");
      setSuffix(Math.random().toString(36).substring(2, 6));
    }
  };

  const closeDialog = () => {
    setActiveDialog(null);
    setSelectedProject(null);
    setProjectName("");
    setSuffix("");
    setIsLoading(false);
    setError(null);
  };

  const handleCreate = async () => {
    if (!projectName.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const roomId = `${generateSlug(projectName, { asciiOnly: true })}-${suffix}`;

      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: projectName, id: roomId }),
      });

      if (!res.ok) {
        let errMsg = "Failed to create project";
        try {
          const errData = await res.json();
          if (errData?.error) errMsg = errData.error;
        } catch {
          // ignore
        }
        throw new Error(errMsg);
      }

      const newProject = await res.json();
      closeDialog();
      router.push(`/editor/${newProject.id}`);
    } catch (err: unknown) {
      console.error("Error creating project:", err);
      const message = err instanceof Error ? err.message : String(err);
      setError(`Create failed: ${message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRename = async () => {
    if (!selectedProject || !projectName.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${selectedProject.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: projectName }),
      });

      if (!res.ok) {
        let errMsg = "Failed to rename project";
        try {
          const errData = await res.json();
          if (errData?.error) errMsg = errData.error;
        } catch {
          // ignore
        }
        throw new Error(errMsg);
      }

      closeDialog();
      router.refresh();
    } catch (err: unknown) {
      console.error("Error renaming project:", err);
      const message = err instanceof Error ? err.message : String(err);
      setError(`Rename failed: ${message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedProject) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${selectedProject.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        let errMsg = "Failed to delete project";
        try {
          const errData = await res.json();
          if (errData?.error) errMsg = errData.error;
        } catch {
          // ignore
        }
        throw new Error(errMsg);
      }

      // Check if the current workspace is the one being deleted
      // Works regardless of exact routing structure (e.g. /editor/[projectId] or similar)
      const pathSegments = pathname.split("/");
      const isDeletingActive =
        pathSegments.includes(selectedProject.id) ||
        (params && params.projectId === selectedProject.id);

      closeDialog();

      if (isDeletingActive) {
        router.push("/editor");
      } else {
        router.refresh();
      }
    } catch (err: unknown) {
      console.error("Error deleting project:", err);
      const message = err instanceof Error ? err.message : String(err);
      setError(`Delete failed: ${message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return {
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
  };
}
