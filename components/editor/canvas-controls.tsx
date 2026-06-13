import React from "react";
import { useReactFlow } from "@xyflow/react";
import { ZoomIn, ZoomOut, Maximize, Undo2, Redo2 } from "lucide-react";

interface CanvasControlsProps {
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

export function CanvasControls({
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
}: CanvasControlsProps) {
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  return (
    <div className="flex items-center gap-1.5 bg-surface/90 backdrop-blur-md border border-border p-1.5 rounded-xl shadow-lg pointer-events-auto select-none">
      <div className="flex items-center gap-0.5">
        <button
          onClick={() => zoomOut({ duration: 300 })}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:text-text-primary hover:bg-subtle transition-all cursor-pointer"
          title="Zoom Out (-)"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <button
          onClick={() => fitView({ duration: 300 })}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:text-text-primary hover:bg-subtle transition-all cursor-pointer"
          title="Fit View"
        >
          <Maximize className="h-4 w-4" />
        </button>
        <button
          onClick={() => zoomIn({ duration: 300 })}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:text-text-primary hover:bg-subtle transition-all cursor-pointer"
          title="Zoom In (+)"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
      </div>

      <div className="h-4 w-px bg-border mx-1" />

      <div className="flex items-center gap-0.5">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all ${
            canUndo
              ? "text-text-secondary hover:text-text-primary hover:bg-subtle cursor-pointer"
              : "text-text-muted opacity-40 cursor-not-allowed"
          }`}
          title="Undo (Cmd/Ctrl + Z)"
        >
          <Undo2 className="h-4 w-4" />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all ${
            canRedo
              ? "text-text-secondary hover:text-text-primary hover:bg-subtle cursor-pointer"
              : "text-text-muted opacity-40 cursor-not-allowed"
          }`}
          title="Redo (Cmd/Ctrl + Shift + Z / Cmd/Ctrl + Y)"
        >
          <Redo2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
export type { CanvasControlsProps };
