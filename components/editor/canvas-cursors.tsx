"use client";

import React from "react";
import { useOthers } from "@liveblocks/react";
import { useViewport } from "@xyflow/react";

export function CanvasCursors() {
  const others = useOthers();
  const { x: transformX, y: transformY, zoom } = useViewport();

  return (
    <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
      {others.map(({ connectionId, presence, info }) => {
        const cursor = presence?.cursor;
        if (!cursor) return null;

        // Project flow/canvas coordinates to React Flow container coordinates
        const x = cursor.x * zoom + transformX;
        const y = cursor.y * zoom + transformY;

        const color = info?.color || "#00c8d4";
        const name = info?.name || "Collaborator";

        return (
          <div
            key={connectionId}
            className="absolute flex items-start gap-1 pointer-events-none"
            style={{
              transform: `translate3d(${x}px, ${y}px, 0)`,
              transition: "transform 0.08s ease-out",
            }}
          >
            <svg
              className="h-5 w-5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M5.653 2.141A1.724 1.724 0 003 3.659v16.682a1.724 1.724 0 002.653 1.518l12.875-8.341a1.724 1.724 0 000-3.036L5.653 2.141z"
                fill={color}
                stroke="white"
                strokeWidth="1.5"
              />
            </svg>
            <div
              className="px-2 py-0.5 rounded-md text-[10px] font-bold text-bg-base whitespace-nowrap shadow-[0_2px_8px_rgba(0,0,0,0.4)] border border-white/20 select-none flex items-center gap-1.5"
              style={{ backgroundColor: color }}
            >
              {presence?.thinking && (
                <span className="h-2 w-2 border border-current border-t-transparent rounded-full animate-spin shrink-0" />
              )}
              {name}
            </div>
          </div>
        );
      })}
    </div>
  );
}
