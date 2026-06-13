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
import { useLiveblocksFlow, Cursors } from "@liveblocks/react-flow";
import { useUndo, useRedo, useCanUndo, useCanRedo } from "@liveblocks/react";
import { CanvasControls } from "./canvas-controls";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

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
        const { shape, width, height } = payload;
        if (!shape) return;

        const position = screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
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
}

const defaultEdgeOptions = {
  type: "canvasEdge",
  style: {
    stroke: "#6b7280",
    strokeWidth: 2,
  },
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: "#6b7280",
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

  return (
    <div style={{ height: "100%", width: "100%", position: "absolute", inset: 0, overflow: "hidden" }} className="bg-base">
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
        fitView
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

import { StarterTemplatesModal } from "./starter-templates-modal";
import { CanvasTemplate } from "./starter-templates";

// ---------- local-only canvas (no Liveblocks) ----------

interface CanvasProps {
  isTemplatesOpen: boolean;
  onCloseTemplates: () => void;
}

export function LocalCanvas({ isTemplatesOpen, onCloseTemplates }: CanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<CanvasNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<CanvasEdge>([]);
  const reactFlowInstance = useReactFlow();
  const { screenToFlowPosition } = reactFlowInstance;
  const { onDragOver, onDrop } = useDragDrop(screenToFlowPosition, onNodesChange);

  useKeyboardShortcuts({ reactFlowInstance });

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
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <StarterTemplatesModal
        isOpen={isTemplatesOpen}
        onClose={onCloseTemplates}
        onImport={handleImportTemplate}
      />
    </CanvasSurface>
  );
}

// ---------- Liveblocks-connected canvas ----------

export function LiveblocksCanvas({ isTemplatesOpen, onCloseTemplates }: CanvasProps) {
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

  const reactFlowInstance = useReactFlow();
  const { screenToFlowPosition } = reactFlowInstance;
  const { onDragOver, onDrop } = useDragDrop(screenToFlowPosition, onNodesChange);

  const undo = useUndo();
  const redo = useRedo();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();

  useKeyboardShortcuts({ reactFlowInstance, undo, redo });

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
    >
      <Cursors />
      <StarterTemplatesModal
        isOpen={isTemplatesOpen}
        onClose={onCloseTemplates}
        onImport={handleImportTemplate}
      />
    </CanvasSurface>
  );
}
