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

# Email (Resend - get from https://resend.com/api-keys)
RESEND_API_KEY=re_...

# Google Calendar (get from https://console.cloud.google.com)
GOOGLE_CLIENT_ID=...apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=...
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Production: https://clockalign.app

# Analytics (PostHog - get from https://app.posthog.com/project/settings)
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# Security (optional - uses SUPABASE_SERVICE_ROLE_KEY as fallback)
OAUTH_STATE_SECRET=your-32-char-random-string  # For HMAC-signing OAuth state
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

## GTM & Viral Mechanics (Go-To-Market)

### Public Lead Magnets
- `/calculator` - Standalone Sacrifice Score Calculator (no auth, shareable results)
- `/finder` - Fair Time Finder with social sharing

### Shareable Components

**Sacrifice Score Card** (`src/components/sacrifice/shareable-score-card.tsx`):
- Branded visual card showing participant scores
- Share to Twitter, LinkedIn, or clipboard
- Tracks shares via PostHog analytics

**Meeting Avoided Badge** (`src/components/async-nudge/meeting-avoided-badge.tsx`):
- Celebration component when users choose async
- "This meeting was a doc 🎉" shareable badge
- Confetti animation for positive reinforcement

### Analytics Events (PostHog)

GTM-specific events in `src/lib/analytics/posthog.ts`:
```typescript
SCORE_CARD_SHARED      // platform: twitter/linkedin/clipboard/native
CALCULATOR_USED
CALCULATOR_SIGNUP_CLICKED
MEETING_AVOIDED_SHARED
LANDING_CTA_CLICKED    // cta_type: hero_primary/hero_secondary/pricing
PRICING_PAGE_VIEWED    // ref: referral code if present
```

### Key GTM Metrics to Track
- K-factor (viral coefficient) via share events
- Calculator → Signup conversion rate
- "Hours Reclaimed" as engagement metric
- Referral code usage

### Positioning
- One-liner: "Calendly schedules a meeting. ClockAlign schedules a team."
- Supporting: "Stop making Tokyo take the midnight calls."

## Security Utilities

The `src/lib/security/` directory contains security utilities for common web vulnerabilities:

### URL Validation (`url-validation.ts`)
- `getCanonicalOrigin()` - Returns trusted app origin from env var, never from request
- `isValidInternalPath(path)` - Validates redirect paths to prevent open redirects
- `sanitizeRedirectPath(path, default)` - Returns safe path or default
- `buildRedirectUrl(path)` - Builds full URL with canonical origin

### Cryptographic Code Generation (`code-generation.ts`)
- `generateSecureCode(prefix, length, charset)` - CSPRNG-based code generation
- `generateInviteCode()` - 8-char invite codes
- `generateReferralCode()` - REF_ prefixed codes
- `generateOAuthNonce()` - 32-char hex nonces
- `createStateSignature(data, secret)` - HMAC-SHA256 signing
- `verifyStateSignature(data, sig, secret)` - Timing-safe verification

**Always use these utilities instead of:**
- Trusting `request.headers.get('origin')` for redirects
- Using `Math.random()` for security-sensitive codes
- Manual redirect path validation

### Calendar Token Management (`src/lib/calendar/tokens.ts`)

OAuth tokens are stored in the dedicated `calendar_tokens` table (not in `users.preferences`).

**Functions:**
- `getCalendarTokens(supabase, userId)` - Read tokens, auto-refresh if expired
- `saveCalendarTokens(supabase, userId, tokens)` - Upsert tokens via RPC
- `hasCalendarConnection(supabase, userId?)` - Check connection status (returns boolean, never tokens)
- `revokeCalendarConnection(supabase)` - Delete tokens on disconnect

**Always use these functions instead of:**
- Reading tokens from `users.preferences.google_calendar`
- Storing tokens in the `users` table
- Using `SELECT *` on users table (use explicit column list)

**Database:**
- `calendar_tokens` table with RLS (users can only access own tokens)
- `upsert_calendar_token()` RPC - SECURITY DEFINER function for token updates
- `has_calendar_connection()` RPC - Safe boolean check without exposing tokens

## Implementation Status

### Completed
- ✅ **Security remediation** (2026-02-03): Implemented 10-point security audit fixes:
  - Created `src/lib/security/url-validation.ts` - Open redirect prevention
  - Created `src/lib/security/code-generation.ts` - Cryptographic code generation
  - Fixed open redirects in auth callbacks, Stripe routes, calendar OAuth
  - Added HMAC-signed OAuth state with nonce cookies for CSRF protection
  - Replaced all `Math.random()` code generation with `crypto.randomBytes()`
  - Added security headers in `next.config.mjs` (CSP, HSTS, X-Frame-Options)
  - Created `supabase/migrations/00005_fix_invite_rls.sql` - Fixed overly permissive team_invites RLS
  - Created `supabase/migrations/00006_calendar_tokens.sql` - Separate token storage table
- ✅ **Fake reviews removed** (2026-02-03): Removed fake testimonial from AsyncNudge.tsx landing component
- ✅ **Auth middleware created** (2026-02-03): Added `/middleware.ts` for Supabase session refresh on every request
- ✅ **Finder centering fixed** (2026-02-03): Fixed scroll centering calculation in `/finder` page "Today" button and scroll functions
- ✅ **Dark mode legibility fixed** (2026-02-03): Added dark: variants to 15+ files for proper contrast:
  - `meeting-form.tsx` - Progress indicator, recurring toggle, participant cards, time slots, confirmation
  - `score-badges.tsx` - QuickScore colors, achievement badges
  - `leaderboard.tsx` - Fairness alerts, status row badges
  - `heatmap.tsx` & `best-times.tsx` - Golden score labels, time category cards, sharpness backgrounds
  - `nudge-banner.tsx` - Icon backgrounds, urgency badges, reasons list
  - Landing components: `Scheduler.tsx`, `GoldenWindows.tsx`, `AsyncNudge.tsx`, `SacrificeLeaderboard.tsx`
- ✅ **Calendar tokens wired to dedicated table** (2026-02-03): P0 security fix to isolate OAuth tokens:
  - Created `src/lib/calendar/tokens.ts` - Centralized token management with auto-refresh
  - Updated `callback/route.ts` to store tokens via `saveCalendarTokens()` RPC
  - Updated `events/route.ts` and `availability/route.ts` to use `getCalendarTokens()`
  - Fixed `settings/page.tsx` to select specific columns and use `hasCalendarConnection()` RPC
  - Created `00007_cleanup_calendar_preferences.sql` to remove old tokens from preferences
  - Added `calendar_tokens` table and RPC function types to `database.ts`

### Roadmap (see TRACKER.md for full plan)
- Phase 1.5.1: Google Calendar Write Integration (HIGH priority)
- Phase 1.5.2: Auto-Rotation for Recurring Meetings (HIGH priority)
- Phase 1.5.3: Custom Energy Curves (MEDIUM priority)
- Phase 1.5.4: Karma Reports (MEDIUM priority)
- Phase 2.0.1: Slack Integration (HIGH priority)
