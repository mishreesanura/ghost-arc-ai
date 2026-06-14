import React from "react";
import { History, Share2, FileText } from "lucide-react";

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full bg-base text-text-primary font-sans">
      {/* Left panel: Info/Branding (hidden on small screens) */}
      <div className="hidden md:flex md:w-1/2 flex-col justify-center bg-surface border-r border-default px-12 lg:px-20 relative">
        
        {/* Logo at the top-left */}
        <div className="absolute top-10 left-12 lg:left-20 flex items-center gap-3">
          <div className="h-6 w-6 rounded bg-accent-primary" />
          <span className="text-[17px] font-bold tracking-tight text-text-primary">GhostArc AI</span>
        </div>

        <div className="relative z-10 w-full max-w-md space-y-12">
          {/* Tagline */}
          <div className="space-y-4">
            <h1 className="text-4xl lg:text-[40px] font-bold tracking-tight text-text-primary leading-[1.15]">
              Design systems at the<br />speed of thought.
            </h1>
            <p className="text-text-secondary text-[15px] leading-relaxed max-w-[400px]">
              Describe your architecture in plain English. GhostArc AI maps it to a shared canvas your whole team can refine in real time.
            </p>
          </div>

          {/* Feature List with custom badges */}
          <div className="space-y-7 pt-2">
            <div className="flex gap-4 items-start">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-elevated border border-default text-accent-primary shadow-sm">
                <History className="h-4 w-4" />
              </div>
              <div className="space-y-1 pt-1">
                <h3 className="font-medium text-text-primary text-[15px] leading-none">AI Architecture Generation</h3>
                <p className="text-text-secondary text-[14px] leading-relaxed pt-1">
                  Describe your system, AI maps it to nodes and edges on a live canvas.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-elevated border border-default text-accent-primary shadow-sm">
                <Share2 className="h-4 w-4" />
              </div>
              <div className="space-y-1 pt-1">
                <h3 className="font-medium text-text-primary text-[15px] leading-none">Real-time Collaboration</h3>
                <p className="text-text-secondary text-[14px] leading-relaxed pt-1">
                  Live cursors, presence indicators, and shared node editing across your team.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-elevated border border-default text-accent-primary shadow-sm">
                <FileText className="h-4 w-4" />
              </div>
              <div className="space-y-1 pt-1">
                <h3 className="font-medium text-text-primary text-[15px] leading-none">Instant Spec Generation</h3>
                <p className="text-text-secondary text-[14px] leading-relaxed pt-1">
                  Export a complete Markdown technical spec directly from the canvas graph.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer in the bottom-left */}
        <div className="absolute bottom-10 left-12 lg:left-20 text-[13px] text-text-faint">
          &copy; 2026 GhostArc AI. All rights reserved.
        </div>
      </div>

      {/* Right panel: Centered Clerk form */}
      <div className="flex w-full md:w-1/2 flex-col justify-center items-center p-8 bg-base relative">
        <div className="w-full max-w-md flex justify-center z-10">
          {children}
        </div>
      </div>
    </div>
  );
}
