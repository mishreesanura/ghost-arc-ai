import { useState } from "react";

export type DialogType = "create" | "rename" | "delete" | null;

export interface ProjectData {
  id: string;
  name: string;
  slug: string;
  isOwned: boolean;
}

export function useProjectDialogs() {
  const [activeDialog, setActiveDialog] = useState<DialogType>(null);
  const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);
  
  const [projectName, setProjectName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const openDialog = (type: DialogType, project?: ProjectData) => {
    setActiveDialog(type);
    if (project) {
      setSelectedProject(project);
      setProjectName(project.name);
    } else {
      setSelectedProject(null);
      setProjectName("");
    }
  };

  const closeDialog = () => {
    setActiveDialog(null);
    setSelectedProject(null);
    setProjectName("");
    setIsLoading(false);
  };

  return {
    activeDialog,
    selectedProject,
    projectName,
    setProjectName,
    isLoading,
    setIsLoading,
    openDialog,
    closeDialog,
  };
}
