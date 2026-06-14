import { task } from "@trigger.dev/sdk";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { z } from "zod";
import { liveblocks } from "@/lib/liveblocks-client";
import { chatMessageSchema } from "@/types/tasks";
// Prisma client will be loaded dynamically to avoid initialization before env vars are populated in Trigger.dev tasks

import { put } from "@vercel/blob";
import fs from "fs/promises";
import path from "path";

// Ensure the Google SDK API key is set for Vercel AI SDK
if (process.env.GOOGLE_AI_API_KEY && !process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
  process.env.GOOGLE_GENERATIVE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;
}

const generateSpecPayloadSchema = z.object({
  projectId: z.string().min(1),
  roomId: z.string().min(1),
  chatHistory: z.array(chatMessageSchema),
  nodes: z.array(z.any()),
  edges: z.array(z.any()),
});

export const generateSpecTask = task({
  id: "generate-spec",
  run: async (payload: z.infer<typeof generateSpecPayloadSchema>) => {
    const validated = generateSpecPayloadSchema.parse(payload);
    const { roomId, chatHistory, nodes, edges } = validated;

    console.log(`Spec Generation Task started for room: "${roomId}"`);

    // Helper: publish to status feed
    const publishStatus = async (text: string) => {
      try {
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

    try {
      await publishStatus("Ghost AI is reviewing your canvas architecture...");

      // Formulate the prompt for Gemini
      const geminiModel = google("gemini-2.5-flash");

      const systemInstruction = `You are a professional software architect. Your goal is to analyze the provided system architecture diagram (represented by nodes and edges) and the collaborative conversation history, and generate a comprehensive, production-grade technical specification in Markdown format.

Focus on describing:
1. Executive Summary: What system this architecture represents.
2. Component Breakdown: Detailed explanation of each node (its label, shape, role, and technology choice if implied).
3. Data Flow & Connections: Comprehensive pathing through the edges, showing how data moves from clients/triggers down to storage or external systems.
4. Architectural Analysis: Trade-offs, scalability considerations, bottlenecks, and security measures.

Output ONLY clean, valid, standard Markdown. Avoid surrounding it with code blocks unless necessary, but format code snippets or tables where helpful.`;

      const chatHistoryString = chatHistory
        .map((msg) => `${msg.sender.toUpperCase()}: ${msg.content}`)
        .join("\n");

      const nodesString = JSON.stringify(
        nodes.map((n) => ({
          id: n.id,
          label: n.data?.label || n.label,
          shape: n.data?.shape || n.shape,
          color: n.data?.color || n.color,
          position: n.position,
        }))
      );

      const edgesString = JSON.stringify(
        edges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          label: e.data?.label || e.label,
        }))
      );

      await publishStatus("Ghost AI is writing the technical specification...");

      const result = await generateText({
        model: geminiModel,
        system: systemInstruction,
        prompt: `Conversation context:\n${chatHistoryString}\n\nCanvas Architecture:\nNodes:\n${nodesString}\nEdges:\n${edgesString}`,
      });

      await publishStatus("Ghost AI is saving your technical specification...");

      // Create a ProjectSpec record first to get the specId
      const { prisma: prismaClient } = await import("@/lib/prisma");
      const specRecord = await prismaClient.projectSpec.create({
        data: {
          projectId: roomId,
          filePath: "pending",
        },
      });
      const specId = specRecord.id;

      // Upload generated markdown to Vercel Blob
      let filePath = "";
      try {
        const blob = await put(`specs/${roomId}/${specId}.md`, result.text, {
          access: "private",
          addRandomSuffix: false,
          allowOverwrite: true,
          contentType: "text/markdown",
        });
        filePath = blob.url;
      } catch (blobError: any) {
        console.warn("Vercel Blob storage failed for spec; falling back to local storage:", blobError);
        const scratchDir = path.join(process.cwd(), "scratch");
        await fs.mkdir(scratchDir, { recursive: true });
        const localFilePath = path.join(scratchDir, `spec-${specId}.md`);
        await fs.writeFile(localFilePath, result.text, "utf8");
        filePath = `local-file://${specId}`;
      }

      // Update the ProjectSpec with the final filePath
      await prismaClient.projectSpec.update({
        where: { id: specId },
        data: { filePath },
      });

      await publishStatus("Technical specification generated successfully!");

      return {
        specId,
        markdown: result.text,
      };
    } catch (err: any) {
      console.error("Spec Generation Task failed:", err);
      await publishStatus(`Spec Generation failed: ${err.message || err}`);
      throw err;
    }
  },
});
