import React from "react";
import Link from "next/link";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AccessDenied() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-base text-text-primary px-6">
      <div className="flex flex-col items-center max-w-md w-full text-center space-y-6 p-8 border border-default bg-surface rounded-3xl shadow-xl backdrop-blur-md relative overflow-hidden">
        {/* Top brand glow effect */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-accent-primary/0 via-accent-primary/50 to-accent-primary/0" />
        
        {/* Glowing lock container */}
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-primary-dim text-accent-primary border border-accent-primary/20 shadow-[0_0_15px_rgba(0,200,212,0.1)]">
          <Lock className="h-8 w-8" strokeWidth={1.5} />
        </div>
        
        {/* Context and messaging */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Access Denied</h1>
          <p className="text-text-muted text-sm leading-relaxed">
            You do not have permission to access this project workspace, or this project does not exist.
          </p>
        </div>

        {/* Action button */}
        <Button asChild className="bg-accent-primary text-bg-base hover:bg-accent-primary/90 font-medium rounded-xl px-6 py-2.5 w-full">
          <Link href="/editor">
            Return to Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
