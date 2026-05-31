/**
 * Generic validating importer for challenge exercise data (DOG-93/95/97/99).
 *
 * Usage:
 *   cd scripts/seed
 *   npx ts-node import-exercises.ts ../../exercises-cipher.json --dry-run
 *   npx ts-node import-exercises.ts ../../exercises-cipher.json
 *
 * Validates each row according to its `type` before writing. Aborts on any
 * validation error. Loads DATABASE_URL from ../../apps/api/.env
 */

import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../apps/api/.env') });

import { PrismaClient } from '@prisma/client';

interface Ex {
  topic: string;
  level: string;
  type: string;
  question: string;
  options: string[] | null;
  answer: string;
  explanation: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
}

const fileArg = process.argv[2];
const isDryRun = process.argv.includes('--dry-run');
if (!fileArg) {
  console.error('Provide a JSON file path.');
  process.exit(1);
}

const blanks = (s: string) => (s.match(/___/g) ?? []).length;
const ws = (s: string) => s.replace(/\s+/g, ' ').trim();

function multisetSubset(need: string[], have: string[]): boolean {
  const pool = [...have];
  for (const w of need) {
    const idx = pool.indexOf(w);
    if (idx === -1) return false;
    pool.splice(idx, 1);
  }
  return true;
}

function validateRow(e: Ex, i: number): string[] {
  const errs: string[] = [];
  const tag = `#${i} (${e.type})`;
  if (!e.topic) errs.push(`${tag}: missing topic`);
  if (!e.explanation) errs.push(`${tag}: missing explanation`);
  if (!['EASY', 'MEDIUM', 'HARD'].includes(e.difficulty)) errs.push(`${tag}: bad difficulty ${e.difficulty}`);

  switch (e.type) {
    case 'SORT': {
      let map: Record<string, string>;
      try {
        map = JSON.parse(e.answer);
      } catch {
        errs.push(`${tag}: answer is not valid JSON`);
        break;
      }
      const opts = e.options ?? [];
      const keys = Object.keys(map);
      if (opts.length < 7 || opts.length > 22) errs.push(`${tag}: ${opts.length} items (want 7-22)`);
      const optSet = new Set(opts);
      const keySet = new Set(keys);
      for (const o of opts) if (!keySet.has(o)) errs.push(`${tag}: option "${o}" not a key in answer`);
      for (const k of keys) if (!optSet.has(k)) errs.push(`${tag}: answer key "${k}" not in options`);
      const cats = new Set(Object.values(map));
      if (cats.size < 2 || cats.size > 4) errs.push(`${tag}: ${cats.size} categories (want 2-4)`);
      break;
    }
    case 'FILL_BLANK': {
      if (blanks(e.question) < 1) errs.push(`${tag}: question has no ___`);
      if (!e.options || !e.options[0] || !e.options[0].trim()) errs.push(`${tag}: options[0] (English) missing`);
      if (!e.answer || e.answer.includes('___')) errs.push(`${tag}: bad answer`);
      break;
    }
    case 'BUILD': {
      const tokens = ws(e.answer).split(' ');
      const opts = e.options ?? [];
      if (!multisetSubset(tokens, opts)) errs.push(`${tag}: not all answer tokens present in options — "${e.answer}"`);
      if (opts.length - tokens.length !== 3) {
        errs.push(`${tag}: ${opts.length} options vs ${tokens.length} answer tokens (need exactly 3 distractors)`);
      }
      if (!e.question.trim()) errs.push(`${tag}: missing English question`);
      break;
    }
    case 'ECHO': {
      if (blanks(e.question) !== 2) errs.push(`${tag}: question has ${blanks(e.question)} blanks (need exactly 2)`);
      let arr: string[];
      try {
        arr = JSON.parse(e.answer);
      } catch {
        errs.push(`${tag}: answer is not valid JSON`);
        break;
      }
      if (!Array.isArray(arr) || arr.length !== 2) {
        errs.push(`${tag}: answer must be a 2-element array`);
        break;
      }
      const full = (e.options ?? [])[0];
      if (!full) {
        errs.push(`${tag}: options[0] (full sentence) missing`);
        break;
      }
      // Reconstruct the sentence by filling blanks in order; must equal options[0].
      let n = -1;
      const rebuilt = e.question.replace(/___/g, () => arr[++n] ?? '');
      if (ws(rebuilt) !== ws(full)) {
        errs.push(`${tag}: filling blanks gives "${ws(rebuilt)}" but options[0] is "${ws(full)}"`);
      }
      break;
    }
    default:
      errs.push(`${tag}: unsupported type ${e.type}`);
  }
  return errs;
}

async function main() {
  const abs = path.resolve(process.cwd(), fileArg);
  const exercises = JSON.parse(fs.readFileSync(abs, 'utf-8')) as Ex[];

  const topics = new Set(exercises.map((e) => e.topic));
  const types = new Set(exercises.map((e) => e.type));
  const byDiff = exercises.reduce<Record<string, number>>((a, e) => {
    a[e.difficulty] = (a[e.difficulty] ?? 0) + 1;
    return a;
  }, {});
  console.log(`Loaded ${exercises.length} | topics: ${[...topics].join(',')} | types: ${[...types].join(',')} | diff:`, byDiff);

  const errs = exercises.flatMap((e, i) => validateRow(e, i));
  if (errs.length) {
    console.error(`\nValidation FAILED (${errs.length}):`);
    errs.slice(0, 50).forEach((e) => console.error('  - ' + e));
    if (errs.length > 50) console.error(`  ... and ${errs.length - 50} more`);
    process.exit(1);
  }
  console.log('Validation passed.');
  if (isDryRun) {
    console.log('Dry run — not writing to DB.');
    return;
  }

  const prisma = new PrismaClient();
  try {
    await prisma.exercise.createMany({
      data: exercises.map((e) => ({
        topic: e.topic,
        level: e.level ?? 'A1',
        type: e.type as any,
        question: e.question,
        options: e.options ?? undefined,
        answer: e.answer,
        explanation: e.explanation,
        difficulty: e.difficulty,
      })),
    });
    for (const t of topics) {
      for (const ty of types) {
        const c = await prisma.exercise.count({ where: { topic: t, type: ty as any } });
        console.log(`Total ${t} / ${ty}: ${c}`);
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
