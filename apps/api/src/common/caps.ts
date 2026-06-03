/**
 * Centralized daily caps (DOG-121).
 *
 * Previously these lived as scattered constants across review/import/words/decks
 * services. They are gathered here and made env-overridable so they can be re-tuned
 * without a code change. Each is a positive integer; an invalid/missing env var falls
 * back to the default.
 */

/** Parse a positive-integer env override, else the default. */
export function capFrom(envValue: string | undefined, fallback: number): number {
  const n = Number(envValue);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

export const CAPS = {
  /** Free plan: due reviews served per day (Pro is unlimited). */
  freeReviewsPerDay: capFrom(process.env.CAP_FREE_REVIEWS, 120),
  /** Free plan: brand-new cards introduced per day (Pro is unlimited). */
  freeNewPerDay: capFrom(process.env.CAP_FREE_NEW, 20),
  /** Free plan: Claude gap-fill entries per day during import enrich (Pro is unlimited). */
  freeImportEnrichPerDay: capFrom(process.env.CAP_FREE_IMPORT_ENRICH, 20),
  /** Pro plan: extract-from-text calls per day. */
  proExtractPerDay: capFrom(process.env.CAP_PRO_EXTRACT, 20),
  /** Pro plan: on-demand example generations per day. */
  proExamplePerDay: capFrom(process.env.CAP_PRO_EXAMPLE, 30),
  /** Pro plan: AI deck generations per day. */
  proGeneratePerDay: capFrom(process.env.CAP_PRO_GENERATE, 5),
  /** Pro plan: on-demand cloud-TTS audio generations per day. */
  proAudioPerDay: capFrom(process.env.CAP_PRO_AUDIO, 50),
} as const;
