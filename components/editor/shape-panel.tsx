"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  RectangleHorizontal,
  Diamond,
  Circle,
  Pill,
  Database,
  Hexagon,
} from "lucide-react";
import type { NodeShape } from "@/types/canvas";

// ---------- shape definitions ----------

interface ShapeDef {
  id: NodeShape;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  width: number;
  height: number;
}

const SHAPES: readonly ShapeDef[] = [
  { id: "rectangle", label: "Rectangle", icon: RectangleHorizontal, width: 150, height: 80 },
  { id: "diamond", label: "Diamond", icon: Diamond, width: 120, height: 120 },
  { id: "circle", label: "Circle", icon: Circle, width: 80, height: 80 },
  { id: "pill", label: "Pill", icon: Pill, width: 130, height: 60 },
  { id: "cylinder", label: "Cylinder", icon: Database, width: 100, height: 120 },
  { id: "hexagon", label: "Hexagon", icon: Hexagon, width: 140, height: 100 },
] as const;

// ---------- ghost preview shape renderers ----------

function GhostRectangle({ w, h }: { w: number; h: number }) {
  return (
    <div
      style={{ width: w, height: h, borderRadius: "0.75rem" }}
      className="border-2 border-accent-primary/60 bg-accent-primary/10"
    />
  );
}

function GhostPill({ w, h }: { w: number; h: number }) {
  return (
    <div
      style={{ width: w, height: h, borderRadius: "9999px" }}
      className="border-2 border-accent-primary/60 bg-accent-primary/10"
    />
  );
}

function GhostCircle({ w, h }: { w: number; h: number }) {
  return (
    <div
      style={{ width: w, height: h, borderRadius: "50%" }}
      className="border-2 border-accent-primary/60 bg-accent-primary/10"
    />
  );
}

function GhostDiamond({ w, h }: { w: number; h: number }) {
  return (
    <svg width={w} height={h} viewBox="0 0 100 100" preserveAspectRatio="none">
      <polygon
        points="50,2 98,50 50,98 2,50"
        fill="rgba(0,200,212,0.1)"
        stroke="rgba(0,200,212,0.6)"
        strokeWidth="2"
      />
    </svg>
  );
}

function GhostHexagon({ w, h }: { w: number; h: number }) {
  return (
    <svg width={w} height={h} viewBox="0 0 100 100" preserveAspectRatio="none">
      <polygon
        points="25,2 75,2 98,50 75,98 25,98 2,50"
        fill="rgba(0,200,212,0.1)"
        stroke="rgba(0,200,212,0.6)"
        strokeWidth="2"
      />
    </svg>
  );
}

function GhostCylinder({ w, h }: { w: number; h: number }) {
  return (
    <svg width={w} height={h} viewBox="0 0 100 120" preserveAspectRatio="none">
      <path
        d="M 2,18 L 2,102 Q 2,118 50,118 Q 98,118 98,102 L 98,18"
        fill="rgba(0,200,212,0.1)"
        stroke="rgba(0,200,212,0.6)"
        strokeWidth="2"
      />
      <ellipse
        cx="50" cy="18" rx="48" ry="16"
        fill="rgba(0,200,212,0.1)"
        stroke="rgba(0,200,212,0.6)"
        strokeWidth="2"
      />
    </svg>
  );
}

function GhostShape({ shape, w, h }: { shape: NodeShape; w: number; h: number }) {
  switch (shape) {
    case "rectangle":
      return <GhostRectangle w={w} h={h} />;
    case "pill":
      return <GhostPill w={w} h={h} />;
    case "circle":
      return <GhostCircle w={w} h={h} />;
    case "diamond":
      return <GhostDiamond w={w} h={h} />;
    case "hexagon":
      return <GhostHexagon w={w} h={h} />;
    case "cylinder":
      return <GhostCylinder w={w} h={h} />;
    default:
      return <GhostRectangle w={w} h={h} />;
  }
}

// ---------- drag preview overlay (portal) ----------

interface DragPreviewProps {
  shape: NodeShape;
  width: number;
  height: number;
  x: number;
  y: number;
}

function DragPreviewOverlay({ shape, width, height, x, y }: DragPreviewProps) {
  return createPortal(
    <div
      className="fixed pointer-events-none z-[9999]"
      style={{
        left: x - width / 2,
        top: y - height / 2,
        width,
        height,
        opacity: 0.75,
      }}
    >
      <GhostShape shape={shape} w={width} h={height} />
    </div>,
    document.body
  );
}

// ---------- main component ----------

export function ShapePanel() {
  const [dragging, setDragging] = useState<{
    shape: NodeShape;
    width: number;
    height: number;
  } | null>(null);

  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const dragActiveRef = useRef(false);

  // Track mouse position globally while dragging
  useEffect(() => {
    if (!dragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
    };

    const handleDragOver = (e: DragEvent) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("dragover", handleDragOver);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("dragover", handleDragOver);
    };
  }, [dragging]);

  const handleDragStart = useCallback(
    (e: React.DragEvent, shapeDef: ShapeDef) => {
      const payload = {
        shape: shapeDef.id,
        width: shapeDef.width,
        height: shapeDef.height,
      };

      e.dataTransfer.setData("text/plain", JSON.stringify(payload));
      e.dataTransfer.effectAllowed = "move";

      // Hide default browser drag image
      const emptyImg = new Image();
      emptyImg.src =
        "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
      e.dataTransfer.setDragImage(emptyImg, 0, 0);

      setCursorPos({ x: e.clientX, y: e.clientY });
      setDragging({
        shape: shapeDef.id,
        width: shapeDef.width,
        height: shapeDef.height,
      });
      dragActiveRef.current = true;
    },
    []
  );

  const handleDragEnd = useCallback(() => {
    setDragging(null);
    dragActiveRef.current = false;
  }, []);

  return (
    <>
      <div className="bg-elevated/85 backdrop-blur-md border border-default hover:border-accent-primary/30 rounded-full px-5 py-2.5 flex items-center gap-3 shadow-[0_8px_30px_rgba(0,0,0,0.6)] hover:shadow-[0_8px_30px_rgba(0,200,212,0.12)] transition-all duration-500">
        {SHAPES.map((shape) => {
          const IconComponent = shape.icon;
          return (
            <div
              key={shape.id}
              draggable
              onDragStart={(e) => handleDragStart(e, shape)}
              onDragEnd={handleDragEnd}
              className="group relative flex items-center justify-center w-10 h-10 rounded-full text-text-secondary hover:text-accent-primary hover:bg-subtle/80 active:scale-95 transition-all duration-200 cursor-grab active:cursor-grabbing border border-transparent hover:border-border-default shadow-sm"
              aria-label={`Drag ${shape.label} shape`}
            >
              <IconComponent
                className="w-5 h-5 transition-transform duration-200 group-hover:scale-110"
                strokeWidth={1.5}
              />

              {/* Custom Premium Tooltip */}
              <div className="absolute -top-11 left-1/2 -translate-x-1/2 px-2.5 py-1 text-[11px] font-medium text-text-primary bg-elevated border border-default rounded-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap shadow-lg">
                {shape.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Drag ghost preview: rendered via portal so it isn't clipped by React Flow */}
      {dragging && (
        <DragPreviewOverlay
          shape={dragging.shape}
          width={dragging.width}
          height={dragging.height}
          x={cursorPos.x}
          y={cursorPos.y}
        />
      )}
    </>
  );
}
