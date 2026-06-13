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
import { ShapePanel } from "./shape-panel";
import { CanvasNode, CanvasEdge } from "@/types/canvas";
import { useLiveblocksFlow, Cursors } from "@liveblocks/react-flow";

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
}

const defaultEdgeOptions = {
  type: "smoothstep",
  style: {
    stroke: "#f8fafc",
    strokeWidth: 1.5,
  },
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: "#f8fafc",
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
}: CanvasSurfaceProps) {
  const nodeTypes = React.useMemo(
    () => ({
      canvasNode: CanvasNodeComponent,
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
        <Panel position="bottom-center" className="!mb-6">
          <ShapePanel />
        </Panel>
      </ReactFlow>
    </div>
  );
}

// ---------- local-only canvas (no Liveblocks) ----------

export function LocalCanvas() {
  const [nodes, , onNodesChange] = useNodesState<CanvasNode>([]);
  const [edges, , onEdgesChange] = useEdgesState<CanvasEdge>([]);
  const { screenToFlowPosition } = useReactFlow();
  const { onDragOver, onDrop } = useDragDrop(screenToFlowPosition, onNodesChange);

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

  return (
    <CanvasSurface
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={handleConnect}
      onDragOver={onDragOver}
      onDrop={onDrop}
    />
  );
}

// ---------- Liveblocks-connected canvas ----------

export function LiveblocksCanvas() {

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

  const { screenToFlowPosition } = useReactFlow();
  const { onDragOver, onDrop } = useDragDrop(screenToFlowPosition, onNodesChange);

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
    >
      <Cursors />
    </CanvasSurface>
  );
}
