# GhostArc AI

GhostArc AI is a real-time collaborative system design workspace. Users describe a system in plain English, an AI agent maps that system onto a shared canvas, collaborators refine the architecture, and the application generates a technical specification from the resulting graph.

---

## Features

### Authentication and Project Management
* User registration, sign-in, and route protection using Clerk.
* Project creation, ownership controls, and collaborator access control.
* Workspace navigation and dashboard for managing multiple projects.
* Real-time collaborator sharing with user details (names, avatars) enriched via Clerk.

### Collaborative Canvas
* Shared real-time canvas powered by Liveblocks and React Flow.
* Presence indicators showing live cursors, participant avatars, and active thinking indicators.
* Local canvas mode fallback with a 5-second timeout when connection to Liveblocks is interrupted.
* Interactive shape panel to drag and drop nodes (supports Rectangle, Circle, Pill, Diamond, Hexagon, and Cylinder).
* Node customization toolbar to update fill and text colors from an 8-color palette.
* Node resizing with double-click inline label editing and automatic textarea height scaling.
* Custom right-angle smoothstep edges that automatically dim at rest and brighten on hover or selection.
* Double-click inline label editing on edges with a "+ Label" fallback button.

### Starter System Designs
* Curated library of prebuilt system design templates including:
  * Microservices Web App
  * CI/CD Deployment Pipeline
  * Event-Driven System
* SVG-based preview grid modal that automatically scales templates for viewing.
* Instant template import that clears the active canvas and centers the new architecture.

### AI Architecture Generation
* Natural language prompt processing using Google Gemini via the Vercel AI SDK.
* Execution tracked as a durable background task with real-time status feeds.
* AI interacts dynamically in the Liveblocks room by moving its cursor and showing thinking states.
* Interprets prompt instructions to perform incremental graph mutations (add, move, update, resize, or delete).
* Integrated room chat feed that locks controls during active AI operations.

### Specification Generation and Spec Preview
* Automated translation of the canvas graph into a structured Markdown technical specification.
* Background generation tasks preventing request handler timeouts.
* Specifications persisted securely in Vercel Blob with database record mapping.
* Collapsible Spec tab listing generated specifications with interactive previews.
* Secure download API endpoint returning specifications as file attachments.

---

## Tech Stack

* **Framework:** Next.js 16 (App Router) + TypeScript + React 19
* **Styling:** Tailwind CSS v4 + shadcn/ui (Radix UI primitives)
* **Authentication:** Clerk
* **Database:** Prisma ORM + PostgreSQL (dynamic branching between Prisma Accelerate and direct node-postgres pg driver)
* **Real-time Synchronization:** Liveblocks (Presence, storage, and React Flow integration)
* **Durable Background Tasks:** Trigger.dev v4
* **AI Engine:** Vercel AI SDK + Google Gemini (`@ai-sdk/google`)
* **Artifact Storage:** Vercel Blob (snapshots and specifications)

---

## Workspace Layout and Guidelines

* **Theme:** Dark mode only. No light mode is supported. Color tokens are managed in `app/globals.css` and mapped to Tailwind tokens via `@theme inline`. Component styling must reference these CSS variables (e.g., `bg-base`, `bg-surface`, `text-copy-primary`, `border-surface-border`, etc.).
* **Border Radii:** Rounded corners scale based on elevation:
  * Inline elements: `rounded-xl`
  * Cards and panels: `rounded-2xl`
  * Modals and dialogs: `rounded-3xl`
* **Icons:** Lucide React (stroke-based icons only, no filled variants).
* **Storage Invariants:** Relational metadata is stored in PostgreSQL. Large canvas snapshots and Markdown specs are persisted in Vercel Blob; database records only hold URL references.

---

## Setup Instructions

### Prerequisites
* Node.js (v18 or higher recommended)
* PostgreSQL database instance

### 1. Clone the Repository and Install Dependencies
```bash
git clone <repository-url>
cd ghost-ai
npm install
```

### 2. Configure Environment Variables
Create a `.env.local` file in the root of your project and configure the following variables:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Database Connection
DATABASE_URL="postgres://username:password@host:port/database"

# Liveblocks Integration
LIVEBLOCKS_PUBLIC_KEY=your_liveblocks_public_key
LIVEBLOCKS_SECRET_KEY=your_liveblocks_secret_key

# Vercel Blob Storage
BLOB_READ_WRITE_TOKEN="your_vercel_blob_rw_token"

# Trigger.dev Background Tasks
TRIGGER_SECRET_KEY=your_trigger_secret_key
TRIGGER_PROJECT_REF=your_trigger_project_ref

# Google Gemini API Key
GOOGLE_AI_API_KEY=your_gemini_api_key
```

### 3. Initialize the Database
Run the Prisma migrations to set up your PostgreSQL schema and generate the Prisma Client:
```bash
npx prisma migrate dev
```

### 4. Run the Development Server
Start the Next.js local development server:
```bash
npm run dev
```
The application will be accessible at [http://localhost:3000](http://localhost:3000).

### 5. Start the Trigger.dev Worker
Start the Trigger.dev development worker to process background tasks:
```bash
npx trigger.dev@latest dev
```

---

## Keyboard Shortcuts

The workspace canvas listens for global keyboard shortcuts. These shortcuts are ignored when input fields, textareas, or content-editable elements are focused.

### Navigation and Canvas Controls
| Key Shortcut | Action |
| --- | --- |
| `+` or `=` | Zoom in canvas |
| `-` | Zoom out canvas |
| `Cmd` / `Ctrl` + `Z` | Undo last canvas change |
| `Cmd` / `Ctrl` + `Shift` + `Z` | Redo last undone canvas change |
| `Cmd` / `Ctrl` + `Y` | Redo last undone canvas change |
| `Delete` or `Backspace` | Delete currently selected nodes and edges |

### Node and Edge Interaction
| Interaction | Action |
| --- | --- |
| `Double-Click` (Node or Edge) | Enter inline text editing mode |
| `Escape` (During editing) | Cancel text modifications and exit editing mode |
| `Enter` or `Blur` (During editing) | Commit text modifications and exit editing mode |

---

## Project Structure

```
├── app/                  # Next.js App Router pages, layouts, and API routes
│   ├── api/              # Request handlers (auth, project mutations, token generation)
│   ├── editor/           # Editor dashboard and collaborative room layouts
│   └── globals.css       # Core design system configuration and CSS theme variables
├── components/           # UI components
│   ├── editor/           # Collaborative canvas, shape panels, and AI sidebar components
│   └── ui/               # Base shadcn/ui components (buttons, dialogs, inputs)
├── context/              # Architectural specification and product rules documentation
├── hooks/                # Custom React hooks (autosave, keyboard shortcuts, mutations)
├── lib/                  # Shared infrastructure (Prisma, Liveblocks clients, auth helpers)
├── prisma/               # Database schemas and migration profiles
├── trigger/              # Trigger.dev background task definitions and AI agents
├── types/                # Core canvas definitions and TypeScript interfaces
└── trigger.config.ts     # Trigger.dev configuration setup
```
