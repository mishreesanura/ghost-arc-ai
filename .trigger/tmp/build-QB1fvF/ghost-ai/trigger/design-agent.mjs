import {
  LiveMap,
  LiveObject,
  external_exports,
  generateText,
  google,
  liveblocks,
  tool
} from "../../chunk-L4KA7G4Z.mjs";
import "../../chunk-GWGHPBEU.mjs";
import {
  task
} from "../../chunk-6FAE34WH.mjs";
import "../../chunk-PFMI3Y4O.mjs";
import {
  __name,
  init_esm
} from "../../chunk-VWGL725N.mjs";

// trigger/design-agent.ts
init_esm();

// node_modules/@liveblocks/react-flow/dist/node.js
init_esm();

// node_modules/@liveblocks/react-flow/dist/lib/shared.js
init_esm();
var DEFAULT_STORAGE_KEY = "flow";
var NODE_BASE_CONFIG = {
  // Local-only (not synced)
  selected: false,
  dragging: false,
  measured: false,
  resizing: false,
  // Atomic (synced as plain Json)
  position: "atomic",
  sourcePosition: "atomic",
  targetPosition: "atomic",
  extent: "atomic",
  origin: "atomic",
  handles: "atomic"
  // Note: the `data` key is intentionally left out of this base config, as it
  // is expected to be provided by the end user
};
var EDGE_BASE_CONFIG = {
  // Local-only (not synced)
  selected: false,
  // Atomic (synced as plain Json)
  markerStart: "atomic",
  markerEnd: "atomic",
  label: "atomic",
  labelBgPadding: "atomic"
  // Note: the `data` key is intentionally left out of this base config, as it
  // is expected to be provided by the end user
};
function buildFlowDataConfigCache(base, data) {
  if (!data) return () => base;
  const dataFallback = data["*"];
  const fallback = dataFallback ? { ...base, data: dataFallback } : base;
  const cache = /* @__PURE__ */ new Map();
  for (const type in data) {
    if (type === "*") continue;
    const specific = data[type];
    if (!specific) continue;
    const dataConfig = { ...dataFallback, ...specific };
    cache.set(type, { ...base, data: dataConfig });
  }
  return (type) => cache.get(type) || fallback;
}
__name(buildFlowDataConfigCache, "buildFlowDataConfigCache");
function buildNodeConfigCache(nodeDataConfig) {
  return buildFlowDataConfigCache(NODE_BASE_CONFIG, nodeDataConfig);
}
__name(buildNodeConfigCache, "buildNodeConfigCache");
function buildEdgeConfigCache(edgeDataConfig) {
  return buildFlowDataConfigCache(EDGE_BASE_CONFIG, edgeDataConfig);
}
__name(buildEdgeConfigCache, "buildEdgeConfigCache");
function toLiveblocksInternalNode(node, config) {
  return LiveObject.from(
    node,
    config
  );
}
__name(toLiveblocksInternalNode, "toLiveblocksInternalNode");
function toLiveblocksInternalEdge(edge, config) {
  return LiveObject.from(
    edge,
    config
  );
}
__name(toLiveblocksInternalEdge, "toLiveblocksInternalEdge");

// node_modules/@liveblocks/react-flow/dist/node.js
async function mutateFlow(options, callback) {
  const { client, roomId } = options;
  const storageKey = options.storageKey ?? DEFAULT_STORAGE_KEY;
  const getNodeSyncConfig = buildNodeConfigCache(options.nodes?.sync);
  const getEdgeSyncConfig = buildEdgeConfigCache(options.edges?.sync);
  const nodeListCache = /* @__PURE__ */ new WeakMap();
  const edgeListCache = /* @__PURE__ */ new WeakMap();
  await client.mutateStorage(roomId, async ({ root }) => {
    let flow = root.get(storageKey);
    if (!flow) {
      const newFlow = new LiveObject({
        nodes: new LiveMap(),
        edges: new LiveMap()
      });
      root.set(storageKey, newFlow);
      flow = newFlow;
    }
    const nodesLiveMap = flow.get("nodes");
    const edgesLiveMap = flow.get("edges");
    function getNodes() {
      const nodeMap = nodesLiveMap.toJSON();
      if (!nodeListCache.has(nodeMap)) {
        nodeListCache.set(nodeMap, Object.values(nodeMap));
      }
      return nodeListCache.get(nodeMap);
    }
    __name(getNodes, "getNodes");
    function getEdges() {
      const edgeMap = edgesLiveMap.toJSON();
      if (!edgeListCache.has(edgeMap)) {
        edgeListCache.set(edgeMap, Object.values(edgeMap));
      }
      return edgeListCache.get(edgeMap);
    }
    __name(getEdges, "getEdges");
    function getNode(id) {
      return nodesLiveMap.get(id)?.toJSON();
    }
    __name(getNode, "getNode");
    function getEdge(id) {
      return edgesLiveMap.get(id)?.toJSON();
    }
    __name(getEdge, "getEdge");
    function upsertNode(id, newNode) {
      const existing = nodesLiveMap.get(id);
      const syncConfig = getNodeSyncConfig(newNode.type);
      if (!existing) {
        nodesLiveMap.set(id, toLiveblocksInternalNode(newNode, syncConfig));
      } else {
        existing.reconcile(newNode, syncConfig);
      }
    }
    __name(upsertNode, "upsertNode");
    function upsertEdge(id, newEdge) {
      const existing = edgesLiveMap.get(id);
      const syncConfig = getEdgeSyncConfig(newEdge.type);
      if (!existing) {
        edgesLiveMap.set(id, toLiveblocksInternalEdge(newEdge, syncConfig));
      } else {
        existing.reconcile(newEdge, syncConfig);
      }
    }
    __name(upsertEdge, "upsertEdge");
    const mutableFlow = {
      get nodes() {
        return getNodes();
      },
      get edges() {
        return getEdges();
      },
      toJSON() {
        return { nodes: getNodes(), edges: getEdges() };
      },
      getNode,
      getEdge,
      addNode(node) {
        upsertNode(node.id, node);
      },
      addNodes(nodes) {
        for (const node of nodes) {
          mutableFlow.addNode(node);
        }
      },
      updateNode(id, partialOrUpdater) {
        const oldNode = getNode(id);
        if (!oldNode) return;
        let newNode;
        if (typeof partialOrUpdater === "function") {
          newNode = partialOrUpdater(oldNode);
        } else {
          newNode = { ...oldNode, ...partialOrUpdater };
        }
        return upsertNode(id, newNode);
      },
      updateNodeData(id, partialOrUpdater) {
        return mutableFlow.updateNode(id, (node) => {
          const currData = node.data ?? {};
          const newData = typeof partialOrUpdater === "function" ? partialOrUpdater(currData) : { ...currData, ...partialOrUpdater };
          return { ...node, data: newData };
        });
      },
      removeNode(id) {
        nodesLiveMap.delete(id);
      },
      removeNodes(ids) {
        for (const id of ids) {
          nodesLiveMap.delete(id);
        }
      },
      addEdge(edge) {
        upsertEdge(edge.id, edge);
      },
      addEdges(edges) {
        for (const edge of edges) {
          mutableFlow.addEdge(edge);
        }
      },
      updateEdge(id, partialOrUpdater) {
        const oldEdge = getEdge(id);
        if (!oldEdge) return;
        let newEdge;
        if (typeof partialOrUpdater === "function") {
          newEdge = partialOrUpdater(oldEdge);
        } else {
          newEdge = { ...oldEdge, ...partialOrUpdater };
        }
        return upsertEdge(id, newEdge);
      },
      updateEdgeData(id, partialOrUpdater) {
        return mutableFlow.updateEdge(id, (edge) => {
          const currData = edge.data;
          const newData = typeof partialOrUpdater === "function" ? partialOrUpdater(currData) : { ...currData, ...partialOrUpdater };
          return { ...edge, data: newData };
        });
      },
      removeEdge(id) {
        edgesLiveMap.delete(id);
      },
      removeEdges(ids) {
        for (const id of ids) {
          edgesLiveMap.delete(id);
        }
      }
    };
    await callback(mutableFlow);
  });
}
__name(mutateFlow, "mutateFlow");

// trigger/design-agent.ts
if (process.env.GOOGLE_AI_API_KEY && !process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
  process.env.GOOGLE_GENERATIVE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;
}
var designAgentTask = task({
  id: "design-agent",
  run: /* @__PURE__ */ __name(async (payload) => {
    const { roomId, prompt } = payload;
    console.log(`Design Agent Task started with prompt: "${prompt}" in room: "${roomId}"`);
    const publishStatus = /* @__PURE__ */ __name(async (text) => {
      try {
        try {
          await liveblocks.createFeed({ roomId, feedId: "ai-status-feed" });
        } catch {
        }
        await liveblocks.createFeedMessage({
          roomId,
          feedId: "ai-status-feed",
          data: { text }
        });
      } catch (err) {
        console.error("Failed to publish status message:", err);
      }
    }, "publishStatus");
    const updatePresence = /* @__PURE__ */ __name(async (isThinking, cursor = null) => {
      try {
        await liveblocks.setPresence(roomId, {
          userId: "ghost-ai",
          data: {
            cursor,
            isThinking,
            thinking: isThinking
          },
          userInfo: {
            name: "Ghost AI",
            avatar: "",
            color: "#6457f9"
          },
          ttl: isThinking ? 60 : 5
        });
      } catch (err) {
        console.error("Failed to update presence:", err);
      }
    }, "updatePresence");
    try {
      await publishStatus("Ghost AI is analyzing your system architecture request...");
      await updatePresence(true, { x: 100, y: 100 });
      let currentNodes = [];
      let currentEdges = [];
      await mutateFlow({ client: liveblocks, roomId }, (flow) => {
        currentNodes = [...flow.nodes];
        currentEdges = [...flow.edges];
      });
      console.log(`Current state: ${currentNodes.length} nodes, ${currentEdges.length} edges.`);
      await publishStatus("Ghost AI is planning the architecture nodes and connections...");
      await updatePresence(true, { x: 200, y: 150 });
      const geminiModel = google("gemini-2.5-flash");
      const systemInstruction = `You are a system architecture generator called Ghost AI.
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
          inputSchema: external_exports.object({
            id: external_exports.string(),
            shape: external_exports.enum(["rectangle", "diamond", "circle", "pill", "cylinder", "hexagon"]),
            label: external_exports.string(),
            color: external_exports.string().optional(),
            x: external_exports.number(),
            y: external_exports.number(),
            width: external_exports.number().optional(),
            height: external_exports.number().optional()
          })
        }),
        moveNode: tool({
          description: "Move an existing node to new coordinates on the canvas.",
          inputSchema: external_exports.object({
            id: external_exports.string(),
            x: external_exports.number(),
            y: external_exports.number()
          })
        }),
        resizeNode: tool({
          description: "Resize an existing node on the canvas.",
          inputSchema: external_exports.object({
            id: external_exports.string(),
            width: external_exports.number(),
            height: external_exports.number()
          })
        }),
        updateNodeData: tool({
          description: "Update labels, shapes, or colors of an existing node.",
          inputSchema: external_exports.object({
            id: external_exports.string(),
            label: external_exports.string().optional(),
            color: external_exports.string().optional(),
            shape: external_exports.enum(["rectangle", "diamond", "circle", "pill", "cylinder", "hexagon"]).optional()
          })
        }),
        deleteNode: tool({
          description: "Remove a node from the canvas.",
          inputSchema: external_exports.object({
            id: external_exports.string()
          })
        }),
        addEdge: tool({
          description: "Add a connection (edge) between two nodes.",
          inputSchema: external_exports.object({
            id: external_exports.string().optional(),
            source: external_exports.string(),
            target: external_exports.string(),
            label: external_exports.string().optional()
          })
        }),
        deleteEdge: tool({
          description: "Remove a connection (edge) from the canvas.",
          inputSchema: external_exports.object({
            id: external_exports.string()
          })
        }),
        finalizeDesign: tool({
          description: "Conclude the design generation and provide a summary description of the layout and architecture changes.",
          inputSchema: external_exports.object({
            summary: external_exports.string()
          })
        })
      };
      const result = await generateText({
        model: geminiModel,
        system: systemInstruction,
        prompt: `User Prompt: "${prompt}"

Current Canvas State:
Nodes:
${JSON.stringify(
          currentNodes.map((n) => ({ id: n.id, label: n.data.label, shape: n.data.shape, color: n.data.color, position: n.position, style: n.style }))
        )}
Edges:
${JSON.stringify(
          currentEdges.map((e) => ({ id: e.id, source: e.source, target: e.target, label: e.data?.label }))
        )}`,
        tools: canvasTools,
        toolChoice: "required"
      });
      const toolCalls = result.steps.flatMap((s) => s.toolCalls);
      console.log(`Generated ${toolCalls.length} tool calls.`);
      await publishStatus("Ghost AI is writing updates to the collaborative canvas...");
      await updatePresence(true, { x: 300, y: 300 });
      const canvasActions = toolCalls.filter((tc) => tc.toolName !== "finalizeDesign");
      const finalizeCall = toolCalls.find((tc) => tc.toolName === "finalizeDesign");
      const summaryText = finalizeCall ? finalizeCall.args?.summary || finalizeCall.input?.summary || "" : "";
      let finalNodes = [];
      let finalEdges = [];
      await mutateFlow({ client: liveblocks, roomId }, (flow) => {
        for (const tc of canvasActions) {
          try {
            const args = tc.args || tc.input;
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
                    color: args.color || "#1F1F1F"
                  }
                });
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
                  style: { width: args.width, height: args.height }
                });
                break;
              }
              case "updateNodeData": {
                flow.updateNodeData(args.id, {
                  ...args.label !== void 0 ? { label: args.label } : {},
                  ...args.color !== void 0 ? { color: args.color } : {},
                  ...args.shape !== void 0 ? { shape: args.shape } : {}
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
                  data: args.label ? { label: args.label } : {}
                });
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
      try {
        const jsonString = JSON.stringify({ nodes: finalNodes, edges: finalEdges });
        let canvasJsonPath = "";
        const { put: blobPut } = await import("../../dist-ARE6JPG3.mjs");
        const fs = await import("fs/promises");
        const path = await import("path");
        try {
          const blob = await blobPut(`canvas/${roomId}.json`, jsonString, {
            access: "private",
            addRandomSuffix: false,
            allowOverwrite: true,
            contentType: "application/json"
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
        const { prisma: prismaClient } = await import("../../prisma-A4WOE3FI.mjs");
        await prismaClient.project.update({
          where: { id: roomId },
          data: { canvasJsonPath }
        });
        console.log(`Saved canvas state in database/blob for project ${roomId}`);
      } catch (saveErr) {
        console.error("Failed to save final canvas state to database from task:", saveErr);
      }
      await publishStatus(summaryText || "Ghost AI successfully completed design generation!");
      await updatePresence(false, null);
      return {
        success: true,
        operationsCount: canvasActions.length
      };
    } catch (err) {
      console.error("Design Agent Task failed:", err);
      await publishStatus(`Ghost AI failed: ${err.message || err}`);
      await updatePresence(false, null);
      throw err;
    }
  }, "run")
});
export {
  designAgentTask
};
//# sourceMappingURL=design-agent.mjs.map
