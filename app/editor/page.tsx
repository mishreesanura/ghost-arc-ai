"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Terminal, 
  Activity, 
  Layers, 
  Sparkles, 
  Sliders,
  CheckCircle,
  FileText
} from "lucide-react";
import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectSidebar } from "@/components/editor/project-sidebar";

export default function Home() {
  const [openDialog, setOpenDialog] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-base text-primary font-sans antialiased">
      {/* Editor Layout Navigation & Sidebar */}
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
      />
      <ProjectSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />


      {/* Main Grid Area */}
      <main className="flex-1 p-8 md:p-12 max-w-6xl mx-auto w-full space-y-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-text-primary">Ghost AI Design System</h1>
          <p className="text-text-muted text-sm max-w-2xl">
            A premium, dark-only technical workspace visual foundation. All components are mapped directly to design tokens with subtle transitions, high-contrast states, and crisp vector typography.
          </p>
        </div>

        {/* System Tokens Showcase */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-default bg-surface flex flex-col gap-2">
            <span className="text-xs text-text-muted font-mono">--bg-base</span>
            <div className="h-6 w-full rounded bg-base border border-subtle" />
            <span className="text-xs text-text-secondary">#080809</span>
          </div>
          <div className="p-4 rounded-xl border border-default bg-surface flex flex-col gap-2">
            <span className="text-xs text-text-muted font-mono">--bg-surface</span>
            <div className="h-6 w-full rounded bg-surface border border-subtle" />
            <span className="text-xs text-text-secondary">#111114</span>
          </div>
          <div className="p-4 rounded-xl border border-default bg-surface flex flex-col gap-2">
            <span className="text-xs text-text-muted font-mono">--accent-primary</span>
            <div className="h-6 w-full rounded bg-accent-primary" />
            <span className="text-xs text-text-secondary">#00c8d4 (Cyan)</span>
          </div>
          <div className="p-4 rounded-xl border border-default bg-surface flex flex-col gap-2">
            <span className="text-xs text-text-muted font-mono">--accent-ai</span>
            <div className="h-6 w-full rounded bg-accent-ai" />
            <span className="text-xs text-text-secondary">#6457f9 (Indigo)</span>
          </div>
        </section>

        {/* Demo Tabs */}
        <Tabs defaultValue="components" className="w-full">
          <TabsList className="bg-surface border border-default p-1 rounded-xl">
            <TabsTrigger value="components" className="rounded-lg data-[state=active]:bg-bg-subtle data-[state=active]:text-accent-primary">
              <Layers className="h-4 w-4 mr-2" />
              Components
            </TabsTrigger>
            <TabsTrigger value="preview" className="rounded-lg data-[state=active]:bg-bg-subtle data-[state=active]:text-accent-primary">
              <Activity className="h-4 w-4 mr-2" />
              Live Workspace Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="components" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card 1: Buttons & Interactive */}
              <Card className="bg-surface border-default rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-text-primary flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-accent-primary" />
                    Interactive States
                  </CardTitle>
                  <CardDescription className="text-text-muted">
                    Testing standard & custom variant buttons and interactive overlays.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-3">
                    <Button className="bg-accent-primary text-bg-base hover:bg-accent-primary/85">Primary Button</Button>
                    <Button variant="secondary" className="bg-bg-subtle text-text-primary border border-default hover:bg-bg-subtle/80">Secondary</Button>
                    <Button variant="destructive" className="bg-state-error text-text-primary hover:bg-state-error/85">Destructive</Button>
                    <Button variant="ghost" className="text-text-secondary hover:text-text-primary hover:bg-bg-subtle/50">Ghost</Button>
                  </div>
                  <div className="pt-2">
                    <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                      <DialogTrigger asChild>
                        <Button className="w-full bg-accent-ai text-text-primary hover:bg-accent-ai/85 gap-2">
                          <Terminal className="h-4 w-4" />
                          Launch Terminal Dialog
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-surface border border-default rounded-3xl text-text-primary shadow-xl">
                        <DialogHeader>
                          <DialogTitle className="text-text-primary flex items-center gap-2">
                            <Terminal className="h-5 w-5 text-accent-ai" />
                            AI Generation Terminal
                          </DialogTitle>
                          <DialogDescription className="text-text-muted">
                            Initialize a background worker process for design synthesis.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                          <div className="space-y-2">
                            <label htmlFor="prompt-input" className="text-xs font-mono text-text-muted">Prompt Input</label>
                            <Input id="prompt-input" className="bg-bg-base border-default text-text-primary placeholder:text-text-faint focus-visible:ring-accent-primary" placeholder="Define monolithic e-commerce cluster..." />
                          </div>
                          <div className="p-3 bg-bg-base rounded-lg border border-default font-mono text-xs text-accent-ai-text">
                            $ ghost-ai --generate --target canvas_v1
                          </div>
                        </div>
                        <div className="flex justify-end gap-3">
                          <Button variant="outline" className="border-default text-text-secondary" onClick={() => setOpenDialog(false)}>
                            Cancel
                          </Button>
                          <Button className="bg-accent-primary text-bg-base" onClick={() => setOpenDialog(false)}>
                            Execute Job
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>

              {/* Card 2: Inputs and Scrolling */}
              <Card className="bg-surface border-default rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-text-primary flex items-center gap-2">
                    <Sliders className="h-5 w-5 text-accent-primary" />
                    Input & Lists
                  </CardTitle>
                  <CardDescription className="text-text-muted">
                    Text fields, forms, and custom scrollable content layouts.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="endpoint-url" className="sr-only">Service Endpoint URL</label>
                    <Input id="endpoint-url" className="bg-bg-base border-default text-text-primary placeholder:text-text-faint focus-visible:ring-accent-primary" placeholder="Enter service endpoint url..." />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="description-nodes" className="sr-only">Description Nodes</label>
                    <Textarea id="description-nodes" className="bg-bg-base border-default text-text-primary placeholder:text-text-faint focus-visible:ring-accent-primary min-h-[80px]" placeholder="Optional description nodes..." />
                  </div>
                  
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-text-secondary">Recent Operations</span>
                    <ScrollArea className="h-[90px] w-full rounded-xl border border-default bg-bg-base p-3">
                      <div className="space-y-2.5 font-mono text-xs">
                        <div className="flex items-center gap-2 text-state-success">
                          <CheckCircle className="h-3.5 w-3.5" />
                          <span>Prisma Schema Synced Successfully</span>
                        </div>
                        <div className="flex items-center gap-2 text-accent-ai-text">
                          <Activity className="h-3.5 w-3.5" />
                          <span>Generated Microservices Nodes (12 edges)</span>
                        </div>
                        <div className="flex items-center gap-2 text-text-muted">
                          <FileText className="h-3.5 w-3.5" />
                          <span>Vercel Blob Snapshot canvas/3.json saved</span>
                        </div>
                      </div>
                    </ScrollArea>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="mt-6">
            <Card className="bg-surface border-default rounded-2xl overflow-hidden">
              <div className="aspect-video w-full bg-bg-base border-b border-default flex flex-col items-center justify-center p-8 text-center gap-4 relative">
                {/* Background dot pattern indicator */}
                <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
                
                <Layers className="h-12 w-12 text-accent-primary animate-pulse" />
                <div className="space-y-2 z-10">
                  <h3 className="text-lg font-bold text-text-primary">Interactive System Canvas Preview</h3>
                  <p className="text-text-muted text-sm max-w-md">
                    This represents the collaborative grid where design nodes reside. Import starter designs to begin.
                  </p>
                </div>
                <div className="flex gap-3 z-10">
                  <Button size="sm" className="bg-accent-primary text-bg-base hover:bg-accent-primary/85">
                    Import Event-Driven Setup
                  </Button>
                  <Button size="sm" variant="outline" className="border-default text-text-secondary">
                    View Templates
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
