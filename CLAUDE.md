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
- `apps/api/.env` — NestJS env (DATABASE_URL, JWT secrets, ANTHROPIC_API_KEY)
- `apps/web/.env.local` — NextJS env (NEXTAUTH_SECRET, NEXT_PUBLIC_API_URL)
- `packages/db/.env` — Prisma only needs DATABASE_URL here for migrations

## Database
- Provider: Supabase (PostgreSQL)
- ORM: Prisma 5.x, schema at `packages/db/prisma/schema.prisma`
- Use Transaction Pooler URL (port 5432 on pooler host, NOT direct port 5432)
- Push schema changes: `cd packages/db && npx prisma generate && npx prisma db push`
- Prisma must also be installed at root devDependencies (hoisting fix)

## Claude API Usage (3 tiers — cost model)
| Tier | When | Cost |
|---|---|---|
| Zero cost | Practice from pre-generated exercise DB | Free |
| One-time cost | Admin generates exercise bank | ~$3 total |
| Per-use cost | AI correction for free writing/translation | ~$0.002/answer |

- Model: `claude-sonnet-4-5`
- Vocab import: up to 20 words per call, returns gender/plural/example/level
- Translation/free-write correction: Pro users only

## Auth Flow
- Email/password: NestJS issues JWT (15min) + refresh token (30 days, stored hashed in DB)
- Google OAuth: handled by NextAuth, then calls `POST /api/auth/google` on NestJS
- Middleware protects: /dashboard, /vocabulary, /verbs, /grammar, /progress, /settings

## Free vs Pro
| Feature | Free | Pro |
|---|---|---|
| A1 grammar theory | ✅ | ✅ |
| Exercises | 10/day | Unlimited |
| Flashcards | 20/day | Unlimited |
| AI correction | ❌ | ✅ |
| Vocab/verb import | ❌ | ✅ |
| Price | Free | €7/month |

## Phase Progress
- [x] Phase 1 — Monorepo, Auth, Vocabulary, Dashboard, DB
- [ ] Phase 2 — Admin exercise generation script, grammar topic pages, exercise engine
- [ ] Phase 3 — Stripe, AI correction, verb conjugation
- [ ] Phase 4 — Progress dashboard, streaks, SEO, mobile polish

## API Endpoints (implemented)
```
POST /auth/register
POST /auth/login
POST /auth/google
POST /auth/refresh
POST /auth/logout

GET    /vocab?level=A1&page=1&limit=20
POST   /vocab/import           (Pro — Claude call)
DELETE /vocab/:id
GET    /vocab/flashcard-session?size=20&level=A1
POST   /vocab/flashcard-result
```

## NestJS Module Map
- `PrismaModule` — global, provides PrismaService
- `AuthModule` — register/login/google/refresh/logout, JWT + Local strategies
- `ClaudeModule` — wraps Anthropic SDK, provides ClaudeService
- `VocabModule` — imports ClaudeModule, all vocab endpoints

## A1 Grammar Topics (13 total, Phase 2)
cases, pronouns (personal + possessive), modal verbs, dativ/akkusativ/two-way prepositions,
imperative, separable verbs, future with werden, numbers/dates/time, präsens, noun gender

## Known Issues / Gotchas
- `next.config.ts` not supported by this Next version — use `next.config.mjs`
- Google Fonts may fail on restricted networks — Inter font removed, using system font
- `@prisma/engines` must be installed at root (added `prisma` to root devDependencies)
- `styled-jsx`, `@alloc/quick-lru` missing from root hoisting — fixed by running `npm i` inside apps/web
