import { Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, PartOfSpeech } from '@prisma/client';
import { TtsService } from '../tts/tts.service';
import { CreateCuratedDeckDto } from './dto/create-curated-deck.dto';
import { UpdateCuratedDeckDto } from './dto/update-curated-deck.dto';
import { ImportCuratedWordsDto } from './dto/import-curated-words.dto';

/** Per-request bound on the curated TTS batch (re-run to continue; idempotent). */
const TTS_BATCH_DEFAULT = 50;
const TTS_BATCH_MAX = 200;

@Injectable()
export class AdminDecksService {
  constructor(
    private prisma: PrismaService,
    private tts: TtsService,
  ) {}

  /**
   * Batch-generate cloud-TTS audio for curated words that don't have it yet (DOG-119).
   * Bounded per call so the request can't time out; re-run to continue. Idempotent: only
   * touches words with audioUrl === null.
   */
  async ttsCurated(limit?: number) {
    if (!this.tts.enabled) {
      throw new ServiceUnavailableException('Cloud TTS is not configured');
    }
    const take = Math.min(TTS_BATCH_MAX, Math.max(1, limit ?? TTS_BATCH_DEFAULT));

    const words = await this.prisma.word.findMany({
      where: { deck: { isCurated: true }, audioUrl: null },
      select: { id: true, german: true },
      take,
    });

    let processed = 0;
    for (const w of words) {
      const audioUrl = await this.tts.synthesizeAndStore(w.german);
      await this.prisma.word.update({ where: { id: w.id }, data: { audioUrl } });
      processed++;
    }

    const remaining = await this.prisma.word.count({
      where: { deck: { isCurated: true }, audioUrl: null },
    });
    return { processed, remaining };
  }

  async listDecks() {
    const decks = await this.prisma.deck.findMany({
      where: { isCurated: true },
      include: { _count: { select: { words: true } } },
      orderBy: [{ level: 'asc' }, { title: 'asc' }],
    });
    return decks.map((d) => ({
      id: d.id,
      title: d.title,
      description: d.description,
      topic: d.topic,
      level: d.level,
      isCurated: d.isCurated,
      createdAt: d.createdAt,
      wordCount: d._count.words,
    }));
  }

  async createDeck(dto: CreateCuratedDeckDto) {
    return this.prisma.deck.create({
      data: {
        ownerId: null,
        isCurated: true,
        title: dto.title,
        description: dto.description ?? null,
        topic: dto.topic ?? null,
        level: dto.level ?? 'A1',
      },
    });
  }

  async updateDeck(id: string, dto: UpdateCuratedDeckDto) {
    await this.assertCuratedDeck(id);
    return this.prisma.deck.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.topic !== undefined ? { topic: dto.topic } : {}),
        ...(dto.level !== undefined ? { level: dto.level } : {}),
      },
    });
  }

  async deleteDeck(id: string) {
    await this.assertCuratedDeck(id);
    await this.prisma.deck.delete({ where: { id } }); // cascades words -> WordTag/CardState
    return { success: true };
  }

  /** Bulk import fully pre-enriched words into a curated deck. No Claude/Wiktionary calls. */
  async importWords(deckId: string, dto: ImportCuratedWordsDto) {
    await this.assertCuratedDeck(deckId);
    const created = await this.prisma.word.createMany({
      data: dto.words.map((w) => ({
        ownerId: null,
        deckId,
        german: w.german,
        english: w.english,
        gender: w.gender ?? null,
        plural: w.plural ?? null,
        example: w.example ?? null,
        partOfSpeech: w.partOfSpeech as PartOfSpeech,
        conjugation: (w.conjugation as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        level: w.level,
        source: 'curated',
      })),
      skipDuplicates: true,
    });
    return { imported: created.count };
  }

  async clearWords(deckId: string) {
    await this.assertCuratedDeck(deckId);
    const { count } = await this.prisma.word.deleteMany({ where: { deckId } });
    return { deleted: count };
  }

  /** Ensure the target exists and is a curated deck — never touch user-owned decks. */
  private async assertCuratedDeck(id: string) {
    const deck = await this.prisma.deck.findUnique({ where: { id } });
    if (!deck || !deck.isCurated) throw new NotFoundException('Curated deck not found');
    return deck;
  }
}
