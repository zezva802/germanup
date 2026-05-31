/**
 * One-off importer for The Detective ERROR_SPOT exercises (DOG-91).
 *
 * Usage:
 *   cd scripts/seed
 *   npx ts-node import-detective.ts ../../exercises-detective-new.json
 *   npx ts-node import-detective.ts ../../exercises-detective-new.json --dry-run
 *
 * Validates that each options[0] appears exactly once in its question
 * (same matching logic as the challenge page) before writing to the DB.
 * Loads DATABASE_URL from ../../apps/api/.env
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
  options: string[];
  answer: string;
  explanation: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
}

const fileArg = process.argv[2];
const isDryRun = process.argv.includes('--dry-run');

if (!fileArg) {
  console.error('Provide a JSON file path. e.g. npx ts-node import-detective.ts ../../exercises-detective-new.json');
  process.exit(1);
}

const clean = (w: string) => w.replace(/[.,!?;:]/g, '').toLowerCase();

function validate(exercises: Ex[]): string[] {
  const errors: string[] = [];
  exercises.forEach((e, i) => {
    if (e.type !== 'ERROR_SPOT') errors.push(`#${i}: type is ${e.type}, expected ERROR_SPOT`);
    if (e.topic !== 'the-detective') errors.push(`#${i}: topic is ${e.topic}`);
    if (!Array.isArray(e.options) || e.options.length < 1) {
      errors.push(`#${i}: missing options[0] — "${e.question}"`);
      return;
    }
    const target = clean(e.options[0]);
    const matches = e.question.split(' ').filter(Boolean).filter((w) => clean(w) === target).length;
    if (matches !== 1) {
      errors.push(`#${i}: options[0] "${e.options[0]}" appears ${matches}x in "${e.question}" (must be exactly 1)`);
    }
  });
  return errors;
}

async function main() {
  const abs = path.resolve(process.cwd(), fileArg);
  const exercises = JSON.parse(fs.readFileSync(abs, 'utf-8')) as Ex[];

  const byDiff = exercises.reduce<Record<string, number>>((acc, e) => {
    acc[e.difficulty] = (acc[e.difficulty] ?? 0) + 1;
    return acc;
  }, {});
  const topics = new Set(exercises.map((e) => e.explanation));
  console.log(`Loaded ${exercises.length} exercises | difficulty:`, byDiff);

  const errors = validate(exercises);
  if (errors.length) {
    console.error(`\nValidation FAILED (${errors.length}):`);
    errors.forEach((e) => console.error('  - ' + e));
    process.exit(1);
  }
  console.log('Validation passed: every options[0] appears exactly once.');

  if (isDryRun) {
    console.log('Dry run — not writing to DB.');
    return;
  }

  const prisma = new PrismaClient();
  try {
    const before = await prisma.exercise.count({ where: { topic: 'the-detective', type: 'ERROR_SPOT' } });
    await prisma.exercise.createMany({
      data: exercises.map((e) => ({
        topic: e.topic,
        level: e.level ?? 'A1',
        type: 'ERROR_SPOT' as const,
        question: e.question,
        options: e.options,
        answer: e.answer,
        explanation: e.explanation,
        difficulty: e.difficulty,
      })),
    });
    const after = await prisma.exercise.count({ where: { topic: 'the-detective', type: 'ERROR_SPOT' } });
    console.log(`Inserted ${after - before}. Total the-detective ERROR_SPOT now: ${after}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
