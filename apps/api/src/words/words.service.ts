import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ClaudeService } from '../claude/claude.service';
import { TtsService } from '../tts/tts.service';
import { Prisma, PartOfSpeech, Plan } from '@prisma/client';
import { CreateWordDto } from './dto/create-word.dto';
import { UpdateWordDto } from './dto/update-word.dto';
import { GetWordsDto } from './dto/get-words.dto';
import { CAPS } from '../common/caps';

const WORD_INCLUDE = { tags: { include: { tag: true } } } satisfies Prisma.WordInclude;

/** Endpoint keys for per-day usage tracking. */
export const EXAMPLE_ENDPOINT = 'word-example';
export const AUDIO_ENDPOINT = 'word-audio';

@Injectable()
export class WordsService {
  constructor(
    private prisma: PrismaService,
    private claude: ClaudeService,
    private tts: TtsService,
  ) {}

  /** Caller's words + words in curated decks, filterable and paginated. */
  async getWords(userId: string, query: GetWordsDto) {
    const { deck, tag, search, partOfSpeech, page = 1, limit = 20 } = query;

    const where: Prisma.WordWhereInput = {
      AND: [
        { OR: [{ ownerId: userId }, { deck: { isCurated: true } }] },
        ...(deck ? [{ deckId: deck }] : []),
        ...(tag ? [{ tags: { some: { tagId: tag } } }] : []),
        ...(partOfSpeech ? [{ partOfSpeech }] : []),
        ...(search
          ? [
              {
                OR: [
                  { german: { contains: search, mode: Prisma.QueryMode.insensitive } },
                  { english: { contains: search, mode: Prisma.QueryMode.insensitive } },
                ],
              },
            ]
          : []),
      ],
    };

    const [data, total] = await Promise.all([
      this.prisma.word.findMany({
        where,
        include: WORD_INCLUDE,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.word.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async createWord(userId: string, dto: CreateWordDto) {
    const deck = await this.prisma.deck.findUnique({ where: { id: dto.deckId } });
    if (!deck) throw new NotFoundException('Deck not found');
    if (deck.isCurated || deck.ownerId !== userId) {
      throw new ForbiddenException('You can only add words to your own decks');
    }

    const word = await this.prisma.word.create({
      data: {
        ownerId: userId,
        deckId: dto.deckId,
        german: dto.german,
        english: dto.english,
        gender: dto.gender ?? null,
        plural: dto.plural ?? null,
        example: dto.example ?? null,
        partOfSpeech: dto.partOfSpeech ?? PartOfSpeech.NOUN,
        conjugation: (dto.conjugation as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        level: dto.level ?? 'A1',
        source: 'manual',
      },
      include: WORD_INCLUDE,
    });

    // Make your own words immediately studiable — no separate "enroll" step for owned decks.
    await this.prisma.cardState.create({ data: { userId, wordId: word.id } });

    return word;
  }

  async updateWord(userId: string, wordId: string, dto: UpdateWordDto) {
    await this.assertOwnedWord(userId, wordId);

    if (dto.tagIds) await this.replaceTags(userId, wordId, dto.tagIds);

    return this.prisma.word.update({
      where: { id: wordId },
      data: {
        ...(dto.german !== undefined ? { german: dto.german } : {}),
        ...(dto.english !== undefined ? { english: dto.english } : {}),
        ...(dto.gender !== undefined ? { gender: dto.gender } : {}),
        ...(dto.plural !== undefined ? { plural: dto.plural } : {}),
        ...(dto.example !== undefined ? { example: dto.example } : {}),
        ...(dto.partOfSpeech !== undefined ? { partOfSpeech: dto.partOfSpeech } : {}),
        ...(dto.level !== undefined ? { level: dto.level } : {}),
        ...(dto.conjugation !== undefined
          ? { conjugation: dto.conjugation as Prisma.InputJsonValue }
          : {}),
      },
      include: WORD_INCLUDE,
    });
  }

  async deleteWord(userId: string, wordId: string) {
    await this.assertOwnedWord(userId, wordId);
    await this.prisma.word.delete({ where: { id: wordId } }); // cascades WordTag + CardState
    return { message: 'Deleted successfully' };
  }

  /** Replace a word's tag set with the given caller-owned tag ids. */
  private async replaceTags(userId: string, wordId: string, tagIds: string[]) {
    const unique = [...new Set(tagIds)];
    if (unique.length > 0) {
      const owned = await this.prisma.tag.count({ where: { id: { in: unique }, ownerId: userId } });
      if (owned !== unique.length) {
        throw new BadRequestException('One or more tags do not exist or are not yours');
      }
    }
    await this.prisma.$transaction([
      this.prisma.wordTag.deleteMany({ where: { wordId } }),
      this.prisma.wordTag.createMany({
        data: unique.map((tagId) => ({ wordId, tagId })),
        skipDuplicates: true,
      }),
    ]);
  }

  /**
   * DOG-114: generate a fresh example sentence for an owned word and persist it.
   * Pro-only, owner-only, capped per day via DailyApiUsage.
   */
  async generateExample(userId: string, plan: Plan, wordId: string) {
    if (plan !== Plan.PRO) {
      throw new ForbiddenException('Example generation is a Pro feature');
    }

    const word = await this.assertOwnedWord(userId, wordId);

    const used = await this.getUsage(userId, EXAMPLE_ENDPOINT);
    if (used >= CAPS.proExamplePerDay) {
      throw new ForbiddenException(`Daily example limit reached (${CAPS.proExamplePerDay})`);
    }

    const example = await this.claude.generateExample({
      german: word.german,
      english: word.english,
      gender: (word.gender as 'der' | 'die' | 'das' | null) ?? null,
      partOfSpeech: word.partOfSpeech,
      level: word.level,
    });

    await this.incrementUsage(userId, EXAMPLE_ENDPOINT);

    return this.prisma.word.update({
      where: { id: wordId },
      data: { example },
      include: WORD_INCLUDE,
    });
  }

  /**
   * DOG-119: generate (and cache) cloud-TTS audio for an owned word, persisting audioUrl.
   * Pro-only, owner-only, capped per day. Identical text reuses the same S3 object.
   */
  async generateAudio(userId: string, plan: Plan, wordId: string) {
    if (plan !== Plan.PRO) {
      throw new ForbiddenException('Audio generation is a Pro feature');
    }
    if (!this.tts.enabled) {
      throw new ServiceUnavailableException('Cloud TTS is not configured');
    }

    const word = await this.assertOwnedWord(userId, wordId);

    const used = await this.getUsage(userId, AUDIO_ENDPOINT);
    if (used >= CAPS.proAudioPerDay) {
      throw new ForbiddenException(`Daily audio limit reached (${CAPS.proAudioPerDay})`);
    }

    const audioUrl = await this.tts.synthesizeAndStore(word.german);
    await this.incrementUsage(userId, AUDIO_ENDPOINT);

    return this.prisma.word.update({
      where: { id: wordId },
      data: { audioUrl },
      include: WORD_INCLUDE,
    });
  }

  private async getUsage(userId: string, endpoint: string): Promise<number> {
    const today = new Date().toISOString().slice(0, 10);
    const row = await this.prisma.dailyApiUsage.findUnique({
      where: { userId_date_endpoint: { userId, date: today, endpoint } },
    });
    return row?.count ?? 0;
  }

  private async incrementUsage(userId: string, endpoint: string): Promise<void> {
    const today = new Date().toISOString().slice(0, 10);
    await this.prisma.dailyApiUsage.upsert({
      where: { userId_date_endpoint: { userId, date: today, endpoint } },
      create: { userId, date: today, endpoint, count: 1 },
      update: { count: { increment: 1 } },
    });
  }

  private async assertOwnedWord(userId: string, wordId: string) {
    const word = await this.prisma.word.findUnique({ where: { id: wordId } });
    if (!word) throw new NotFoundException('Word not found');
    if (word.ownerId !== userId) throw new ForbiddenException('You do not own this word');
    return word;
  }
}
