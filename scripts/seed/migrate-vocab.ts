/**
 * One-off migration for the Words rework (DOG-102).
 *
 * Folds the legacy vocabulary models into the new unified Word model:
 *   - VocabWord  -> Word (partOfSpeech NOUN if gender present, else OTHER)
 *   - UserVerb   -> Word (partOfSpeech VERB, conjugation JSON)
 * Each user's migrated words land in an auto "My Words" deck. Per-user SRS
 * CardState rows are seeded from FlashcardStat (mastered -> a multi-day REVIEW
 * interval, otherwise NEW).
 *
 * Legacy tables (VocabWord / UserVerb / FlashcardStat / ConjugationStat) are
 * READ ONLY here and left intact — a later cleanup ticket drops them.
 *
 * The script is idempotent: re-running skips words already present in the
 * user's "My Words" deck and upserts CardState on the [userId, wordId] unique.
 *
 * Usage:
 *   cd scripts/seed
 *   npx ts-node migrate-vocab.ts --dry-run
 *   npx ts-node migrate-vocab.ts
 *
 * Loads DATABASE_URL from ../../apps/api/.env
 */

import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../apps/api/.env') });

import { PrismaClient, PartOfSpeech, CardStateType } from '@prisma/client';

const isDryRun = process.argv.includes('--dry-run');

const MASTERED_INTERVAL_DAYS = 4;
const MY_WORDS_TITLE = 'My Words';

const prisma = new PrismaClient();

interface Counts {
  usersProcessed: number;
  decksCreated: number;
  nounsMigrated: number;
  verbsMigrated: number;
  cardStatesReview: number;
  cardStatesNew: number;
  skippedExisting: number;
}

async function findOrCreateMyWordsDeck(userId: string, counts: Counts): Promise<string> {
  const existing = await prisma.deck.findFirst({
    where: { ownerId: userId, title: MY_WORDS_TITLE, isCurated: false },
  });
  if (existing) return existing.id;

  if (isDryRun) {
    counts.decksCreated++;
    return `dry-run-deck-${userId}`;
  }
  const deck = await prisma.deck.create({
    data: { ownerId: userId, title: MY_WORDS_TITLE, isCurated: false },
  });
  counts.decksCreated++;
  return deck.id;
}

/** Seed a CardState for a freshly migrated word, mirroring its FlashcardStat (if any). */
async function seedCardState(
  userId: string,
  wordId: string,
  stat: { mastered: boolean; timesCorrect: number; lastShown: Date | null } | null,
  counts: Counts,
) {
  const now = new Date();
  let data;
  if (stat?.mastered) {
    data = {
      state: CardStateType.REVIEW,
      intervalDays: MASTERED_INTERVAL_DAYS,
      dueAt: new Date(now.getTime() + MASTERED_INTERVAL_DAYS * 24 * 60 * 60 * 1000),
      reps: stat.timesCorrect ?? 0,
      lastReviewedAt: stat.lastShown ?? null,
    };
    counts.cardStatesReview++;
  } else {
    data = {
      state: CardStateType.NEW,
      intervalDays: 0,
      dueAt: now,
      reps: 0,
      lastReviewedAt: null,
    };
    counts.cardStatesNew++;
  }

  if (isDryRun) return;
  await prisma.cardState.upsert({
    where: { userId_wordId: { userId, wordId } },
    create: { userId, wordId, ...data },
    update: {}, // never clobber an existing card's live SRS state on re-run
  });
}

async function migrateUser(userId: string, counts: Counts) {
  const [vocab, verbs] = await Promise.all([
    prisma.vocabWord.findMany({ where: { userId }, include: { flashcardStats: true } }),
    prisma.userVerb.findMany({ where: { userId } }),
  ]);
  if (vocab.length === 0 && verbs.length === 0) return;

  counts.usersProcessed++;
  const deckId = await findOrCreateMyWordsDeck(userId, counts);

  // --- VocabWord -> Word (NOUN if gender present, else OTHER) ---
  for (const vw of vocab) {
    const existing = await prisma.word.findFirst({
      where: { deckId, german: vw.german, partOfSpeech: { not: PartOfSpeech.VERB } },
    });
    if (existing) {
      counts.skippedExisting++;
      await seedCardState(userId, existing.id, vw.flashcardStats, counts);
      continue;
    }

    counts.nounsMigrated++;
    if (isDryRun) {
      // still count the would-be card state
      await seedCardState(userId, `dry-run-word`, vw.flashcardStats, counts);
      continue;
    }
    const word = await prisma.word.create({
      data: {
        ownerId: userId,
        deckId,
        german: vw.german,
        english: vw.english,
        gender: vw.gender,
        plural: vw.plural,
        example: vw.example,
        partOfSpeech: vw.gender ? PartOfSpeech.NOUN : PartOfSpeech.OTHER,
        level: vw.level || 'A1',
        source: 'manual',
        createdAt: vw.createdAt,
      },
    });
    await seedCardState(userId, word.id, vw.flashcardStats, counts);
  }

  // --- UserVerb -> Word (VERB, conjugation JSON, english="" placeholder) ---
  for (const uv of verbs) {
    const existing = await prisma.word.findFirst({
      where: { deckId, german: uv.infinitive, partOfSpeech: PartOfSpeech.VERB },
    });
    if (existing) {
      counts.skippedExisting++;
      await seedCardState(userId, existing.id, null, counts);
      continue;
    }

    counts.verbsMigrated++;
    if (isDryRun) {
      await seedCardState(userId, `dry-run-word`, null, counts);
      continue;
    }
    const word = await prisma.word.create({
      data: {
        ownerId: userId,
        deckId,
        german: uv.infinitive,
        english: '', // UserVerb has no English; backfilled by a later enrichment ticket
        example: uv.example,
        partOfSpeech: PartOfSpeech.VERB,
        conjugation: {
          praesens: uv.praesens,
          imperfekt: uv.imperfekt,
          partizip2: uv.partizip2,
          hilfsverb: uv.hilfsverb,
          isIrregular: uv.isIrregular,
        },
        level: 'A1',
        source: 'manual',
        createdAt: uv.createdAt,
      },
    });
    // Verbs use ConjugationStat, not FlashcardStat, so they all seed as NEW.
    await seedCardState(userId, word.id, null, counts);
  }
}

async function main() {
  console.log(isDryRun ? '=== DRY RUN (no writes) ===' : '=== MIGRATING (writing to DB) ===');

  // Users that own any legacy vocab or verbs.
  const [vocabUsers, verbUsers] = await Promise.all([
    prisma.vocabWord.findMany({ distinct: ['userId'], select: { userId: true } }),
    prisma.userVerb.findMany({ distinct: ['userId'], select: { userId: true } }),
  ]);
  const userIds = [...new Set([...vocabUsers, ...verbUsers].map((r) => r.userId))].sort();
  console.log(`Users with legacy vocab/verbs: ${userIds.length}`);

  const counts: Counts = {
    usersProcessed: 0,
    decksCreated: 0,
    nounsMigrated: 0,
    verbsMigrated: 0,
    cardStatesReview: 0,
    cardStatesNew: 0,
    skippedExisting: 0,
  };

  try {
    for (const userId of userIds) {
      await migrateUser(userId, counts);
    }
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n--- Summary ---');
  console.log(`Users processed:      ${counts.usersProcessed}`);
  console.log(`Decks created:        ${counts.decksCreated}`);
  console.log(`Nouns migrated:       ${counts.nounsMigrated}`);
  console.log(`Verbs migrated:       ${counts.verbsMigrated}`);
  console.log(`CardState (REVIEW):   ${counts.cardStatesReview}`);
  console.log(`CardState (NEW):      ${counts.cardStatesNew}`);
  console.log(`Skipped (existing):   ${counts.skippedExisting}`);
  if (isDryRun) console.log('\nDry run complete — nothing written.');
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
