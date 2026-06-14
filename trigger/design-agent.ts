import { task } from "@trigger.dev/sdk";
import { google } from "@ai-sdk/google";
import { generateText, tool } from "ai";
import { z } from "zod";
import { liveblocks } from "@/lib/liveblocks-client";
import { mutateFlow } from "@liveblocks/react-flow/node";
import type { CanvasNode, CanvasEdge } from "@/types/canvas";

export interface DesignAgentPayload {
  prompt: string;
  roomId: string;
}

// Ensure the Google SDK API key is set for Vercel AI SDK
if (process.env.GOOGLE_AI_API_KEY && !process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
  process.env.GOOGLE_GENERATIVE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;
}

export const designAgentTask = task({
  id: "design-agent",
  run: async (payload: DesignAgentPayload) => {
    const { roomId, prompt } = payload;
    console.log(`Design Agent Task started with prompt: "${prompt}" in room: "${roomId}"`);

    // Helper: publish to status feed
    const publishStatus = async (text: string) => {
      try {
        // Ensure feed exists
        try {
          await liveblocks.createFeed({ roomId, feedId: "ai-status-feed" });
        } catch {
          // Already exists or creation failed
        }
        await liveblocks.createFeedMessage({
          roomId,
          feedId: "ai-status-feed",
          data: { text },
        });
      } catch (err) {
        console.error("Failed to publish status message:", err);
      }
    };

    // Helper: update AI presence
    const updatePresence = async (isThinking: boolean, cursor: { x: number; y: number } | null = null) => {
      try {
        await liveblocks.setPresence(roomId, {
          userId: "ghostarc-ai",
          data: {
            cursor,
            isThinking,
            thinking: isThinking,
          },
          userInfo: {
            name: "GhostArc AI",
            avatar: "",
            color: "#6457f9",
          },
          ttl: isThinking ? 60 : 5,
        });
      } catch (err) {
        console.error("Failed to update presence:", err);
      }
    };

    try {
      // 1. Initialize and notify start
      await publishStatus("GhostArc AI is analyzing your system architecture request...");
      await updatePresence(true, { x: 100, y: 100 });

      // 2. Fetch current canvas state
      let currentNodes: CanvasNode[] = [];
      let currentEdges: CanvasEdge[] = [];

      await mutateFlow<CanvasNode, CanvasEdge>({ client: liveblocks, roomId }, (flow) => {
        currentNodes = [...flow.nodes];
        currentEdges = [...flow.edges];
      });

      console.log(`Current state: ${currentNodes.length} nodes, ${currentEdges.length} edges.`);
      await publishStatus("GhostArc AI is planning the architecture nodes and connections...");
      await updatePresence(true, { x: 200, y: 150 });

      // 3. Ask Gemini for operations using tools
      const geminiModel = google("gemini-2.5-flash");
      const systemInstruction = `You are a system architecture generator called GhostArc AI.
Your goal is to parse user design requirements and output structured operations to modify a system design canvas by invoking the appropriate tools.
The canvas is composed of nodes and edges.

### Allowed Node Shapes:
- "rectangle" (general components/services)
- "diamond" (gateways/decisions)
- "circle" (endpoints/events)
- "pill" (processes/services)
- "cylinder" (databases/caches/storages)
- "hexagon" (external boundaries/systems)

### Allowed Node Colors (Fill / Border+Text):
Assign colors logically.
- "#1F1F1F" / "#EDEDED" (Neutral dark / Default)
- "#10233D" / "#52A8FF" (Blue)
- "#2E1938" / "#BF7AF0" (Purple)
- "#331B00" / "#FF990A" (Orange)
- "#3C1618" / "#FF6166" (Red)
- "#3A1726" / "#F75F8F" (Pink)
- "#0F2E18" / "#62C073" (Green)
- "#062822" / "#0AC7B4" (Teal)

### Layout Rules:
- Standard Rectangle/Pill size: 180 width, 80 height.
- Circles: 80 width, 80 height.
- Databases/Cylinders: 120 width, 100 height.
- Diamonds: 100 width, 100 height.
- Place nodes logically to prevent overlaps. Separate nodes by at least 150-250 pixels.
- Lay out from left-to-right (e.g. Clients -> API Gateway -> Microservices -> Databases) or top-to-bottom.
- If existing nodes exist, integrate cleanly with them. Do not place new nodes directly on top of existing ones.

Invoke one or more tools to perform the canvas mutations. When you are done proposing edits, you MUST invoke the finalizeDesign tool to provide a summary description of the layout changes.`;

      const canvasTools = {
        addNode: tool({
          description: "Add a new node to the canvas.",
          inputSchema: z.object({
            id: z.string(),
            shape: z.enum(["rectangle", "diamond", "circle", "pill", "cylinder", "hexagon"]),
            label: z.string(),
            color: z.string().optional(),
            x: z.number(),
            y: z.number(),
            width: z.number().optional(),
            height: z.number().optional(),
          }),
        }),
        moveNode: tool({
          description: "Move an existing node to new coordinates on the canvas.",
          inputSchema: z.object({
            id: z.string(),
            x: z.number(),
            y: z.number(),
          }),
        }),
        resizeNode: tool({
          description: "Resize an existing node on the canvas.",
          inputSchema: z.object({
            id: z.string(),
            width: z.number(),
            height: z.number(),
          }),
        }),
        updateNodeData: tool({
          description: "Update labels, shapes, or colors of an existing node.",
          inputSchema: z.object({
            id: z.string(),
            label: z.string().optional(),
            color: z.string().optional(),
            shape: z.enum(["rectangle", "diamond", "circle", "pill", "cylinder", "hexagon"]).optional(),
          }),
        }),
        deleteNode: tool({
          description: "Remove a node from the canvas.",
          inputSchema: z.object({
            id: z.string(),
          }),
        }),
        addEdge: tool({
          description: "Add a connection (edge) between two nodes.",
          inputSchema: z.object({
            id: z.string().optional(),
            source: z.string(),
            target: z.string(),
            label: z.string().optional(),
          }),
        }),
        deleteEdge: tool({
          description: "Remove a connection (edge) from the canvas.",
          inputSchema: z.object({
            id: z.string(),
          }),
        }),
        finalizeDesign: tool({
          description: "Conclude the design generation and provide a summary description of the layout and architecture changes.",
          inputSchema: z.object({
            summary: z.string(),
          }),
        }),
      };

      const result = await generateText({
        model: geminiModel,
        system: systemInstruction,
        prompt: `User Prompt: "${prompt}"\n\nCurrent Canvas State:\nNodes:\n${JSON.stringify(
          currentNodes.map((n) => ({ id: n.id, label: n.data.label, shape: n.data.shape, color: n.data.color, position: n.position, style: n.style }))
        )}\nEdges:\n${JSON.stringify(
          currentEdges.map((e) => ({ id: e.id, source: e.source, target: e.target, label: e.data?.label }))
        )}`,
        tools: canvasTools,
        toolChoice: "required",
      });

      const toolCalls = result.steps.flatMap((s) => s.toolCalls);
      console.log(`Generated ${toolCalls.length} tool calls.`);

      // 4. Apply operations to storage
      await publishStatus("GhostArc AI is writing updates to the collaborative canvas...");
      await updatePresence(true, { x: 300, y: 300 });

      const canvasActions = toolCalls.filter((tc) => tc.toolName !== "finalizeDesign");
      const finalizeCall = toolCalls.find((tc) => tc.toolName === "finalizeDesign");
      const summaryText = finalizeCall ? ((finalizeCall as any).args?.summary || (finalizeCall as any).input?.summary || "") : "";

      let finalNodes: CanvasNode[] = [];
      let finalEdges: CanvasEdge[] = [];

      await mutateFlow<CanvasNode, CanvasEdge>({ client: liveblocks, roomId }, (flow) => {
        for (const tc of canvasActions) {
          try {
            const args = (tc as any).args || (tc as any).input;
            switch (tc.toolName) {
              case "addNode": {
                const w = args.width || (args.shape === "circle" ? 80 : args.shape === "diamond" ? 100 : 180);
                const h = args.height || (args.shape === "circle" ? 80 : args.shape === "diamond" ? 100 : 80);
                flow.addNode({
                  id: args.id,
                  type: "canvasNode",
                  position: { x: args.x, y: args.y },
                  width: w,
                  height: h,
                  style: { width: w, height: h },
                  data: {
                    label: args.label,
                    shape: args.shape,
                    color: args.color || "#1F1F1F",
                  },
                } as CanvasNode);
                break;
              }
              case "moveNode": {
                flow.updateNode(args.id, { position: { x: args.x, y: args.y } });
                break;
              }
              case "resizeNode": {
                flow.updateNode(args.id, {
                  width: args.width,
                  height: args.height,
                  style: { width: args.width, height: args.height },
                });
                break;
              }
              case "updateNodeData": {
                flow.updateNodeData(args.id, {
                  ...(args.label !== undefined ? { label: args.label } : {}),
                  ...(args.color !== undefined ? { color: args.color } : {}),
                  ...(args.shape !== undefined ? { shape: args.shape } : {}),
                });
                break;
              }
              case "deleteNode": {
                flow.removeNode(args.id);
                break;
              }
              case "addEdge": {
                flow.addEdge({
                  id: args.id || `edge-${Date.now()}-${Math.random()}`,
                  type: "canvasEdge",
                  source: args.source,
                  target: args.target,
                  data: args.label ? { label: args.label } : {},
                } as CanvasEdge);
                break;
              }
              case "deleteEdge": {
                flow.removeEdge(args.id);
                break;
              }
            }
          } catch (opErr) {
            console.error(`Failed to apply tool call: ${JSON.stringify(tc)}`, opErr);
          }
        }

        finalNodes = [...flow.nodes];
        finalEdges = [...flow.edges];
      });

      // Save the generated canvas state to database / Vercel Blob so Local Canvas mode is also updated
      try {
        const jsonString = JSON.stringify({ nodes: finalNodes, edges: finalEdges });
        let canvasJsonPath = "";

        const { put: blobPut } = await import("@vercel/blob");
        const fs = await import("fs/promises");
        const path = await import("path");

        try {
          const blob = await blobPut(`canvas/${roomId}.json`, jsonString, {
            access: "private",
            addRandomSuffix: false,
            allowOverwrite: true,
            contentType: "application/json",
          });
          canvasJsonPath = blob.url;
        } catch (blobError) {
          console.warn("Vercel Blob storage failed in task; using local file fallback:", blobError);
          const scratchDir = path.join(process.cwd(), "scratch");
          await fs.mkdir(scratchDir, { recursive: true });
          const localFilePath = path.join(scratchDir, `canvas-${roomId}.json`);
          await fs.writeFile(localFilePath, jsonString, "utf8");
          canvasJsonPath = `local-file://${roomId}`;
        }

        const { prisma: prismaClient } = await import("@/lib/prisma");
        await prismaClient.project.update({
          where: { id: roomId },
          data: { canvasJsonPath },
        });
        console.log(`Saved canvas state in database/blob for project ${roomId}`);
      } catch (saveErr) {
        console.error("Failed to save final canvas state to database from task:", saveErr);
      }

      // 5. Done
      await publishStatus(summaryText || "GhostArc AI successfully completed design generation!");
      await updatePresence(false, null);

      return {
        success: true,
        operationsCount: canvasActions.length,
      };
    } catch (err: any) {
      console.error("Design Agent Task failed:", err);
      await publishStatus(`GhostArc AI failed: ${err.message || err}`);
      await updatePresence(false, null);
      throw err;
    }
  },
});
