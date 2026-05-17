# GermanUp — Project Guide

## What This Is
Web-based German learning app for English speakers. A1 launch scope.
Stack: NextJS 14 (App Router) + NestJS + PostgreSQL (Supabase) + Anthropic Claude API.

## Monorepo Structure
```
/german
  /apps
    /web        NextJS 14, port 5000 (dev)
    /api        NestJS, port 5001 (dev)
  /packages
    /types      Shared TypeScript interfaces (@germanup/types)
    /db         Prisma schema + client (@germanup/db)
```

## Running the Project
```bash
# From root — starts both apps via Turborepo
npm run dev

# If you get missing module errors, run npm install inside each app once:
cd apps/web && npm install
cd apps/api && npm install
```

> npm workspaces has a hoisting bug with transitive deps. Running npm install inside each app fixes it. pnpm would solve this properly but we use npm.

## Key Env Files
- `apps/api/.env` — NestJS env (DATABASE_URL, JWT secrets, ANTHROPIC_API_KEY, ADMIN_EMAIL)
- `apps/web/.env.local` — NextJS env (NEXTAUTH_SECRET, NEXT_PUBLIC_API_URL, NEXT_PUBLIC_ADMIN_EMAIL)
- `packages/db/.env` — Prisma only needs DATABASE_URL here for migrations

## Database
- Provider: Supabase (PostgreSQL)
- ORM: Prisma 5.x, schema at `packages/db/prisma/schema.prisma`
- Use Transaction Pooler URL (port 5432 on pooler host, NOT direct port 5432)
- Push schema changes: `cd packages/db && npx prisma generate && npx prisma db push`
- Prisma must also be installed at root devDependencies (hoisting fix)
- User model has: streakCount, lastActiveDate, streakFreezeUsedAt
- DailyApiUsage model tracks per-user per-day Claude API call counts

## Claude API Usage (3 tiers — cost model)
| Tier | When | Cost |
|---|---|---|
| Zero cost | Practice from pre-generated exercise DB | Free |
| One-time cost | Admin generates exercise bank via admin panel | ~$3 total |
| Per-use cost | AI correction for free writing/translation | ~$0.001/answer |

- Model: `claude-sonnet-4-6`
- temperature: 0 on all calls for consistent JSON output
- Prompt caching enabled on correctTranslation and correctFreeWrite system prompts
- Vocab import: Wiktionary lookup first (free, gets gender/plural), Claude only adds english/example/level
- Translation/free-write correction: Pro users only
- Free write passes exercise question to Claude so it checks task compliance

## Auth Flow
- Email/password: NestJS issues JWT (15min) + refresh token (30 days, stored hashed in DB)
- Google OAuth: handled by NextAuth, then calls `POST /api/auth/google` on NestJS
- Middleware protects: /dashboard, /vocabulary, /verbs, /grammar, /progress, /settings
- Session token cached in module-level store (session-store.ts) — axios interceptor reads from it, not from getSession() on every request

## Free vs Pro
| Feature | Free | Pro |
|---|---|---|
| A1 grammar theory | ✅ | ✅ |
| Exercises | 10/day | Unlimited |
| Flashcards | 20/day | Unlimited |
| Single word lookup (Wiktionary) | ✅ | ✅ |
| AI correction | ❌ | ✅ |
| Bulk vocab import (Claude) | ❌ | ✅ (10/day) |
| Verb import (Claude) | ❌ | ✅ (20/day) |
| Streak freeze | ❌ | ✅ (1/week) |
| Price | Free | €7/month |

## Phase Progress
- [x] Phase 1 — Monorepo, Auth, Vocabulary, Dashboard, DB
- [x] Phase 2 — Admin exercise panel, grammar topic pages, exercise engine
- [x] Phase 3 — Stripe, AI correction, verb conjugation
- [x] Phase 4 — Streaks, daily goals, SEO, mobile, rate limiting, deploy

## API Endpoints (implemented)
```
POST /auth/register
POST /auth/login
POST /auth/google
POST /auth/refresh
POST /auth/logout

GET    /vocab?level=A1&page=1&limit=20
GET    /vocab/lookup?word=Hund         (free — Wiktionary gender/plural)
POST   /vocab/add                      (free — single word add)
POST   /vocab/import                   (Pro — Claude bulk import, 10/day)
DELETE /vocab/:id
GET    /vocab/flashcard-session
POST   /vocab/flashcard-result

GET    /exercises?topic=cases&difficulty=mixed&limit=10
POST   /exercises/result
POST   /exercises/correct-translation  (Pro, 50/day)
POST   /exercises/correct-freewrite    (Pro, 30/day)

GET    /verbs
POST   /verbs/import                   (Pro — Claude, 20/day)
DELETE /verbs/:id
GET    /verbs/practice-session
POST   /verbs/conjugation-result

GET    /progress
GET    /progress/today                 (streak + daily goal stats)
POST   /progress/streak-freeze         (Pro only)
GET    /progress/:topic

GET    /subscription/status
POST   /subscription/checkout
POST   /subscription/portal
POST   /subscription/webhook

GET    /admin/exercises                (admin only)
GET    /admin/exercises/stats
POST   /admin/exercises/import
PUT    /admin/exercises/:id
DELETE /admin/exercises/:id
DELETE /admin/exercises/all

GET    /health
```

## NestJS Module Map
- `PrismaModule` — global, provides PrismaService
- `AuthModule` — register/login/google/refresh/logout, JWT + Local strategies
- `ClaudeModule` — wraps Anthropic SDK, provides ClaudeService
- `VocabModule` — imports ClaudeModule, all vocab endpoints + Wiktionary lookup
- `ExercisesModule` — exercise fetch, result recording, AI correction
- `VerbsModule` — verb import, practice session, conjugation stats
- `ProgressModule` — topic progress, streak, daily goals
- `SubscriptionModule` — Stripe checkout, portal, webhook
- `AdminModule` — exercise CRUD, bulk import, delete all (admin-guarded)

## Admin Panel
- URL: /admin/exercises
- Protected by ADMIN_EMAIL env var (set in both api and web .env)
- Features: browse/filter exercises, edit, delete, bulk import JSON, delete all
- Exercise import format: JSON array matching Exercise schema

## Exercise Curriculum
- See CURRICULUM.md for topic-by-topic grammar rules
- Each topic only uses grammar from that topic + all previous topics
- Use CURRICULUM.md context when generating exercises to avoid grammar bleed

## Rate Limiting (per user per day)
- /vocab/import: 10 calls
- /verbs/import: 20 calls
- /exercises/correct-translation: 50 calls
- /exercises/correct-freewrite: 30 calls
- Tracked in DailyApiUsage table (userId + date + endpoint)

## Deployment
- API: Railway (apps/api) — postinstall runs prisma generate
- Web: Railway (apps/web)
- DB: Supabase (connected via DATABASE_URL)
- Health check: GET /health → { status: "ok" }

## Known Issues / Gotchas
- `next.config.ts` not supported by this Next version — use `next.config.mjs`
- Google Fonts may fail on restricted networks — Inter font removed, using system font
- `@prisma/engines` must be installed at root (added `prisma` to root devDependencies)
- Prisma generate runs via postinstall in apps/api/package.json on Railway
- npm workspaces hoisting: run `npm i` inside apps/web and apps/api if modules missing
- useSearchParams() in dashboard must be inside Suspense boundary (done in layout.tsx)
- Session token stored in session-store.ts module — interceptor reads from it to avoid /api/auth/session spam
