"use client";

import React, { useState, useRef, useEffect } from "react";
import { Sparkles, X, FileText, Download, Send, Bot, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useFeedMessages, useCreateFeedMessage, useOthers } from "@liveblocks/react";
import { chatMessageSchema, statusMessageSchema } from "@/types/tasks";
import { useRealtimeRun } from "@trigger.dev/react-hooks";
import type { designAgentTask } from "@/trigger/design-agent";
import type { generateSpecTask } from "@/trigger/generate-spec";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";

interface Message {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: number;
}

interface AiSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  nodes: any[];
  edges: any[];
}

export function AiSidebar({ isOpen, onClose, roomId, nodes, edges }: AiSidebarProps) {
  const [activeTab, setActiveTab] = useState<string>("architect");
  const [inputValue, setInputValue] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);
  
  const [runId, setRunId] = useState<string | null>(null);
  const [publicToken, setPublicToken] = useState<string | null>(null);

  // Specs Tab States
  const [specs, setSpecs] = useState<any[]>([]);
  const [specsLoading, setSpecsLoading] = useState(false);
  const [selectedSpec, setSelectedSpec] = useState<any | null>(null);
  const [previewContent, setPreviewContent] = useState<string>("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Spec Generation Task States
  const [specRunId, setSpecRunId] = useState<string | null>(null);
  const [specToken, setSpecToken] = useState<string | null>(null);
  const [specStatusMessage, setSpecStatusMessage] = useState<string | null>(null);

  // Local state fallbacks to guarantee instant rendering even if Liveblocks feeds fail
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [localStatusMessage, setLocalStatusMessage] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // 1. Subscribe to the ai-chat feed
  const { messages: rawChatMessages, isLoading: chatLoading, error: chatError } = useFeedMessages("ai-chat");
  const createFeedMessage = useCreateFeedMessage();

  // 2. Subscribe to the ai-status-feed
  const { messages: rawStatusMessages } = useFeedMessages("ai-status-feed");

  // Track active AI thinking state from presence of others
  const others = useOthers();
  const isAiThinking = React.useMemo(() => {
    return others.some(
      (other) => other.presence?.isThinking === true || other.presence?.thinking === true
    );
  }, [others]);

  // Retrieve latest status message from ai-status-feed or local status fallback
  const latestStatusMessage = React.useMemo(() => {
    if (localStatusMessage) return localStatusMessage;
    if (!rawStatusMessages || rawStatusMessages.length === 0) return null;
    const latest = rawStatusMessages[rawStatusMessages.length - 1];
    const parsed = statusMessageSchema.safeParse(latest.data);
    return parsed.success ? parsed.data.text : null;
  }, [rawStatusMessages, localStatusMessage]);

  // Track Trigger.dev run status for design agent
  const { run } = useRealtimeRun<typeof designAgentTask>(
    runId || undefined,
    {
      accessToken: publicToken || undefined,
      enabled: !!runId && !!publicToken,
      onComplete: async (completedRun, err) => {
        console.log("AI run finished:", completedRun, err);
        const statusText = latestStatusMessage || "GhostArc AI successfully completed design generation!";
        const finalContent = (err || completedRun.status === "FAILED")
          ? `GhostArc AI run encountered an error: ${err?.message || (completedRun as any).error?.message || "GhostArc AI run encountered an error."}`
          : statusText;

        // Immediately add final response locally
        const assistantMsg: Message = {
          id: `assistant-local-${Date.now()}`,
          sender: "assistant",
          text: finalContent,
          timestamp: Date.now(),
        };
        setLocalMessages((prev) => [...prev, assistantMsg]);
        setLocalStatusMessage(null);

        // Dispatch custom event to notify local canvas to reload the updated state from database
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("ghostarc-ai-completed", { detail: { roomId } }));
        }

        try {
          await createFeedMessage("ai-chat", {
            sender: "assistant",
            role: "assistant",
            content: finalContent,
            timestamp: Date.now(),
          });
        } catch (feedErr) {
          console.error("Failed to post run result to feed:", feedErr);
        } finally {
          setRunId(null);
          setPublicToken(null);
        }
      },
    }
  );

  // Sync Trigger.dev run status to local status message
  useEffect(() => {
    if (!run) return;
    if (run.status === "QUEUED") {
      setLocalStatusMessage("GhostArc AI task is queued...");
    } else if (run.status === "EXECUTING") {
      setLocalStatusMessage("GhostArc AI is executing the design mutations...");
    } else if (run.status === "COMPLETED") {
      setLocalStatusMessage(null);
      setRunId(null);
      setPublicToken(null);
    } else if (run.status === "FAILED" || run.status === "CRASHED" || run.status === "SYSTEM_FAILURE" || run.status === "CANCELED") {
      setLocalStatusMessage("GhostArc AI run failed.");
      const timer = setTimeout(() => {
        setRunId(null);
        setPublicToken(null);
        setLocalStatusMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [run?.status]);

  // Track Trigger.dev run status for spec generation
  const { run: specRun } = useRealtimeRun<typeof generateSpecTask>(
    specRunId || undefined,
    {
      accessToken: specToken || undefined,
      enabled: !!specRunId && !!specToken,
      onComplete: async (completedRun, err) => {
        console.log("Spec generation run finished:", completedRun, err);
        setSpecRunId(null);
        setSpecToken(null);
        setSpecStatusMessage(null);
        // Refresh specs list
        fetchSpecs();
      },
    }
  );

  // Sync spec run status to local spec status message
  useEffect(() => {
    if (!specRun) return;
    if (specRun.status === "QUEUED") {
      setSpecStatusMessage("Spec generation task is queued...");
    } else if (specRun.status === "EXECUTING") {
      setSpecStatusMessage("GhostArc AI is writing the technical specification...");
    } else if (specRun.status === "COMPLETED") {
      setSpecStatusMessage(null);
      setSpecRunId(null);
      setSpecToken(null);
      fetchSpecs();
    } else if (specRun.status === "FAILED" || specRun.status === "CRASHED" || specRun.status === "SYSTEM_FAILURE" || specRun.status === "CANCELED") {
      setSpecStatusMessage("Spec generation task failed.");
      const timer = setTimeout(() => {
        setSpecRunId(null);
        setSpecToken(null);
        setSpecStatusMessage(null);
        fetchSpecs();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [specRun?.status]);

  // Fetch specs list
  const fetchSpecs = async () => {
    setSpecsLoading(true);
    try {
      const res = await fetch(`/api/projects/${roomId}/specs`);
      if (res.ok) {
        const data = await res.json();
        setSpecs(data);
      }
    } catch (err) {
      console.error("Failed to fetch specs:", err);
    } finally {
      setSpecsLoading(false);
    }
  };

  // Fetch specs on active tab change or project change
  useEffect(() => {
    if (activeTab === "specs") {
      fetchSpecs();
    }
  }, [activeTab, roomId]);

  // Spec generation trigger
  const handleGenerateSpec = async () => {
    if (specRunId || isAiThinking) return;
    setSpecStatusMessage("Initializing specification generator...");
    try {
      const chatHistory = messages.map((m) => ({
        sender: m.sender,
        content: m.text,
        timestamp: m.timestamp,
      }));

      const res = await fetch("/api/ai/spec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId,
          chatHistory,
          nodes,
          edges,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to trigger spec generation");
      }

      const { runId: newRunId } = await res.json();

      const tokenRes = await fetch("/api/ai/spec/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId: newRunId }),
      });

      if (!tokenRes.ok) {
        const errorData = await tokenRes.json();
        throw new Error(errorData.error || "Failed to fetch spec run token");
      }

      const { token: newToken } = await tokenRes.json();
      setSpecRunId(newRunId);
      setSpecToken(newToken);
    } catch (err: any) {
      console.error("Failed to generate spec:", err);
      setSpecStatusMessage(`Error: ${err.message || "Failed to generate spec"}`);
      setTimeout(() => setSpecStatusMessage(null), 5000);
    }
  };

  // Fetch single spec content and open preview modal
  const handlePreviewSpec = async (spec: any) => {
    setSelectedSpec(spec);
    setIsPreviewOpen(true);
    setPreviewLoading(true);
    setPreviewContent("");
    try {
      const res = await fetch(`/api/projects/${roomId}/specs/${spec.id}/download`);
      if (res.ok) {
        const text = await res.text();
        setPreviewContent(text);
      } else {
        setPreviewContent("Failed to load specification content.");
      }
    } catch (err) {
      console.error("Failed to load spec preview:", err);
      setPreviewContent("Error loading specification content.");
    } finally {
      setPreviewLoading(false);
    }
  };

  // Download spec action helper
  const handleDownloadSpec = (e: React.MouseEvent, specId: string) => {
    e.stopPropagation();
    window.location.href = `/api/projects/${roomId}/specs/${specId}/download`;
  };

  // 5. Parse and validate chat messages, merging with local messages safely
  const messages = React.useMemo(() => {
    const feedMsgs: Message[] = [];
    if (rawChatMessages) {
      for (const msg of rawChatMessages) {
        const parsed = chatMessageSchema.safeParse(msg.data);
        if (parsed.success) {
          feedMsgs.push({
            id: msg.id,
            sender: parsed.data.sender,
            text: parsed.data.content,
            timestamp: parsed.data.timestamp || new Date(msg.createdAt).getTime(),
          });
        }
      }
    }

    // Combine feed messages and local messages, deduplicating by text, sender, and time proximity
    const combined = [...feedMsgs];
    for (const local of localMessages) {
      const exists = combined.some(
        (m) =>
          m.text === local.text &&
          m.sender === local.sender &&
          Math.abs(m.timestamp - local.timestamp) < 15000 // within 15 seconds
      );
      if (!exists) {
        combined.push(local);
      }
    }

    return combined.sort((a, b) => a.timestamp - b.timestamp);
  }, [rawChatMessages, localMessages]);

  // Auto-resize Textarea (72px to 160px)
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    const nextHeight = Math.min(Math.max(textarea.scrollHeight, 72), 160);
    textarea.style.height = `${nextHeight}px`;
  }, [inputValue]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]");
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const triggerDesignFlow = async (promptText: string) => {
    setSendError(null);

    // Immediately render user's message locally
    const userMsg: Message = {
      id: `user-local-${Date.now()}`,
      sender: "user",
      text: promptText,
      timestamp: Date.now(),
    };
    setLocalMessages((prev) => [...prev, userMsg]);
    setLocalStatusMessage("Initializing design agent...");

    try {
      // 1. Push user message to the ai-chat feed (non-blocking try-catch)
      try {
        await createFeedMessage("ai-chat", {
          sender: "user",
          role: "user",
          content: promptText,
          timestamp: Date.now(),
        });
      } catch (feedErr) {
        console.warn("Failed to push user message to Liveblocks feed:", feedErr);
      }

      // 2. Call POST /api/ai/design
      const designRes = await fetch("/api/ai/design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: promptText, roomId }),
      });
      if (!designRes.ok) {
        const errorData = await designRes.json();
        throw new Error(errorData.error || "Failed to trigger AI design");
      }
      const { runId: newRunId } = await designRes.json();

      // 3. Fetch public token
      const tokenRes = await fetch("/api/ai/design/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId: newRunId }),
      });
      if (!tokenRes.ok) {
        const errorData = await tokenRes.json();
        throw new Error(errorData.error || "Failed to fetch public token");
      }
      const { token: newPublicToken } = await tokenRes.json();

      // 4. Store in state to activate useRealtimeRun tracking
      setRunId(newRunId);
      setPublicToken(newPublicToken);
    } catch (err: any) {
      console.error("Failed to execute design flow:", err);
      const errMsg = err.message || "Failed to trigger GhostArc AI. Please try again.";

      // Render assistant error locally
      const assistantErrorMsg: Message = {
        id: `assistant-local-error-${Date.now()}`,
        sender: "assistant",
        text: `Failed to trigger GhostArc AI: ${errMsg}`,
        timestamp: Date.now(),
      };
      setLocalMessages((prev) => [...prev, assistantErrorMsg]);
      setLocalStatusMessage(null);

      try {
        await createFeedMessage("ai-chat", {
          sender: "assistant",
          role: "assistant",
          content: `Failed to trigger GhostArc AI: ${errMsg}`,
          timestamp: Date.now(),
        });
      } catch (feedErr) {
        console.error("Failed to post error to feed:", feedErr);
      }
      setSendError(errMsg);
      setTimeout(() => setSendError(null), 5000);
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isAiThinking || runId) return;
    const textToSend = inputValue.trim();
    setInputValue("");
    await triggerDesignFlow(textToSend);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChipClick = async (prompt: string) => {
    if (isAiThinking || runId) return;
    await triggerDesignFlow(prompt);
  };

  return (
    <aside
      className={`fixed top-16 right-0 bottom-0 z-20 flex w-80 flex-col border-l border-border-default bg-surface/95 backdrop-blur-md text-text-primary transition-transform duration-300 ease-in-out shadow-2xl ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      {/* Sidebar Header */}
      <div className="flex h-16 items-center justify-between border-b border-border-default px-6 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-ai/10 text-accent-ai border border-accent-ai/20">
            <Sparkles className="h-4.5 w-4.5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-text-primary leading-tight">AI Workspace</span>
            <span className="text-[10px] text-text-muted">Collaborate with GhostArc AI</span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-text-muted hover:text-text-primary hover:bg-subtle/50 h-8 w-8 rounded-lg transition-colors"
          aria-label="Close AI panel"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabs Container */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex flex-1 flex-col overflow-hidden"
      >
        <div className="px-6 py-3 border-b border-border-default shrink-0">
          <TabsList className="grid grid-cols-2 w-full bg-subtle p-1 rounded-xl">
            <TabsTrigger
              value="architect"
              className="rounded-lg py-1.5 text-xs transition-colors data-[state=active]:bg-accent data-[state=active]:text-accent-foreground text-text-muted"
            >
              AI Architect
            </TabsTrigger>
            <TabsTrigger
              value="specs"
              className="rounded-lg py-1.5 text-xs transition-colors data-[state=active]:bg-accent data-[state=active]:text-accent-foreground text-text-muted"
            >
              Specs
            </TabsTrigger>
          </TabsList>
        </div>

        {/* AI Architect Tab Content */}
        <TabsContent value="architect" className="flex flex-1 flex-col overflow-hidden m-0 p-0">
          {/* Scrollable Chat Area */}
          <ScrollArea ref={scrollAreaRef} className="flex-1 px-6 py-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-8 px-2 space-y-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-ai/10 text-accent-ai border border-accent-ai/20 shadow-[0_0_20px_rgba(100,87,249,0.15)] animate-pulse">
                  <Bot className="h-6 w-6" strokeWidth={1.5} />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-sm font-medium text-text-primary">GhostArc AI Architect</h3>
                  <p className="text-xs text-text-muted leading-relaxed max-w-[220px]">
                    Describe your architecture goals, and let the AI draft system designs or technical specifications.
                  </p>
                </div>

                {/* Starter Prompt Chips */}
                <div className="flex flex-col gap-2 w-full pt-2">
                  {[
                    "Design an e-commerce backend",
                    "Create a chat app architecture",
                    "Build a CI/CD pipeline",
                  ].map((chipText) => (
                    <button
                      key={chipText}
                      onClick={() => handleChipClick(chipText)}
                      disabled={isAiThinking || !!runId}
                      className="w-full text-left bg-subtle hover:bg-subtle/80 text-accent-ai-text border border-border-default px-4 py-2.5 rounded-xl text-xs transition cursor-pointer font-medium hover:border-accent-ai/30 hover:shadow-[0_0_10px_rgba(100,87,249,0.05)] disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {chipText}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3.5 pb-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed border ${
                      msg.sender === "user"
                        ? "self-end text-black border-transparent"
                        : "self-start bg-elevated border-border-default text-accent-ai-text"
                    }`}
                    style={msg.sender === "user" ? { backgroundColor: "#62C073" } : undefined}
                  >
                    <span className="font-sans whitespace-pre-wrap">{msg.text}</span>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* AI Thinking/Status Indicator Panel */}
          {(isAiThinking || !!runId) && (
            <div className="px-6 py-2 bg-elevated border-t border-border-default flex items-center justify-between gap-2.5 shrink-0 animate-pulse">
              <div className="flex items-center gap-2.5 min-w-0">
                <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" style={{ color: "#62C073" }} />
                <span className="text-[11px] font-medium truncate" style={{ color: "#62C073" }}>
                  {latestStatusMessage || "GhostArc AI is analyzing your design..."}
                </span>
              </div>
              <span className="text-[9px] font-mono text-text-muted shrink-0 uppercase tracking-wider">
                Running
              </span>
            </div>
          )}

          {/* Chat Input Section */}
          <div className="p-4 border-t border-border-default bg-surface/50 shrink-0">
            {sendError && (
              <div className="mb-2 text-[10px] text-state-error font-medium text-center">
                {sendError}
              </div>
            )}
            <div className="relative flex items-end gap-2 bg-elevated border border-border-default rounded-xl p-2 focus-within:border-accent-foreground/50 transition-colors">
              <Textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isAiThinking || !!runId ? "Please wait until generation completes..." : "Ask GhostArc AI..."}
                disabled={isAiThinking || !!runId}
                className="flex-1 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-xs text-text-primary placeholder:text-text-faint resize-none p-1 min-h-[72px] max-h-[160px] overflow-y-auto outline-none nodrag nopan disabled:opacity-50"
              />
              <Button
                size="icon"
                onClick={handleSend}
                disabled={!inputValue.trim() || isAiThinking || !!runId}
                className="h-8 w-8 rounded-lg shrink-0 text-black hover:opacity-90 transition-all disabled:opacity-40 disabled:bg-subtle disabled:text-text-muted"
                style={(!inputValue.trim() || isAiThinking || !!runId) ? undefined : { backgroundColor: "#62C073" }}
              >
                {isAiThinking || !!runId ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Specs Tab Content */}
        <TabsContent value="specs" className="flex flex-1 flex-col p-6 space-y-4 overflow-y-auto m-0">
          <Button
            onClick={handleGenerateSpec}
            disabled={!!specRunId || isAiThinking}
            className="w-full py-5 rounded-xl bg-accent text-white hover:bg-accent/80 font-medium text-xs transition-colors shrink-0 shadow-[0_0_15px_rgba(0,200,212,0.1)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {specRunId ? (
              <span className="flex items-center justify-center gap-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Generating...
              </span>
            ) : (
              "Generate Spec"
            )}
          </Button>

          {/* Active Generation Progress Indicator */}
          {specRunId && (
            <div className="flex flex-col items-center justify-center p-4 bg-accent-ai/5 border border-accent-ai/20 rounded-xl space-y-2.5 shrink-0 animate-pulse">
              <Loader2 className="h-4 w-4 animate-spin text-accent-ai" />
              <div className="text-center">
                <p className="text-[11px] font-semibold text-text-primary">Generating Specification...</p>
                <p className="text-[9px] text-text-muted mt-0.5">
                  {specStatusMessage || "GhostArc AI is reviewing and writing..."}
                </p>
              </div>
            </div>
          )}

          <div className="space-y-2.5 flex-1 flex flex-col min-h-0">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-text-muted block shrink-0">Generated Documents</span>

            {specsLoading && !specRunId ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-text-muted flex-1">
                <Loader2 className="h-5 w-5 animate-spin text-accent-ai" />
                <span className="text-xs">Loading specifications...</span>
              </div>
            ) : specs.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-16 px-4 space-y-3 flex-1 border border-dashed border-border-default rounded-2xl">
                <FileText className="h-8 w-8 text-text-faint" />
                <div className="space-y-1">
                  <h5 className="text-xs font-semibold text-text-primary">No Specs Yet</h5>
                  <p className="text-[10px] text-text-muted max-w-[180px] leading-relaxed">
                    Click "Generate Spec" above to create your first technical specification.
                  </p>
                </div>
              </div>
            ) : (
              <ScrollArea className="flex-1 -mx-1 px-1">
                <div className="space-y-2.5 pb-4">
                  {specs.map((spec) => {
                    const cleanFilename = `spec-${roomId.slice(0, 8)}-${spec.id.slice(0, 8)}.md`;
                    return (
                      <div
                        key={spec.id}
                        onClick={() => handlePreviewSpec(spec)}
                        className="flex items-start gap-3.5 p-4 rounded-2xl bg-elevated border border-border-default hover:border-border-subtle transition-all cursor-pointer group"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent-foreground border border-accent/20 group-hover:bg-accent/15 transition-colors">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <h4 className="text-xs font-semibold text-text-primary truncate group-hover:text-accent transition-colors">
                            {cleanFilename}
                          </h4>
                          <p className="text-[10px] text-text-muted leading-normal font-mono">
                            {new Date(spec.createdAt).toLocaleString()}
                          </p>
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[9px] text-text-faint font-mono">v1.0.0 • Generated</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => handleDownloadSpec(e, spec.id)}
                              className="h-7 w-7 rounded-md text-text-muted hover:text-text-primary hover:bg-subtle/50 transition-colors"
                              aria-label="Download spec"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Specification Preview Modal */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col bg-surface border-border-default text-text-primary rounded-2xl overflow-hidden p-6 shadow-2xl">
          <DialogHeader className="flex flex-row items-center justify-between border-b border-border-default pb-4 shrink-0">
            <div className="space-y-1 min-w-0">
              <DialogTitle className="text-sm font-semibold flex items-center gap-2 truncate text-text-primary">
                <FileText className="h-4.5 w-4.5 text-accent shrink-0" />
                {selectedSpec ? `spec-${roomId.slice(0, 8)}-${selectedSpec.id.slice(0, 8)}.md` : "Specification Preview"}
              </DialogTitle>
              <DialogDescription className="text-[10px] text-text-muted">
                Generated on {selectedSpec ? new Date(selectedSpec.createdAt).toLocaleString() : ""}
              </DialogDescription>
            </div>
            {selectedSpec && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => handleDownloadSpec(e, selectedSpec.id)}
                className="h-8 rounded-lg text-xs flex items-center gap-1.5 hover:bg-subtle text-text-primary border-border-default ml-4"
              >
                <Download className="h-3.5 w-3.5" />
                Download MD
              </Button>
            )}
          </DialogHeader>
          
          <ScrollArea className="flex-grow overflow-y-auto mt-4 pr-1">
            {previewLoading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3 text-text-muted">
                <Loader2 className="h-6 w-6 animate-spin text-accent" />
                <span className="text-xs">Fetching specification content...</span>
              </div>
            ) : (
              <div className="p-1">
                <MarkdownRenderer content={previewContent} />
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </aside>
  );
}
