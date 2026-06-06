# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Phase 2: Database Setup, Editor Shell Wiring & Share Dialog Complete

## Current Goal

- All initial routing, workspace layouts, access controls, project management API endpoints, sidebar configurations, and real-time collaborator share controls are complete.

## Completed

- Phase 1: Design System & Foundation UI Components. Configured shadcn/ui with Radix & Nova preset, integrated CSS variables theme tokens, created `lib/utils.ts` helper, and added core components (Button, Card, Dialog, Input, Tabs, Textarea, ScrollArea).
- Phase 1: Implemented base editor chrome components (`EditorNavbar`, `ProjectSidebar`) with integrated layout toggling and overlay/sliding properties.
- Phase 1: Integrated Clerk authentication, configuring `ClerkProvider` with dark theme settings, route protection in `proxy.ts`, custom styled sign-in/sign-up pages, `/` page redirecting to `/editor`, and user profile/logout controls.
- Phase 1: Redesigned the sign-in/sign-up page layout to match the requested 50/50 layout with custom icon-badges, updated tagline/headings, a copyright footer, and a premium glowing blue-cyan gradient background on the left panel. Properly configured Geist Sans and Geist Mono in Tailwind `@theme inline` within `app/globals.css` to fix the typography.
- Phase 1: Built `/editor` home screen empty state, added project management dialogs (Create, Rename, Delete) using mock data, and wired project item actions into the sidebar using `DropdownMenu`.
- Phase 2: Database Setup & Prisma Integration. Created split schema models (`Project` & `ProjectCollaborator`) under `prisma/models/project.prisma`. Configured `prisma.config.ts` to load environment variables from `.env.local` and `.env`. Implemented `lib/prisma.ts` cached client singleton that dynamically branches between Prisma Accelerate (for `prisma+postgres://`) and `@prisma/adapter-pg` (for standard `postgres://` connections). Ran database migrations and generated the type-safe client.
- Phase 2: Project API Routes. Implemented REST endpoints for list/create (`/api/projects`) and rename/delete (`/api/projects/[projectId]`). Secured routes via Clerk (`401 Unauthorized` for unauthenticated requests, `403 Forbidden` for non-owner mutations). Handled Next.js 16 dynamic route segment changes by awaiting `params` promise.
- Phase 2: Editor Home Wiring. Converted the `/editor` homepage to a React Server Component (RSC). Implemented a project data helper (`lib/projects.ts`) to fetch owned and shared projects for a user server-side. Developed the `useProjectActions` hook to coordinate API mutations (create, rename, delete) and align the Project ID with the client-generated Liveblocks room ID. Updated `ProjectSidebar` and `ProjectDialogs` to consume the real database models and navigate/refresh the UI cleanly.
- Phase 2: Refined slug generation (`lib/slug.ts`) to use Unicode property escapes for multi-language compatibility, added an optional ASCII transliteration fallback, updated the Prisma schema generator client provider to `prisma-client-js`, added project ID format and length validation in the POST route handler, and improved error handling/exact path segment matching in `useProjectActions` hooks and project dialogs.
- Phase 2: Editor Workspace Shell. Implemented server-side access validation helpers (`lib/project-access.ts`), visual project highlighting in `ProjectSidebar`, customizable top `WorkspaceNavbar` displaying the active project name, collaborative canvas and AI assistant sidebar layout skeletons (`WorkspaceClient`), and a unified server component entry point for `/editor/[roomId]` routing with fallback `AccessDenied` rendering.
- Phase 2: Project Share Dialog. Created backend API endpoints (`/api/projects/[projectId]/collaborators` and `/api/projects/[projectId]/collaborators/[collaboratorId]`) to support listing, inviting, and removing collaborators. Configured server-side ownership checks. Implemented the frontend `<ShareDialog />` with Clerk user details enrichment (names/avatars), read-only view for collaborators, link copying state, and integrated it into the `WorkspaceClient` navbar action.

## In Progress

- None.

## Next Up

- Phase 2: Starter System Designs / Canvas Integration

## Open Questions

- None.

## Architecture Decisions

- Created a dedicated `useProjectDialogs` hook for managing shared dialog state across the `/editor` layout without prop-drilling or duplicating dialog components.
- Implemented dynamic branching in `lib/prisma.ts` to support both Prisma Accelerate edge acceleration and direct PostgreSQL connections with the Node-postgres driver adapter (`@prisma/adapter-pg` + `pg`), preserving global cached state in non-production environments to avoid database connection exhaustion during development hot-reloads.
- Cast the exported Prisma client singleton to standard `PrismaClient` in `lib/prisma.ts` to resolve TypeScript compilation errors arising from union signature incompatibility between the standard and dynamic Accelerate client return types.

## Session Notes

- Design system setup is complete and verified with a clean Next.js production build.
- Base editor layout header navigation and sidebar overlays are implemented and fully verified with Next.js Turbopack build.
- Database setup, schema mapping, and client singleton are verified, and the first migration applied successfully to the pooled database. Production builds pass without type errors.
- Backend project API endpoints are fully implemented, secured, and compilation/build checks pass successfully.
- Implemented and verified Unicode slugification, Prisma schema generator block provider fix, API route input validation, error notification banners, and exact pathname segment checks.
