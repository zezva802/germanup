# GermanUp — Full Project Specification & Linear Tasks

**Date:** 2026-05-23  
**Status:** Active spec — use this as the source of truth for what to build next.

---

## Project Direction

### What we're building
A German A1 learning app that makes users feel **focused, calm, and in control** — not like a gamified app that's trying to entertain them. The vibe is closer to a good textbook + flashcard system than Duolingo.

### Design principle: Focused Study Feel
- Calm backgrounds — dark mode preferred (slate/zinc palette, near-black). Light mode should feel like aged paper, not blinding white.
- Lots of whitespace. Let content breathe.
- Typography is the hero — readable, clean, good hierarchy.
- Accent color = one muted green or blue. Never red/orange/yellow for decoration.
- Animations only for feedback (correct/wrong answer), never for decoration.
- Sidebar stays out of the way. Content is center stage.

### Priority order for this sprint
1. **Challenge system** — 5 challenges fully live in the app
2. **Words page** — replace /vocabulary + /verbs with new /words page
3. **Import UX redesign** — vocab and verb import feels smooth and confident
4. **Design overhaul** — main pages feel like the design principle above
5. **Code cleanup** — commit everything, delete clutter

---

## EPIC 1 — Code Cleanup & Git Hygiene
*Get the repo into a clean, honest state before building anything new.*

---

### TASK-001 · Commit the new /words page
**Priority:** P1 (Urgent)  
**Label:** Cleanup  

**Context:**  
`apps/web/src/app/(app)/words/page.tsx` is fully implemented (532 lines) but untracked in git. It has noun list with gender colors, verb cards with expandable conjugation tables, import modal with noun/verb tabs, search/filter, delete. It's done — it just needs to be committed.

**Steps:**
- Stage `apps/web/src/app/(app)/words/`
- Stage `apps/web/src/components/layout/theme-accent.tsx` (if keeping it)
- Stage challenge assets in `apps/web/public/challenges/`
- Review the uncommitted changes in grammar practice tab, layout, middleware, globals.css
- Commit all of these in one clean commit: `feat: words page, challenge assets, grammar fixes`

**Acceptance criteria:**
- [ ] `git status` shows no untracked files in `apps/web/src`
- [ ] All challenge background images and icons are committed
- [ ] Modified files (grammar, layout, middleware, CSS) are reviewed and committed or reverted intentionally

---

### TASK-002 · Delete root HTML mockup files
**Priority:** P2  
**Label:** Cleanup  

**Context:**  
The project root has 10+ standalone HTML files that were used for design exploration: `design-preview.html`, `design-v2.html` through `design-v6.html`, `design-vocab.html`, `challenges-mockup.html`, `theme-mockup.html`, `words-mockup.html`, `challenge-architect.html`, `challenge-arena.html`, `challenge-detective.html`, `challenge-navigator.html`, `challenge-shapeshifter.html`. These are not part of the app and clutter the repo.

**Steps:**
- Move any still-useful mockups to `/docs/mockups/` if you want to keep them
- Delete the rest
- Commit: `chore: remove design mockup HTML files from root`

**Acceptance criteria:**
- [ ] No `.html` files in the repo root
- [ ] Repo root only contains config files, CLAUDE.md, CURRICULUM.md, package.json, turbo.json, etc.

---

### TASK-003 · Delete old /vocabulary and /verbs pages
**Priority:** P1  
**Label:** Cleanup + Frontend  

**Context:**  
Once the new `/words` page is live and wired into the sidebar, the old `/vocabulary` and `/verbs` pages are dead code. The new page consolidates both into one screen.

**Steps:**
- Delete `apps/web/src/app/(app)/vocabulary/` (entire directory)
- Delete `apps/web/src/app/(app)/verbs/` (entire directory)
- Add redirects in `next.config.mjs`:
  - `/vocabulary` → `/words`
  - `/verbs` → `/words`
- Update sidebar link: remove "Vocabulary" and "Verbs" entries, add single "Words" entry
- Update any internal links pointing to `/vocabulary` or `/verbs`

**Acceptance criteria:**
- [ ] `/vocabulary` and `/verbs` routes redirect to `/words` (not 404)
- [ ] Sidebar shows "Words" not "Vocabulary" and "Verbs" as separate items
- [ ] No dead imports referencing the deleted pages
- [ ] No broken links anywhere in the app

---

### TASK-004 · Review and fix middleware (uncommitted change)
**Priority:** P1  
**Label:** Backend / Auth  

**Context:**  
`apps/web/src/middleware.ts` has uncommitted modifications. Before moving forward, understand what changed and make sure it's intentional.

**Steps:**
- Run `git diff apps/web/src/middleware.ts` to see what changed
- If the change is needed, commit it with a descriptive message
- If it was accidental, revert it
- Verify that protected routes (/dashboard, /words, /grammar, /progress, /settings) still require auth
- Verify that `/words` is in the protected route list (it likely isn't yet since the page was added without updating middleware)

**Acceptance criteria:**
- [ ] Middleware is committed with no leftover uncommitted changes
- [ ] `/words` route is protected (redirects to login if not authed)
- [ ] All existing protected routes still work

---

## EPIC 2 — Words Page (Replace Vocabulary + Verbs)
*Single unified page for managing all words the user is learning.*

---

### TASK-005 · Wire /words into sidebar navigation
**Priority:** P1  
**Label:** Frontend  

**Context:**  
The sidebar (`apps/web/src/components/layout/app-sidebar.tsx`) currently has separate "Vocabulary" and "Verbs" items. We need to replace those with a single "Words" item pointing to `/words`.

**Steps:**
- Open `app-sidebar.tsx`
- Remove the "Vocabulary" nav item (href: `/vocabulary`)
- Remove the "Verbs" nav item (href: `/verbs`)
- Add "Words" nav item (href: `/words`) with an appropriate icon (e.g., `BookOpen` from lucide-react)
- Make sure the active state highlights correctly when on `/words`

**Acceptance criteria:**
- [ ] Sidebar shows "Words" as a single item where "Vocabulary" and "Verbs" used to be
- [ ] Clicking "Words" navigates to `/words` and highlights the nav item
- [ ] No leftover Vocabulary/Verbs nav items

---

### TASK-006 · Audit and polish the /words page UI
**Priority:** P1  
**Label:** Frontend + Design  

**Context:**  
The `/words` page is implemented but was built during a fast development phase. It needs to be reviewed against the "calm, focused" design principle before it becomes the primary words management page.

**Checklist to review:**
- Does the noun list with gender colors (blue = der, red = die, green = das) look clean and readable?
- Do verb cards with expandable conjugation tables feel good to use?
- Is the search/filter bar subtle and not distracting?
- Are delete buttons appropriately subtle (not red alarming buttons everywhere)?
- Does the import button stand out appropriately as the primary action?
- Is the flashcard link clearly accessible?
- Does the empty state (no words yet) look good and give the user a clear action?

**Steps:**
- Visit `/words` in the running dev app
- Review each section against the design principle
- Fix spacing, color, or layout issues found
- Ensure the page looks good at 375px (mobile) and 1280px (desktop)

**Acceptance criteria:**
- [ ] Page feels calm and study-focused, not cluttered
- [ ] Gender colors are readable in both light and dark mode
- [ ] Empty state is friendly and shows import/add actions clearly
- [ ] Mobile layout is usable (no overflow, readable cards)
- [ ] Conjugation table expansion animates smoothly (or just toggles — no janky transitions)

---

### TASK-007 · Add flashcard link/entry from /words page
**Priority:** P2  
**Label:** Frontend  

**Context:**  
The old `/vocabulary/flashcards` route needs to be reachable from the new `/words` page. Check whether the words page already links to it. If so, verify the route still works after deleting the old vocabulary directory.

**Steps:**
- Move flashcard page from `/vocabulary/flashcards/` to `/words/flashcards/` (or keep it at `/vocabulary/flashcards` with a redirect)
- Easier option: keep `/vocabulary/flashcards` route as-is but just accessible from the new words page
- Make sure the link in the words page header/toolbar goes to the correct URL
- After clicking "Flashcards" from the words page, the session should start correctly

**Acceptance criteria:**
- [ ] "Flashcards" action on /words page works and starts a session
- [ ] Flashcard session shows the user's actual words (nouns + verbs or just nouns — decide which)
- [ ] Back button from flashcards returns to /words

---

## EPIC 3 — Import UX Redesign
*Adding words/verbs should feel smooth, clear, and confidence-inspiring.*

---

### TASK-008 · Redesign the noun import flow
**Priority:** P2  
**Label:** Frontend + Design  

**Context:**  
The current import is a modal with a text area for bulk import. It works but feels rough. The new flow should feel like: "I type a word, I see what will be added, I confirm."

**New noun import flow:**
1. User opens import from /words page
2. Tab: "Add Noun" | "Bulk Import"
3. **Add Noun (single):** 
   - Type German word (e.g., "Hund")
   - On type or submit, trigger Wiktionary lookup → show preview card: article (der/die/das), plural, example
   - User can override article/plural if Wiktionary got it wrong
   - Click "Add to my words" → word added, modal stays open for next word
4. **Bulk Import (Pro):**
   - Textarea: paste one word per line
   - "Preview" button → show a list of all words that will be added with their genders (Claude batch lookup)
   - "Confirm import" → adds all
   - Show which words failed lookup and let user fix them

**Steps:**
- Redesign the import modal component (`vocabulary/import-modal.tsx` or wherever it lives)
- Implement the preview card for single noun add (uses existing `/vocab/lookup` endpoint)
- Implement the bulk preview list
- Polish the error states (word not found, offline, API error)

**Acceptance criteria:**
- [ ] Single noun add shows preview before confirming
- [ ] User can override article/plural from Wiktionary
- [ ] Bulk import shows preview list before committing
- [ ] Failed lookups are clearly shown with option to retry or skip
- [ ] Modal doesn't close between word additions (user can add several in a row)

---

### TASK-009 · Redesign the verb import flow
**Priority:** P2  
**Label:** Frontend + Design  

**Context:**  
Verb import calls Claude to generate conjugations. This costs a small amount per call and takes 1-2 seconds. The UX should reflect that — show a loading state, then a full preview of the conjugation table before the user confirms.

**New verb import flow:**
1. User types infinitive (e.g., "gehen")
2. Hits "Look up" → loading spinner → Claude returns conjugation data
3. Preview card shows:
   - Full Präsens conjugation table (ich/du/er/wir/ihr/sie)
   - Imperfekt form
   - Partizip II
   - Hilfsverb (haben/sein)
   - Example sentence
4. User can edit any field if Claude got something wrong
5. Click "Add verb" → added, form resets for next verb

**Steps:**
- Create or redesign verb import section in the import modal
- Hit existing `/verbs/import` endpoint
- Show full conjugation preview table (editable)
- Handle the loading state gracefully (Claude call takes 1-2s)
- Handle Pro gate (show upgrade prompt if user is Free)

**Acceptance criteria:**
- [ ] Verb import shows full conjugation preview before saving
- [ ] All fields in the preview are editable before confirming
- [ ] Loading state is clearly shown while Claude generates
- [ ] Free users see an upgrade prompt instead of the import form
- [ ] Error states (verb not found, Claude failure) are shown clearly

---

### TASK-010 · Merge noun and verb import into one cohesive modal
**Priority:** P2  
**Label:** Frontend  

**Context:**  
Both import flows should live in one modal, accessible from the /words page. The modal should feel like a focused tool — dark background overlay, clean card, clear tabs.

**Design spec:**
- Modal title: "Add to your words"
- Tabs: "Noun" | "Verb" | "Bulk (Pro)"
- Tab switching doesn't close or reset the other tabs' state
- ESC key closes modal
- Click outside closes modal
- On mobile: modal takes full screen height (slide up from bottom)

**Acceptance criteria:**
- [ ] Single modal has Noun / Verb / Bulk tabs
- [ ] Switching tabs doesn't lose typed content in other tabs
- [ ] Modal is keyboard navigable (ESC closes, Tab moves between fields)
- [ ] On mobile: full-screen slide-up behavior
- [ ] Success state (word added) shows brief confirmation then auto-focuses the input for next word

---

## EPIC 4 — Challenge System
*5 fully playable challenges, each with a distinct mechanic and a clear learning goal.*

---

### TASK-011 · Create challenge hub page
**Priority:** P1  
**Label:** Frontend  

**Context:**  
There's no page in the app that shows the 5 challenges as a selection screen. The route `/grammar/challenge/[slug]` exists but there's no index page to navigate from. We need a hub page that shows all challenges with their current state (locked, available, in-progress, completed).

**Challenge cards should show:**
- Challenge name + icon (icons already exist in `/public/challenges/`)
- One-line description of what it tests
- Mechanic hint ("drag to sort", "fill the gap", "spot the mistake")
- User's best score / completion status
- Locked badge if not available yet (or just lock by A1 completion %)

**Page route:** `/grammar/challenges` (new route)

**Sidebar update:** Add "Challenges" item under Grammar section in sidebar.

**Design notes:**
- Background images in `/public/challenges/` (bg-navigator.png etc) — use as card backgrounds with a dark overlay
- Grid layout: 2 columns on desktop, 1 column on mobile
- Cards should feel like "entering a room" — atmospheric, not just buttons

**Steps:**
- Create `apps/web/src/app/(app)/grammar/challenges/page.tsx`
- Render 5 challenge cards with background images + icons
- Fetch user's challenge progress (can be stubbed with zeroes initially)
- Wire up navigation: each card links to `/grammar/challenge/[slug]`
- Add "Challenges" to sidebar under Grammar

**Acceptance criteria:**
- [ ] `/grammar/challenges` renders all 5 challenge cards
- [ ] Each card shows background image with dark overlay + icon + name + description
- [ ] Clicking a card navigates to that challenge's page
- [ ] "Challenges" appears in the sidebar under Grammar
- [ ] Page looks good on mobile (stacked single column)

---

### TASK-012 · Build The Navigator (SORT challenge)
**Priority:** P1  
**Label:** Frontend + Data  

**Context:**  
The Navigator tests word order. User drags (or taps to select) words into the correct sentence order. Exercise data for this challenge exists in `sort-exercises.json` and should be imported into the DB via admin panel. Background + icon assets already exist.

**Mechanic:**
- Show a shuffled sentence as word tiles
- User drags tiles (or clicks them in order) to arrange the sentence
- Submit → show correct/incorrect + explanation
- Move to next exercise

**Challenge page route:** `/grammar/challenge/navigator`

**Steps:**
1. Import `sort-exercises.json` via admin panel → exercises are in DB with type = SORT
2. Build the challenge page component:
   - Header: challenge name, progress (e.g., "Exercise 3/10"), exit button
   - Word tiles (drag-and-drop using a library like `@dnd-kit/core` or simple click-to-slot)
   - Submit button → feedback → next
   - End screen: score, replay option
3. API: use existing `GET /exercises?topic=X&type=SORT&limit=10` endpoint
4. Record results via `POST /exercises/result`

**Acceptance criteria:**
- [ ] User can rearrange word tiles by drag-and-drop (desktop) and tap-to-place (mobile)
- [ ] Submit shows green (correct) or red (incorrect) + explanation
- [ ] Progress bar shows current exercise number
- [ ] End screen shows final score and "Play again" option
- [ ] Results are saved (exercise result recorded in DB)
- [ ] Challenge accessible from hub page at `/grammar/challenges`

---

### TASK-013 · Create SORT exercise data for The Navigator
**Priority:** P1  
**Label:** Data / Admin  

**Context:**  
`sort-exercises.json` exists at the repo root. It needs to be imported into the database via the admin panel. Check the format matches what the admin bulk import endpoint expects.

**Steps:**
- Open `sort-exercises.json` and verify the JSON format matches the admin import schema (type, topic, question, options, answer, explanation, difficulty, level)
- Go to `/admin/exercises` → bulk import → paste the JSON
- Verify exercises appear in the admin table with type = SORT
- If format doesn't match, transform the JSON to match

**Acceptance criteria:**
- [ ] All exercises from `sort-exercises.json` are in the database
- [ ] They appear in admin panel filtered by type = SORT
- [ ] Running `GET /exercises?type=SORT&limit=5` returns exercises from these data

---

### TASK-014 · Build The Detective (ERROR_SPOT challenge)
**Priority:** P1  
**Label:** Frontend + Data  

**Context:**  
The Detective tests the ability to spot grammar errors. A sentence is shown with one mistake. The user identifies the error by clicking/highlighting the wrong word.

**Mechanic:**
- Show a sentence with one grammar mistake
- Sentence is rendered as clickable word spans
- User clicks the word they think is wrong
- Submit → show which word was wrong + explanation of the rule

**Data needed:** ~30 ERROR_SPOT exercises. Use admin panel + Claude to generate these, or generate them manually based on CURRICULUM.md topics.

**Exercise format:**
```json
{
  "type": "ERROR_SPOT",
  "topic": "articles",
  "level": "A1",
  "question": "Der Mann kauft eine Brot im Supermarkt.",
  "answer": "eine",
  "explanation": "'Brot' is neuter (das), so the article in accusative case is 'ein', not 'eine'.",
  "difficulty": "EASY"
}
```

**Steps:**
1. Generate 30 ERROR_SPOT exercises covering A1 topics from CURRICULUM.md
2. Import via admin panel
3. Build challenge page:
   - Sentence rendered as clickable word tokens
   - Highlight selected word in yellow
   - Submit → green checkmark on correct word, red on selected word if wrong
   - Show explanation
4. Use existing exercises endpoint and result recording

**Acceptance criteria:**
- [ ] 30+ ERROR_SPOT exercises in DB covering A1 topics
- [ ] User can click words in a sentence to select a suspected error
- [ ] Submit shows the correct answer + rule explanation
- [ ] Challenge works on mobile (tap to select word)
- [ ] Accessible from challenge hub

---

### TASK-015 · Build The Architect (BUILD challenge)
**Priority:** P1  
**Label:** Frontend + Data  

**Context:**  
The Architect tests sentence construction. The user is given a set of words and must arrange them to match a given meaning or translation prompt.

**Mechanic:**
- Show a translation prompt (e.g., "The man buys bread.")
- Show a pool of German words (word tiles) — includes the correct words plus 2-3 distractors
- User builds the sentence by clicking tiles in order
- Tiles are added to a construction bar at the top
- User can click placed tiles to remove them back to the pool

**Key difference from Navigator:** The Architect gives a meaning prompt and provides distractors. The Navigator shuffles a real sentence.

**Steps:**
1. Generate 30 BUILD exercises via admin panel (give Claude the format and ask for A1 exercises)
2. Build the challenge page:
   - Translation prompt at top
   - Construction bar (shows tiles user has placed)
   - Word tile pool below
   - Tiles move between pool and bar on click
   - Submit → correct/incorrect + explanation

**Acceptance criteria:**
- [ ] 30 BUILD exercises in DB
- [ ] Clicking a word tile moves it to the construction bar
- [ ] Clicking a placed tile removes it back to the pool
- [ ] Submit evaluates full sentence match
- [ ] End screen shows score

---

### TASK-016 · Build The Shapeshifter (FILL_BLANK challenge)
**Priority:** P2  
**Label:** Frontend + Data  

**Context:**  
The Shapeshifter tests word forms — case endings, adjective agreements, verb conjugations. The user fills in a blank with the correct form of a word.

**Mechanic:**
- Show a sentence with one blank
- The prompt shows the base form of the word to use (e.g., "gut → ___")
- User types the correct inflected form
- Submit → correct/wrong + explanation

**Note:** This is functionally similar to FILL_BLANK exercises that already exist. The "Shapeshifter" branding gives it a theme. Check if existing FILL_BLANK exercises can be used or if new ones targeting specifically word-form changes are needed.

**Steps:**
1. Audit existing FILL_BLANK exercises in DB — are there enough (30+) that test word forms specifically?
2. If not, generate targeted FILL_BLANK exercises focused on case/adjective/conjugation
3. Build challenge page:
   - Sentence with blank shown as `___`
   - Text input for the answer
   - Hint button (shows base form of word)
   - Submit → feedback
4. Style to match Shapeshifter theme (use bg-shapeshifter.png as header background)

**Acceptance criteria:**
- [ ] 30+ FILL_BLANK exercises targeting word forms in DB
- [ ] Sentence with blank and text input renders correctly
- [ ] Correct answer is evaluated (case-insensitive, trimmed)
- [ ] Hint button reveals the base form
- [ ] Challenge accessible from hub

---

### TASK-017 · Build The Arena (timed mixed challenge)
**Priority:** P2  
**Label:** Frontend  

**Context:**  
The Arena is the pressure-test mode. Mixed exercise types, timed, fast paced. The user gets as many correct as possible in 3 minutes.

**Mechanic:**
- 3-minute countdown timer (visible, but not anxiety-inducing — just a progress bar)
- Random mix of MULTIPLE_CHOICE and FILL_BLANK exercises
- Each correct answer → score +1, brief green flash, next question
- Wrong answer → score unchanged, brief red flash, next question
- No explanations during the run (too slow)
- End screen: score, accuracy %, time used

**Steps:**
1. Build challenge page with countdown timer
2. Fetch a large batch of exercises (type=any, level=A1, limit=50)
3. Show one at a time, auto-advance after answer
4. Record all results at the end in one batch (or individual POST calls per answer)
5. Show leaderboard potential (just personal best for now)

**Acceptance criteria:**
- [ ] Timer counts down from 3:00
- [ ] Exercises auto-advance after answer (with 300ms feedback flash)
- [ ] Final score screen shows correct count, accuracy %, personal best
- [ ] Challenge accessible from hub

---

### TASK-018 · Challenge progress tracking
**Priority:** P2  
**Label:** Backend + Frontend  

**Context:**  
The challenge hub page needs to show each user's progress per challenge. Currently there's no challenge-specific tracking in the DB — `PracticeSession` tracks sessions but not per-challenge.

**Options:**
- A) Use existing `PracticeSession` with type = challenge name and topic = slug — sessions are already recorded, just need a query that aggregates per-challenge
- B) Add a `ChallengeProgress` table with best score, total plays, last played

**Recommendation:** Option A first (no schema change, just a new query on PracticeSession). Upgrade to B later if needed.

**Steps:**
1. Add `GET /progress/challenges` endpoint that returns per-challenge stats from PracticeSession
2. In challenge hub page, fetch this data and show on each card:
   - Best score
   - Times played
   - Last played date
3. If user has never played a challenge: show "Start" CTA
4. If user has played: show best score + "Play again"

**Acceptance criteria:**
- [ ] `GET /progress/challenges` returns stats for all 5 challenge types
- [ ] Challenge hub shows real scores if user has played, "Start" if not
- [ ] Scores update after completing a challenge

---

## EPIC 5 — Design Overhaul
*Make every main page feel calm, focused, and suitable for studying.*

---

### TASK-019 · Define design tokens (Tailwind config)
**Priority:** P2  
**Label:** Design  

**Context:**  
Before touching individual pages, define a consistent palette in `tailwind.config` so all pages use the same colors. The current design likely uses arbitrary Tailwind defaults.

**Proposed palette direction (to validate in the actual config):**

**Dark mode (default/preferred):**
- Background: `zinc-950` (#09090b)
- Surface (cards, panels): `zinc-900` (#18181b)
- Border: `zinc-800` (#27272a)
- Text primary: `zinc-50`
- Text muted: `zinc-400`
- Accent (correct/positive): `emerald-500`
- Accent (links, focus): `sky-400`
- Error: `rose-500`

**Light mode:**
- Background: `stone-50` (#fafaf9)
- Surface: `white`
- Border: `stone-200`
- Text primary: `stone-900`
- Text muted: `stone-500`

**Steps:**
- Open `tailwind.config.js` or `tailwind.config.ts` in `apps/web`
- Add semantic color tokens (not hardcoded colors) to `theme.extend.colors`
- Add dark mode class strategy (`darkMode: 'class'`)
- Verify globals.css sets the right CSS variables

**Acceptance criteria:**
- [ ] Tailwind config has semantic tokens: `--color-bg`, `--color-surface`, `--color-border`, `--color-text`, `--color-muted`, `--color-accent`
- [ ] Dark mode class strategy is active
- [ ] Toggling `.dark` on `<html>` switches the palette visibly

---

### TASK-020 · Redesign the dashboard page
**Priority:** P2  
**Label:** Frontend + Design  

**Context:**  
The dashboard is the first thing users see after login. It needs to feel focused and informative without being overwhelming.

**What should be on the dashboard:**
1. **Greeting + streak** — "Good evening, [Name]" + streak flame
2. **Daily goal progress** — exercises done today / goal (e.g., 4/10)
3. **Continue where you left off** — last grammar topic practiced
4. **Quick actions** — 3 buttons: "Practice Grammar", "Review Words", "Challenges"
5. **Weekly activity heatmap** (optional, lower priority)

**What should NOT be on the dashboard:**
- Long lists of topics
- Stats that aren't actionable
- Anything that doesn't help the user decide what to do next

**Steps:**
- Audit current dashboard (`apps/web/src/app/(app)/dashboard/page.tsx`)
- Remove any clutter that doesn't fit the above structure
- Redesign using design tokens from TASK-019
- The greeting + streak should be the hero, not buried

**Acceptance criteria:**
- [ ] Dashboard loads in <1s (no loading spinners for hero content)
- [ ] Streak + daily goal are above the fold on desktop and mobile
- [ ] Three clear CTAs are present (Grammar, Words, Challenges)
- [ ] No unnecessary data or distracting elements
- [ ] Works on mobile without horizontal scroll

---

### TASK-021 · Apply design tokens to grammar pages
**Priority:** P2  
**Label:** Frontend + Design  

**Context:**  
Grammar topic pages (`/grammar/a1/[topic]`) have theory, visual, and practice tabs. These are core to the learning experience and should feel clean.

**What to check and fix:**
- Tab bar: should be minimal, not overwhelming
- Theory tab: text should be readable at comfortable size, good line height
- Visual tab: images should have breathing room
- Practice tab: exercise card should be the clear focus of the screen

**Steps:**
- Visit 3-4 different grammar topic pages
- Apply design tokens (surface colors, text sizes, spacing)
- Make sure the active exercise card is visually prominent
- AI correction feedback (for Pro users) should feel inline and natural, not a popup

**Acceptance criteria:**
- [ ] Text in theory tab is readable (min 16px, good line height, max 72ch line width)
- [ ] Exercise card in practice tab is clearly the focus element on the page
- [ ] Tabs don't take up more than 10% of vertical space
- [ ] Consistent spacing with the rest of the app (using tokens from TASK-019)

---

### TASK-022 · Sidebar polish
**Priority:** P3  
**Label:** Frontend + Design  

**Context:**  
The sidebar should feel like a quiet navigation tool, not a feature showcase.

**What to fix:**
- Icons should be consistent size and weight
- Active item should be clearly highlighted (not just bold text)
- The sidebar should collapse gracefully on mobile
- Pro badge (if shown) should be subtle
- The "Upgrade" button (if in sidebar) should be the least prominent element

**Steps:**
- Review current sidebar component
- Standardize icon size (all 18px or 20px, same weight)
- Make active state use accent color background with sufficient contrast
- Test collapse behavior on 375px viewport

**Acceptance criteria:**
- [ ] All nav icons same size and visual weight
- [ ] Active route is clearly distinguished
- [ ] Sidebar collapses to icon-only or slides off-screen on mobile
- [ ] No visual clutter in the sidebar

---

### TASK-023 · Dark mode toggle
**Priority:** P3  
**Label:** Frontend  

**Context:**  
Once design tokens are defined, add a dark/light mode toggle. Default should be dark (study focus). Use `next-themes` if not already installed.

**Steps:**
- Check if `next-themes` is in the deps
- If not: `npm install next-themes`
- Wrap layout in `ThemeProvider`
- Add toggle button in the header or settings page
- Persist preference in localStorage

**Acceptance criteria:**
- [ ] Toggling dark/light mode switches all pages cleanly
- [ ] Preference persists across page reloads
- [ ] No flash of wrong theme on initial load (SSR safe)
- [ ] Default is dark mode

---

## EPIC 6 — Grammar Section Improvements

---

### TASK-024 · Audit and fix grammar practice tab (uncommitted changes)
**Priority:** P1  
**Label:** Frontend  

**Context:**  
`apps/web/src/app/(app)/grammar/a1/[topic]/practice-tab.tsx` has uncommitted modifications. Review what changed and either commit or revert.

**Steps:**
- `git diff apps/web/src/app/(app)/grammar/a1/[topic]/practice-tab.tsx`
- Understand what changed
- If it's a fix or improvement: commit it
- If it's experimental and broken: revert it
- Manually test the practice tab on 2-3 grammar topics to make sure exercises load and results record correctly

**Acceptance criteria:**
- [ ] Practice tab file has no uncommitted modifications
- [ ] Exercises load on at least: articles, cases, verb-conjugation topics
- [ ] Submitting an answer records the result correctly
- [ ] AI correction (for Pro users) works on TRANSLATE and FREE_WRITE exercises

---

### TASK-025 · Missing preposition teaching images
**Priority:** P3  
**Label:** Content / Design  

**Context:**  
15 of 22 preposition teaching images exist in `public/prepositions/`. Missing: `mit`, `nach`, `seit`, `von`, `für`, `ohne`. These 6 images are needed for the prepositions visual tab to be complete.

**Steps:**
- Generate or source 6 illustrations showing spatial/contextual meaning of each preposition
- Name them: `mit.png`, `nach.png`, `seit.png`, `von.png`, `für.png`, `ohne.png`
- Place in `apps/web/public/prepositions/`
- Verify they display correctly in the prepositions visual tab

**Acceptance criteria:**
- [ ] All 22 preposition images exist in `/public/prepositions/`
- [ ] Each image displays at correct size in the visual tab (no broken images)

---

## EPIC 7 — Mobile Experience

---

### TASK-026 · Mobile audit — identify broken layouts
**Priority:** P3  
**Label:** Frontend  

**Context:**  
Run through the app on a 375px mobile viewport and document what's broken.

**Pages to test:**
- Dashboard
- /words (word list, import modal)
- /grammar/a1/[any-topic] (all three tabs)
- /grammar/challenges (hub)
- /grammar/challenge/navigator (exercise)
- /progress

**Steps:**
- Open Chrome DevTools, set to iPhone SE (375px)
- Go through each page
- Screenshot and list layout issues
- Create sub-tasks for each broken page

**Acceptance criteria:**
- [ ] A documented list of mobile layout issues per page
- [ ] Priority order: challenge pages > words > grammar > dashboard > progress

---

### TASK-027 · Mobile: fix sidebar and navigation
**Priority:** P3  
**Label:** Frontend  

**Context:**  
On mobile, the sidebar is either always visible (taking too much space) or needs a hamburger menu to toggle. This needs to work cleanly.

**Steps:**
- On mobile (< 768px): sidebar should be hidden by default
- Hamburger icon in header opens sidebar as an overlay
- Clicking a nav item closes the sidebar
- Clicking outside the sidebar closes it

**Acceptance criteria:**
- [ ] No sidebar visible by default on 375px
- [ ] Hamburger menu toggles sidebar overlay
- [ ] Navigation works correctly on mobile

---

## EPIC 8 — Backend Hardening

---

### TASK-028 · Add /words route protection to middleware
**Priority:** P1  
**Label:** Backend / Auth  

**Context:**  
The new `/words` route needs to be in the protected routes list in `apps/web/src/middleware.ts`. If not added, unauthenticated users can visit it without being redirected to login.

**Also check:** `/grammar/challenges` and `/grammar/challenge/[slug]` routes need protection too.

**Steps:**
- Open `middleware.ts`
- Add `/words` to the matcher patterns
- Add `/grammar/challenges` to the matcher
- Test: log out → visit `/words` → should redirect to `/login`

**Acceptance criteria:**
- [ ] `/words` requires auth (redirects to /login when not logged in)
- [ ] `/grammar/challenges` requires auth
- [ ] `/grammar/challenge/navigator` (and other slugs) requires auth

---

### TASK-029 · Challenge exercises API — verify endpoint works for each type
**Priority:** P2  
**Label:** Backend  

**Context:**  
The existing `GET /exercises` endpoint is used by all challenge pages. Verify it works for all exercise types needed by the challenges.

**Test each:**
- `GET /exercises?type=SORT&level=A1&limit=10` — for Navigator
- `GET /exercises?type=ERROR_SPOT&level=A1&limit=10` — for Detective
- `GET /exercises?type=BUILD&level=A1&limit=10` — for Architect
- `GET /exercises?type=FILL_BLANK&level=A1&limit=10` — for Shapeshifter
- `GET /exercises?level=A1&limit=50` (no type filter) — for Arena

**Steps:**
- Run each query against the API
- If any fail: debug the exercises controller/service in `apps/api/src/exercises/`
- Ensure the response includes: id, type, topic, question, options (JSON), answer, explanation, difficulty

**Acceptance criteria:**
- [ ] All 5 queries return correctly formatted exercise arrays
- [ ] `options` field is properly parsed from JSON (not a raw string)
- [ ] Each exercise type returns exercises from the correct data (after TASK-013 through TASK-016 data import)

---

### TASK-030 · Rate limiting check for challenge endpoints
**Priority:** P3  
**Label:** Backend  

**Context:**  
Challenges call `POST /exercises/result` for every exercise answered. If a user plays The Arena and answers 30 questions, that's 30 POST calls. Verify there's no rate limiting on `/exercises/result` that would block this.

**Steps:**
- Check if DailyApiUsage tracking applies to `/exercises/result` (it should only apply to AI endpoints)
- Verify `POST /exercises/result` has no rate limiting
- If there's rate limiting: remove it from this specific endpoint (result recording should be unlimited)

**Acceptance criteria:**
- [ ] `POST /exercises/result` can be called 50+ times in a session without 429 errors
- [ ] AI endpoints (`/exercises/correct-translation`, `/exercises/correct-freewrite`) still have rate limits

---

## Summary Table

| Task | Epic | Priority | Label |
|------|------|----------|-------|
| TASK-001 | Cleanup | P1 Urgent | Cleanup |
| TASK-002 | Cleanup | P2 | Cleanup |
| TASK-003 | Cleanup | P1 | Cleanup + Frontend |
| TASK-004 | Cleanup | P1 | Auth |
| TASK-005 | Words Page | P1 | Frontend |
| TASK-006 | Words Page | P1 | Frontend + Design |
| TASK-007 | Words Page | P2 | Frontend |
| TASK-008 | Import UX | P2 | Frontend + Design |
| TASK-009 | Import UX | P2 | Frontend + Design |
| TASK-010 | Import UX | P2 | Frontend |
| TASK-011 | Challenges | P1 | Frontend |
| TASK-012 | Challenges | P1 | Frontend + Data |
| TASK-013 | Challenges | P1 | Data / Admin |
| TASK-014 | Challenges | P1 | Frontend + Data |
| TASK-015 | Challenges | P1 | Frontend + Data |
| TASK-016 | Challenges | P2 | Frontend + Data |
| TASK-017 | Challenges | P2 | Frontend |
| TASK-018 | Challenges | P2 | Backend + Frontend |
| TASK-019 | Design | P2 | Design |
| TASK-020 | Design | P2 | Frontend + Design |
| TASK-021 | Design | P2 | Frontend + Design |
| TASK-022 | Design | P3 | Frontend + Design |
| TASK-023 | Design | P3 | Frontend |
| TASK-024 | Grammar | P1 | Frontend |
| TASK-025 | Grammar | P3 | Content |
| TASK-026 | Mobile | P3 | Frontend |
| TASK-027 | Mobile | P3 | Frontend |
| TASK-028 | Backend | P1 | Auth |
| TASK-029 | Backend | P2 | Backend |
| TASK-030 | Backend | P3 | Backend |

**P1 Urgent (do first):** 001, 003, 004, 005, 006, 011, 012, 013, 014, 015, 024, 028  
**P2 (core features):** 002, 007, 008, 009, 010, 016, 017, 018, 019, 020, 021, 029  
**P3 (polish):** 022, 023, 025, 026, 027, 030
