# Mission Control Dashboard — Spec

## Overview
A locally-hosted Next.js dashboard for Tenichi to manage and monitor his OpenClaw AI agent system. This is the command center for building a 24/7 autonomous company.

## Tech Stack
- **Framework:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS + shadcn/ui
- **Language:** TypeScript
- **Hosting:** Local (localhost:3000)

## Layout
- Dark theme (professional, clean)
- Left sidebar navigation
- Main content area with responsive grid

## Pages / Sections

### 1. Dashboard (Home) — `/`
Top-level overview with key widgets:

#### Agent Status Card
- Show agent name (Jennie) with status indicator
  - 🟢 **Active** — currently working on a task
  - 🟡 **Standby** — not working, ready for requests / on heartbeat
- Show current model, uptime, last activity timestamp

#### Scheduled Cron Jobs
- Table/list of all cron jobs
- Columns: Name, Schedule (human-readable), Next Run, Last Run, Last Status
- Filterable by frequency: Daily / Weekly / Monthly / All
- Click to expand and see job details/payload

#### Action Required
- List of items needing human attention
- Could be: pairing requests, failed cron jobs, pending approvals
- Each item has a brief description and timestamp
- Visual badge count in sidebar nav

### 2. Activity Feed — `/activity`
- Live feed of agent activity (session runs, tool calls, messages sent/received)
- Time filter buttons: Last 1h | 6h | 12h | 24h
- Each entry shows: timestamp, session type, brief description, status (success/error)
- Auto-refresh or polling

### 3. Memory & History — `/memory`
Three tabs:

#### Daily Memory
- List of `memory/YYYY-MM-DD.md` files from OpenClaw workspace
- Click to expand and read contents
- Most recent first

#### Session History
- List of all sessions with last message preview
- Searchable by keyword
- Shows: session key, last updated, message count, channel

#### Morning Briefs
- List of morning brief cron run results
- Click to expand and see the full brief content
- Shows: date, status, delivery channel

### 4. Files — `/files`
- File tree browser of `~/.openclaw/` directory
- Expandable folders
- Click file to view contents (read-only)
- Show file size and last modified date

## Data Sources
The dashboard reads from the OpenClaw system via:
- **OpenClaw CLI commands** (exec'd server-side via API routes):
  - `openclaw status` — agent status
  - `openclaw logs` — activity feed  
  - `openclaw sessions list` — session history
  - Cron job list from `~/.openclaw/cron/jobs.json`
  - File system reads for memory files and workspace files
- **Direct file reads** for:
  - `~/.openclaw/workspace/memory/*.md`
  - `~/.openclaw/cron/jobs.json`
  - `~/.openclaw/` file tree

## API Routes (Next.js Route Handlers)
- `GET /api/status` — agent status + basic info
- `GET /api/cron` — list cron jobs  
- `GET /api/activity?hours=1` — activity feed with time filter
- `GET /api/sessions?q=search` — session list with search
- `GET /api/memory` — list memory files
- `GET /api/memory/[filename]` — read specific memory file
- `GET /api/briefs` — list morning brief runs
- `GET /api/files?path=` — file tree / file contents
- `GET /api/actions` — items requiring human action

## Design Notes
- Use polling (every 30s) for status updates, not websockets (keep it simple)
- All data is read-only for v1 (no write operations from dashboard)
- Mobile-responsive but desktop-first
- No auth needed (localhost only)
- Error states should be handled gracefully with fallback UI
