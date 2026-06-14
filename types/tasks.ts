import { z } from "zod";

export const statusMessageSchema = z.object({
  text: z.string().optional(),
});

export type StatusMessage = z.infer<typeof statusMessageSchema>;

export const chatMessageSchema = z.object({
  id: z.string().optional(),
  sender: z.enum(["user", "assistant"]),
  role: z.enum(["user", "assistant"]).optional(),
  content: z.string(),
  timestamp: z.number().optional(),
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;
