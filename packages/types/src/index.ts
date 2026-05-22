export type Plan = 'FREE' | 'PRO';
export type Level = 'A1' | 'A2' | 'A3';
export type ExerciseType = 'FILL_BLANK' | 'MULTIPLE_CHOICE' | 'TRANSLATE' | 'FREE_WRITE' | 'SORT' | 'BUILD' | 'ERROR_SPOT';
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type Gender = 'der' | 'die' | 'das';
export type Tense = 'praesens' | 'imperfekt';
export type Pronoun = 'ich' | 'du' | 'er' | 'wir' | 'ihr' | 'sie';
export type Hilfsverb = 'haben' | 'sein';

export interface User {
  id: string;
  email: string;
  name?: string | null;
  avatar?: string | null;
  provider: 'email' | 'google';
  plan: Plan;
  createdAt: Date;
}

export interface VocabWord {
  id: string;
  userId: string;
  german: string;
  english: string;
  gender?: Gender | null;
  plural?: string | null;
  example?: string | null;
  level: Level;
  createdAt: Date;
  flashcardStats?: FlashcardStat | null;
}

export interface FlashcardStat {
  id: string;
  wordId: string;
  timesShown: number;
  timesCorrect: number;
  consecutiveKnew: number;
  lastShown?: Date | null;
  mastered: boolean;
}

export interface ConjugationTable {
  ich: string;
  du: string;
  er: string;
  wir: string;
  ihr: string;
  sie: string;
}

export interface UserVerb {
  id: string;
  userId: string;
  infinitive: string;
  isIrregular: boolean;
  praesens: ConjugationTable;
  imperfekt: ConjugationTable;
  partizip2: string;
  hilfsverb: Hilfsverb;
  example: string;
  createdAt: Date;
}

export interface Exercise {
  id: string;
  topic: string;
  level: Level;
  type: ExerciseType;
  question: string;
  options?: string[] | null;
  answer: string;
  explanation: string;
  difficulty: Difficulty;
  imageUrl?: string | null;
}

export interface TopicProgress {
  id: string;
  userId: string;
  topic: string;
  level: Level;
  exercisesDone: number;
  correctCount: number;
  lastPracticed?: Date | null;
  unlocked: boolean;
}

export interface PracticeSession {
  id: string;
  userId: string;
  type: 'flashcard' | 'grammar' | 'conjugation';
  topic?: string | null;
  score: number;
  total: number;
  duration: number;
  createdAt: Date;
}

// Auth response types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse extends AuthTokens {
  user: User;
}

// Paginated response
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// Vocab import
export interface VocabImportItem {
  german: string;
  english: string;
  gender?: Gender | null;
  plural?: string | null;
  example?: string | null;
  level: Level;
}

export interface ClaudeVocabResponse {
  words: VocabImportItem[];
}

// Flashcard session
export interface FlashcardSessionWord extends VocabWord {
  inRequeue?: boolean;
}

export interface FlashcardResultDto {
  wordId: string;
  knew: boolean;
}

// Translation correction
export interface TranslationCorrectionResult {
  correct: boolean;
  corrected: string;
  errors: Array<{ wrong: string; right: string; rule: string }>;
  explanation: string;
  encouragement: string;
}

export interface FreeWriteCorrectionResult extends TranslationCorrectionResult {
  missingElements: string[];
}

// A1 topic slugs
export const A1_TOPICS = [
  'praesens',
  'noun-gender',
  'cases',
  'personal-pronouns',
  'possessive-pronouns',
  'modal-verbs',
  'dativ-prepositions',
  'akkusativ-prepositions',
  'two-way-prepositions',
  'imperative',
  'separable-verbs',
  'future-werden',
  'numbers-dates-time',
] as const;

export type A1Topic = (typeof A1_TOPICS)[number];

export interface Challenge {
  slug: string;
  name: string;
  description: string;
  emoji: string;
  topics: A1Topic[];
  minXp: number; // required XP in each topic to unlock
}

export const CHALLENGES: Challenge[] = [
  {
    slug: 'the-navigator',
    name: 'The Navigator',
    description: 'Find your way through German prepositions.',
    emoji: '🗺️',
    topics: ['dativ-prepositions', 'akkusativ-prepositions', 'two-way-prepositions'],
    minXp: 150,
  },
  {
    slug: 'the-shapeshifter',
    name: 'The Shapeshifter',
    description: 'Every noun has a disguise. Use it.',
    emoji: '🔄',
    topics: ['personal-pronouns', 'possessive-pronouns'],
    minXp: 150,
  },
  {
    slug: 'the-architect',
    name: 'The Architect',
    description: 'Build sentences that actually stand up.',
    emoji: '🏗️',
    topics: ['praesens', 'modal-verbs', 'separable-verbs', 'future-werden', 'imperative'],
    minXp: 400,
  },
  {
    slug: 'the-arena',
    name: 'The Arena',
    description: 'der, die, das, dem, den — only one survives.',
    emoji: '⚔️',
    topics: ['noun-gender', 'cases', 'personal-pronouns'],
    minXp: 400,
  },
  {
    slug: 'the-detective',
    name: 'The Detective',
    description: 'One mistake is hiding in every sentence. Find it.',
    emoji: '🔍',
    topics: ['cases', 'dativ-prepositions', 'akkusativ-prepositions', 'modal-verbs', 'personal-pronouns'],
    minXp: 800,
  },
];
