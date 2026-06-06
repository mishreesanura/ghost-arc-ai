"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Copy, Check, Plus, Trash2, Loader2, Users } from "lucide-react";

interface Collaborator {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  createdAt: string;
}

interface OwnerInfo {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
}

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  isOwner: boolean;
}

export function ShareDialog({
  isOpen,
  onClose,
  projectId,
  projectName,
  isOwner,
}: ShareDialogProps) {
  const [owner, setOwner] = useState<OwnerInfo | null>(null);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchCollaborators = useCallback(async () => {
    setIsLoading(true);
    setListError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/collaborators`);
      if (!res.ok) {
        throw new Error(await res.text());
      }
      const data = await res.json();
      setOwner(data.owner);
      setCollaborators(data.collaborators);
    } catch (err: unknown) {
      setListError("Failed to load collaborators.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchCollaborators();
    }
  }, [isOpen, fetchCollaborators]);

  const handleCopyLink = () => {
    const link = `${window.location.origin}/editor/${projectId}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setIsInviting(true);
    setInviteError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/collaborators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to invite collaborator");
      }

      setInviteEmail("");
      await fetchCollaborators();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred.";
      setInviteError(message);
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemove = async (collaboratorId: string) => {
    try {
      const res = await fetch(
        `/api/projects/${projectId}/collaborators/${collaboratorId}`,
        {
          method: "DELETE",
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to remove collaborator");
      }

      await fetchCollaborators();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to remove collaborator.";
      alert(message);
    }
  };

  const projectUrl = typeof window !== "undefined" ? `${window.location.origin}/editor/${projectId}` : "";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-surface border-default text-text-primary rounded-xl max-w-md w-full">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Share &quot;{projectName}&quot;</DialogTitle>
          <DialogDescription className="text-text-muted text-sm">
            Invite collaborators to design this system together in real-time.
          </DialogDescription>
        </DialogHeader>

        {/* Copy Link Section */}
        <div className="space-y-2 pt-2">
          <label className="text-xs font-semibold text-text-secondary">Project Link</label>
          <div className="flex gap-2">
            <Input
              readOnly
              value={projectUrl}
              className="bg-base border-default text-text-secondary font-mono text-xs focus-visible:ring-accent-primary"
            />
            <Button
              onClick={handleCopyLink}
              variant="outline"
              className="border-default text-text-secondary hover:text-text-primary hover:bg-subtle/50 shrink-0 gap-1.5"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-state-success animate-in fade-in zoom-in duration-200" />
                  <span className="text-xs">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span className="text-xs">Copy</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Owner Only: Invite Form */}
        {isOwner && (
          <form onSubmit={handleInvite} className="space-y-2 pt-4 border-t border-default mt-4">
            <label htmlFor="invite-email" className="text-xs font-semibold text-text-secondary">
              Invite Collaborator
            </label>
            <div className="flex gap-2">
              <Input
                id="invite-email"
                type="email"
                placeholder="collaborator@email.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                disabled={isInviting}
                className="bg-base border-default text-text-primary focus-visible:ring-accent-primary"
              />
              <Button
                type="submit"
                disabled={isInviting || !inviteEmail.trim()}
                className="bg-accent-primary text-bg-base hover:bg-accent-primary/90 shrink-0 gap-1.5"
              >
                {isInviting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                <span className="text-xs">Invite</span>
              </Button>
            </div>
            {inviteError && (
              <p className="text-xs text-state-error font-medium animate-in fade-in slide-in-from-top-1 duration-200">
                {inviteError}
              </p>
            )}
          </form>
        )}

        {/* Collaborators List Section */}
        <div className="space-y-3 pt-4 border-t border-default mt-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary">
            <Users className="h-4 w-4 text-text-muted" />
            <span>People with access</span>
          </div>

          {listError && (
            <p className="text-xs text-state-error font-medium">{listError}</p>
          )}

          <ScrollArea className="max-h-52 w-full pr-1.5">
            <div className="space-y-3 py-1">
              {isLoading ? (
                <div className="flex items-center justify-center py-6 text-text-muted text-xs gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-accent-primary" />
                  <span>Loading members...</span>
                </div>
              ) : (
                <>
                  {/* Owner Row */}
                  {owner && (
                    <div className="flex items-center justify-between py-1 animate-in fade-in duration-200">
                      <div className="flex items-center gap-3">
                        {owner.avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={owner.avatar}
                            alt={owner.name || owner.email}
                            className="h-8 w-8 rounded-full border border-default object-cover shrink-0"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-subtle flex items-center justify-center text-xs font-semibold text-text-secondary capitalize shrink-0 border border-default">
                            {owner.email ? owner.email[0] : "O"}
                          </div>
                        )}
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-text-primary leading-none">
                            {owner.name || owner.email}
                          </span>
                          {owner.name && (
                            <span className="text-[10px] text-text-muted mt-0.5 font-mono">
                              {owner.email}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider bg-subtle/50 px-2 py-0.5 rounded border border-default shrink-0">
                        Owner
                      </span>
                    </div>
                  )}

                  {/* Collaborators Rows */}
                  {collaborators.map((collab) => (
                    <div
                      key={collab.id}
                      className="flex items-center justify-between py-1 animate-in fade-in duration-200"
                    >
                      <div className="flex items-center gap-3">
                        {collab.avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={collab.avatar}
                            alt={collab.name || collab.email}
                            className="h-8 w-8 rounded-full border border-default object-cover shrink-0"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-subtle flex items-center justify-center text-xs font-semibold text-text-secondary capitalize shrink-0 border border-default">
                            {collab.email[0]}
                          </div>
                        )}
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-text-primary leading-none">
                            {collab.name || collab.email}
                          </span>
                          {collab.name && (
                            <span className="text-[10px] text-text-muted mt-0.5 font-mono">
                              {collab.email}
                            </span>
                          )}
                        </div>
                      </div>

                      {isOwner ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemove(collab.id)}
                          className="h-8 w-8 text-text-muted hover:text-state-error hover:bg-state-error/10 rounded-lg shrink-0 transition-colors"
                          title="Remove collaborator"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      ) : (
                        <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider bg-subtle/50 px-2 py-0.5 rounded border border-default shrink-0">
                          Collaborator
                        </span>
                      )}
                    </div>
                  ))}

                  {!owner && collaborators.length === 0 && (
                    <div className="text-center py-6 text-text-muted text-xs">
                      No members with access.
                    </div>
                  )}
                </>
              )}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="mt-2">
          <Button
            type="button"
            onClick={onClose}
            className="w-full bg-accent-primary text-bg-base hover:bg-accent-primary/90 font-semibold text-xs py-2 rounded-xl"
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
