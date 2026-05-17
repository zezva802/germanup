# Graph Report - .  (2026-05-16)

## Corpus Check
- Corpus is ~28,951 words - fits in a single context window. You may not need a graph.

## Summary
- 364 nodes · 308 edges · 100 communities detected
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 16 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Vocab & Claude AI Service|Vocab & Claude AI Service]]
- [[_COMMUNITY_Architecture & Docs|Architecture & Docs]]
- [[_COMMUNITY_Auth System|Auth System]]
- [[_COMMUNITY_Exercise & Practice Engine|Exercise & Practice Engine]]
- [[_COMMUNITY_Claude API & Grammar Topics|Claude API & Grammar Topics]]
- [[_COMMUNITY_Stripe & Subscription|Stripe & Subscription]]
- [[_COMMUNITY_Progress & Streak Tracking|Progress & Streak Tracking]]
- [[_COMMUNITY_Verbs Service|Verbs Service]]
- [[_COMMUNITY_Auth Controller|Auth Controller]]
- [[_COMMUNITY_Verbs Controller|Verbs Controller]]
- [[_COMMUNITY_Vocab Controller|Vocab Controller]]
- [[_COMMUNITY_Pricing & Upgrade UI|Pricing & Upgrade UI]]
- [[_COMMUNITY_Exercises Controller|Exercises Controller]]
- [[_COMMUNITY_Progress Controller|Progress Controller]]
- [[_COMMUNITY_SEO Page Layouts|SEO Page Layouts]]
- [[_COMMUNITY_Verbs React Hooks|Verbs React Hooks]]
- [[_COMMUNITY_Vocab React Hooks|Vocab React Hooks]]
- [[_COMMUNITY_Exercise Generation Script|Exercise Generation Script]]
- [[_COMMUNITY_Grammar Practice Tab|Grammar Practice Tab]]
- [[_COMMUNITY_Exercise React Hooks|Exercise React Hooks]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 69|Community 69]]
- [[_COMMUNITY_Community 70|Community 70]]
- [[_COMMUNITY_Community 71|Community 71]]
- [[_COMMUNITY_Community 72|Community 72]]
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Community 74|Community 74]]
- [[_COMMUNITY_Community 75|Community 75]]
- [[_COMMUNITY_Community 76|Community 76]]
- [[_COMMUNITY_Community 77|Community 77]]
- [[_COMMUNITY_Community 78|Community 78]]
- [[_COMMUNITY_Community 79|Community 79]]
- [[_COMMUNITY_Community 80|Community 80]]
- [[_COMMUNITY_Community 81|Community 81]]
- [[_COMMUNITY_Community 82|Community 82]]
- [[_COMMUNITY_Community 83|Community 83]]
- [[_COMMUNITY_Community 84|Community 84]]
- [[_COMMUNITY_Community 85|Community 85]]
- [[_COMMUNITY_Community 86|Community 86]]
- [[_COMMUNITY_Community 87|Community 87]]
- [[_COMMUNITY_Community 88|Community 88]]
- [[_COMMUNITY_Community 89|Community 89]]
- [[_COMMUNITY_Community 90|Community 90]]
- [[_COMMUNITY_Community 91|Community 91]]
- [[_COMMUNITY_Community 92|Community 92]]
- [[_COMMUNITY_Community 93|Community 93]]
- [[_COMMUNITY_Community 94|Community 94]]
- [[_COMMUNITY_Community 95|Community 95]]
- [[_COMMUNITY_Community 96|Community 96]]
- [[_COMMUNITY_Community 97|Community 97]]
- [[_COMMUNITY_Community 98|Community 98]]
- [[_COMMUNITY_Community 99|Community 99]]

## God Nodes (most connected - your core abstractions)
1. `AuthService` - 12 edges
2. `VocabService` - 9 edges
3. `Anthropic Claude API` - 9 edges
4. `AuthController` - 8 edges
5. `ProgressService` - 8 edges
6. `VerbsService` - 8 edges
7. `ExercisesService` - 7 edges
8. `VerbsController` - 7 edges
9. `VocabController` - 7 edges
10. `ClaudeService` - 6 edges

## Surprising Connections (you probably didn't know these)
- `Streak System` --references--> `PostgreSQL (Supabase)`  [INFERRED]
  build-prompts-and-testing.md → CLAUDE.md
- `SEO (meta/OG tags, sitemap, robots.txt)` --references--> `apps/web (NextJS)`  [INFERRED]
  build-prompts-and-testing.md → CLAUDE.md
- `PricingPage()` --calls--> `useCheckout()`  [INFERRED]
  apps\web\src\app\(app)\pricing\page.tsx → apps\web\src\hooks\use-subscription.ts
- `UpgradeModal()` --calls--> `useCheckout()`  [INFERRED]
  apps\web\src\components\upgrade-modal.tsx → apps\web\src\hooks\use-subscription.ts
- `Build Prompts & Testing Guide` --references--> `GermanUp App`  [EXTRACTED]
  build-prompts-and-testing.md → CLAUDE.md

## Hyperedges (group relationships)
- **GermanUp Monorepo Tech Stack** — claude_nextjs, claude_nestjs, claude_postgresql, claude_anthropic_api, claude_prisma, claude_turborepo [EXTRACTED 1.00]
- **NestJS Module Architecture** — claude_prisma_module, claude_auth_module, claude_claude_module, claude_vocab_module [EXTRACTED 1.00]
- **4-Phase Build Progression** — claude_phase1, claude_phase2, claude_phase3, claude_phase4 [EXTRACTED 1.00]
- **Authentication Mechanisms** — claude_jwt_auth, claude_nextauth, claude_google_oauth, claude_auth_module [EXTRACTED 1.00]

## Communities

### Community 0 - "Vocab & Claude AI Service"
Cohesion: 0.13
Nodes (4): ClaudeService, stripFences(), VocabService, handleDelete()

### Community 1 - "Architecture & Docs"
Cohesion: 0.12
Nodes (20): apps/api (NestJS), apps/web (NextJS), AuthModule, GermanUp App, Google OAuth, JWT Auth (15min access + 30day refresh), NestJS API, NextAuth.js (+12 more)

### Community 2 - "Auth System"
Cohesion: 0.18
Nodes (2): AuthService, LocalStrategy

### Community 3 - "Exercise & Practice Engine"
Cohesion: 0.15
Nodes (5): ExercisesService, handleKey(), handleNext(), handleStart(), handleSubmit()

### Community 4 - "Claude API & Grammar Topics"
Cohesion: 0.15
Nodes (17): A1 Grammar Topics (13 total), Anthropic Claude API, ClaudeModule, Claude API Cost Model (3 tiers), Prisma ORM, PrismaModule, Pro Plan (EUR7/month), POST /vocab/import (Claude Call) (+9 more)

### Community 5 - "Stripe & Subscription"
Cohesion: 0.15
Nodes (2): SubscriptionController, SubscriptionService

### Community 6 - "Progress & Streak Tracking"
Cohesion: 0.28
Nodes (1): ProgressService

### Community 7 - "Verbs Service"
Cohesion: 0.25
Nodes (1): VerbsService

### Community 8 - "Auth Controller"
Cohesion: 0.25
Nodes (1): AuthController

### Community 9 - "Verbs Controller"
Cohesion: 0.25
Nodes (1): VerbsController

### Community 10 - "Vocab Controller"
Cohesion: 0.25
Nodes (1): VocabController

### Community 11 - "Pricing & Upgrade UI"
Cohesion: 0.25
Nodes (3): PricingPage(), UpgradeModal(), useCheckout()

### Community 12 - "Exercises Controller"
Cohesion: 0.29
Nodes (1): ExercisesController

### Community 13 - "Progress Controller"
Cohesion: 0.29
Nodes (1): ProgressController

### Community 14 - "SEO Page Layouts"
Cohesion: 0.33
Nodes (1): Layout()

### Community 15 - "Verbs React Hooks"
Cohesion: 0.33
Nodes (0): 

### Community 16 - "Vocab React Hooks"
Cohesion: 0.33
Nodes (0): 

### Community 17 - "Exercise Generation Script"
Cohesion: 0.6
Nodes (5): buildPrompt(), extractStems(), generateBatch(), main(), saveBatch()

### Community 18 - "Grammar Practice Tab"
Cohesion: 0.6
Nodes (3): handleDifficultyChange(), handleTypeChange(), resetSession()

### Community 19 - "Exercise React Hooks"
Cohesion: 0.4
Nodes (0): 

### Community 20 - "Community 20"
Cohesion: 0.5
Nodes (1): JwtRefreshStrategy

### Community 21 - "Community 21"
Cohesion: 0.5
Nodes (1): JwtStrategy

### Community 22 - "Community 22"
Cohesion: 0.5
Nodes (1): PrismaService

### Community 23 - "Community 23"
Cohesion: 0.5
Nodes (1): cn()

### Community 24 - "Community 24"
Cohesion: 0.5
Nodes (0): 

### Community 25 - "Community 25"
Cohesion: 0.67
Nodes (2): handleGoogle(), onSubmit()

### Community 26 - "Community 26"
Cohesion: 0.5
Nodes (0): 

### Community 27 - "Community 27"
Cohesion: 0.5
Nodes (0): 

### Community 28 - "Community 28"
Cohesion: 0.67
Nodes (0): 

### Community 29 - "Community 29"
Cohesion: 0.67
Nodes (0): 

### Community 30 - "Community 30"
Cohesion: 0.67
Nodes (3): Phase 3 - Stripe, AI Correction, Verb Conjugation, Phase 3 Testing Checklist, Phase 3 Build Prompt

### Community 31 - "Community 31"
Cohesion: 0.67
Nodes (3): Phase 1 - Monorepo, Auth, Vocabulary, Dashboard, Phase 1 Testing Checklist, Phase 1 Build Prompt

### Community 32 - "Community 32"
Cohesion: 0.67
Nodes (3): Phase 2 - Exercise Engine, Grammar Topics, Phase 2 Testing Checklist, Phase 2 Build Prompt

### Community 33 - "Community 33"
Cohesion: 0.67
Nodes (3): Phase 4 - Progress, Streaks, SEO, Mobile, Phase 4 Testing Checklist, Phase 4 Build Prompt

### Community 34 - "Community 34"
Cohesion: 1.0
Nodes (1): AppModule

### Community 35 - "Community 35"
Cohesion: 1.0
Nodes (0): 

### Community 36 - "Community 36"
Cohesion: 1.0
Nodes (1): AuthModule

### Community 37 - "Community 37"
Cohesion: 1.0
Nodes (1): GoogleAuthDto

### Community 38 - "Community 38"
Cohesion: 1.0
Nodes (1): LoginDto

### Community 39 - "Community 39"
Cohesion: 1.0
Nodes (1): RefreshDto

### Community 40 - "Community 40"
Cohesion: 1.0
Nodes (1): RegisterDto

### Community 41 - "Community 41"
Cohesion: 1.0
Nodes (1): JwtAuthGuard

### Community 42 - "Community 42"
Cohesion: 1.0
Nodes (1): JwtRefreshGuard

### Community 43 - "Community 43"
Cohesion: 1.0
Nodes (1): LocalAuthGuard

### Community 44 - "Community 44"
Cohesion: 1.0
Nodes (1): ClaudeModule

### Community 45 - "Community 45"
Cohesion: 1.0
Nodes (1): ExercisesModule

### Community 46 - "Community 46"
Cohesion: 1.0
Nodes (1): CorrectFreewriteDto

### Community 47 - "Community 47"
Cohesion: 1.0
Nodes (1): CorrectTranslationDto

### Community 48 - "Community 48"
Cohesion: 1.0
Nodes (1): ExerciseResultDto

### Community 49 - "Community 49"
Cohesion: 1.0
Nodes (1): GetExercisesDto

### Community 50 - "Community 50"
Cohesion: 1.0
Nodes (1): PrismaModule

### Community 51 - "Community 51"
Cohesion: 1.0
Nodes (1): ProgressModule

### Community 52 - "Community 52"
Cohesion: 1.0
Nodes (1): SubscriptionModule

### Community 53 - "Community 53"
Cohesion: 1.0
Nodes (1): VerbsModule

### Community 54 - "Community 54"
Cohesion: 1.0
Nodes (1): ConjugationResultDto

### Community 55 - "Community 55"
Cohesion: 1.0
Nodes (1): ImportVerbDto

### Community 56 - "Community 56"
Cohesion: 1.0
Nodes (1): PracticeSessionDto

### Community 57 - "Community 57"
Cohesion: 1.0
Nodes (1): VocabModule

### Community 58 - "Community 58"
Cohesion: 1.0
Nodes (1): FlashcardResultDto

### Community 59 - "Community 59"
Cohesion: 1.0
Nodes (1): FlashcardSessionDto

### Community 60 - "Community 60"
Cohesion: 1.0
Nodes (1): GetVocabDto

### Community 61 - "Community 61"
Cohesion: 1.0
Nodes (1): ImportWordsDto

### Community 62 - "Community 62"
Cohesion: 1.0
Nodes (0): 

### Community 63 - "Community 63"
Cohesion: 1.0
Nodes (0): 

### Community 64 - "Community 64"
Cohesion: 1.0
Nodes (0): 

### Community 65 - "Community 65"
Cohesion: 1.0
Nodes (0): 

### Community 66 - "Community 66"
Cohesion: 1.0
Nodes (0): 

### Community 67 - "Community 67"
Cohesion: 1.0
Nodes (0): 

### Community 68 - "Community 68"
Cohesion: 1.0
Nodes (0): 

### Community 69 - "Community 69"
Cohesion: 1.0
Nodes (0): 

### Community 70 - "Community 70"
Cohesion: 1.0
Nodes (0): 

### Community 71 - "Community 71"
Cohesion: 1.0
Nodes (0): 

### Community 72 - "Community 72"
Cohesion: 1.0
Nodes (0): 

### Community 73 - "Community 73"
Cohesion: 1.0
Nodes (0): 

### Community 74 - "Community 74"
Cohesion: 1.0
Nodes (0): 

### Community 75 - "Community 75"
Cohesion: 1.0
Nodes (0): 

### Community 76 - "Community 76"
Cohesion: 1.0
Nodes (0): 

### Community 77 - "Community 77"
Cohesion: 1.0
Nodes (0): 

### Community 78 - "Community 78"
Cohesion: 1.0
Nodes (0): 

### Community 79 - "Community 79"
Cohesion: 1.0
Nodes (0): 

### Community 80 - "Community 80"
Cohesion: 1.0
Nodes (0): 

### Community 81 - "Community 81"
Cohesion: 1.0
Nodes (0): 

### Community 82 - "Community 82"
Cohesion: 1.0
Nodes (0): 

### Community 83 - "Community 83"
Cohesion: 1.0
Nodes (0): 

### Community 84 - "Community 84"
Cohesion: 1.0
Nodes (0): 

### Community 85 - "Community 85"
Cohesion: 1.0
Nodes (0): 

### Community 86 - "Community 86"
Cohesion: 1.0
Nodes (0): 

### Community 87 - "Community 87"
Cohesion: 1.0
Nodes (0): 

### Community 88 - "Community 88"
Cohesion: 1.0
Nodes (0): 

### Community 89 - "Community 89"
Cohesion: 1.0
Nodes (0): 

### Community 90 - "Community 90"
Cohesion: 1.0
Nodes (0): 

### Community 91 - "Community 91"
Cohesion: 1.0
Nodes (0): 

### Community 92 - "Community 92"
Cohesion: 1.0
Nodes (0): 

### Community 93 - "Community 93"
Cohesion: 1.0
Nodes (0): 

### Community 94 - "Community 94"
Cohesion: 1.0
Nodes (0): 

### Community 95 - "Community 95"
Cohesion: 1.0
Nodes (0): 

### Community 96 - "Community 96"
Cohesion: 1.0
Nodes (0): 

### Community 97 - "Community 97"
Cohesion: 1.0
Nodes (0): 

### Community 98 - "Community 98"
Cohesion: 1.0
Nodes (1): Free Plan

### Community 99 - "Community 99"
Cohesion: 1.0
Nodes (1): GET /vocab/flashcard-session

## Knowledge Gaps
- **48 isolated node(s):** `AppModule`, `AuthModule`, `GoogleAuthDto`, `LoginDto`, `RefreshDto` (+43 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 34`** (2 nodes): `AppModule`, `app.module.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 35`** (2 nodes): `main.ts`, `bootstrap()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 36`** (2 nodes): `auth.module.ts`, `AuthModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 37`** (2 nodes): `google-auth.dto.ts`, `GoogleAuthDto`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 38`** (2 nodes): `login.dto.ts`, `LoginDto`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 39`** (2 nodes): `refresh.dto.ts`, `RefreshDto`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 40`** (2 nodes): `register.dto.ts`, `RegisterDto`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 41`** (2 nodes): `jwt-auth.guard.ts`, `JwtAuthGuard`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 42`** (2 nodes): `jwt-refresh.guard.ts`, `JwtRefreshGuard`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 43`** (2 nodes): `local-auth.guard.ts`, `LocalAuthGuard`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 44`** (2 nodes): `claude.module.ts`, `ClaudeModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 45`** (2 nodes): `exercises.module.ts`, `ExercisesModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 46`** (2 nodes): `correct-freewrite.dto.ts`, `CorrectFreewriteDto`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 47`** (2 nodes): `correct-translation.dto.ts`, `CorrectTranslationDto`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 48`** (2 nodes): `exercise-result.dto.ts`, `ExerciseResultDto`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 49`** (2 nodes): `get-exercises.dto.ts`, `GetExercisesDto`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 50`** (2 nodes): `prisma.module.ts`, `PrismaModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 51`** (2 nodes): `progress.module.ts`, `ProgressModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 52`** (2 nodes): `subscription.module.ts`, `SubscriptionModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 53`** (2 nodes): `verbs.module.ts`, `VerbsModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 54`** (2 nodes): `conjugation-result.dto.ts`, `ConjugationResultDto`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 55`** (2 nodes): `import-verb.dto.ts`, `ImportVerbDto`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 56`** (2 nodes): `practice-session.dto.ts`, `PracticeSessionDto`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 57`** (2 nodes): `vocab.module.ts`, `VocabModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 58`** (2 nodes): `flashcard-result.dto.ts`, `FlashcardResultDto`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 59`** (2 nodes): `flashcard-session.dto.ts`, `FlashcardSessionDto`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 60`** (2 nodes): `get-vocab.dto.ts`, `GetVocabDto`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 61`** (2 nodes): `import-words.dto.ts`, `ImportWordsDto`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 62`** (2 nodes): `layout.tsx`, `RootLayout()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 63`** (2 nodes): `page.tsx`, `LandingPage()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 64`** (2 nodes): `robots.ts`, `robots()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 65`** (2 nodes): `sitemap.ts`, `sitemap()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 66`** (2 nodes): `layout.tsx`, `AppLayout()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 67`** (2 nodes): `page.tsx`, `StatCard()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 68`** (2 nodes): `layout.tsx`, `AuthLayout()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 69`** (2 nodes): `sidebar.tsx`, `cn()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 70`** (2 nodes): `input.tsx`, `cn()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 71`** (2 nodes): `modal.tsx`, `Modal()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 72`** (2 nodes): `spinner.tsx`, `Spinner()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 73`** (2 nodes): `flashcard-session.tsx`, `cn()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 74`** (2 nodes): `import-modal.tsx`, `handleImport()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 75`** (2 nodes): `auth.ts`, `refreshAccessToken()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 76`** (2 nodes): `utils.ts`, `cn()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 77`** (2 nodes): `providers.tsx`, `Providers()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 78`** (1 nodes): `constants.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 79`** (1 nodes): `current-user.decorator.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 80`** (1 nodes): `configuration.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 81`** (1 nodes): `next-env.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 82`** (1 nodes): `next.config.mjs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 83`** (1 nodes): `postcss.config.mjs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 84`** (1 nodes): `tailwind.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 85`** (1 nodes): `middleware.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 86`** (1 nodes): `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 87`** (1 nodes): `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 88`** (1 nodes): `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 89`** (1 nodes): `route.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 90`** (1 nodes): `header.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 91`** (1 nodes): `button.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 92`** (1 nodes): `api.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 93`** (1 nodes): `next-auth.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 94`** (1 nodes): `index.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 95`** (1 nodes): `index.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 96`** (1 nodes): `index.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 97`** (1 nodes): `index.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 98`** (1 nodes): `Free Plan`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 99`** (1 nodes): `GET /vocab/flashcard-session`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Anthropic Claude API` connect `Claude API & Grammar Topics` to `Architecture & Docs`?**
  _High betweenness centrality (0.005) - this node is a cross-community bridge._
- **Why does `GermanUp App` connect `Architecture & Docs` to `Claude API & Grammar Topics`?**
  _High betweenness centrality (0.004) - this node is a cross-community bridge._
- **What connects `AppModule`, `AuthModule`, `GoogleAuthDto` to the rest of the system?**
  _48 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Vocab & Claude AI Service` be split into smaller, more focused modules?**
  _Cohesion score 0.13 - nodes in this community are weakly interconnected._
- **Should `Architecture & Docs` be split into smaller, more focused modules?**
  _Cohesion score 0.12 - nodes in this community are weakly interconnected._