# CareerTrack Pro

A premium job search dashboard built with React, TypeScript, and Supabase. Track applications, manage resumes, prepare for interviews, and get AI-powered career insights — all in one place.

## Features

- **Dashboard** — Visual analytics with charts, stats, and activity heatmaps
- **Application Tracker** — 30+ fields per application, 16 status stages, bulk actions, kanban & table views
- **Resume Intelligence** — ATS scoring, keyword analysis, JD matching, AI-powered resume tailoring
- **Resume Versions** — Track multiple resume variants with performance comparison
- **Interview Question Bank** — Practice mode, document upload, difficulty & confidence tracking
- **Learning Roadmap** — Week-by-week study plan with task checklists
- **Timetable** — Weekly schedule planner
- **AI Chatbot** — Context-aware career assistant (OpenAI-powered)
- **Domain Presets** — 8 career domains with pre-configured roadmaps and questions
- **Dark Mode** — Full dark/light theme support

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React 18, TypeScript |
| Build | Vite 5 |
| Styling | Tailwind CSS 3.4, DM Sans + JetBrains Mono |
| State | Zustand |
| Backend | Supabase (Auth, PostgreSQL, RLS) |
| Charts | Recharts |
| Animations | Framer Motion |
| Icons | Lucide React |
| Notifications | Sonner |
| Deployment | Vercel |

## Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9
- A **Supabase** project ([supabase.com](https://supabase.com))

## Quick Start

```bash
# 1. Clone the repository
git clone <repo-url>
cd CareerTracker

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# 4. Set up the database
# Copy the contents of supabase-schema.sql into
# Supabase Dashboard → SQL Editor → New query → Run

# 5. Start development server
npm run dev
```

The app will be available at `http://localhost:5173`.

## Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Get these from your Supabase project: **Settings → API**.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with HMR |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build locally |

## Project Structure

```
CareerTracker/
├── src/
│   ├── components/
│   │   ├── layout/        # Header, sidebar, navigation
│   │   └── ui/            # Reusable UI primitives (Button, Card, Input, Modal, etc.)
│   ├── constants/
│   │   ├── config.ts      # Status colors, categories, sources
│   │   ├── domain-presets.ts  # 8 career domain configurations
│   │   └── seed-data.ts   # Demo data for onboarding
│   ├── features/
│   │   ├── applications/  # Application tracker
│   │   ├── chatbot/       # AI chat assistant
│   │   ├── dashboard/     # Analytics dashboard
│   │   ├── onboarding/    # First-run setup wizard
│   │   ├── profile/       # User profile modal
│   │   ├── questions/     # Interview question bank
│   │   ├── resumes/       # Resume intelligence & versions
│   │   ├── roadmap/       # Learning roadmap
│   │   ├── suggestions/   # AI-powered suggestions
│   │   └── timetable/     # Weekly schedule
│   ├── lib/               # Utilities and analytics helpers
│   ├── store/             # Zustand state management
│   └── types/             # TypeScript type definitions
├── supabase-schema.sql    # Database schema (run in Supabase SQL Editor)
├── tailwind.config.js     # Tailwind theme (indigo brand, zinc grays, custom shadows)
├── vite.config.js         # Vite config with @ path alias
└── vercel.json            # Vercel SPA routing
```

## Database

The app uses 8 Supabase tables with Row Level Security:

- `profiles` — User settings and onboarding state
- `applications` — Job applications with full tracking
- `resume_versions` — Resume variants and metadata
- `job_descriptions` — Parsed job descriptions
- `tailoring_sessions` — AI resume tailoring history
- `ats_score_history` — ATS score tracking over time
- `roadmap` — Weekly learning milestones
- `questions` — Interview questions and practice state

Run `supabase-schema.sql` in your Supabase SQL Editor to create all tables and RLS policies.

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
4. Deploy — the included `vercel.json` handles SPA routing

## License

MIT
