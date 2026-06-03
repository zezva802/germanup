import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CardStateType } from '@prisma/client';
import { CreateDeckDto } from './dto/create-deck.dto';
import { UpdateDeckDto } from './dto/update-deck.dto';

/** Card states that count as "in rotation" (not brand-new) for due calculations. */
const DUE_STATES: CardStateType[] = [
  CardStateType.LEARNING,
  CardStateType.REVIEW,
  CardStateType.LAPSED,
];

@Injectable()
export class DecksService {
  constructor(private prisma: PrismaService) {}

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

  /** Loads a deck and ensures the caller owns it (and it isn't curated). */
  private async assertOwnedDeck(userId: string, deckId: string) {
    const deck = await this.prisma.deck.findUnique({ where: { id: deckId } });
    if (!deck) throw new NotFoundException('Deck not found');
    if (deck.isCurated) throw new ForbiddenException('Curated decks are read-only');
    if (deck.ownerId !== userId) throw new ForbiddenException('You do not own this deck');
    return deck;
  }
}
