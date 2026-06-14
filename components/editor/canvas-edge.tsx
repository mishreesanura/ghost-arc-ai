"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  getSmoothStepPath,
  EdgeLabelRenderer,
  type EdgeProps,
  useReactFlow,
} from "@xyflow/react";
import { CanvasEdge } from "@/types/canvas";

export function CanvasEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
  data,
  markerEnd,
  style,
}: EdgeProps<CanvasEdge>) {
  const { setEdges } = useReactFlow();
  const [isEditing, setIsEditing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const label = data?.label || "";
  const [inputValue, setInputValue] = useState(label);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync input value with label updates from other users or actions
  useEffect(() => {
    if (!isEditing) {
      setInputValue(label);
    }
  }, [label, isEditing]);

  // Autofocus input when editing starts
  useEffect(() => {
    if (isEditing) {
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [isEditing]);

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
  });

  const saveLabel = (value: string) => {
    setIsEditing(false);
    setEdges((eds) =>
      eds.map((edge) => {
        if (edge.id === id) {
          const data = {
            ...(edge.data ?? {}),
            label: value.trim(),
          };
          return {
            ...edge,
            data,
          };
        }
        return edge;
      })
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      saveLabel(inputValue);
    } else if (e.key === "Escape") {
      setInputValue(label);
      setIsEditing(false);
    }
  };

  const handleBlur = () => {
    saveLabel(inputValue);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const isHighlighted = isHovered || selected || isEditing;
  const strokeColor = isHighlighted ? "var(--color-accent-primary)" : "var(--color-text-muted)";
  const opacity = isHighlighted ? "1" : "0.45";

  return (
    <>
      <g
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onDoubleClick={handleDoubleClick}
      >
        {/* Wider invisible interactive path for easy hovering and clicking */}
        <path
          d={edgePath}
          fill="none"
          stroke="transparent"
          strokeWidth={15}
          className="cursor-pointer"
        />
        {/* Visible connection stroke */}
        <path
          d={edgePath}
          fill="none"
          stroke={strokeColor}
          strokeWidth={2}
          style={{
            opacity,
            transition: "stroke 0.15s, opacity 0.15s",
            strokeLinecap: "round",
            ...style,
          }}
          markerEnd={markerEnd}
        />
      </g>

      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: "all",
            zIndex: 10,
          }}
          className="nodrag nopan"
        >
          {isEditing ? (
            <div className="flex items-center bg-surface border border-accent-primary rounded px-2 py-1 shadow-lg">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
                className="bg-transparent text-xs text-text-primary outline-none border-none p-0 focus:ring-0 focus:outline-none"
                style={{
                  width: `${Math.max(40, inputValue.length * 7.5)}px`,
                  minWidth: "40px",
                }}
              />
            </div>
          ) : label ? (
            <button
              onDoubleClick={handleDoubleClick}
              className="flex items-center justify-center bg-surface border border-default text-text-primary text-[10px] font-medium px-2 py-0.5 rounded-full shadow-sm hover:border-accent-primary transition-colors cursor-pointer select-none"
            >
              {label}
            </button>
          ) : (
            isHighlighted && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center justify-center bg-surface/80 hover:bg-surface border border-dashed border-default text-text-muted/60 text-[9px] px-1.5 py-0.5 rounded shadow-sm hover:border-accent-primary transition-colors cursor-pointer select-none"
              >
                + Label
              </button>
            )
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
