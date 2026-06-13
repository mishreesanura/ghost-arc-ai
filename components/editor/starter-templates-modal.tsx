"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CanvasTemplate, CANVAS_TEMPLATES } from "./starter-templates";
import { NODE_COLORS } from "@/types/canvas";
import { Download, AlertTriangle, X } from "lucide-react";

interface StarterTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (template: CanvasTemplate) => void;
}

export function StarterTemplatesModal({
  isOpen,
  onClose,
  onImport,
}: StarterTemplatesModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<CanvasTemplate | null>(null);

  const handleConfirmImport = () => {
    if (selectedTemplate) {
      onImport(selectedTemplate);
      setSelectedTemplate(null);
      onClose();
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent
          showCloseButton={false}
          className="bg-surface border border-default text-text-primary rounded-3xl max-w-5xl sm:max-w-5xl max-h-[90vh] flex flex-col p-8 overflow-hidden"
        >
          {/* Custom circular close button matching shadcn/UI dialog overlay */}
          <button
            onClick={onClose}
            className="absolute right-6 top-6 rounded-full border border-default p-1.5 text-text-muted hover:text-text-primary hover:bg-subtle transition-all duration-200"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>

          <DialogHeader className="mb-6 select-none">
            <DialogTitle className="text-2xl font-bold tracking-tight text-text-primary">
              Import Template
            </DialogTitle>
            <DialogDescription className="text-text-secondary text-sm font-normal mt-1 flex items-center gap-1.5 flex-wrap">
              <span>Choose a starter template to pre-populate your canvas. Any existing nodes will be replaced — use</span>
              <kbd className="px-1.5 py-0.5 text-[10px] font-sans font-medium bg-subtle border border-default rounded text-text-primary shadow-[0_1px_1px_rgba(0,0,0,0.2)]">
                ⌘Z
              </kbd>
              <span>to undo.</span>
            </DialogDescription>
          </DialogHeader>

          {/* Grid of template options - exactly 3 columns matching design */}
          <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-1 md:grid-cols-3 gap-6 pb-2">
            {CANVAS_TEMPLATES.map((template) => {
              // Calculate preview bounds for SVG
              const minX = Math.min(...template.nodes.map((n) => n.position.x));
              const minY = Math.min(...template.nodes.map((n) => n.position.y));
              const maxX = Math.max(...template.nodes.map((n) => n.position.x + (n.width || 120)));
              const maxY = Math.max(...template.nodes.map((n) => n.position.y + (n.height || 60)));
              const padding = 35;
              const viewBoxWidth = maxX - minX + padding * 2;
              const viewBoxHeight = maxY - minY + padding * 2;
              const viewBox = `${minX - padding} ${minY - padding} ${viewBoxWidth} ${viewBoxHeight}`;

              return (
                <div
                  key={template.id}
                  className="flex flex-col bg-elevated/50 border border-default hover:border-accent-primary/40 rounded-2xl p-5 transition-all duration-200 cursor-pointer group"
                  onClick={() => setSelectedTemplate(template)}
                >
                  {/* Premium dark preview box (black background) */}
                  <div className="w-full h-48 bg-base border border-subtle rounded-xl mb-4 relative overflow-hidden flex items-center justify-center p-4">
                    <svg
                      viewBox={viewBox}
                      className="w-full h-full max-w-full max-h-full"
                      preserveAspectRatio="xMidYMidMeet"
                    >
                      {/* Draw edges first */}
                      {template.edges.map((edge) => {
                        const sourceNode = template.nodes.find((n) => n.id === edge.source);
                        const targetNode = template.nodes.find((n) => n.id === edge.target);
                        if (!sourceNode || !targetNode) return null;

                        const sW = sourceNode.width || 120;
                        const sH = sourceNode.height || 60;
                        const tW = targetNode.width || 120;
                        const tH = targetNode.height || 60;

                        const sCenter = { x: sourceNode.position.x + sW / 2, y: sourceNode.position.y + sH / 2 };
                        const tCenter = { x: targetNode.position.x + tW / 2, y: targetNode.position.y + tH / 2 };

                        return (
                          <line
                            key={edge.id}
                            x1={sCenter.x}
                            y1={sCenter.y}
                            x2={tCenter.x}
                            y2={tCenter.y}
                            stroke="rgba(255, 255, 255, 0.15)"
                            strokeWidth="1.5"
                          />
                        );
                      })}

                      {/* Draw nodes (no labels matching the design mockup image) */}
                      {template.nodes.map((node) => {
                        const x = node.position.x;
                        const y = node.position.y;
                        const w = node.width || 120;
                        const h = node.height || 60;
                        const fill = node.data.color || "#1F1F1F";
                        const shape = node.data.shape || "rectangle";

                        return (
                          <g key={node.id}>
                            {shape === "circle" && (
                              <circle
                                cx={x + w / 2}
                                cy={y + h / 2}
                                r={Math.min(w, h) / 2}
                                fill={fill}
                                stroke="rgba(255, 255, 255, 0.12)"
                                strokeWidth="1"
                              />
                            )}
                            {shape === "pill" && (
                              <rect
                                x={x}
                                y={y}
                                width={w}
                                height={h}
                                rx="9999"
                                ry="9999"
                                fill={fill}
                                stroke="rgba(255, 255, 255, 0.12)"
                                strokeWidth="1"
                              />
                            )}
                            {shape === "diamond" && (
                              <polygon
                                points={`${x + w / 2},${y} ${x + w},${y + h / 2} ${x + w / 2},${y + h} ${x},${y + h / 2}`}
                                fill={fill}
                                stroke="rgba(255, 255, 255, 0.12)"
                                strokeWidth="1"
                              />
                            )}
                            {shape === "hexagon" && (
                              <polygon
                                points={`${x + w * 0.25},${y} ${x + w * 0.75},${y} ${x + w},${y + h / 2} ${x + w * 0.75},${y + h} ${x + w * 0.25},${y + h} ${x},${y + h / 2}`}
                                fill={fill}
                                stroke="rgba(255, 255, 255, 0.12)"
                                strokeWidth="1"
                              />
                            )}
                            {shape === "cylinder" && (
                              <>
                                <path
                                  d={`M ${x},${y + h * 0.15} L ${x},${y + h * 0.85} Q ${x},${y + h} ${x + w / 2},${y + h} Q ${x + w},${y + h} ${x + w},${y + h * 0.85} L ${x + w},${y + h * 0.15}`}
                                  fill={fill}
                                  stroke="rgba(255, 255, 255, 0.12)"
                                  strokeWidth="1"
                                />
                                <ellipse
                                  cx={x + w / 2}
                                  cy={y + h * 0.85}
                                  rx={w / 2}
                                  ry={h * 0.15}
                                  fill={fill}
                                  stroke="rgba(255, 255, 255, 0.12)"
                                  strokeWidth="1"
                                />
                                <ellipse
                                  cx={x + w / 2}
                                  cy={y + h * 0.15}
                                  rx={w / 2}
                                  ry={h * 0.15}
                                  fill={fill}
                                  stroke="rgba(255, 255, 255, 0.12)"
                                  strokeWidth="1"
                                />
                              </>
                            )}
                            {shape === "rectangle" && (
                              <rect
                                x={x}
                                y={y}
                                width={w}
                                height={h}
                                rx="8"
                                ry="8"
                                fill={fill}
                                stroke="rgba(255, 255, 255, 0.12)"
                                strokeWidth="1"
                              />
                            )}
                          </g>
                        );
                      })}
                    </svg>
                  </div>

                  <div className="flex-1 flex flex-col justify-between select-none">
                    <div>
                      <h4 className="font-semibold text-text-primary text-sm mb-1.5 group-hover:text-accent-primary transition-colors duration-200">
                        {template.name}
                      </h4>
                      <p className="text-xs text-text-muted leading-relaxed mb-5 min-h-[54px]">
                        {template.description}
                      </p>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-default hover:border-accent-primary/40 bg-elevated/50 hover:bg-subtle text-text-primary text-xs font-semibold py-2 rounded-xl flex items-center justify-center gap-2 transition-all duration-200"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTemplate(template);
                      }}
                    >
                      <Download className="h-3.5 w-3.5" />
                      Import
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={selectedTemplate !== null} onOpenChange={(open) => !open && setSelectedTemplate(null)}>
        <DialogContent className="bg-surface border border-default text-text-primary rounded-3xl max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-state-warning mb-1">
              <AlertTriangle className="h-5 w-5" />
              <DialogTitle className="text-lg font-bold">Replace Current Canvas?</DialogTitle>
            </div>
            <DialogDescription className="text-text-secondary text-sm">
              Importing <strong>{selectedTemplate?.name}</strong> will erase all existing nodes and edges on the current canvas. This change is immediate and synchronized for all active collaborators.
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="ghost"
              onClick={() => setSelectedTemplate(null)}
              className="text-text-secondary hover:text-text-primary"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmImport}
              className="bg-accent-primary text-bg-base hover:bg-accent-primary/90 rounded-xl"
            >
              Confirm Import
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
