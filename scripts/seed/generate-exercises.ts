/**
 * Exercise generation script for GermanUp.
 *
 * Setup (first time only):
 *   cd scripts/seed && npm install
 *   cd ../../packages/db && npx prisma generate   (if client not yet generated)
 *
 * Usage:
 *   npx ts-node generate-exercises.ts --topic=cases --type=FILL_BLANK --batches=5
 *   npx ts-node generate-exercises.ts --topic=cases --type=FILL_BLANK --batches=1 --dry-run
 *
 * Loads DATABASE_URL and ANTHROPIC_API_KEY from ../../apps/api/.env
 */

import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../apps/api/.env') });

import { Command } from 'commander';
import Anthropic from '@anthropic-ai/sdk';
import { PrismaClient } from '@prisma/client';

const VALID_TYPES = ['FILL_BLANK', 'MULTIPLE_CHOICE', 'IDENTIFY', 'TRANSLATE', 'FREE_WRITE'] as const;
type ExType = (typeof VALID_TYPES)[number];

interface GeneratedExercise {
  topic: string;
  level: string;
  type: string;
  question: string;
  options: string[] | null;
  answer: string;
  explanation: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
}

const program = new Command();
program
  .requiredOption('--topic <topic>', 'Grammar topic slug (e.g. cases, modal-verbs)')
  .requiredOption(
    '--type <type>',
    'Exercise type: FILL_BLANK | MULTIPLE_CHOICE | IDENTIFY | TRANSLATE | FREE_WRITE',
  )
  .option('--batches <n>', 'Number of batches to generate (100 exercises per batch)', '1')
  .option('--dry-run', 'Print exercises to console without saving to DB')
  .parse(process.argv);

const opts = program.opts<{
  topic: string;
  type: string;
  batches: string;
  dryRun?: boolean;
}>();

const topic = opts.topic;
const exType = opts.type as ExType;
const totalBatches = parseInt(opts.batches, 10);
const isDryRun = opts.dryRun ?? false;

if (!VALID_TYPES.includes(exType)) {
  console.error(`Invalid type: ${exType}. Must be one of: ${VALID_TYPES.join(', ')}`);
  process.exit(1);
}

if (isNaN(totalBatches) || totalBatches < 1) {
  console.error('--batches must be a positive integer');
  process.exit(1);
}

const anthropicKey = process.env.ANTHROPIC_API_KEY;
const databaseUrl = process.env.DATABASE_URL;

if (!anthropicKey) {
  console.error('ANTHROPIC_API_KEY is not set. Check apps/api/.env');
  process.exit(1);
}
if (!databaseUrl && !isDryRun) {
  console.error('DATABASE_URL is not set. Check apps/api/.env');
  process.exit(1);
}

const client = new Anthropic({ apiKey: anthropicKey });
const prisma = isDryRun ? null : new PrismaClient({ datasources: { db: { url: databaseUrl } } });

function buildPrompt(batchN: number, previousStems: string[]): string {
  const stemsText =
    previousStems.length > 0
      ? previousStems.slice(-30).join('; ')
      : 'none yet';

  return `You are building a German A1 exercise database.
Topic: ${topic}
Exercise type: ${exType}
Batch: ${batchN} of ${totalBatches}
Do not repeat these previously used question stems: ${stemsText}

Rules:
- Vary nouns and verbs widely across exercises
- Use fun everyday themes: dogs, food, travel, friends, family, city
- Mix difficulty: 40% EASY, 40% MEDIUM, 20% HARD
- Every answer must be 100% grammatically correct German
- Explanations in simple English, max 1 sentence
- For FILL_BLANK: question contains ___ where the answer goes
- For MULTIPLE_CHOICE: provide exactly 4 options in the "options" array; one is correct
- For IDENTIFY: ask student to identify a grammar feature (options array with 4 choices)
- For TRANSLATE/FREE_WRITE: options is null

Return ONLY a valid JSON array of exactly 50 objects, zero extra text, no markdown:
[{
  "topic": "${topic}",
  "level": "A1",
  "type": "${exType}",
  "question": "...",
  "options": ["a","b","c","d"] or null,
  "answer": "...",
  "explanation": "...",
  "difficulty": "EASY"|"MEDIUM"|"HARD"
}]`;
}

function extractStems(exercises: GeneratedExercise[]): string[] {
  return exercises.map((e) => e.question.slice(0, 60));
}

async function generateBatch(
  batchN: number,
  previousStems: string[],
): Promise<GeneratedExercise[]> {
  console.log(`  Calling Claude for batch ${batchN}/${totalBatches}...`);

  const message = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 7000,
    messages: [{ role: 'user', content: buildPrompt(batchN, previousStems) }],
  });

  const text = message.content[0]?.type === 'text' ? message.content[0].text : '';

  const jsonStart = text.indexOf('[');
  const jsonEnd = text.lastIndexOf(']');
  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error(`Claude response did not contain a JSON array. Response: ${text.slice(0, 200)}`);
  }

  const jsonStr = text.slice(jsonStart, jsonEnd + 1);
  const exercises = JSON.parse(jsonStr) as GeneratedExercise[];

  if (!Array.isArray(exercises)) {
    throw new Error('Parsed response is not an array');
  }

  console.log(`  Got ${exercises.length} exercises from Claude`);
  return exercises;
}

async function saveBatch(exercises: GeneratedExercise[]): Promise<void> {
  if (!prisma) return;

  const data = exercises.map((e) => ({
    topic: e.topic,
    level: e.level ?? 'A1',
    type: e.type as ExType,
    question: e.question,
    options: e.options ?? undefined,
    answer: e.answer,
    explanation: e.explanation,
    difficulty: (e.difficulty ?? 'MEDIUM') as 'EASY' | 'MEDIUM' | 'HARD',
  }));

  await prisma.exercise.createMany({ data, skipDuplicates: false });
  console.log(`  Saved ${data.length} exercises to DB`);
}

async function main() {
  console.log(`\nGermanUp Exercise Generator`);
  console.log(`Topic: ${topic} | Type: ${exType} | Batches: ${totalBatches} | Dry-run: ${isDryRun}`);
  console.log('─'.repeat(60));

  const allStems: string[] = [];
  let totalSaved = 0;

  for (let batchN = 1; batchN <= totalBatches; batchN++) {
    console.log(`\nBatch ${batchN}/${totalBatches}`);

    try {
      const exercises = await generateBatch(batchN, allStems);
      allStems.push(...extractStems(exercises));

      if (isDryRun) {
        console.log('\n--- DRY RUN OUTPUT ---');
        console.log(JSON.stringify(exercises.slice(0, 3), null, 2));
        console.log(`  ... (${exercises.length} total exercises, showing first 3)`);
      } else {
        await saveBatch(exercises);
        totalSaved += exercises.length;
      }
    } catch (err) {
      console.error(`  ERROR in batch ${batchN}:`, (err as Error).message);
      console.error('  Continuing with next batch...');
    }
  }

  console.log('\n' + '─'.repeat(60));
  if (isDryRun) {
    console.log(`Dry run complete. Would have generated ~${totalBatches * 100} exercises.`);
  } else {
    console.log(`Done. Saved ${totalSaved} exercises to DB.`);
  }

  if (prisma) await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
