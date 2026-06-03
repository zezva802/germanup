/**
 * Seed loader for curated A1 decks (DOG-107).
 *
 * Reads every packages/db/seed/decks/*.json and loads it as a curated deck
 * (isCurated = true, ownerId = null) with source = "curated" words — the same
 * contract as the admin bulk import (DOG-106), but runnable with no server up.
 *
 * Idempotent: a curated deck with the same title is refreshed (its words are
 * replaced), so re-running re-applies edits without duplicating.
 *
 *   cd scripts/seed
 *   npx ts-node seed-decks.ts --dry-run
 *   npx ts-node seed-decks.ts
 *
 * Loads DATABASE_URL from ../../apps/api/.env
 */
import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../../apps/api/.env') });

import { PrismaClient, Prisma, PartOfSpeech } from '@prisma/client';

const isDryRun = process.argv.includes('--dry-run');
const DECKS_DIR = path.resolve(__dirname, '../../packages/db/seed/decks');
const VALID_POS = new Set(Object.values(PartOfSpeech));
const EMOJI = /\p{Extended_Pictographic}/u;

interface SeedWord {
  german: string;
  english: string;
  gender?: string | null;
  plural?: string | null;
  example: string;
  partOfSpeech: string;
  level: string;
  conjugation?: Record<string, unknown>;
}
interface SeedDeck {
  title: string;
  description?: string;
  topic?: string;
  level: string;
  words: SeedWord[];
}

function lintDeck(file: string, deck: SeedDeck): string[] {
  const errs: string[] = [];
  const tag = path.basename(file);
  if (!deck.title) errs.push(`${tag}: missing title`);
  if (!deck.level) errs.push(`${tag}: missing level`);
  if (!Array.isArray(deck.words) || deck.words.length === 0) errs.push(`${tag}: no words`);
  if (EMOJI.test(deck.title ?? '') || EMOJI.test(deck.description ?? '')) errs.push(`${tag}: emoji in deck title/description`);

  const seen = new Set<string>();
  (deck.words ?? []).forEach((w, i) => {
    const wtag = `${tag}#${i} (${w.german ?? '?'})`;
    if (!w.german?.trim()) errs.push(`${wtag}: missing german`);
    if (!w.english?.trim()) errs.push(`${wtag}: missing english`);
    if (!w.example?.trim()) errs.push(`${wtag}: missing example`);
    if (!w.level?.trim()) errs.push(`${wtag}: missing level`);
    if (!VALID_POS.has(w.partOfSpeech as PartOfSpeech)) errs.push(`${wtag}: bad partOfSpeech ${w.partOfSpeech}`);
    if (w.partOfSpeech === 'VERB' && !w.conjugation) errs.push(`${wtag}: verb without conjugation`);
    if (EMOJI.test(JSON.stringify(w))) errs.push(`${wtag}: emoji in word content`);
    const key = w.german?.toLowerCase().trim();
    if (key) {
      if (seen.has(key)) errs.push(`${wtag}: duplicate german within deck`);
      seen.add(key);
    }
  });
  return errs;
}

async function main() {
  const files = fs.readdirSync(DECKS_DIR).filter((f) => f.endsWith('.json')).sort();
  console.log(isDryRun ? '=== DRY RUN ===' : '=== SEEDING curated decks ===');
  console.log(`Found ${files.length} deck file(s) in ${DECKS_DIR}\n`);

  const decks = files.map((f) => {
    const full = path.join(DECKS_DIR, f);
    return { file: full, data: JSON.parse(fs.readFileSync(full, 'utf-8')) as SeedDeck };
  });

  // Lint everything up front; abort on any problem.
  const errs = decks.flatMap(({ file, data }) => lintDeck(file, data));
  if (errs.length) {
    console.error(`Content lint FAILED (${errs.length}):`);
    errs.forEach((e) => console.error('  - ' + e));
    process.exit(1);
  }
  console.log('Content lint passed (fields present, no emoji, no in-deck duplicates, verbs have conjugation).\n');

  let totalWords = 0;
  for (const { data } of decks) {
    console.log(`${data.title}: ${data.words.length} words`);
    totalWords += data.words.length;
    if (isDryRun) continue;

    const existing = await prisma.deck.findFirst({ where: { isCurated: true, title: data.title } });
    let deckId: string;
    if (existing) {
      await prisma.word.deleteMany({ where: { deckId: existing.id } });
      await prisma.deck.update({
        where: { id: existing.id },
        data: { description: data.description ?? null, topic: data.topic ?? null, level: data.level },
      });
      deckId = existing.id;
      console.log(`  refreshed existing deck`);
    } else {
      const created = await prisma.deck.create({
        data: { ownerId: null, isCurated: true, title: data.title, description: data.description ?? null, topic: data.topic ?? null, level: data.level },
      });
      deckId = created.id;
      console.log(`  created new deck`);
    }

    await prisma.word.createMany({
      data: data.words.map((w) => ({
        ownerId: null,
        deckId,
        german: w.german,
        english: w.english,
        gender: w.gender ?? null,
        plural: w.plural ?? null,
        example: w.example,
        partOfSpeech: w.partOfSpeech as PartOfSpeech,
        conjugation: (w.conjugation as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        level: w.level,
        source: 'curated',
      })),
    });
  }

  console.log(`\n${decks.length} decks, ${totalWords} words total.${isDryRun ? ' (dry run — nothing written)' : ''}`);
}

const prisma = new PrismaClient();
main()
  .catch((e) => { console.error('Fatal:', e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
