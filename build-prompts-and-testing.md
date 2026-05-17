# GermanUp — Build Prompts & Testing Guide

---

## HOW TO USE THIS DOCUMENT

1. Start a fresh Claude session (claude.ai or API)
2. First message ALWAYS = paste the spec + the phase prompt
3. Work through each phase completely before moving to next
4. After each phase = run the test checklist before continuing
5. If something breaks = paste the error + say "fix this"

---

## GOLDEN RULE FOR EVERY SESSION

Always start your Claude session with:

```
I am building a German learning app called GermanUp.
Full specification: [paste german-app-specification.md here]
Current phase: [X]
What we have done so far: [brief summary]
Now do: [phase prompt below]
```

---

---

# PHASE 1 — Core Setup + Auth + Vocabulary + Flashcards

## Prompt to paste:

```
I am building a German learning app. Full spec: [PASTE SPEC]

Do Phase 1 completely:

1. MONOREPO SETUP
Create a monorepo with:
- /apps/web — NextJS 14 with App Router, TypeScript, Tailwind
- /apps/api — NestJS with TypeScript
- /packages/types — shared TypeScript interfaces
- /packages/db — Prisma schema + client
Root package.json with workspaces.
Turborepo for build pipeline.

2. DATABASE
Implement the FULL Prisma schema from the spec exactly as written.
Configure for PostgreSQL (Supabase connection string from env).
Generate and run migrations.

3. AUTH — NestJS side
- POST /auth/register (email + bcrypt password)
- POST /auth/login (returns JWT access token 15min + refresh token 30 days)
- POST /auth/refresh
- POST /auth/logout
- JWT guard and decorator for protected routes
- User entity linked to Prisma

4. AUTH — NextJS side
- NextAuth.js with email/password provider + Google OAuth provider
- Login page /login
- Register page /register
- Session stored in JWT
- Auth middleware protecting /dashboard and all app routes
- Redirect to /login if not authenticated

5. VOCABULARY — NestJS
- POST /vocab/import (calls Claude API, accepts array of words, returns enriched data, saves to DB)
- GET /vocab (paginated, filter by level)
- DELETE /vocab/:id
- GET /vocab/flashcard-session?size=20&level=A1 (returns words ordered by newest first, prioritizing never-seen and failed words)
- POST /vocab/flashcard-result { wordId, knew: boolean } (updates FlashcardStat: consecutiveKnew++ if knew, reset to 0 if not, mark mastered if consecutiveKnew >= 2)

6. VOCABULARY — NextJS
- /vocabulary page: list of imported words, import button, filter by level
- Import modal: textarea for words, one per line, submit calls API
- /vocabulary/flashcards page: 
  - Session config screen (size 10/20/50, level filter)
  - Flashcard UI: shows English → Space to flip → shows German + gender + plural + example
  - Knew/Didn't know buttons
  - Progress bar
  - Session summary screen

7. DASHBOARD
- /dashboard with:
  - Today's streak counter
  - Daily goal progress bar (target: 20 exercises)
  - Quick action cards: Flashcards / Grammar / Verbs
  - Simple topic grid (A1 topics, all locked for now)

Use these Claude API details:
- Model: claude-sonnet-4-20250514
- API key from env: ANTHROPIC_API_KEY
- Vocab import prompt: [paste vocab import prompt from spec]

All environment variables from spec.
Write production-quality TypeScript, no any types.
Include error handling on all API calls.
```

---

## Phase 1 Testing Checklist

Run every single item. Only move to Phase 2 when ALL pass.

### Setup
- [ ] `npm install` runs without errors in root
- [ ] `npm run dev` starts both NextJS (port 3000) and NestJS (port 3001)
- [ ] No TypeScript errors on startup

### Database
- [ ] Supabase dashboard shows all tables created (User, VocabWord, FlashcardStat, UserVerb, Exercise, TopicProgress, PracticeSession, Subscription)
- [ ] Prisma Studio runs: `cd packages/db && npx prisma studio`
- [ ] All relations visible in Prisma Studio

### Auth — Register
- [ ] Go to /register
- [ ] Fill form with test@test.com / password123
- [ ] Submit → redirects to /dashboard
- [ ] Check Supabase: User row created with hashed password
- [ ] Check: plan = FREE

### Auth — Login
- [ ] Go to /login
- [ ] Login with test@test.com / password123
- [ ] Redirects to /dashboard ✅
- [ ] Wrong password → shows error message ✅

### Auth — Google OAuth
- [ ] Click "Continue with Google"
- [ ] Google popup appears
- [ ] After Google auth → redirected to /dashboard
- [ ] Check Supabase: User created with provider = "google"

### Auth — Protected routes
- [ ] Log out
- [ ] Try to visit /dashboard → redirected to /login ✅
- [ ] Try to visit /vocabulary → redirected to /login ✅

### Auth — Token refresh
- [ ] Open browser devtools → Application → Cookies
- [ ] Check access token exists after login
- [ ] Wait 15 minutes OR manually expire token in DB
- [ ] Refresh page → still logged in (refresh token worked) ✅

### Vocabulary — Import
- [ ] Log in
- [ ] Go to /vocabulary
- [ ] Click Import
- [ ] Type: Hund, Stadt, lernen, schlafen, Freund
- [ ] Submit
- [ ] Loading indicator shows
- [ ] Words appear in list with gender, plural, example ✅
- [ ] Check Supabase: 5 VocabWord rows created for this user
- [ ] Check: FlashcardStat row created for each word

### Vocabulary — List
- [ ] Words show in list ordered by newest first ✅
- [ ] Each word shows: German, English, gender, level
- [ ] Delete button removes word from list and DB ✅
- [ ] Filter by A1 shows only A1 words ✅

### Flashcards — Session config
- [ ] Click Flashcards
- [ ] Session config screen shows: size 10/20/50, level filter
- [ ] Select size 5 (or however many words you imported)
- [ ] Click Start

### Flashcards — Practice
- [ ] Card shows English word ✅
- [ ] Press Space → card flips showing German + gender + plural + example ✅
- [ ] Click Knew It → next card ✅
- [ ] Click Didn't Know → card comes back later in session ✅
- [ ] Progress bar updates ✅
- [ ] After word marked Knew twice consecutively → doesn't reappear ✅
- [ ] Session ends → summary screen with score ✅
- [ ] Check Supabase: FlashcardStat updated (timesShown, timesCorrect, consecutiveKnew) ✅

### Dashboard
- [ ] /dashboard loads without error ✅
- [ ] Streak shows (0 for new user) ✅
- [ ] Daily goal bar shows ✅
- [ ] Quick action cards visible ✅

---

---

# PHASE 2 — Grammar Topics + Exercise Engine

## Prompt to paste:

```
I am building GermanUp. Full spec: [PASTE SPEC]
Phase 1 is complete and tested. Now do Phase 2.

1. EXERCISE GENERATION SCRIPT
Create /scripts/seed/generate-exercises.ts
This script:
- Takes a topic name and exercise type as arguments
- Calls Claude API with the generation prompt from the spec
- Generates 100 exercises per call
- Saves all to Exercise table in DB
- Logs progress and any errors
- Has a --dry-run flag that prints exercises without saving

Run it like: npx ts-node generate-exercises.ts --topic=cases --type=FILL_BLANK --batches=5

Claude prompt for generation (insert in script):
"""
You are building a German A1 exercise database.
Topic: {TOPIC}
Exercise type: {TYPE}
Batch: {N} of {TOTAL}
Do not repeat these previously used question stems: {PREVIOUS_STEMS}

Rules:
- Vary nouns and verbs widely across exercises
- Use fun everyday themes: dogs, food, travel, friends, family, city
- Mix difficulty: 40% EASY, 40% MEDIUM, 20% HARD
- Every answer must be 100% grammatically correct German
- Explanations in simple English, max 1 sentence

Return ONLY a valid JSON array, zero extra text, no markdown:
[{
  "topic": "{TOPIC}",
  "level": "A1",
  "type": "{TYPE}",
  "question": "...",
  "options": ["a","b","c","d"] or null,
  "answer": "...",
  "explanation": "...",
  "difficulty": "EASY"|"MEDIUM"|"HARD"
}]
"""

Generate these exercise sets (run script for each):
- cases: FILL_BLANK x5 batches, MULTIPLE_CHOICE x3 batches, IDENTIFY x2 batches
- pronouns_personal: FILL_BLANK x3, MULTIPLE_CHOICE x3
- pronouns_possessive: FILL_BLANK x3, MULTIPLE_CHOICE x3
- modals: FILL_BLANK x3, MULTIPLE_CHOICE x3
- prepositions_dativ: MULTIPLE_CHOICE x3, FILL_BLANK x2
- prepositions_akkusativ: MULTIPLE_CHOICE x3, FILL_BLANK x2
- prepositions_twoway: MULTIPLE_CHOICE x3, FILL_BLANK x3, IDENTIFY x2
- imperative: FILL_BLANK x2, MULTIPLE_CHOICE x2
- separable_verbs: FILL_BLANK x3, MULTIPLE_CHOICE x2
- future_werden: FILL_BLANK x2, MULTIPLE_CHOICE x2
- numbers_time: FILL_BLANK x2, MULTIPLE_CHOICE x2

2. EXERCISE API — NestJS
- GET /exercises?topic=cases&difficulty=mixed&limit=20&type=FILL_BLANK
  Returns random exercises from DB matching filters
  Tracks which exercises this user has seen recently (avoid repeats)
- POST /exercises/result { exerciseId, correct: boolean }
  Updates Exercise stats (timesShown, timesCorrect)
  Updates TopicProgress for this user
- POST /exercises/correct-translation (Pro only)
  Body: { topic, task, studentAnswer }
  Calls Claude API with correction prompt from spec
  Returns correction JSON
- POST /exercises/correct-freewrite (Pro only)  
  Body: { topic, requiredElements, studentAnswer }
  Calls Claude API
  Returns correction JSON

3. GRAMMAR TOPICS — NextJS
- /grammar page:
  Grid of all 13 A1 topics as cards
  Each card shows: topic name, progress bar, lock icon if locked
  Topics unlock in order (complete topic N to unlock N+1)
  First 3 topics unlocked by default

- /grammar/a1/[topic] page with two tabs:

  TAB 1 — Theory:
  Static content for each topic (hardcode the theory from our lessons)
  Clean readable layout with examples in colored boxes
  No API calls

  TAB 2 — Practice:
  Difficulty selector: Easy / Medium / Hard / Mixed
  Exercise type tabs: Fill Blank / Multiple Choice / Translation / Free Write
  Translation and Free Write show "Pro feature" lock for free users

  Exercise UI:
  - Fill blank: sentence with ___ → text input → submit → show result + explanation
  - Multiple choice: question + 4 buttons → click → show result + explanation
  - Translation: English sentence → textarea → submit → Claude corrects (Pro)
  - Free write: scenario text → textarea → submit → Claude corrects (Pro)
  
  After each answer:
  - Green/red flash on the answer
  - Show correct answer
  - Show explanation
  - Next button

  Progress tracked: exercises done, correct percentage per topic

4. PROGRESS — NestJS + NextJS
- GET /progress → all topics summary
- GET /progress/:topic → detailed stats for one topic
- /progress page: 
  Grid of topics with % correct
  Streak calendar (last 30 days)
  Total exercises done
  Weakest topics highlighted

All theory content for all 13 A1 topics must be hardcoded from this content:
[paste the theory sections from our German lessons above — cases, pronouns, modals, prepositions etc.]
```

---

## Phase 2 Testing Checklist

### Exercise Generation Script
- [ ] Script runs without errors: `npx ts-node generate-exercises.ts --topic=cases --type=FILL_BLANK --batches=1 --dry-run`
- [ ] Dry run prints valid JSON array ✅
- [ ] Real run saves to DB: check Supabase Exercise table has rows ✅
- [ ] Run for cases topic: at least 500 rows with topic="cases" ✅
- [ ] Exercises have varied questions (not all the same noun) ✅
- [ ] Difficulty mix: roughly 40/40/20 ✅
- [ ] No duplicate questions in same topic ✅

### Exercise API
- [ ] GET /exercises?topic=cases&limit=10 returns 10 exercises ✅
- [ ] GET /exercises?topic=cases&difficulty=EASY&limit=10 returns only EASY ✅
- [ ] GET /exercises?topic=cases&type=MULTIPLE_CHOICE returns only MC ✅
- [ ] POST /exercises/result saves to DB ✅
- [ ] POST /exercises/result updates TopicProgress for user ✅
- [ ] POST /exercises/correct-translation fails with 403 for Free user ✅
- [ ] POST /exercises/correct-translation works for Pro user ✅ (manually set plan=PRO in DB to test)
- [ ] Claude correction returns valid JSON with correct/corrected/errors/explanation ✅

### Grammar Pages
- [ ] /grammar loads with 13 topic cards ✅
- [ ] First 3 topics unlocked, rest locked ✅
- [ ] Click locked topic → shows "Complete previous topic" message ✅
- [ ] Click unlocked topic → goes to /grammar/a1/cases ✅

### Theory Tab
- [ ] All theory content displays correctly ✅
- [ ] Examples in colored boxes ✅
- [ ] No API calls on theory tab (check Network tab in devtools) ✅

### Practice Tab — Fill Blank
- [ ] Exercises load from DB ✅
- [ ] Type answer → submit → green if correct ✅
- [ ] Type wrong answer → red + shows correct answer ✅
- [ ] Explanation shows after answer ✅
- [ ] Next button loads next exercise ✅
- [ ] After 10 exercises → summary screen ✅

### Practice Tab — Multiple Choice
- [ ] 4 options show ✅
- [ ] Click correct → green ✅
- [ ] Click wrong → red + highlights correct answer ✅

### Practice Tab — Translation (Pro)
- [ ] Free user sees locked screen ✅
- [ ] Pro user sees textarea ✅
- [ ] Submit → Claude returns correction ✅
- [ ] Errors shown clearly ✅
- [ ] Loading spinner during API call ✅

### Progress
- [ ] /progress loads ✅
- [ ] After doing 10 exercises in cases → cases shows progress ✅
- [ ] % correct updates in real time ✅
- [ ] Streak shows 1 after first practice day ✅

### Topic Unlock
- [ ] Complete 20 exercises in topic 1 → topic 2 unlocks ✅
- [ ] Unlock animation plays ✅

---

---

# PHASE 3 — Verbs + Stripe + Pro Gates

## Prompt to paste:

```
I am building GermanUp. Full spec: [PASTE SPEC]
Phases 1 and 2 complete and tested. Now do Phase 3.

1. VERB CONJUGATION — NestJS
- POST /verbs/import
  Accepts: { infinitive: string }
  Calls Claude API with verb import prompt from spec
  Saves UserVerb + ConjugationStat rows (one per pronoun per tense)
  Pro users only
- GET /verbs — list user's imported verbs
- DELETE /verbs/:id
- GET /verbs/practice-session?verbIds=[...]&tense=praesens
  Returns practice items: { verbId, infinitive, pronoun, tense }
  Only irregular verbs
  Prioritize pronouns with lowest correct% for this user
- POST /verbs/conjugation-result { verbId, pronoun, tense, correct }
  Updates ConjugationStat

2. VERB CONJUGATION — NextJS
- /verbs page:
  List of imported verbs with irregular badge
  Conjugation table visible on click/expand
  Import button (Pro only)
  Practice button
- /verbs/practice page:
  User selects verbs to practice (checkboxes)
  Select tense: Präsens / Imperfekt / Both
  Practice UI:
    Shows: infinitive + pronoun → user types form
    Enter to submit
    Green/red result
    Shows correct form if wrong
    No API call — compares with DB
  Session summary: score per verb, weakest forms highlighted

3. STRIPE INTEGRATION — NestJS
- POST /subscription/checkout
  Creates Stripe checkout session
  Price: €7/month recurring
  Success URL: /dashboard?upgraded=true
  Cancel URL: /pricing
- POST /subscription/webhook
  Handles: checkout.session.completed → set user.plan = PRO
  Handles: customer.subscription.deleted → set user.plan = FREE
  Handles: invoice.payment_failed → email user (just log for now)
- GET /subscription/status → returns plan + expiry date
- POST /subscription/portal → Stripe customer portal URL

4. PRO GATES — NextJS
Add Pro gates to:
- Vocabulary import button → if FREE show upgrade modal
- Translation + Free write exercises → show upgrade modal
- Verb import → show upgrade modal
- /verbs/practice with >3 verbs → show upgrade modal

Upgrade modal:
- Shows Pro features list
- "Upgrade for €7/month" button → calls /subscription/checkout → redirects to Stripe

5. PRICING PAGE
- /pricing page:
  Free tier features list
  Pro tier features list
  "Get Pro" button → Stripe checkout
  If already Pro → shows "You're on Pro ✅"

Stripe config:
- Secret key from env STRIPE_SECRET_KEY
- Webhook secret from env STRIPE_WEBHOOK_SECRET
- Use Stripe CLI for local webhook testing: stripe listen --forward-to localhost:3001/subscription/webhook
```

---

## Phase 3 Testing Checklist

### Verb Import
- [ ] Set user plan = PRO in Supabase
- [ ] Go to /verbs → click Import
- [ ] Type: sprechen → submit
- [ ] Loading shows ✅
- [ ] Verb appears in list with conjugation table ✅
- [ ] isIrregular = true for sprechen ✅
- [ ] Check Supabase: UserVerb row + 12 ConjugationStat rows (6 pronouns x 2 tenses) ✅
- [ ] Import regular verb: lernen → isIrregular = false ✅

### Verb Practice
- [ ] Click Practice
- [ ] Select sprechen
- [ ] Select Präsens
- [ ] Shows: sprechen → du → [input] ✅
- [ ] Type sprichst → Enter → green ✅
- [ ] Type wrong → red + shows sprichst ✅
- [ ] No API call made (check Network tab) ✅
- [ ] Session summary shows score ✅
- [ ] ConjugationStat updated in Supabase ✅

### Stripe — Local testing
- [ ] Install Stripe CLI
- [ ] Run: stripe listen --forward-to localhost:3001/subscription/webhook
- [ ] Click Upgrade button → redirected to Stripe checkout page ✅
- [ ] Use test card: 4242 4242 4242 4242, any expiry, any CVC
- [ ] After payment → redirected to /dashboard?upgraded=true ✅
- [ ] Check Supabase: user.plan = PRO ✅
- [ ] Stripe CLI shows: checkout.session.completed received ✅

### Stripe — Cancellation
- [ ] Go to /settings
- [ ] Click Manage Subscription → Stripe portal opens ✅
- [ ] Cancel subscription in portal
- [ ] Stripe CLI shows: customer.subscription.deleted ✅
- [ ] Check Supabase: user.plan = FREE ✅

### Pro Gates
- [ ] Set user plan = FREE in Supabase
- [ ] Try to import vocabulary → upgrade modal shows ✅
- [ ] Try translation exercise → upgrade modal shows ✅
- [ ] Try verb import → upgrade modal shows ✅
- [ ] Modal has correct Pro features list ✅
- [ ] Click Upgrade → Stripe checkout opens ✅

### Pricing Page
- [ ] /pricing loads ✅
- [ ] Free and Pro columns show ✅
- [ ] Get Pro button works ✅
- [ ] Logged in Pro user sees "You're on Pro ✅" ✅

---

---

# PHASE 4 — Polish + SEO + Deploy

## Prompt to paste:

```
I am building GermanUp. Full spec: [PASTE SPEC]
Phases 1, 2, 3 complete and tested. Now do Phase 4.

1. STREAK SYSTEM
- User gets +1 streak for each day they complete at least 10 exercises
- Streak resets to 0 if they miss a day
- Streak stored on User model (add streakCount + lastActiveDate fields)
- Dashboard shows current streak with fire emoji
- Streak freeze: Pro users can freeze streak for 1 day per week

2. DAILY GOALS
- Default goal: 20 exercises per day
- Track exercises done today (count from PracticeSession where date = today)
- Dashboard progress bar: X / 20 exercises today
- Celebrate with animation when goal reached

3. MOBILE RESPONSIVE
Audit and fix all pages for mobile (375px width):
- Dashboard cards stack vertically
- Flashcard UI works with touch (tap to flip instead of Space)
- Exercise UI full width inputs
- Navigation becomes hamburger menu on mobile
- Verb conjugation table scrolls horizontally

4. LANDING PAGE
/ route (not logged in):
- Hero: "Master German Grammar — One Rule at a Time"
- Feature highlights: Flashcards / AI Correction / Progress Tracking
- Pricing section (same as /pricing)
- CTA: "Start for Free"
- Clean professional design

5. SEO
- Meta tags on all pages
- OpenGraph tags for social sharing
- robots.txt
- sitemap.xml (static pages only)
- Page titles: "GermanUp — Learn German A1 Grammar"

6. ERROR HANDLING AUDIT
Check every API call has:
- Loading state ✅
- Error state with user-friendly message ✅
- Retry button where appropriate ✅
- No raw error messages shown to user ✅

7. RATE LIMITING — NestJS
Add rate limiting to Claude API endpoints:
- /vocab/import: max 10 calls per user per day
- /verbs/import: max 20 calls per user per day
- /exercises/correct-translation: max 50 calls per user per day (Pro)
- /exercises/correct-freewrite: max 30 calls per user per day (Pro)
Use nestjs-throttler or track in DB.

8. DEPLOY
Frontend — Vercel:
- Connect GitHub repo
- Set all NEXT_PUBLIC_ env variables
- Auto-deploy on main branch push

Backend — Railway:
- Connect GitHub repo  
- Set all backend env variables
- Add PostgreSQL plugin OR connect to Supabase
- Health check endpoint: GET /health → { status: "ok" }

Post-deploy checks:
- Test register/login on production URL
- Test one vocabulary import
- Test one exercise session
- Test Stripe checkout with test card
```

---

## Phase 4 Testing Checklist

### Streak
- [ ] Complete 10 exercises → streak = 1 ✅
- [ ] Come back next day → streak = 2 ✅
- [ ] Skip a day → streak resets to 0 ✅
- [ ] Dashboard shows streak with 🔥 ✅

### Daily Goals
- [ ] Fresh day → progress bar at 0/20 ✅
- [ ] Do 10 exercises → bar at 10/20 ✅
- [ ] Do 20 → bar full + celebration animation ✅

### Mobile
- [ ] Open on mobile (or Chrome devtools 375px)
- [ ] Dashboard looks good ✅
- [ ] Tap flashcard to flip ✅
- [ ] Exercise inputs full width ✅
- [ ] Navigation hamburger works ✅

### Landing Page
- [ ] / shows landing page for logged-out users ✅
- [ ] / shows dashboard for logged-in users ✅
- [ ] CTA button goes to /register ✅

### Rate Limiting
- [ ] Import 11 vocabulary batches in one day → 11th returns 429 error ✅
- [ ] Error message shown to user: "Daily import limit reached" ✅

### Deploy — Vercel
- [ ] Push to main → Vercel auto-deploys ✅
- [ ] Production URL loads ✅
- [ ] No console errors on production ✅

### Deploy — Railway
- [ ] NestJS health check: GET https://api.yourapp.com/health → { status: "ok" } ✅
- [ ] Register new user on production ✅
- [ ] Login works ✅
- [ ] Import vocabulary works ✅

### Full E2E on Production
- [ ] Register new account ✅
- [ ] Import 5 vocabulary words ✅
- [ ] Do a flashcard session ✅
- [ ] Go to /grammar/a1/cases ✅
- [ ] Read theory ✅
- [ ] Do 10 fill blank exercises ✅
- [ ] Progress updates ✅
- [ ] Upgrade to Pro (Stripe test card) ✅
- [ ] Import a verb ✅
- [ ] Do translation exercise with AI correction ✅
- [ ] Check /progress dashboard ✅

---

---

# WHEN THINGS BREAK — Debug Prompts

## Claude API not responding:
```
This API call to Claude is failing. Here is the full error:
[paste error]
Here is my current code:
[paste code]
Fix it. The API key is set correctly in env — the issue is in the code.
```

## Prisma/DB errors:
```
I'm getting this Prisma error:
[paste error]
My schema is:
[paste relevant schema section]
Fix the query and explain what was wrong.
```

## Auth not working:
```
Authentication is broken. Symptom: [describe what happens]
My NextAuth config: [paste]
My NestJS JWT guard: [paste]
Error in console: [paste]
Fix it completely.
```

## Stripe webhook not firing:
```
Stripe webhook is not updating the user's plan.
Stripe CLI shows the event was received: [paste CLI output]
My webhook handler: [paste code]
My Supabase shows plan is still FREE.
Find the bug and fix it.
```

## Exercise generation producing bad data:
```
My exercise generation script is producing exercises with wrong answers.
Example bad exercise: [paste]
My generation prompt: [paste]
Fix the prompt to ensure grammatically correct German answers only.
Add a validation step that re-asks Claude to verify each answer before saving.
```

---

---

# QUICK REFERENCE — How to manually test Claude API calls

Use this curl command to test any endpoint directly:

```bash
# Get JWT token first
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123"}'

# Copy the accessToken from response, then:

# Test vocab import
curl -X POST http://localhost:3001/vocab/import \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"words":["Hund","Stadt","lernen"]}'

# Test exercise fetch
curl "http://localhost:3001/exercises?topic=cases&limit=5" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test AI correction (need Pro user)
curl -X POST http://localhost:3001/exercises/correct-translation \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"topic":"cases","task":"Translate: I give the dog water","studentAnswer":"Ich gebe dem Hund Wasser"}'
```

---

*End of build prompts and testing guide*
