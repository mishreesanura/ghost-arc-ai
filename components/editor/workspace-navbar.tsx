"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { PanelLeftOpen, PanelLeftClose, PanelRightClose, Share2, Sparkles, LayoutTemplate } from "lucide-react";
import { Show, UserButton } from "@clerk/nextjs";

interface WorkspaceNavbarProps {
  projectName: string;
  isLeftSidebarOpen: boolean;
  onToggleLeftSidebar: () => void;
  isRightSidebarOpen: boolean;
  onToggleRightSidebar: () => void;
  onShare?: () => void;
  onOpenTemplates?: () => void;
}

export function WorkspaceNavbar({
  projectName,
  isLeftSidebarOpen,
  onToggleLeftSidebar,
  isRightSidebarOpen,
  onToggleRightSidebar,
  onShare,
  onOpenTemplates,
}: WorkspaceNavbarProps) {
  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-default bg-surface px-6 shrink-0 z-30">
      {/* Left section: Sidebar toggle + App Branding + Project Name */}
      <div className="flex items-center gap-4 overflow-hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleLeftSidebar}
          className="text-text-secondary hover:text-text-primary hover:bg-subtle/50 h-9 w-9 rounded-lg shrink-0"
          aria-label={isLeftSidebarOpen ? "Close projects sidebar" : "Open projects sidebar"}
        >
          {isLeftSidebarOpen ? (
            <PanelLeftClose className="h-5 w-5" />
          ) : (
            <PanelLeftOpen className="h-5 w-5" />
          )}
        </Button>
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-ai text-text-primary font-bold">
            G
          </div>
          <span className="text-sm font-bold tracking-tight text-text-primary hidden sm:inline-block">Ghost AI</span>
        </div>
        <div className="h-4 w-[1px] bg-border-default hidden sm:block shrink-0" />
        <span className="text-sm font-semibold text-text-primary truncate max-w-[150px] sm:max-w-[300px]">
          {projectName}
        </span>
      </div>

      {/* Right section: Templates, Share, AI Sidebar toggle, and User button */}
      <div className="flex items-center gap-3 shrink-0">
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenTemplates}
          className="border-default text-text-secondary hover:text-text-primary hover:bg-subtle/50 h-9 px-3 gap-2 rounded-xl text-xs font-semibold"
        >
          <LayoutTemplate className="h-4 w-4" />
          <span className="hidden xs:inline">Templates</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onShare}
          className="border-default text-text-secondary hover:text-text-primary hover:bg-subtle/50 h-9 px-3 gap-2 rounded-xl text-xs font-semibold"
        >
          <Share2 className="h-4 w-4" />
          <span className="hidden xs:inline">Share</span>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleRightSidebar}
          className={`h-9 w-9 rounded-lg ${
            isRightSidebarOpen
              ? "bg-accent-ai/10 text-accent-ai-text hover:bg-accent-ai/20 hover:text-accent-ai-text"
              : "text-text-secondary hover:text-text-primary hover:bg-subtle/50"
          }`}
          aria-label={isRightSidebarOpen ? "Close AI assistant" : "Open AI assistant"}
        >
          {isRightSidebarOpen ? (
            <PanelRightClose className="h-5 w-5" />
          ) : (
            <Sparkles className="h-5 w-5" />
          )}
        </Button>

        <div className="h-6 w-[1px] bg-border-default" />

        <Show when="signed-in">
          <UserButton />
        </Show>
      </div>
    </header>
  );
}
