# ClockAlign 🌍⏰

> **Fair Meeting Scheduling for Global Teams**

ClockAlign helps distributed teams find meeting times that don't always burden the same people. Using the Sacrifice Score™ system, it tracks who's taking the scheduling hit and helps rotate the pain fairly.

## ✨ Features

- **🎯 Golden Windows** - Find times when everyone is sharp, not just awake
- **📊 Sacrifice Score™** - Track and balance meeting time burden across team members
- **🔔 Async Nudge** - Smart suggestions to go async when sync meetings are costly
- **⏱️ Hours Reclaimed** - See how much time you've saved by choosing async
- **👥 Team Management** - Invite members with shareable codes
- **🌐 Timezone-Aware** - Built from the ground up for global teams

## 🚀 Quick Start

### Prerequisites

- Node.js 18.17+ 
- npm 9+
- Supabase account (for database + auth)

### Setup

1. **Clone and install dependencies:**
   ```bash
   cd app
   npm install --include=dev
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   
   Required variables:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

3. **Run database migrations:**
   ```bash
   npx supabase db push
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

## 🏗️ Architecture

```
src/
├── app/                    # Next.js 14 App Router
│   ├── (auth)/             # Auth pages (login)
│   ├── (dashboard)/        # Protected pages
│   │   ├── dashboard/      # Home dashboard
│   │   ├── meetings/       # Meeting management
│   │   ├── teams/          # Team management
│   │   ├── fairness/       # Sacrifice leaderboard
│   │   └── settings/       # User settings
│   └── api/                # API routes
│       ├── meetings/       # Meeting CRUD
│       ├── teams/          # Team CRUD
│       ├── sacrifice-score/# Score calculations
│       ├── golden-windows/ # Optimal time finder
│       └── async-nudge/    # Async suggestions
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── layout/             # App shell components
│   ├── sacrifice/          # Sacrifice score components
│   ├── golden-windows/     # Heatmap & best times
│   ├── async-nudge/        # Nudge banner & tracker
│   └── meetings/           # Meeting form & detail
├── lib/
│   ├── supabase/           # Supabase clients
│   ├── sacrifice-score.ts  # Scoring algorithm
│   ├── golden-windows.ts   # Overlap detection
│   ├── async-nudge.ts      # Async trigger logic
│   ├── timezone.ts         # Timezone utilities
│   ├── errors.ts           # Error handling
│   └── a11y.ts             # Accessibility helpers
└── types/
    └── database.ts         # Supabase types
```

## 📡 API Reference

See [API.md](./docs/API.md) for full endpoint documentation.

### Key Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/meetings` | GET/POST | List/create meetings |
| `/api/meetings/[id]` | GET/PUT/DELETE | Meeting CRUD |
| `/api/teams` | GET/POST | List/create teams |
| `/api/golden-windows` | GET | Find optimal meeting times |
| `/api/sacrifice-score` | GET | Get sacrifice scores |
| `/api/async-nudge/stats` | GET | Hours reclaimed stats |

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- src/__tests__/sacrifice-score.test.ts
```

## 🎨 Tech Stack

- **Framework:** [Next.js 14](https://nextjs.org/) with App Router
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **Database:** [Supabase](https://supabase.com/) (PostgreSQL)
- **Auth:** Supabase Auth (Magic Link + OAuth)
- **Time:** [Luxon](https://moment.github.io/luxon/) for timezone handling
- **Testing:** [Vitest](https://vitest.dev/)

## 🔧 Configuration

### Tailwind

Extended with custom animations for smooth transitions. See `tailwind.config.js`.

### TypeScript

Strict mode enabled. Path alias `@/` maps to `src/`.

### ESLint

Using Next.js recommended config with TypeScript support.

## 📚 Key Concepts

### Sacrifice Score™

Each meeting time is scored based on how "painful" it is for each participant:

| Time Period | Points | Category |
|-------------|--------|----------|
| 10 AM - 4 PM | 1 | Golden Hours |
| 9 AM, 4-5 PM | 1.5 | Good |
| 8 AM, 5-6 PM | 2 | Acceptable |
| 7-8 AM | 3 | Early Morning |
| 6-8 PM | 3 | Evening |
| 8-9 PM | 4 | Late Evening |
| 9-10 PM | 5 | Night |
| 10-11 PM | 6 | Late Night |
| 11 PM - 7 AM | 10 | Graveyard |

### Golden Windows

Uses energy curves (based on chronotype) to find times when all participants are cognitively sharp, not just available.

### Async Nudge

Analyzes meeting characteristics to suggest async alternatives when:
- Total sacrifice score is high (>15 points)
- Timezone spread is large (>8 hours)
- Meeting pattern matches async-friendly types (standups, updates, etc.)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](../LICENSE) for details.

---

Built with ❤️ for distributed teams everywhere.
