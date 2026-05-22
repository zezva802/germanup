# Challenges & Exercises Plan

## Exercise Types

| Type | Status | Used In |
|---|---|---|
| FILL_BLANK | ✅ Built | Regular topics + challenges |
| MULTIPLE_CHOICE | ✅ Built | Regular topics + challenges |
| TRANSLATE | ✅ Built | Regular topics (Pro) |
| FREE_WRITE | ✅ Built | Regular topics (Pro) |
| SORT | ✅ Built | Challenges only |
| BUILD | ✅ Built | Challenges only |
| ERROR_SPOT | ✅ Built | Challenges only |

**DB:** Run these in Supabase SQL editor if not done yet:
```sql
ALTER TYPE "ExType" ADD VALUE IF NOT EXISTS 'SORT';
ALTER TYPE "ExType" ADD VALUE IF NOT EXISTS 'BUILD';
ALTER TYPE "ExType" ADD VALUE IF NOT EXISTS 'ERROR_SPOT';
```
Then: `cd packages/db && npx prisma generate`

---

## Challenges

### 🗺️ The Navigator — Prepositions Master
**Unlocks:** Learner rank (150 XP) in dativ + akkusativ + two-way prepositions
**Topics required:** `dativ-prepositions`, `akkusativ-prepositions`, `two-way-prepositions`

| Phase | Type | Status | What to import |
|---|---|---|---|
| 1 — Sort | SORT | ✅ Ready to import | `sort-exercises.json` (1 exercise, all 22 prepositions) |
| 2 — Context | FILL_BLANK / MULTIPLE_CHOICE | ✅ Auto (uses existing topic exercises) | Nothing — pulls from DB automatically |
| 3 — Pictures | FILL_BLANK + imageUrl | ⏳ Waiting on 9 images | 9 images → `public/challenges/prepositions/` then import exercises |

**Picture exercises format** (import after images ready):
```json
{
  "topic": "the-navigator",
  "level": "A1",
  "type": "FILL_BLANK",
  "question": "Die Katze springt ___ Tisch.",
  "options": null,
  "answer": "auf den",
  "explanation": "Movement toward → Akkusativ. auf + den (der Tisch, masculine accusative)",
  "difficulty": "HARD",
  "imageUrl": "/challenges/prepositions/auf-akkusativ.png"
}
```
Need 9 images (2 per two-way preposition: location + movement):
- `auf-dativ.png`, `auf-akkusativ.png`
- `in-dativ.png`, `in-akkusativ.png`
- `an-dativ.png`, `an-akkusativ.png`
- `unter-dativ.png`, `unter-akkusativ.png`
- `vor-dativ.png`, `vor-akkusativ.png`

---

### 🔄 The Shapeshifter — Pronoun Swap
**Unlocks:** Learner rank (150 XP) in personal + possessive pronouns
**Topics required:** `personal-pronouns`, `possessive-pronouns`

| Phase | Type | Status | What to import |
|---|---|---|---|
| 1 — Sort | SORT | ❌ Need to create | Sort pronouns by person/gender |
| 2 — Context | FILL_BLANK | ❌ Need to create | Replace noun with correct pronoun |
| 3 — (none planned) | — | — | — |

**SORT exercise example:**
```json
{
  "topic": "the-shapeshifter",
  "level": "A1",
  "type": "SORT",
  "question": "Sort these pronouns by person.",
  "options": ["ich", "mein", "du", "dein", "er", "sein", "sie", "ihr", "wir", "unser"],
  "answer": "{\"ich\":\"Personal\",\"du\":\"Personal\",\"er\":\"Personal\",\"sie\":\"Personal\",\"wir\":\"Personal\",\"mein\":\"Possessive\",\"dein\":\"Possessive\",\"sein\":\"Possessive\",\"ihr\":\"Possessive\",\"unser\":\"Possessive\"}",
  "explanation": "Personal pronouns replace nouns directly. Possessive pronouns show ownership.",
  "difficulty": "MEDIUM"
}
```

**FILL_BLANK exercise examples (topic: the-shapeshifter):**
- "Das ist Maria. ___ wohnt in Berlin. ___ Wohnung ist groß." → Sie / Ihre
- "Ich sehe den Mann. ___ trägt ___ Mantel." → Er / seinen
- "Wir haben ein Auto. ___ Auto ist neu." → Unser

---

### 🏗️ The Architect — Verb Position
**Unlocks:** Practiced rank (400 XP) in präsens + modal verbs + separable verbs + future + imperative
**Topics required:** `praesens`, `modal-verbs`, `separable-verbs`, `future-werden`, `imperative`

| Phase | Type | Status | What to import |
|---|---|---|---|
| 1 — Build | BUILD | ❌ Need to create | Arrange word tiles into correct sentence |
| 2 — Context | FILL_BLANK / MULTIPLE_CHOICE | ✅ Auto | Nothing |
| 3 — (none planned) | — | — | — |

**BUILD exercise examples (topic: the-architect):**
```json
[
  {
    "topic": "the-architect",
    "type": "BUILD",
    "question": "Build the correct sentence.",
    "options": ["Wir", "müssen", "morgen", "früh", "aufstehen"],
    "answer": "Wir müssen morgen früh aufstehen",
    "explanation": "Modal verb (müssen) stays in position 2. Infinitive (aufstehen) goes to the end.",
    "difficulty": "HARD"
  },
  {
    "topic": "the-architect",
    "type": "BUILD",
    "question": "Build the correct sentence.",
    "options": ["Ich", "rufe", "dich", "morgen", "an"],
    "answer": "Ich rufe dich morgen an",
    "explanation": "Separable verb: rufen stays in position 2, prefix (an) goes to the end.",
    "difficulty": "HARD"
  },
  {
    "topic": "the-architect",
    "type": "BUILD",
    "question": "Build the correct sentence.",
    "options": ["Er", "wird", "nächste", "Woche", "kommen"],
    "answer": "Er wird nächste Woche kommen",
    "explanation": "Future with werden: wird stays in position 2, infinitive goes to the end.",
    "difficulty": "HARD"
  }
]
```

---

### ⚔️ The Arena — Article Battle
**Unlocks:** Practiced rank (400 XP) in noun-gender + cases + personal-pronouns
**Topics required:** `noun-gender`, `cases`, `personal-pronouns`

| Phase | Type | Status | What to import |
|---|---|---|---|
| 1 — Sort | SORT | ❌ Need to create | Sort nouns by gender |
| 2 — Context | FILL_BLANK | ❌ Need to create | Fill correct article in sentence |
| 3 — (none planned) | — | — | — |

**SORT exercise example:**
```json
{
  "topic": "the-arena",
  "type": "SORT",
  "question": "Sort these nouns by their gender.",
  "options": ["Mann", "Frau", "Kind", "Hund", "Katze", "Auto", "Haus", "Stadt", "Tag"],
  "answer": "{\"Mann\":\"der\",\"Hund\":\"der\",\"Tag\":\"der\",\"Frau\":\"die\",\"Katze\":\"die\",\"Stadt\":\"die\",\"Kind\":\"das\",\"Auto\":\"das\",\"Haus\":\"das\"}",
  "explanation": "der: Mann, Hund, Tag. die: Frau, Katze, Stadt. das: Kind, Auto, Haus.",
  "difficulty": "HARD"
}
```

**FILL_BLANK exercise examples (topic: the-arena):**
- "Ich gebe ___ Frau ___ Buch." → der / das (Dativ feminine + Akkusativ neuter)
- "Er sieht ___ Mann und ___ Kind." → den / das (Akkusativ masculine + neuter)
- "___ Hund läuft neben ___ Katze." → Der / der (Nominativ + Dativ)

---

### 🔍 The Detective — Sentence Rescue
**Unlocks:** Confident rank (800 XP) in cases + dativ-prepositions + akkusativ-prepositions + modal-verbs + personal-pronouns
**Topics required:** `cases`, `dativ-prepositions`, `akkusativ-prepositions`, `modal-verbs`, `personal-pronouns`

| Phase | Type | Status | What to import |
|---|---|---|---|
| 1 — Error Spot | ERROR_SPOT | ❌ Need to create | Find the wrong word, type correction |
| 2 — Context | FILL_BLANK / MULTIPLE_CHOICE | ✅ Auto | Nothing |
| 3 — (none planned) | — | — | — |

**ERROR_SPOT exercise format:**
- `options`: `["wrongword"]` — the highlighted word
- `answer`: `"correctword"` — what to replace it with

**ERROR_SPOT exercise examples (topic: the-detective):**
```json
[
  {
    "topic": "the-detective",
    "type": "ERROR_SPOT",
    "question": "Ich gehe in den Küche.",
    "options": ["den"],
    "answer": "der",
    "explanation": "Location → Dativ. 'die Küche' (feminine) → Dativ = 'der'. in der Küche.",
    "difficulty": "HARD"
  },
  {
    "topic": "the-detective",
    "type": "ERROR_SPOT",
    "question": "Er gibt seiner Mutter ein Geschenk für sie.",
    "options": ["seiner"],
    "answer": "seiner",
    "explanation": "Actually correct! seine Mutter (Dativ) → seiner. Trick question.",
    "difficulty": "HARD"
  },
  {
    "topic": "the-detective",
    "type": "ERROR_SPOT",
    "question": "Wir müssen das Buch lesen morgen.",
    "options": ["morgen"],
    "answer": "morgen lesen",
    "explanation": "Infinitive goes to the end: Wir müssen morgen das Buch lesen.",
    "difficulty": "HARD"
  }
]
```

---

## Visual Learning (Prepositions)

### Teaching images — `public/prepositions/`
Show on Visual tab inside each preposition topic page.

| Image | Status |
|---|---|
| auf, unter, über, neben, vor, hinter, zwischen, an, in | ✅ Done |
| durch, um, gegen | ✅ Done |
| aus, zu, gegenüber, bei | ✅ Done |
| mit, nach, seit, von, für, ohne | ❌ Need 6 more images |

### Challenge images — `public/challenges/prepositions/`
Used in The Navigator Phase 3.

| Image | Status |
|---|---|
| auf-dativ, auf-akkusativ | ❌ Needed |
| in-dativ, in-akkusativ | ❌ Needed |
| an-dativ, an-akkusativ | ❌ Needed |
| unter-dativ, unter-akkusativ | ❌ Needed |
| vor-dativ, vor-akkusativ | ❌ Needed |

---

## Summary — What You Need to Do

### SQL (run in Supabase)
```sql
ALTER TYPE "ExType" ADD VALUE IF NOT EXISTS 'SORT';
ALTER TYPE "ExType" ADD VALUE IF NOT EXISTS 'BUILD';
ALTER TYPE "ExType" ADD VALUE IF NOT EXISTS 'ERROR_SPOT';
```

### Prisma
```
cd packages/db && npx prisma generate
```

### Import via admin panel
1. `sort-exercises.json` → The Navigator Phase 1
2. The Shapeshifter exercises (SORT + FILL_BLANK) — create from examples above
3. The Architect exercises (BUILD) — create from examples above
4. The Arena exercises (SORT + FILL_BLANK) — create from examples above
5. The Detective exercises (ERROR_SPOT) — create from examples above

### Images to find
- 6 teaching images: `mit, nach, seit, von, für, ohne` → `public/prepositions/`
- 10 challenge images (5 pairs) → `public/challenges/prepositions/`
