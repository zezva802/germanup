// Client-side types for the Words rework API (decks / words / tags).
// The web app cannot import @germanup/db, so these mirror the API response shapes.

export type PartOfSpeech = 'NOUN' | 'VERB' | 'ADJ' | 'ADV' | 'OTHER';

export interface ConjugationTable {
  ich?: string;
  du?: string;
  er?: string;
  wir?: string;
  ihr?: string;
  sie?: string;
}

export interface Conjugation {
  praesens?: ConjugationTable;
  imperfekt?: ConjugationTable;
  partizip2?: string;
  hilfsverb?: string;
  isIrregular?: boolean;
}

export interface Tag {
  id: string;
  ownerId: string;
  name: string;
  _count?: { words: number };
}

export interface WordTag {
  wordId: string;
  tagId: string;
  tag: Tag;
}

export interface Word {
  id: string;
  ownerId: string | null;
  deckId: string;
  german: string;
  english: string;
  gender: string | null;
  plural: string | null;
  example: string | null;
  audioUrl: string | null;
  partOfSpeech: PartOfSpeech;
  conjugation: Conjugation | null;
  level: string;
  source: string | null;
  createdAt: string;
  tags?: WordTag[];
}

/** Shape returned by GET /decks (list): includes counts for the caller. */
export interface DeckSummary {
  id: string;
  ownerId: string | null;
  title: string;
  description: string | null;
  topic: string | null;
  level: string;
  isCurated: boolean;
  createdAt: string;
  wordCount: number;
  newCount: number;
  dueCount: number;
}

/** Shape returned by GET /decks/:id (detail): includes its words. */
export interface DeckDetail {
  id: string;
  ownerId: string | null;
  title: string;
  description: string | null;
  topic: string | null;
  level: string;
  isCurated: boolean;
  createdAt: string;
  words: Word[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// ─── Import flow (DOG-111) ──────────────────────────────────────────────────

export interface PreviewRow {
  german: string;
  gender: string | null;
  english: string;
  plural: string | null;
  example: string | null;
  partOfSpeech: PartOfSpeech;
  level: string;
  source: string;
  status: 'new' | 'duplicate';
  fieldsFilledByAI: string[];
}

export interface CapUsage {
  plan: 'FREE' | 'PRO';
  limit: number | null;
  used: number;
  enrichedThisRequest: number;
}

export interface ImportPreviewResponse {
  rows: PreviewRow[];
  capUsage: CapUsage;
}

export interface ImportCommitResponse {
  created: number;
  wordIds: string[];
  skippedDuplicates: number;
}

// ─── Review / study (DOG-109) ───────────────────────────────────────────────

export type ReviewGrade = 'AGAIN' | 'GOOD' | 'EASY';
export type ReviewMode = 'flashcard' | 'type' | 'listening';

export interface ReviewItem {
  wordId: string;
  state: string;
  dueAt: string;
  intervalDays: number;
  ease: number;
  reps: number;
  lapses: number;
  word: Pick<Word, 'id' | 'german' | 'english' | 'gender' | 'plural' | 'example' | 'audioUrl' | 'partOfSpeech' | 'conjugation' | 'level'>;
}

export interface ReviewQueue {
  count: number;
  dueCount: number;
  newCount: number;
  items: ReviewItem[];
}

export interface GradeResult {
  state: string;
  dueAt: string;
  intervalDays: number;
  streakUpdated: boolean;
}

export interface WordsStats {
  totalWords: number;
  byState: { new: number; learning: number; review: number; lapsed: number };
  reviewsToday: number;
  dueToday: number;
  streak: number;
}

// ─── Advanced stats (DOG-115/118, Pro) ──────────────────────────────────────

export interface ForecastBucket {
  date: string; // local YYYY-MM-DD
  count: number;
}

export interface LeechWord {
  wordId: string;
  deckId: string;
  german: string;
  english: string;
  lapses: number;
  state: string;
  suspended: boolean;
}

export interface AdvancedStats {
  window: { days: number };
  retention: { pct: number | null; prevPct: number | null; reviewsCounted: number };
  forecast: ForecastBucket[];
  leeches: LeechWord[];
  leechThreshold: number;
}
