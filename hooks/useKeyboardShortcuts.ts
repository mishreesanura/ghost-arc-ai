import { useEffect } from "react";
import { type useReactFlow } from "@xyflow/react";

interface KeyboardShortcutsProps {
  reactFlowInstance: ReturnType<typeof useReactFlow>;
  undo?: () => void;
  redo?: () => void;
}

export function useKeyboardShortcuts({
  reactFlowInstance,
  undo,
  redo,
}: KeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore shortcut triggers when user is typing in inputs or textareas or contenteditables
      const target = event.target as HTMLElement;
      if (
        !target ||
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable ||
        target.closest("[contenteditable]")
      ) {
        return;
      }

      const isMac = typeof window !== "undefined" && /mac/i.test(navigator.userAgent);
      const isCmdOrCtrl = isMac ? event.metaKey : event.ctrlKey;

      // Cmd/Ctrl + Shift + Z -> Redo
      if (isCmdOrCtrl && event.shiftKey && event.key.toLowerCase() === "z") {
        event.preventDefault();
        redo?.();
        return;
      }

      // Cmd/Ctrl + Z -> Undo
      if (isCmdOrCtrl && !event.shiftKey && event.key.toLowerCase() === "z") {
        event.preventDefault();
        undo?.();
        return;
      }

      // Cmd/Ctrl + Y -> Redo
      if (isCmdOrCtrl && event.key.toLowerCase() === "y") {
        event.preventDefault();
        redo?.();
        return;
      }

      // + or = -> Zoom In
      if (!isCmdOrCtrl && (event.key === "+" || event.key === "=")) {
        event.preventDefault();
        reactFlowInstance.zoomIn({ duration: 300 });
        return;
      }

      // - -> Zoom Out
      if (!isCmdOrCtrl && event.key === "-") {
        event.preventDefault();
        reactFlowInstance.zoomOut({ duration: 300 });
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [reactFlowInstance, undo, redo]);
}
