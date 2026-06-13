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
    }, 5000);

    return () => clearTimeout(timer);
  }, [status, onTimeout]);

  return <>{children}</>;
}

function LiveblocksWithTimeout({
  projectId,
  onTimeout,
}: {
  projectId: string;
  onTimeout: () => void;
}) {
  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      <RoomProvider
        id={projectId}
        initialPresence={{
          cursor: null,
          isThinking: false,
        }}
      >
        <LiveblocksConnectionMonitor onTimeout={onTimeout}>
          <ReactFlowProvider>
            <LiveblocksCanvas />
          </ReactFlowProvider>
        </LiveblocksConnectionMonitor>
      </RoomProvider>
    </LiveblocksProvider>
  );
}

// ---------- Main exported wrapper ----------

interface CollaborativeCanvasWrapperProps {
  projectId: string;
}

export function CollaborativeCanvasWrapper({ projectId }: CollaborativeCanvasWrapperProps) {
  const [useLocal, setUseLocal] = useState(false);

  const handleLiveblocksError = React.useCallback(() => {
    console.warn("Switching to local canvas mode");
    setUseLocal(true);
  }, []);

  // Local-only mode: no Liveblocks providers, just React Flow
  if (useLocal) {
    return (
      <ReactFlowProvider>
        <LocalCanvas />
      </ReactFlowProvider>
    );
  }

  // Try Liveblocks – if it errors, the boundary switches to local mode
  return (
    <LiveblocksErrorBoundary
      onError={handleLiveblocksError}
      fallback={
        <ReactFlowProvider>
          <LocalCanvas />
        </ReactFlowProvider>
      }
    >
      <LiveblocksWithTimeout
        projectId={projectId}
        onTimeout={handleLiveblocksError}
      />
    </LiveblocksErrorBoundary>
  );
}
