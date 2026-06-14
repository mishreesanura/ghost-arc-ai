import {
  put
} from "../../chunk-N7H3WBYG.mjs";
import {
  external_exports,
  generateText,
  google,
  liveblocks
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

// trigger/generate-spec.ts
init_esm();

// types/tasks.ts
init_esm();
var statusMessageSchema = external_exports.object({
  text: external_exports.string().optional()
});
var chatMessageSchema = external_exports.object({
  id: external_exports.string().optional(),
  sender: external_exports.enum(["user", "assistant"]),
  role: external_exports.enum(["user", "assistant"]).optional(),
  content: external_exports.string(),
  timestamp: external_exports.number().optional()
});

// trigger/generate-spec.ts
import fs from "fs/promises";
import path from "path";
if (process.env.GOOGLE_AI_API_KEY && !process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
  process.env.GOOGLE_GENERATIVE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;
}
var generateSpecPayloadSchema = external_exports.object({
  projectId: external_exports.string().min(1),
  roomId: external_exports.string().min(1),
  chatHistory: external_exports.array(chatMessageSchema),
  nodes: external_exports.array(external_exports.any()),
  edges: external_exports.array(external_exports.any())
});
var generateSpecTask = task({
  id: "generate-spec",
  run: /* @__PURE__ */ __name(async (payload) => {
    const validated = generateSpecPayloadSchema.parse(payload);
    const { roomId, chatHistory, nodes, edges } = validated;
    console.log(`Spec Generation Task started for room: "${roomId}"`);
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
    try {
      await publishStatus("GhostArc AI is reviewing your canvas architecture...");
      const geminiModel = google("gemini-2.5-flash");
      const systemInstruction = `You are a professional software architect. Your goal is to analyze the provided system architecture diagram (represented by nodes and edges) and the collaborative conversation history, and generate a comprehensive, production-grade technical specification in Markdown format.

Focus on describing:
1. Executive Summary: What system this architecture represents.
2. Component Breakdown: Detailed explanation of each node (its label, shape, role, and technology choice if implied).
3. Data Flow & Connections: Comprehensive pathing through the edges, showing how data moves from clients/triggers down to storage or external systems.
4. Architectural Analysis: Trade-offs, scalability considerations, bottlenecks, and security measures.

Output ONLY clean, valid, standard Markdown. Avoid surrounding it with code blocks unless necessary, but format code snippets or tables where helpful.`;
      const chatHistoryString = chatHistory.map((msg) => `${msg.sender.toUpperCase()}: ${msg.content}`).join("\n");
      const nodesString = JSON.stringify(
        nodes.map((n) => ({
          id: n.id,
          label: n.data?.label || n.label,
          shape: n.data?.shape || n.shape,
          color: n.data?.color || n.color,
          position: n.position
        }))
      );
      const edgesString = JSON.stringify(
        edges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          label: e.data?.label || e.label
        }))
      );
      await publishStatus("GhostArc AI is writing the technical specification...");
      const result = await generateText({
        model: geminiModel,
        system: systemInstruction,
        prompt: `Conversation context:
${chatHistoryString}

Canvas Architecture:
Nodes:
${nodesString}
Edges:
${edgesString}`
      });
      await publishStatus("GhostArc AI is saving your technical specification...");
      const { prisma: prismaClient } = await import("../../prisma-A4WOE3FI.mjs");
      const specRecord = await prismaClient.projectSpec.create({
        data: {
          projectId: roomId,
          filePath: "pending"
        }
      });
      const specId = specRecord.id;
      let filePath = "";
      try {
        const blob = await put(`specs/${roomId}/${specId}.md`, result.text, {
          access: "private",
          addRandomSuffix: false,
          allowOverwrite: true,
          contentType: "text/markdown"
        });
        filePath = blob.url;
      } catch (blobError) {
        console.warn("Vercel Blob storage failed for spec; falling back to local storage:", blobError);
        const scratchDir = path.join(process.cwd(), "scratch");
        await fs.mkdir(scratchDir, { recursive: true });
        const localFilePath = path.join(scratchDir, `spec-${specId}.md`);
        await fs.writeFile(localFilePath, result.text, "utf8");
        filePath = `local-file://${specId}`;
      }
      await prismaClient.projectSpec.update({
        where: { id: specId },
        data: { filePath }
      });
      await publishStatus("Technical specification generated successfully!");
      return {
        specId,
        markdown: result.text
      };
    } catch (err) {
      console.error("Spec Generation Task failed:", err);
      await publishStatus(`Spec Generation failed: ${err.message || err}`);
      throw err;
    }
  }, "run")
});
export {
  generateSpecTask
};
//# sourceMappingURL=generate-spec.mjs.map
