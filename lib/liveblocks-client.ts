import { Liveblocks } from "@liveblocks/node";

if (!process.env.LIVEBLOCKS_SECRET_KEY) {
  console.warn("WARNING: LIVEBLOCKS_SECRET_KEY is not defined in environment variables. Falling back to dummy key.");
}

const globalForLiveblocks = globalThis as unknown as {
  liveblocks: Liveblocks | undefined;
};

export const liveblocks =
  globalForLiveblocks.liveblocks ??
  new Liveblocks({
    secret: process.env.LIVEBLOCKS_SECRET_KEY || "sk_test_placeholder_key_for_development",
  });

if (process.env.NODE_ENV !== "production") {
  globalForLiveblocks.liveblocks = liveblocks;
}

const PALETTE = [
  "#00c8d4", // Cyan
  "#6457f9", // AI purple
  "#ff990a", // Orange
  "#ff6166", // Red
  "#f75f8f", // Pink
  "#34d399", // Green
  "#fbbf24", // Yellow
  "#52a8ff", // Blue
];

/**
 * Deterministically maps a user ID to a consistent color from our fixed palette.
 */
export function getUserColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % PALETTE.length;
  return PALETTE[index];
}
