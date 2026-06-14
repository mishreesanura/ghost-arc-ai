import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getClerkUserIdentity, checkProjectAccess } from "@/lib/project-access";
import { liveblocks, getUserColor } from "@/lib/liveblocks-client";

export async function POST(request: Request) {
  // 1. Require Clerk authentication
  const { userId, emails } = await getClerkUserIdentity();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Parse the target room (project ID) from the request body
  let body: { room?: string } = {};
  try {
    body = await request.json();
  } catch {
    // Malformed request body
  }

  const room = body.room;
  if (typeof room !== "string") {
    return Response.json({ error: "Room ID (project ID) must be a string" }, { status: 400 });
  }

  const roomId = room.trim();
  const idPattern = /^[A-Za-z0-9-]+$/;
  if (roomId === "" || !idPattern.test(roomId) || roomId.length > 50) {
    return Response.json(
      { error: "Invalid Room ID (project ID). Must contain only letters, numbers, and hyphens, and be up to 50 characters long." },
      { status: 400 }
    );
  }

  // 3. Retrieve project metadata to confirm existence
  const project = await prisma.project.findUnique({
    where: { id: roomId },
  });
  if (!project) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  // 4. Verify user project access (owner or collaborator)
  const hasAccess = await checkProjectAccess(roomId, userId, emails);
  if (!hasAccess) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  // 5. Ensure the Liveblocks room exists (create only if needed)
  // Skip if we are running with a dummy placeholder key in development to prevent API errors
  const isPlaceholderKey =
    !process.env.LIVEBLOCKS_SECRET_KEY ||
    process.env.LIVEBLOCKS_SECRET_KEY.startsWith("sk_test_placeholder");

  if (!isPlaceholderKey) {
    try {
      await liveblocks.getOrCreateRoom(roomId, {
        defaultAccesses: [],
        metadata: {
          name: project.name,
        },
      });
      // Ensure the feeds exist for this room so the client doesn't throw a "Feed not found" error when subscribing.
      try {
        await liveblocks.createFeed({ roomId, feedId: "ai-chat" });
      } catch (err) {
        // Feed may already exist or creation failed
      }
      try {
        await liveblocks.createFeed({ roomId, feedId: "ai-status-feed" });
      } catch (err) {
        // Feed may already exist or creation failed
      }
    } catch (err) {
      console.error(`Failed to ensure Liveblocks room exists for project ${roomId}:`, err);
    }
  }

  // 6. Enrich user details from Clerk for Presence and UserMeta
  const clerkUser = await currentUser();
  const userName =
    [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ") ||
    clerkUser?.username ||
    clerkUser?.emailAddresses?.[0]?.emailAddress ||
    "Guest Collaborator";

  const userAvatar = clerkUser?.imageUrl || "";
  const cursorColor = getUserColor(userId);

  // 7. Prepare the session token and authorize access
  const session = liveblocks.prepareSession(userId, {
    userInfo: {
      name: userName,
      avatar: userAvatar,
      color: cursorColor,
    },
  });

  // Grant full access to this project room
  session.allow(roomId, session.FULL_ACCESS);

  try {
    const { status, body: responseBody } = await session.authorize();
    return new Response(responseBody, {
      status,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (err) {
    console.error("Failed to authorize Liveblocks session:", err);
    return Response.json(
      { error: "Internal Server Error", message: "Failed to authorize Liveblocks session." },
      { status: 500 }
    );
  }
}
