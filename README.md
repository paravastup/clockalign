# ClockAlign

> Schedule meetings that are fair for everyone 🌍⏰

ClockAlign is a timezone-aware meeting scheduler that optimizes for **fairness**, **cognitive sharpness**, and **meeting necessity**—not just availability.

## Features

- **Sacrifice Score™** - Quantified fairness tracking with visible leaderboard
- **Golden Windows** - Find times when everyone's actually sharp, not just awake
- **Async Nudge** - Smart detection when meetings should be async

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth (Magic Link + Google OAuth)
- **Timezone:** Luxon

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn
- Supabase account

### Setup

1. **Clone and install dependencies:**
   ```bash
   cd app
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` with your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

3. **Run database migrations:**
   
   Copy the contents of `supabase/migrations/00001_initial_schema.sql` 
   and run it in your Supabase SQL editor.

4. **Configure Supabase Auth:**
   
   In Supabase Dashboard → Authentication → Providers:
   - Enable Email (Magic Link)
   - Enable Google OAuth (configure with your Google Cloud credentials)
   
   Set redirect URL: `http://localhost:3000/auth/callback`

5. **Start development server:**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Auth pages (login, signup)
│   ├── (dashboard)/       # Protected dashboard pages
│   ├── api/               # API routes
│   └── auth/callback/     # OAuth callback handler
├── components/
│   └── ui/                # shadcn/ui components
├── lib/
│   ├── auth/              # Auth actions and helpers
│   ├── supabase/          # Supabase client configs
│   ├── timezone.ts        # Timezone utilities (Luxon)
│   └── utils.ts           # General utilities
└── types/
    └── database.ts        # TypeScript database types
```

## Key Concepts

### Sacrifice Score™

Pain points based on local meeting time:
- **Core hours (9 AM - 6 PM):** 0 points
- **Early start (8-9 AM):** 1 point
- **Evening (6-8 PM):** 2 points
- **Early morning (6-8 AM):** 3 points
- **Late evening (8-10 PM):** 4 points
- **Night (10 PM - 12 AM):** 6 points
- **Graveyard (12-6 AM):** 10 points

Multipliers:
- Duration: `pain × (minutes / 30)`
- Recurring: `pain × 1.5`
- Organizer: `pain × 0.8`

### Golden Windows

Sharpness scores (0-100%) based on cognitive energy curves:
- Maximum focus: 10-11 AM (95%)
- Morning peak: 8-9 AM (90%)
- Secondary peak: 4-5 PM (85%)
- Post-lunch dip: 12-1 PM (65%)

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Contributing

See the main ClockAlign PRD for feature requirements and sprint plan.

## License

MIT
