import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ClaudeService } from '../claude/claude.service';
import { ImportWordsDto } from './dto/import-words.dto';
import { GetVocabDto } from './dto/get-vocab.dto';
import { FlashcardResultDto } from './dto/flashcard-result.dto';
import { FlashcardSessionDto } from './dto/flashcard-session.dto';
import { Plan, VocabWord } from '@prisma/client';

export interface WiktionaryLookupResult {
  found: boolean;
  gender: 'der' | 'die' | 'das' | null;
  plural: string | null;
}

@Injectable()
export class VocabService {
  constructor(
    private prisma: PrismaService,
    private claude: ClaudeService,
  ) {}

  async importWords(userId: string, userPlan: Plan, dto: ImportWordsDto) {
    if (userPlan !== 'PRO') {
      throw new ForbiddenException('Vocabulary import requires a Pro subscription');
    }

    await this.checkAndIncrementDailyUsage(userId, 'vocab/import', 10);

    // Step 1: Wiktionary lookups in parallel (free, no Claude tokens)
    const lookups = await Promise.all(
      dto.words.map(async (word) => {
        const result = await this.lookupWord(word);
        return { german: word, gender: result.gender, plural: result.plural };
      }),
    );

    // Step 2: Claude only fills in english translation, example, level
    const enriched = await this.claude.enrichVocabulary(lookups);

    const created = await Promise.all(
      enriched.map((word) =>
        this.prisma.vocabWord.create({
          data: {
            userId,
            german: word.german,
            english: word.english,
            gender: word.gender ?? null,
            plural: word.plural ?? null,
            example: word.example ?? null,
            level: word.level,
          },
        }),
      ),
    );

    return created;
  }

  async getVocab(userId: string, query: GetVocabDto) {
    const { page = 1, limit = 20, level } = query;

    const where = { userId, ...(level ? { level } : {}) };

    const [data, total] = await Promise.all([
      this.prisma.vocabWord.findMany({
        where,
        include: { flashcardStats: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.vocabWord.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async deleteWord(userId: string, wordId: string) {
    const word = await this.prisma.vocabWord.findFirst({
      where: { id: wordId, userId },
    });
    if (!word) throw new NotFoundException('Word not found');

    await this.prisma.vocabWord.delete({ where: { id: wordId } });
    return { message: 'Deleted successfully' };
  }

  async getFlashcardSession(userId: string, userPlan: Plan, query: FlashcardSessionDto) {
    const { size = 20, level } = query;

    // Free tier: cap at 20 flashcards per day
    if (userPlan === 'FREE') {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const doneToday = await this.prisma.practiceSession.count({
        where: { userId, type: 'flashcard', createdAt: { gte: todayStart } },
      });
      if (doneToday >= 20) {
        throw new ForbiddenException('Free plan allows 20 flashcards per day. Upgrade to Pro for unlimited access.');
      }
    }

    const where = { userId, ...(level ? { level } : {}) };

    const words = await this.prisma.vocabWord.findMany({
      where,
      include: { flashcardStats: true },
      orderBy: { createdAt: 'desc' },
    });

    const sorted = this.prioritizeWords(words);
    return sorted.slice(0, size);
  }

  async recordFlashcardResult(userId: string, dto: FlashcardResultDto) {
    const word = await this.prisma.vocabWord.findFirst({
      where: { id: dto.wordId, userId },
      include: { flashcardStats: true },
    });
    if (!word) throw new NotFoundException('Word not found');

    if (word.flashcardStats) {
      const consecutiveKnew = dto.knew ? word.flashcardStats.consecutiveKnew + 1 : 0;
      await this.prisma.flashcardStat.update({
        where: { id: word.flashcardStats.id },
        data: {
          timesShown: { increment: 1 },
          ...(dto.knew ? { timesCorrect: { increment: 1 } } : {}),
          consecutiveKnew,
          lastShown: new Date(),
          mastered: consecutiveKnew >= 2,
        },
      });
    } else {
      await this.prisma.flashcardStat.create({
        data: {
          wordId: dto.wordId,
          timesShown: 1,
          timesCorrect: dto.knew ? 1 : 0,
          consecutiveKnew: dto.knew ? 1 : 0,
          lastShown: new Date(),
          mastered: false,
        },
      });
    }

    // Track daily flashcard count via PracticeSession
    await this.prisma.practiceSession.create({
      data: {
        userId,
        type: 'flashcard',
        score: dto.knew ? 1 : 0,
        total: 1,
        duration: 0,
      },
    });

    return { success: true };
  }

  async lookupWord(word: string): Promise<WiktionaryLookupResult> {
    const term = word.trim();
    if (!term) return { found: false, gender: null, plural: null };

    // German noun pages are capitalized (Hund, not hund). Try as typed, then a capitalized
    // variant so a lowercase entry still resolves; return the first hit that carries data.
    const capitalized = term.charAt(0).toUpperCase() + term.slice(1);
    const variants = capitalized !== term ? [term, capitalized] : [term];

    let lastFound: WiktionaryLookupResult = { found: false, gender: null, plural: null };
    for (const variant of variants) {
      const result = await this.fetchWiktionary(variant);
      if (result.found) {
        lastFound = result;
        if (result.gender || result.plural) return result; // got useful noun data
      }
    }
    return lastFound;
  }

  private async fetchWiktionary(word: string): Promise<WiktionaryLookupResult> {
    try {
      const url = `https://de.wiktionary.org/w/api.php?action=parse&page=${encodeURIComponent(word)}&prop=wikitext&format=json&redirects=1`;
      const res = await fetch(url);
      if (!res.ok) return { found: false, gender: null, plural: null };

      const data = await res.json() as { parse?: { wikitext?: { '*'?: string } } };
      const wikitext = data?.parse?.wikitext?.['*'] ?? '';

      if (!wikitext) return { found: false, gender: null, plural: null };

      // Extract gender from {{Deutsch Substantiv Übersicht ... |Genus=m/f/n ... }}
      const genusMatch = wikitext.match(/\|Genus\s*=\s*([mfnu])/);
      const genusMap: Record<string, 'der' | 'die' | 'das'> = { m: 'der', f: 'die', n: 'das' };
      const gender = genusMatch ? (genusMap[genusMatch[1]] ?? null) : null;

      // Extract nominative plural
      const pluralMatch = wikitext.match(/\|Nominativ Plural\s*=\s*([^\n|{}]+)/);
      const plural = pluralMatch ? pluralMatch[1].trim() : null;

      return { found: true, gender, plural: plural || null };
    } catch {
      return { found: false, gender: null, plural: null };
    }
  }

  async addWord(
    userId: string,
    dto: { german: string; english: string; level: string; gender?: string; plural?: string },
  ) {
    return this.prisma.vocabWord.create({
      data: {
        userId,
        german: dto.german,
        english: dto.english,
        gender: dto.gender ?? null,
        plural: dto.plural ?? null,
        example: null,
        level: dto.level,
      },
    });
  }

  private prioritizeWords(
    words: (VocabWord & { flashcardStats: { consecutiveKnew: number; mastered: boolean } | null })[],
  ) {
    return [...words].sort((a, b) => {
      const sA = a.flashcardStats;
      const sB = b.flashcardStats;
      if (!sA && sB) return -1;
      if (sA && !sB) return 1;
      if (!sA && !sB) return 0;
      return (sA!.consecutiveKnew) - (sB!.consecutiveKnew);
    });
  }

  private async checkAndIncrementDailyUsage(userId: string, endpoint: string, limit: number) {
    const today = new Date().toISOString().slice(0, 10);
    const row = await this.prisma.dailyApiUsage.upsert({
      where: { userId_date_endpoint: { userId, date: today, endpoint } },
      create: { userId, date: today, endpoint, count: 1 },
      update: { count: { increment: 1 } },
    });
    if (row.count > limit) {
      throw new ForbiddenException('Daily import limit reached. Try again tomorrow.');
    }
  }
}
