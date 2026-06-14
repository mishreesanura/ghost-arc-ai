"use client";

import React from "react";
import { useReactFlow } from "@xyflow/react";
import { NODE_COLORS } from "@/types/canvas";
import { cn } from "@/lib/utils";

interface NodeColorToolbarProps {
  nodeId: string;
  activeColor: string;
}

export function NodeColorToolbar({ nodeId, activeColor }: NodeColorToolbarProps) {
  const { updateNodeData } = useReactFlow();

  const handleColorSelect = (fillColor: string, e: React.MouseEvent) => {
    e.stopPropagation();
    updateNodeData(nodeId, { color: fillColor });
  };

  return (
    <div
      className="nodrag nopan absolute bottom-[calc(100%+12px)] left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 p-1.5 rounded-xl border border-default bg-elevated/90 backdrop-blur-md shadow-xl select-none"
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {NODE_COLORS.map(({ fill, text, name }) => {
        const isActive = activeColor.toLowerCase() === fill.toLowerCase();
        
        return (
          <Swatch
            key={fill}
            fill={fill}
            text={text}
            name={name}
            isActive={isActive}
            onClick={(e) => handleColorSelect(fill, e)}
          />
        );
      })}
    </div>
  );
}

interface SwatchProps {
  fill: string;
  text: string;
  name: string;
  isActive: boolean;
  onClick: (e: React.MouseEvent) => void;
}

function Swatch({ fill, text, name, isActive, onClick }: SwatchProps) {
  const [isHovered, setIsHovered] = React.useState(false);

  // A tight, controlled glow using the text color
  const glowShadow = isHovered 
    ? `0 0 6px 1px ${text}80` // 50% opacity text color for subtle glow
    : undefined;

  return (
    <button
      type="button"
      title={name}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "relative w-6 h-6 rounded-full transition-all duration-150 ease-out focus:outline-none flex items-center justify-center border",
        isActive 
          ? "scale-110 border-white" 
          : "border-transparent hover:scale-105"
      )}
      style={{
        backgroundColor: fill,
        boxShadow: glowShadow,
      }}
    >
      {isActive && (
        <span 
          className="w-2 h-2 rounded-full" 
          style={{ backgroundColor: text }}
        />
      )}
    </button>
  );
}
