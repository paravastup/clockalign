# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm install --include=dev   # Install dependencies
npm run dev                 # Start dev server (http://localhost:3000)
npm run build               # Production build
npm run lint                # ESLint
npx tsc --noEmit            # Type check
npm test                    # Run Vitest tests
npm test -- --run           # Run tests once (no watch)
npm test -- __tests__/sacrifice-score.test.ts  # Single test file
```

## Deployment

**Always use Vercel CLI to deploy:**

```bash
vercel --prod    # Deploy to production
vercel           # Deploy preview
```

**Do NOT use:**
- `rsync` for deployment
- GitHub Actions CI/CD pipeline
- `git push` alone does NOT deploy - you must use `vercel` CLI

## Architecture Overview

### Next.js 14 App Router Structure

```
src/app/
├── (auth)/        # Unauthenticated pages (login)
├── (dashboard)/   # Protected pages (requires auth)
│   ├── dashboard/ # Home dashboard
│   ├── meetings/  # Meeting CRUD
│   ├── teams/     # Team management
│   ├── fairness/  # Sacrifice leaderboard
│   └── settings/  # User preferences
├── api/           # API routes
├── finder/        # Public "Fair Time Finder" tool (no auth required)
└── auth/callback/ # OAuth callback handler
```

### Core Domain Algorithms (src/lib/)

**Sacrifice Score** (`sacrifice-score.ts`):
- Pain weight algorithm: maps hour (0-23) to sacrifice points (1-10 pts)
- Golden hours (10am-4pm) = 1pt, graveyard (11pm-7am) = 10pts
- Multipliers: duration (per 30min), recurring (×1.5), organizer (×0.8)
- Leaderboard calculation with fairness index using coefficient of variation

**Golden Windows** (`golden-windows.ts`):
- Energy curves: per-hour sharpness values (0-1) based on chronotype
- Overlap detection: finds UTC hours where all participants are available
- Quality score formula: 40% avg sharpness + 30% min sharpness + 20% availability + 10% evenness
- Supports chronotypes: early_bird, normal, night_owl

**Async Nudge** (`async-nudge.ts`):
- Triggers when total sacrifice > 15pts or timezone spread > 8h
- Tracks "hours reclaimed" when users choose async over sync

### Supabase Integration

**Two client patterns** (src/lib/supabase/):
- `client.ts` → `createBrowserClient()` for Client Components
- `server.ts` → `createServerClient()` for Server Components/API routes

**Database types** are manually maintained in `src/types/database.ts`. Regenerate with:
```bash
npx supabase gen types typescript
```

### Component Organization

```
src/components/
├── ui/              # shadcn/ui primitives (Button, Card, Dialog, etc.)
├── layout/          # App shell, sidebar, header, mobile nav
├── sacrifice/       # Score badges, leaderboard, podium, history chart
├── golden-windows/  # Heatmap visualizations, best times, preferences
├── async-nudge/     # Nudge banner, hours reclaimed tracker
├── meetings/        # Meeting form
├── landing/         # Marketing page components
└── dashboard/       # Onboarding checklist, welcome header
```

### Styling

- **Tailwind CSS** with CSS variables for theming (light/dark mode via `next-themes`)
- **shadcn/ui** component library (components.json configured)
- Custom colors: `coral-*` palette, HSL-based semantic colors
- Custom animations: `float`, `glow-pulse`, `shimmer`, `pop-in` (see tailwind.config.js)
- Path alias: `@/` maps to `src/`

### Key Libraries

- **luxon**: All timezone handling (DateTime, Interval, Zone)
- **framer-motion**: Page transitions and microinteractions
- **date-fns** + **date-fns-tz**: Calendar picker date handling
- **sonner**: Toast notifications

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe (get from https://dashboard.stripe.com/apikeys)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price IDs (create in Stripe Dashboard > Products)
STRIPE_PRICE_ID_MONTHLY=price_...
STRIPE_PRICE_ID_YEARLY=price_...
```

## Stripe Integration

ClockAlign uses Stripe for premium subscriptions.

### Testing Webhooks Locally
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login and forward webhooks
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### Subscription Flow
1. User clicks "Upgrade" → `/api/stripe/checkout` creates Checkout Session
2. User completes payment on Stripe hosted checkout
3. Stripe sends webhook → `/api/webhooks/stripe` updates user in database
4. User returns to `/settings?success=true`

### Premium Features (Pro Tier)
- Unlimited teams and team members
- Sacrifice Leaderboard
- Golden Windows Heatmap
- Async Nudge tracking
- Split Calls for future dates

### Key Files
- `src/lib/stripe.ts` - Stripe client and pricing config
- `src/hooks/useSubscription.ts` - Client-side subscription state
- `src/components/premium-gate.tsx` - Feature gating components
- `src/app/api/stripe/` - Checkout and portal routes
- `src/app/api/webhooks/stripe/` - Webhook handler

### Promo Codes for Owner/Company
Create these in Stripe Dashboard (no code changes needed):
1. **Coupon**: 100% off, Duration: Forever
2. **Promotion Code**: `OWNER2024` (for owner)
3. **Promotion Code**: `TEAMFREE` (for colleagues)

Users enter these at Stripe checkout to get $0 forever subscriptions.

## Referral System

Users can share referral codes to give friends their first month free.

### Key Files
- `src/app/api/referrals/code/route.ts` - Get/create user's referral code
- `src/app/api/referrals/stats/route.ts` - Get referral statistics
- `src/components/referral-share.tsx` - Share code UI component
- `src/app/(dashboard)/referrals/page.tsx` - Referral dashboard
- `supabase/migrations/00004_referrals.sql` - Database schema

### How It Works
1. Each user gets a unique referral code (e.g., `REF_abc12345`)
2. User shares code with friends
3. Friend uses code at Stripe checkout (via allow_promotion_codes)
4. Referral is tracked in database

## Testing

Tests are in `__tests__/` directory using Vitest:
- `sacrifice-score.test.ts` - Unit tests for scoring algorithm
- `golden-windows.test.ts` - Overlap detection tests
- `e2e/flows.test.ts` - Integration tests
