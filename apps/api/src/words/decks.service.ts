import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ClaudeService } from '../claude/claude.service';
import { CardStateType, PartOfSpeech, Plan, Prisma } from '@prisma/client';
import { CreateDeckDto } from './dto/create-deck.dto';
import { UpdateDeckDto } from './dto/update-deck.dto';
import { GenerateDeckDto } from './dto/generate-deck.dto';

/** Card states that count as "in rotation" (not brand-new) for due calculations. */
const DUE_STATES: CardStateType[] = [
  CardStateType.LEARNING,
  CardStateType.REVIEW,
  CardStateType.LAPSED,
];

/** Pro-only daily cap on AI deck generation (DOG-113). */
const GENERATE_ENDPOINT = 'deck-generate';
export const PRO_GENERATE_CAP = 5;
const DEFAULT_GENERATE_COUNT = 20;
const MAX_GENERATE_COUNT = 30;

const VALID_POS = new Set<string>(Object.values(PartOfSpeech));

@Injectable()
export class DecksService {
  constructor(
    private prisma: PrismaService,
    private claude: ClaudeService,
  ) {}

  /** Curated decks (all) + caller's own, each with word count and the caller's new/due counts. */
  async getDecks(userId: string) {
    const now = new Date();

    const [decks, cards] = await Promise.all([
      this.prisma.deck.findMany({
        where: { OR: [{ isCurated: true }, { ownerId: userId }] },
        include: { _count: { select: { words: true } } },
        orderBy: [{ isCurated: 'desc' }, { createdAt: 'asc' }],
      }),
      this.prisma.cardState.findMany({
        where: { userId },
        select: { state: true, dueAt: true, word: { select: { deckId: true } } },
      }),
    ]);

    // Bucket the caller's card states per deck in memory (one query, no per-deck round-trips).
    const counts = new Map<string, { newCount: number; dueCount: number }>();
    for (const c of cards) {
      const deckId = c.word.deckId;
      const entry = counts.get(deckId) ?? { newCount: 0, dueCount: 0 };
      if (c.state === CardStateType.NEW) entry.newCount++;
      else if (DUE_STATES.includes(c.state) && c.dueAt <= now) entry.dueCount++;
      counts.set(deckId, entry);
    }

    return decks.map((d) => ({
      id: d.id,
      ownerId: d.ownerId,
      title: d.title,
      description: d.description,
      topic: d.topic,
      level: d.level,
      isCurated: d.isCurated,
      createdAt: d.createdAt,
      wordCount: d._count.words,
      newCount: counts.get(d.id)?.newCount ?? 0,
      dueCount: counts.get(d.id)?.dueCount ?? 0,
    }));
  }

  /** Deck detail + its words. Curated decks are visible to everyone; user decks only to the owner. */
  async getDeck(userId: string, deckId: string) {
    const deck = await this.prisma.deck.findUnique({
      where: { id: deckId },
      include: { words: { include: { tags: { include: { tag: true } } }, orderBy: { createdAt: 'asc' } } },
    });
    if (!deck) throw new NotFoundException('Deck not found');
    if (!deck.isCurated && deck.ownerId !== userId) throw new NotFoundException('Deck not found');
    return deck;
  }

  async createDeck(userId: string, dto: CreateDeckDto) {
    return this.prisma.deck.create({
      data: {
        ownerId: userId,
        isCurated: false,
        title: dto.title,
        description: dto.description ?? null,
        topic: dto.topic ?? null,
        level: dto.level ?? 'A1',
      },
    });
  }

  async updateDeck(userId: string, deckId: string, dto: UpdateDeckDto) {
    await this.assertOwnedDeck(userId, deckId);
    return this.prisma.deck.update({
      where: { id: deckId },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.topic !== undefined ? { topic: dto.topic } : {}),
        ...(dto.level !== undefined ? { level: dto.level } : {}),
      },
    });
  }

  async deleteDeck(userId: string, deckId: string) {
    await this.assertOwnedDeck(userId, deckId);
    await this.prisma.deck.delete({ where: { id: deckId } });
    return { message: 'Deleted successfully' };
  }

  /**
   * Enroll the caller in a curated deck: create a NEW CardState for every word in the deck the
   * caller doesn't already have one for. Idempotent (skipDuplicates on @@unique([userId, wordId])).
   * Words are shared — never copied.
   */
  async startDeck(userId: string, deckId: string) {
    const deck = await this.prisma.deck.findUnique({
      where: { id: deckId },
      include: { words: { select: { id: true } } },
    });
    if (!deck) throw new NotFoundException('Deck not found');
    if (!deck.isCurated && deck.ownerId !== userId) throw new NotFoundException('Deck not found');

    const result = await this.prisma.cardState.createMany({
      data: deck.words.map((w) => ({ userId, wordId: w.id })),
      skipDuplicates: true,
    });

    return { enrolled: result.count, totalWords: deck.words.length };
  }

  /**
   * AI-generated deck (DOG-113): Claude produces enriched words for a topic; they're saved as a
   * NEW user-owned (non-curated) deck with source="claude". Pro-only, capped per day. Returns the
   * new deck + its words for review; the deck appears in GET /decks and is immediately studyable.
   */
  async generateDeck(userId: string, plan: Plan, dto: GenerateDeckDto) {
    if (plan !== Plan.PRO) {
      throw new ForbiddenException('Deck generation is a Pro feature');
    }

    const used = await this.getGenerateUsage(userId);
    if (used >= PRO_GENERATE_CAP) {
      throw new ForbiddenException(`Daily deck generation limit reached (${PRO_GENERATE_CAP})`);
    }

    const level = dto.level || 'A1';
    const count = Math.min(MAX_GENERATE_COUNT, Math.max(1, dto.count ?? DEFAULT_GENERATE_COUNT));

    const generated = await this.claude.generateDeck(dto.topic, level, count);
    await this.incrementGenerateUsage(userId);

    // Dedupe within the generated set by lemma (case-insensitive).
    const seen = new Set<string>();
    const words = generated.filter((w) => {
      const key = w.german?.trim().toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const deck = await this.prisma.deck.create({
      data: { ownerId: userId, isCurated: false, title: dto.topic, topic: dto.topic, level },
    });

    for (const w of words) {
      const pos = VALID_POS.has(w.partOfSpeech) ? w.partOfSpeech : PartOfSpeech.OTHER;
      const isVerb = pos === PartOfSpeech.VERB;
      const conjugation =
        isVerb && w.conjugation?.praesens
          ? (w.conjugation as unknown as Prisma.InputJsonValue)
          : Prisma.JsonNull;
      await this.prisma.word.create({
        data: {
          ownerId: userId,
          deckId: deck.id,
          german: w.german.trim(),
          english: w.english || '',
          gender: w.gender || null,
          plural: w.plural || null,
          example: w.example || null,
          partOfSpeech: pos,
          conjugation,
          level,
          source: 'claude',
        },
      });
    }

    return this.getDeck(userId, deck.id);
  }

  private async getGenerateUsage(userId: string): Promise<number> {
    const today = new Date().toISOString().slice(0, 10);
    const row = await this.prisma.dailyApiUsage.findUnique({
      where: { userId_date_endpoint: { userId, date: today, endpoint: GENERATE_ENDPOINT } },
    });
    return row?.count ?? 0;
  }

  private async incrementGenerateUsage(userId: string): Promise<void> {
    const today = new Date().toISOString().slice(0, 10);
    await this.prisma.dailyApiUsage.upsert({
      where: { userId_date_endpoint: { userId, date: today, endpoint: GENERATE_ENDPOINT } },
      create: { userId, date: today, endpoint: GENERATE_ENDPOINT, count: 1 },
      update: { count: { increment: 1 } },
    });
  }

  /** Loads a deck and ensures the caller owns it (and it isn't curated). */
  private async assertOwnedDeck(userId: string, deckId: string) {
    const deck = await this.prisma.deck.findUnique({ where: { id: deckId } });
    if (!deck) throw new NotFoundException('Deck not found');
    if (deck.isCurated) throw new ForbiddenException('Curated decks are read-only');
    if (deck.ownerId !== userId) throw new ForbiddenException('You do not own this deck');
    return deck;
  }
}
