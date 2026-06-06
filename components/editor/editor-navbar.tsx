"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { PanelLeftOpen, PanelLeftClose } from "lucide-react";
import { SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs";

interface EditorNavbarProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function EditorNavbar({ isSidebarOpen, onToggleSidebar }: EditorNavbarProps) {
  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-default bg-surface px-6">
      {/* Left section: Sidebar toggle + App Branding */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="text-text-secondary hover:text-text-primary hover:bg-subtle/50 h-9 w-9 rounded-lg"
          aria-label={isSidebarOpen ? "Close projects sidebar" : "Open projects sidebar"}
        >
          {isSidebarOpen ? (
            <PanelLeftClose className="h-5 w-5" />
          ) : (
            <PanelLeftOpen className="h-5 w-5" />
          )}
        </Button>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-ai text-text-primary font-bold">
            G
          </div>
          <span className="text-lg font-bold tracking-tight text-text-primary">Ghost AI</span>
        </div>
      </div>

      {/* Center section: Workspace Page Title or Status Placeholder */}
      <div className="flex items-center">
        <span className="text-sm font-medium text-text-secondary">Workspace</span>
      </div>

      {/* Right section: Auth controls */}
      <div className="flex items-center gap-3">
        <Show when="signed-out">
          <SignInButton mode="modal">
            <Button variant="ghost" className="text-text-secondary hover:text-text-primary hover:bg-subtle/50 text-sm font-medium">
              Sign In
            </Button>
          </SignInButton>
          <SignUpButton mode="modal">
            <Button className="bg-accent-primary text-bg-base hover:bg-accent-primary/85 text-sm font-semibold px-4 py-2 rounded-xl">
              Sign Up
            </Button>
          </SignUpButton>
        </Show>
        <Show when="signed-in">
          <UserButton />
        </Show>
      </div>
    </header>
  );
}
