# ClockAlign — Agent Development Guide

> **Last Updated:** 2025-01-31  
> **Project Status:** MVP Complete (89% — Day 6 of 6-day sprint)  

---

## Project Overview

**ClockAlign** is a timezone-aware meeting scheduler designed for distributed teams. Unlike traditional schedulers that only find time overlap, ClockAlign optimizes for **fairness** (Sacrifice Score™), **cognitive sharpness** (Golden Windows), and **meeting necessity** (Async Nudge).

### Core Value Propositions

| Feature | Description |
|---------|-------------|
| **Sacrifice Score™** | Quantified "pain index" tracking timezone burden per person. Creates accountability and visibility around scheduling fairness. |
| **Golden Windows** | Energy-aware overlap detection using cognitive sharpness curves. Finds when people are productive, not just awake. |
| **Async Nudge** | Smart prompts to go async when timezone spread makes sync meetings costly. |

### Project Structure

```
clockalign/
├── app/                    # Main Next.js 14 application
├── kimi-frontend/          # Vite-based React landing/demo page
├── tasks/                  # EPIC documentation files
├── PRD.md                  # Product Requirements Document
├── PLAN.md                 # Architecture & development plan
├── TRACKER.md              # Sprint progress tracker
└── SYNTHESIS.md            # Multi-model brainstorm synthesis
```

---

## Technology Stack

### Main Application (`app/`)

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Framework** | Next.js 14 (App Router) | React framework with RSC support |
| **Language** | TypeScript 5.9 | Type safety with strict mode |
| **Styling** | Tailwind CSS 3.4 | Utility-first CSS |
| **UI Components** | shadcn/ui + Radix UI | Accessible, composable components |
| **Database** | Supabase (PostgreSQL) | Database + Auth + RLS |
| **Time Handling** | Luxon | Superior timezone support |
| **Testing** | Vitest | Unit and integration tests |
| **Animations** | Framer Motion | Smooth UI transitions |
| **Icons** | Lucide React | Consistent iconography |

### Landing Page (`kimi-frontend/`)

| Layer | Technology |
|-------|------------|
| **Framework** | React 19 + Vite 7 |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS |
| **UI Components** | shadcn/ui |
| **Animations** | Framer Motion |
| **Charts** | Recharts |

---

## Build and Development Commands

### Main Application (`app/`)

```bash
cd app

# Development
npm run dev              # Start development server (http://localhost:3000)

# Production build
npm run build            # Create production build
npm start                # Start production server

# Testing
npm test                 # Run Vitest in watch mode
npm run test:run         # Run tests once

# Linting
npm run lint             # Run ESLint
```

### Landing Page (`kimi-frontend/`)

```bash
cd kimi-frontend

# Development
npm run dev              # Start Vite dev server

# Production build
npm run build            # Build for production
npm run preview          # Preview production build

# Linting
npm run lint             # Run ESLint
```

---

## Code Organization

### Main Application (`app/`)

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Auth pages (login, callback)
│   │   ├── login/page.tsx
│   │   └── callback/route.ts
│   ├── (dashboard)/        # Protected dashboard routes
│   │   ├── layout.tsx      # Dashboard shell with sidebar
│   │   ├── dashboard/      # Home dashboard
│   │   ├── meetings/       # Meeting CRUD + scheduling
│   │   ├── teams/          # Team management
│   │   ├── fairness/       # Sacrifice leaderboard
│   │   └── settings/       # User preferences
│   ├── api/                # API route handlers
│   │   ├── meetings/       # Meeting CRUD endpoints
│   │   ├── teams/          # Team CRUD endpoints
│   │   ├── golden-windows/ # Optimal time finder
│   │   ├── sacrifice-score/# Score calculations
│   │   └── async-nudge/    # Async suggestions
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Landing page (redirects)
├── components/             # React components
│   ├── ui/                 # shadcn/ui components
│   ├── layout/             # App shell (sidebar, header)
│   ├── sacrifice/          # Leaderboard, score badges
│   ├── golden-windows/     # Heatmap, best times
│   ├── async-nudge/        # Nudge banner, hours reclaimed
│   ├── meetings/           # Meeting form, detail
│   ├── timezone-picker.tsx
│   └── energy-preferences.tsx
├── lib/                    # Utility modules
│   ├── supabase/           # Supabase clients
│   │   ├── client.ts       # Browser client
│   │   ├── server.ts       # Server client
│   │   └── middleware.ts   # Auth middleware
│   ├── sacrifice-score.ts  # Pain calculation algorithm
│   ├── golden-windows.ts   # Overlap detection
│   ├── async-nudge.ts      # Async trigger logic
│   ├── timezone.ts         # Timezone utilities
│   ├── errors.ts           # Error handling
│   ├── a11y.ts             # Accessibility helpers
│   └── sentry.ts           # Error tracking
├── types/                  # TypeScript types
│   └── database.ts         # Supabase generated types
└── hooks/                  # Custom React hooks
```

---

## Key Configuration Files

| File | Purpose |
|------|---------|
| `app/package.json` | Main app dependencies and scripts |
| `app/tsconfig.json` | TypeScript config (strict mode, path aliases) |
| `app/tailwind.config.js` | Tailwind with custom animations |
| `app/vitest.config.ts` | Vitest test configuration |
| `app/next.config.mjs` | Next.js configuration |
| `app/.env.example` | Environment variable template |
| `kimi-frontend/vite.config.ts` | Vite configuration |

---

## Environment Variables

Create `app/.env.local` from `app/.env.example`:

```env
# Required: Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Database Schema

ClockAlign uses **Supabase (PostgreSQL)** with Row Level Security (RLS) enabled.

### Core Tables

| Table | Purpose |
|-------|---------|
| `users` | User profiles, timezones, energy preferences |
| `teams` | Team/organization containers |
| `team_members` | Many-to-many: users ↔ teams |
| `team_invites` | Pending team invitations |
| `meetings` | Scheduled meetings |
| `meeting_participants` | Meeting attendees |
| `meeting_slots` | Proposed/confirmed meeting times |
| `sacrifice_scores` | Pain scores per participant per slot |
| `golden_windows` | Custom energy curves per user |
| `async_nudges` | Meeting-to-async conversions |

### Running Migrations

```bash
npx supabase db push
```

Migrations are in `app/supabase/migrations/`:
- `00001_initial_schema.sql` — Core tables
- `00002_team_invites.sql` — Team invites
- `20250201_sacrifice_scores_triggers.sql` — Score calculation triggers

---

## Testing Strategy

### Test Organization

```
app/__tests__/
├── sacrifice-score.test.ts           # Unit tests for pain algorithm
├── sacrifice-score-integration.test.ts # Integration tests
├── golden-windows.test.ts            # Overlap algorithm tests
├── golden-windows-visual.test.tsx    # Component tests
└── e2e/
    └── flows.test.ts                 # End-to-end flow tests
```

### Running Tests

```bash
# All tests
npm test

# Specific file
npm test -- sacrifice-score.test.ts

# With coverage
npm test -- --coverage
```

### Key Test Areas

1. **Sacrifice Score Algorithm** — Pain weights, multipliers, category detection
2. **Golden Windows** — Overlap detection, energy curves, quality scoring
3. **Async Nudge** — Trigger conditions, pattern matching
4. **Timezone Utilities** — DST handling, UTC conversion

---

## Code Style Guidelines

### TypeScript

- **Strict mode enabled** — No `any` types without justification
- **Path aliases** — Use `@/` for imports from `src/`
- **Explicit return types** on public functions

### Component Patterns

```typescript
// Server Component (default)
export default async function Page() {
  const data = await fetchData();
  return <Component data={data} />;
}

// Client Component (when needed)
'use client';
export default function InteractiveComponent() {
  const [state, setState] = useState();
  // ...
}
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `SacrificeLeaderboard` |
| Functions | camelCase | `calculatePainScore` |
| Constants | SCREAMING_SNAKE | `PAIN_WEIGHTS` |
| Types/Interfaces | PascalCase | `MeetingSlot` |
| Files | kebab-case | `sacrifice-score.ts` |

### Import Order

1. React/Next.js imports
2. Third-party libraries
3. Internal `@/` imports
4. Relative imports
5. CSS imports

---

## Key Algorithms

### Sacrifice Score™ Calculation

```typescript
// Pain categories by local hour
const PAIN_CATEGORIES = {
  golden:      { hours: [10, 11, 14, 15], points: 1 },
  good:        { hours: [9, 16], points: 1.5 },
  acceptable:  { hours: [8, 17], points: 2 },
  early_morning:{ hours: [7], points: 3 },
  evening:     { hours: [18, 19], points: 3 },
  late_evening:{ hours: [20], points: 4 },
  night:       { hours: [21, 22], points: 5 },
  late_night:  { hours: [23], points: 6 },
  graveyard:   { hours: [0, 1, 2, 3, 4, 5, 6], points: 10 }
};

// Multipliers
// - Duration: × (duration_minutes / 30)
// - Recurring: × 1.5
// - Organizer: × 0.8 (discount)
```

### Golden Windows Scoring

Quality score based on:
- Average sharpness across participants
- Minimum sharpness (weakest link)
- Availability ratio
- Evenness of distribution

### Async Nudge Triggers

Triggers when:
- Timezone spread ≥ 5 hours
- Any participant scores 4+ pain points
- Meeting type is async-friendly (standup, update, review)

---

## API Endpoints

All endpoints require Supabase authentication.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/meetings` | GET/POST | List/create meetings |
| `/api/meetings/[id]` | GET/PUT/DELETE | Meeting CRUD |
| `/api/teams` | GET/POST | List/create teams |
| `/api/teams/[id]` | GET/PATCH/DELETE | Team CRUD |
| `/api/teams/[id]/invite` | POST | Create team invite |
| `/api/golden-windows` | GET | Find optimal times |
| `/api/sacrifice-score` | GET | Get scores (user/team/meeting) |
| `/api/sacrifice-score/calculate` | POST | Calculate score for slot |
| `/api/async-nudge/stats` | GET | Hours reclaimed stats |

See `app/docs/API.md` for full documentation.

---

## Common Development Tasks

### Adding a New API Route

1. Create file in `app/src/app/api/[name]/route.ts`
2. Export `GET`, `POST`, etc. handlers
3. Use `createClient()` from `@/lib/supabase/server`
4. Validate with Zod (if needed)
5. Return JSON responses

### Adding a Database Migration

1. Create file in `app/supabase/migrations/`
2. Name format: `YYYYMMDD_description.sql`
3. Run `npx supabase db push`

### Adding a UI Component

1. Use shadcn/ui CLI: `npx shadcn add [component]`
2. Or create manually in `app/src/components/`
3. Follow existing component patterns

---

## Deployment

### Main Application

- **Platform:** Vercel
- **Branch:** `main` auto-deploys
- **Preview:** All PRs get preview URLs

### Environment Setup

1. Connect GitHub repo to Vercel
2. Add environment variables in Vercel dashboard
3. Configure Supabase allow-list for Vercel domains

---

## Troubleshooting

### Build Failures

```bash
# Clear Next.js cache
rm -rf app/.next

# Reinstall dependencies
cd app && rm -rf node_modules && npm install --include=dev

# Type check
npx tsc --noEmit
```

### Module Resolution Issues

- Check `tsconfig.json` paths configuration
- Ensure `@/` alias is used consistently
- Verify Vitest config has matching aliases

### Database Issues

- Verify Supabase connection strings
- Check RLS policies if data not returning
- Run migrations: `npx supabase db push`

---

## Security Considerations

1. **RLS Policies** — All tables have RLS enabled. Verify policies when adding new tables.

2. **Service Role Key** — Only use on server. Never expose in client code.

3. **Input Validation** — Validate all API inputs. Use Zod for complex schemas.

4. **CORS** — Configured in Supabase. Add production domains.

5. **Auth Callbacks** — Always verify state parameter in OAuth callbacks.

---

## Documentation References

| Document | Purpose |
|----------|---------|
| `PRD.md` | Product requirements, user flows, data model |
| `PLAN.md` | Architecture decisions, file structure |
| `TRACKER.md` | Sprint progress, task completion |
| `SYNTHESIS.md` | Multi-model feature brainstorm |
| `app/docs/API.md` | API endpoint reference |
| `app/docs/DATABASE.md` | Database schema documentation |
| `tasks/EPIC-*.md` | Feature implementation specs |

---

## Contributing Checklist

Before submitting changes:

- [ ] Code follows TypeScript strict mode
- [ ] Tests pass: `npm run test:run`
- [ ] Build succeeds: `npm run build`
- [ ] Lint passes: `npm run lint`
- [ ] RLS policies added for new tables
- [ ] API documented in `docs/API.md` (if changed)
- [ ] Database schema documented (if changed)

---

*Built with ❤️ for distributed teams everywhere.*
