"use client";

import React from "react";
import {
  ReactFlow,
  Background,
  MiniMap,
  ConnectionMode,
  BackgroundVariant,
  useReactFlow,
  Panel,
  useNodesState,
  useEdgesState,
  useNodes,
  useEdges,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  type Connection,
  MarkerType,
} from "@xyflow/react";
import { CanvasNodeComponent } from "./canvas-node";
import { CanvasEdgeComponent } from "./canvas-edge";
import { ShapePanel } from "./shape-panel";
import { CanvasNode, CanvasEdge } from "@/types/canvas";
import { useLiveblocksFlow } from "@liveblocks/react-flow";
import { useUndo, useRedo, useCanUndo, useCanRedo, useMyPresence, useOthers } from "@liveblocks/react";
import { CanvasControls } from "./canvas-controls";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { AvatarGroup } from "./avatar-group";
import { CanvasCursors } from "./canvas-cursors";

// ---------- shared drag-and-drop logic ----------

function useDragDrop(
  screenToFlowPosition: ReturnType<typeof useReactFlow>["screenToFlowPosition"],
  onNodesChange: OnNodesChange<CanvasNode>
) {
  const nodeCounterRef = React.useRef(0);

  const onDragOver = React.useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
    },
    []
  );

  const onDrop = React.useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();

      const rawPayload = event.dataTransfer.getData("text/plain");
      if (!rawPayload) return;

      try {
        const payload = JSON.parse(rawPayload);
        const { shape, width, height, grabX = 20, grabY = 20 } = payload;
        if (!shape) return;

        // Bounding rect of the canvas container
        const containerRect = event.currentTarget.getBoundingClientRect();

        // Calculate drop position centering the node at the cursor.
        // screenToFlowPosition converts screen (client) coordinates to canvas/flow space
        // by subtracting the container bounding rect offset and applying the current zoom and pan.
        const position = screenToFlowPosition({
          x: event.clientX - width / 2,
          y: event.clientY - height / 2,
        });

        nodeCounterRef.current += 1;
        const id = `${shape}-${Date.now()}-${nodeCounterRef.current}`;

        const newNode: CanvasNode = {
          id,
          type: "canvasNode",
          position,
          width,
          height,
          style: { width, height },
          data: {
            label: "",
            shape,
            color: "#1F1F1F",
          },
        };

        onNodesChange([{ type: "add", item: newNode }]);
      } catch (err) {
        console.error("Error processing shape drop:", err);
      }
    },
    [screenToFlowPosition, onNodesChange]
  );

  return { onDragOver, onDrop };
}

// ---------- shared React Flow surface ----------

interface CanvasSurfaceProps {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  onNodesChange: OnNodesChange<CanvasNode>;
  onEdgesChange: OnEdgesChange<CanvasEdge>;
  onConnect: OnConnect;
  onDelete?: (params: { nodes: CanvasNode[]; edges: CanvasEdge[] }) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  isLoading?: boolean;
  children?: React.ReactNode;
  undo?: () => void;
  redo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onPointerMove?: React.PointerEventHandler<HTMLDivElement>;
  onPointerLeave?: React.PointerEventHandler<HTMLDivElement>;
}

const defaultEdgeOptions = {
  type: "canvasEdge",
  style: {
    stroke: "var(--color-text-muted)",
    strokeWidth: 2,
  },
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: "var(--color-text-muted)",
  },
};

function CanvasSurface({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onDelete,
  onDragOver,
  onDrop,
  isLoading,
  children,
  undo,
  redo,
  canUndo,
  canRedo,
  onPointerMove,
  onPointerLeave,
}: CanvasSurfaceProps) {
  const nodeTypes = React.useMemo(
    () => ({
      canvasNode: CanvasNodeComponent,
    }),
    []
  );

  const edgeTypes = React.useMemo(
    () => ({
      canvasEdge: CanvasEdgeComponent,
    }),
    []
  );

  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const allNodes = useNodes<CanvasNode>();
  const allEdges = useEdges<CanvasEdge>();

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Delete" && event.key !== "Backspace") {
        return;
      }

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

      // gets currently selected nodes using useNodes() filtered by selected state
      const selectedNodes = allNodes.filter((node) => node.selected);

      // gets currently selected edges using useEdges() filtered by selected state
      const selectedEdges = allEdges.filter((edge) => edge.selected);

      if (selectedNodes.length > 0 || selectedEdges.length > 0) {
        event.preventDefault();
        onDelete?.({ nodes: selectedNodes, edges: selectedEdges });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [allNodes, allEdges, onDelete]);

  return (
    <div
      ref={wrapperRef}
      style={{ height: "100%", width: "100%", position: "absolute", inset: 0, overflow: "hidden" }}
      className="bg-base"
    >
      {isLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-base/60 backdrop-blur-sm pointer-events-none">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-text-muted">
              Syncing workspace...
            </span>
          </div>
        </div>
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDelete={onDelete}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode={ConnectionMode.Loose}
        onDragOver={onDragOver}
        onDrop={onDrop}
        defaultEdgeOptions={defaultEdgeOptions}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        fitView
        deleteKeyCode={null}
        style={{ height: "100%", width: "100%" }}
      >
        {children}
        <Background
          variant={BackgroundVariant.Dots}
          gap={16}
          size={1.5}
          color="rgba(255, 255, 255, 0.25)"
        />
        <MiniMap
          className="!bg-surface !border-default !rounded-xl overflow-hidden"
          nodeColor="#2a2a30"
          maskColor="rgba(8, 8, 9, 0.7)"
          aria-label="Canvas Minimap"
        />
        <Panel position="bottom-left" className="!mb-6 !ml-6">
          <CanvasControls
            onUndo={undo}
            onRedo={redo}
            canUndo={canUndo}
            canRedo={canRedo}
          />
        </Panel>
        <Panel position="bottom-center" className="!mb-6">
          <ShapePanel />
        </Panel>
      </ReactFlow>
    </div>
  );
}

import { useCanvasAutosave, type SaveStatus } from "@/hooks/use-canvas-autosave";
import { StarterTemplatesModal } from "./starter-templates-modal";
import { CanvasTemplate } from "./starter-templates";

// ---------- local-only canvas (no Liveblocks) ----------

interface CanvasProps {
  projectId: string;
  isTemplatesOpen: boolean;
  onCloseTemplates: () => void;
  onSaveStatusChange: (status: SaveStatus) => void;
  initialNodes?: CanvasNode[];
  initialEdges?: CanvasEdge[];
}

export function LocalCanvas({
  projectId,
  isTemplatesOpen,
  onCloseTemplates,
  onSaveStatusChange,
  initialNodes,
  initialEdges,
  onSyncState,
}: CanvasProps & { onSyncState?: (nodes: CanvasNode[], edges: CanvasEdge[]) => void }) {
  const [nodes, setNodes, onNodesChange] = useNodesState<CanvasNode>(initialNodes ?? []);
  const [edges, setEdges, onEdgesChange] = useEdgesState<CanvasEdge>(initialEdges ?? []);
  const reactFlowInstance = useReactFlow();
  const { screenToFlowPosition } = reactFlowInstance;
  const { onDragOver, onDrop } = useDragDrop(screenToFlowPosition, onNodesChange);

  useKeyboardShortcuts({ reactFlowInstance });

  const [isInitialized, setIsInitialized] = React.useState(!!(initialNodes && initialNodes.length > 0));

  // Call onSyncState on change
  React.useEffect(() => {
    onSyncState?.(nodes, edges);
  }, [nodes, edges, onSyncState]);

  const loadSavedState = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/canvas`);
      if (res.ok) {
        const data = await res.json();
        if (data && (data.nodes?.length > 0 || data.edges?.length > 0)) {
          setNodes(data.nodes);
          setEdges(data.edges);
          setTimeout(() => {
            reactFlowInstance.fitView({ duration: 300 });
          }, 100);
        }
      }
    } catch (error) {
      console.error("Failed to load saved local canvas state:", error);
    }
    setIsInitialized(true);
  }, [projectId, setNodes, setEdges, reactFlowInstance]);

  // Load saved canvas state on mount for Local mode
  React.useEffect(() => {
    if (initialNodes && initialNodes.length > 0) {
      return;
    }
    loadSavedState();
  }, [initialNodes, loadSavedState]);

  // Auto-refresh canvas when GhostArc AI completes mutations
  React.useEffect(() => {
    const handleAiCompleted = () => {
      console.log("GhostArc AI completed design generation, auto-refreshing local canvas state...");
      loadSavedState();
    };

    window.addEventListener("ghostarc-ai-completed", handleAiCompleted);
    return () => {
      window.removeEventListener("ghostarc-ai-completed", handleAiCompleted);
    };
  }, [loadSavedState]);

  // Hook up autosave for Local mode
  const { saveStatus } = useCanvasAutosave({
    projectId,
    nodes,
    edges,
    isInitialized,
  });

  React.useEffect(() => {
    onSaveStatusChange(saveStatus);
  }, [saveStatus, onSaveStatusChange]);

  const handleConnect: OnConnect = React.useCallback(
    (connection: Connection) => {
      onEdgesChange([
        {
          type: "add",
          item: {
            ...connection,
            id: `edge-${Date.now()}`,
          } as CanvasEdge,
        },
      ]);
    },
    [onEdgesChange]
  );

  const handleDelete = React.useCallback(
    ({ nodes: nodesToDelete, edges: edgesToDelete }: { nodes: CanvasNode[]; edges: CanvasEdge[] }) => {
      if (nodesToDelete.length > 0) {
        onNodesChange(nodesToDelete.map((node) => ({ type: "remove" as const, id: node.id })));
      }
      if (edgesToDelete.length > 0) {
        onEdgesChange(edgesToDelete.map((edge) => ({ type: "remove" as const, id: edge.id })));
      }
    },
    [onNodesChange, onEdgesChange]
  );

  const handleImportTemplate = React.useCallback(
    (template: CanvasTemplate) => {
      setNodes(template.nodes);
      setEdges(template.edges);
      setTimeout(() => {
        reactFlowInstance.fitView({ duration: 300 });
      }, 50);
    },
    [setNodes, setEdges, reactFlowInstance]
  );

  return (
    <CanvasSurface
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={handleConnect}
      onDelete={handleDelete}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <Panel position="top-right" className="!mt-4 !mr-4 z-40">
        <AvatarGroup others={[]} />
      </Panel>
      <StarterTemplatesModal
        isOpen={isTemplatesOpen}
        onClose={onCloseTemplates}
        onImport={handleImportTemplate}
      />
    </CanvasSurface>
  );
}

// ---------- Liveblocks-connected canvas ----------

export function LiveblocksCanvas({
  projectId,
  isTemplatesOpen,
  onCloseTemplates,
  onSaveStatusChange,
  onSyncState,
}: CanvasProps & { onSyncState?: (nodes: CanvasNode[], edges: CanvasEdge[]) => void }) {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onDelete,
    isLoading,
  } = useLiveblocksFlow<CanvasNode, CanvasEdge>({
    nodes: { initial: [] },
    edges: { initial: [] },
  });

  React.useEffect(() => {
    if (nodes || edges) {
      onSyncState?.(nodes ?? [], edges ?? []);
    }
  }, [nodes, edges, onSyncState]);

  const others = useOthers();

  const reactFlowInstance = useReactFlow();
  const { screenToFlowPosition } = reactFlowInstance;
  const { onDragOver, onDrop } = useDragDrop(screenToFlowPosition, onNodesChange);

  const undo = useUndo();
  const redo = useRedo();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();
  const [_, updateMyPresence] = useMyPresence();

  useKeyboardShortcuts({ reactFlowInstance, undo, redo });

  const [isInitialized, setIsInitialized] = React.useState(false);

  // Load saved canvas state on mount if room is empty
  React.useEffect(() => {
    if (isLoading) return;

    const loadSavedState = async () => {
      // Check if room is empty
      const currentNodes = nodes || [];
      const currentEdges = edges || [];
      if (currentNodes.length === 0 && currentEdges.length === 0) {
        try {
          const res = await fetch(`/api/projects/${projectId}/canvas`);
          if (res.ok) {
            const data = await res.json();
            if (data && (data.nodes?.length > 0 || data.edges?.length > 0)) {
              // Add retrieved nodes
              const nodeChanges = data.nodes.map((node: any) => ({
                type: "add" as const,
                item: node,
              }));
              onNodesChange(nodeChanges);

              // Add retrieved edges
              const edgeChanges = data.edges.map((edge: any) => ({
                type: "add" as const,
                item: edge,
              }));
              onEdgesChange(edgeChanges);

              setTimeout(() => {
                reactFlowInstance.fitView({ duration: 300 });
              }, 100);
            }
          }
        } catch (error) {
          console.error("Failed to load saved canvas state:", error);
        }
      }
      setIsInitialized(true);
    };

    loadSavedState();
  }, [isLoading, projectId, nodes, edges, onNodesChange, onEdgesChange, reactFlowInstance]);

  // Hook up autosave for Liveblocks mode
  const { saveStatus } = useCanvasAutosave({
    projectId,
    nodes: nodes ?? [],
    edges: edges ?? [],
    isInitialized,
  });

  React.useEffect(() => {
    onSaveStatusChange(saveStatus);
  }, [saveStatus, onSaveStatusChange]);

  const handlePointerMove = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const flowPos = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      updateMyPresence({ cursor: flowPos });
    },
    [reactFlowInstance, updateMyPresence]
  );

  const handlePointerLeave = React.useCallback(() => {
    updateMyPresence({ cursor: null });
  }, [updateMyPresence]);

  const handleImportTemplate = React.useCallback(
    (template: CanvasTemplate) => {
      // 1. Delete all current nodes and edges
      const currentNodes = nodes || [];
      const currentEdges = edges || [];
      onDelete({ nodes: currentNodes, edges: currentEdges });

      // 2. Add the template's nodes
      const nodeChanges = template.nodes.map((node) => ({
        type: "add" as const,
        item: node,
      }));
      onNodesChange(nodeChanges);

      // 3. Add the template's edges
      const edgeChanges = template.edges.map((edge) => ({
        type: "add" as const,
        item: edge,
      }));
      onEdgesChange(edgeChanges);

      // 4. Fit view
      setTimeout(() => {
        reactFlowInstance.fitView({ duration: 300 });
      }, 50);
    },
    [nodes, edges, onDelete, onNodesChange, onEdgesChange, reactFlowInstance]
  );

  return (
    <CanvasSurface
      nodes={nodes ?? []}
      edges={edges ?? []}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onDelete={onDelete}
      onDragOver={onDragOver}
      onDrop={onDrop}
      isLoading={isLoading}
      undo={undo}
      redo={redo}
      canUndo={canUndo}
      canRedo={canRedo}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <CanvasCursors />
      <Panel position="top-right" className="!mt-4 !mr-4 z-40">
        <AvatarGroup others={others} />
      </Panel>
      <StarterTemplatesModal
        isOpen={isTemplatesOpen}
        onClose={onCloseTemplates}
        onImport={handleImportTemplate}
      />
    </CanvasSurface>
  );
}

