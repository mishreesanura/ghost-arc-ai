import React from "react";
import { Handle, Position, NodeProps, NodeResizer, useReactFlow } from "@xyflow/react";
import { CanvasNode, NodeShape, NODE_COLORS } from "@/types/canvas";

// ---------- SVG shape renderers (scale with node size) ----------

function DiamondSvg({ fill, stroke }: { fill: string; stroke: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="absolute inset-0 w-full h-full"
    >
      <polygon
        points="50,2 98,50 50,98 2,50"
        fill={fill}
        stroke={stroke}
        strokeWidth="1.5"
      />
    </svg>
  );
}

function HexagonSvg({ fill, stroke }: { fill: string; stroke: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="absolute inset-0 w-full h-full"
    >
      <polygon
        points="25,2 75,2 98,50 75,98 25,98 2,50"
        fill={fill}
        stroke={stroke}
        strokeWidth="1.5"
      />
    </svg>
  );
}

function CylinderSvg({ fill, stroke }: { fill: string; stroke: string }) {
  return (
    <svg
      viewBox="0 0 100 120"
      preserveAspectRatio="none"
      className="absolute inset-0 w-full h-full"
    >
      {/* body */}
      <path
        d="M 2,18 L 2,102 Q 2,118 50,118 Q 98,118 98,102 L 98,18"
        fill={fill}
        stroke={stroke}
        strokeWidth="1.5"
      />
      {/* bottom ellipse (visible behind body) */}
      <ellipse
        cx="50"
        cy="102"
        rx="48"
        ry="16"
        fill={fill}
        stroke={stroke}
        strokeWidth="1.5"
      />
      {/* top ellipse */}
      <ellipse
        cx="50"
        cy="18"
        rx="48"
        ry="16"
        fill={fill}
        stroke={stroke}
        strokeWidth="1.5"
      />
    </svg>
  );
}

// ---------- CSS shape wrappers ----------

function CssShapeWrapper({
  shape,
  fill,
  selected,
  children,
}: {
  shape: NodeShape;
  fill: string;
  selected: boolean;
  children: React.ReactNode;
}) {
  const borderColor = selected
    ? "var(--color-accent-primary)"
    : "var(--color-border-default)";
  const shadow = selected
    ? "0 0 12px rgba(0,200,212,0.35)"
    : "none";

  let borderRadius = "0.75rem"; // rectangle
  if (shape === "pill") borderRadius = "9999px";
  if (shape === "circle") borderRadius = "50%";

  return (
    <div
      className="w-full h-full flex items-center justify-center p-3 transition-all duration-200 group relative"
      style={{
        backgroundColor: fill,
        borderRadius,
        border: `1.5px solid ${borderColor}`,
        boxShadow: shadow,
      }}
    >
      {children}
    </div>
  );
}

// ---------- SVG shape wrapper ----------

function SvgShapeWrapper({
  shape,
  fill,
  selected,
  children,
}: {
  shape: NodeShape;
  fill: string;
  selected: boolean;
  children: React.ReactNode;
}) {
  const stroke = selected
    ? "var(--color-accent-primary)"
    : "var(--color-border-default)";
  const shadow = selected
    ? "drop-shadow(0 0 6px rgba(0,200,212,0.35))"
    : "none";

  return (
    <div
      className="w-full h-full relative flex items-center justify-center group"
      style={{ filter: shadow }}
    >
      {shape === "diamond" && <DiamondSvg fill={fill} stroke={stroke} />}
      {shape === "hexagon" && <HexagonSvg fill={fill} stroke={stroke} />}
      {shape === "cylinder" && <CylinderSvg fill={fill} stroke={stroke} />}
      {/* Label sits on top of the SVG */}
      <div className="relative z-10 p-3 flex items-center justify-center w-full h-full">
        {children}
      </div>
    </div>
  );
}

// ---------- Main node component ----------

export function CanvasNodeComponent({ id, data, selected }: NodeProps<CanvasNode>) {
  const label = data.label || "";
  const fillColor = data.color || "#1F1F1F";
  const shape: NodeShape = data.shape || "rectangle";

  const colorPair = NODE_COLORS.find(
    (c) => c.fill.toLowerCase() === fillColor.toLowerCase()
  );
  const textColor = colorPair ? colorPair.text : "#EDEDED";

  const { updateNodeData } = useReactFlow();
  const [isEditing, setIsEditing] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(label);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (!isEditing) {
      setInputValue(label);
    }
  }, [label, isEditing]);

  React.useEffect(() => {
    if (isEditing) {
      textareaRef.current?.focus();
      textareaRef.current?.select();
    }
  }, [isEditing]);

  React.useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputValue, isEditing]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInputValue(val);
    updateNodeData(id, { label: val });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      setIsEditing(false);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const isSvgShape = shape === "diamond" || shape === "hexagon" || shape === "cylinder";

  const contentElement = isEditing ? (
    <textarea
      ref={textareaRef}
      value={inputValue}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      placeholder="Type label..."
      className="nodrag nopan w-full bg-transparent border-none outline-none resize-none overflow-hidden text-center text-sm font-medium placeholder:text-text-muted/30 focus:ring-0 focus:outline-none py-1"
      style={{ color: textColor }}
      rows={1}
    />
  ) : (
    <div
      onDoubleClick={handleDoubleClick}
      className="w-full flex items-center justify-center cursor-text min-h-[1.5rem]"
    >
      <span
        className="text-sm font-medium select-none text-center leading-normal break-words max-w-full"
        style={{ color: textColor }}
      >
        {label || (
          <span className="text-text-muted/40 italic text-xs font-normal">
            Empty Node
          </span>
        )}
      </span>
    </div>
  );

  const handles = (
    <>
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="!w-2 !h-2 !bg-white !border-none opacity-0 group-hover:opacity-100 transition-opacity duration-200"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!w-2 !h-2 !bg-white !border-none opacity-0 group-hover:opacity-100 transition-opacity duration-200"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="!w-2 !h-2 !bg-white !border-none opacity-0 group-hover:opacity-100 transition-opacity duration-200"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!w-2 !h-2 !bg-white !border-none opacity-0 group-hover:opacity-100 transition-opacity duration-200"
      />
    </>
  );

  return (
    <>
      <NodeResizer
        minWidth={60}
        minHeight={40}
        isVisible={!!selected}
        handleClassName="!bg-elevated !border-accent-primary !rounded-sm !w-2 !h-2 !border hover:!scale-125 transition-transform duration-200"
        lineClassName="!border-accent-primary/40"
      />
      {isSvgShape ? (
        <SvgShapeWrapper shape={shape} fill={fillColor} selected={!!selected}>
          {contentElement}
          {handles}
        </SvgShapeWrapper>
      ) : (
        <CssShapeWrapper shape={shape} fill={fillColor} selected={!!selected}>
          {contentElement}
          {handles}
        </CssShapeWrapper>
      )}
    </>
  );
}
