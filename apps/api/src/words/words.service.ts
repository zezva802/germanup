import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, PartOfSpeech } from '@prisma/client';
import { CreateWordDto } from './dto/create-word.dto';
import { UpdateWordDto } from './dto/update-word.dto';
import { GetWordsDto } from './dto/get-words.dto';

const WORD_INCLUDE = { tags: { include: { tag: true } } } satisfies Prisma.WordInclude;

@Injectable()
export class WordsService {
  constructor(private prisma: PrismaService) {}

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

    return this.prisma.word.create({
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

  private async assertOwnedWord(userId: string, wordId: string) {
    const word = await this.prisma.word.findUnique({ where: { id: wordId } });
    if (!word) throw new NotFoundException('Word not found');
    if (word.ownerId !== userId) throw new ForbiddenException('You do not own this word');
    return word;
  }
}
