"use client";

import React, { Component, ErrorInfo, ReactNode, useState, useEffect } from "react";
import { LiveblocksProvider, RoomProvider, useStatus } from "@liveblocks/react";
import { ReactFlowProvider } from "@xyflow/react";
import { LocalCanvas, LiveblocksCanvas } from "./collaborative-canvas";

// ---------- Error boundary: catches Liveblocks render errors ----------

interface ErrorBoundaryProps {
  children: ReactNode;
  onError?: () => void;
  fallback: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class LiveblocksErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { hasError: false };

  public static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn("Liveblocks canvas error – falling back to local mode:", error.message);
    this.props.onError?.();
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// ---------- Timeout wrapper: if Liveblocks doesn't render in 5 s, switch to local ----------

function LiveblocksConnectionMonitor({
  onTimeout,
  children,
}: {
  onTimeout: () => void;
  children: React.ReactNode;
}) {
  const status = useStatus();

  useEffect(() => {
    if (status === "connected") {
      return;
    }

    const timer = setTimeout(() => {
      console.warn(`Liveblocks connection timed out (status: ${status}). Falling back to local canvas.`);
      onTimeout();
    }, 30000); // 30 seconds connection timeout

    return () => clearTimeout(timer);
  }, [status, onTimeout]);

  return <>{children}</>;
}

import { SaveStatus } from "@/hooks/use-canvas-autosave";
import { CanvasNode, CanvasEdge } from "@/types/canvas";

function LiveblocksWithTimeout({
  projectId,
  onTimeout,
  isTemplatesOpen,
  onCloseTemplates,
  onSaveStatusChange,
  onSyncState,
}: {
  projectId: string;
  onTimeout: () => void;
  isTemplatesOpen: boolean;
  onCloseTemplates: () => void;
  onSaveStatusChange: (status: SaveStatus) => void;
  onSyncState: (nodes: CanvasNode[], edges: CanvasEdge[]) => void;
}) {
  return (
    <LiveblocksConnectionMonitor onTimeout={onTimeout}>
      <ReactFlowProvider>
        <LiveblocksCanvas
          projectId={projectId}
          isTemplatesOpen={isTemplatesOpen}
          onCloseTemplates={onCloseTemplates}
          onSaveStatusChange={onSaveStatusChange}
          onSyncState={onSyncState}
        />
      </ReactFlowProvider>
    </LiveblocksConnectionMonitor>
  );
}

// ---------- Main exported wrapper ----------

interface CollaborativeCanvasWrapperProps {
  projectId: string;
  isTemplatesOpen: boolean;
  onCloseTemplates: () => void;
  onSaveStatusChange: (status: SaveStatus) => void;
  onSyncState?: (nodes: CanvasNode[], edges: CanvasEdge[]) => void;
}

export function CollaborativeCanvasWrapper({
  projectId,
  isTemplatesOpen,
  onCloseTemplates,
  onSaveStatusChange,
  onSyncState,
}: CollaborativeCanvasWrapperProps) {
  const [useLocal, setUseLocal] = useState(false);
  const [lastNodes, setLastNodes] = useState<CanvasNode[]>([]);
  const [lastEdges, setLastEdges] = useState<CanvasEdge[]>([]);

  const handleLiveblocksError = React.useCallback(() => {
    console.warn("Switching to local canvas mode");
    setUseLocal(true);
  }, []);

  const handleSyncState = React.useCallback((nodes: CanvasNode[], edges: CanvasEdge[]) => {
    setLastNodes(nodes);
    setLastEdges(edges);
    onSyncState?.(nodes, edges);
  }, [onSyncState]);

  // Local-only mode: no Liveblocks providers, just React Flow
  if (useLocal) {
    return (
      <ReactFlowProvider>
        <LocalCanvas
          projectId={projectId}
          isTemplatesOpen={isTemplatesOpen}
          onCloseTemplates={onCloseTemplates}
          onSaveStatusChange={onSaveStatusChange}
          initialNodes={lastNodes}
          initialEdges={lastEdges}
          onSyncState={handleSyncState}
        />
      </ReactFlowProvider>
    );
  }

  // Try Liveblocks – if it errors, the boundary switches to local mode
  return (
    <LiveblocksErrorBoundary
      onError={handleLiveblocksError}
      fallback={
        <ReactFlowProvider>
          <LocalCanvas
            projectId={projectId}
            isTemplatesOpen={isTemplatesOpen}
            onCloseTemplates={onCloseTemplates}
            onSaveStatusChange={onSaveStatusChange}
            initialNodes={lastNodes}
            initialEdges={lastEdges}
            onSyncState={handleSyncState}
          />
        </ReactFlowProvider>
      }
    >
      <LiveblocksWithTimeout
        projectId={projectId}
        onTimeout={handleLiveblocksError}
        isTemplatesOpen={isTemplatesOpen}
        onCloseTemplates={onCloseTemplates}
        onSaveStatusChange={onSaveStatusChange}
        onSyncState={handleSyncState}
      />
    </LiveblocksErrorBoundary>
  );
}
