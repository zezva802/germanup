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
export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}
export interface AuthResponse extends AuthTokens {
    user: User;
}
export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
}
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
export interface FlashcardSessionWord extends VocabWord {
    inRequeue?: boolean;
}
export interface FlashcardResultDto {
    wordId: string;
    knew: boolean;
}
export interface TranslationCorrectionResult {
    correct: boolean;
    corrected: string;
    errors: Array<{
        wrong: string;
        right: string;
        rule: string;
    }>;
    explanation: string;
    encouragement: string;
}
export interface FreeWriteCorrectionResult extends TranslationCorrectionResult {
    missingElements: string[];
}
export declare const A1_TOPICS: readonly ["praesens", "noun-gender", "cases", "personal-pronouns", "possessive-pronouns", "modal-verbs", "dativ-prepositions", "akkusativ-prepositions", "two-way-prepositions", "imperative", "separable-verbs", "future-werden", "numbers-dates-time"];
export type A1Topic = (typeof A1_TOPICS)[number];
export interface Challenge {
    slug: string;
    name: string;
    description: string;
    emoji: string;
    topics: A1Topic[];
    minXp: number;
}
export declare const CHALLENGES: Challenge[];
// Challenges: the-navigator, the-shapeshifter, the-architect, the-arena, the-detective
//# sourceMappingURL=index.d.ts.map