import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ClaudeService, ImportGapInput } from '../claude/claude.service';
import { VocabService } from '../vocab/vocab.service';
import { PartOfSpeech, Plan, Prisma } from '@prisma/client';
import { parseImportText, ParsedEntry } from './import-parser';
import { ImportPreviewDto } from './dto/import-preview.dto';
import { ImportCommitDto } from './dto/import-commit.dto';
import { ExtractTextDto } from './dto/extract-text.dto';
import { CAPS } from '../common/caps';

const ENRICH_ENDPOINT = 'words-import-enrich';
const EXTRACT_ENDPOINT = 'words-extract';

/** Normalize a German term for matching: lower-case, drop a leading definite article. */
function normalizeGerman(g: string): string {
  return g.trim().toLowerCase().replace(/^(der|die|das)\s+/, '');
}

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

@Injectable()
export class ImportService {
  constructor(
    private prisma: PrismaService,
    private claude: ClaudeService,
    private vocab: VocabService,
  ) {}

  async preview(userId: string, plan: Plan, dto: ImportPreviewDto) {
    const parsed = parseImportText(dto.text);
    return this.previewFromEntries(userId, plan, parsed);
  }

  /**
   * Extract-from-text (DOG-112): Claude pulls candidate vocab from a passage, then the
   * candidates flow through the exact same preview enrichment as a manual paste. Pro-only,
   * capped per day via DailyApiUsage; commit reuses POST /words/import/commit.
   */
  async extract(userId: string, plan: Plan, dto: ExtractTextDto) {
    if (plan !== Plan.PRO) {
      throw new ForbiddenException('Extract from text is a Pro feature');
    }

    const used = await this.getExtractUsage(userId);
    if (used >= CAPS.proExtractPerDay) {
      throw new ForbiddenException(`Daily extract limit reached (${CAPS.proExtractPerDay})`);
    }

    const candidates = await this.claude.extractVocabFromText(dto.text);
    await this.incrementExtractUsage(userId);

    // Dedupe by lemma (case-insensitive) as a safety net over Claude's own dedupe.
    const seen = new Set<string>();
    const parsed: ParsedEntry[] = [];
    for (const c of candidates) {
      const key = c.german.trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      parsed.push({
        german: c.german.trim(),
        gender: c.gender ?? null,
        english: c.english || null,
        partOfSpeech: c.gender ? PartOfSpeech.NOUN : PartOfSpeech.OTHER,
      });
    }

    return this.previewFromEntries(userId, plan, parsed);
  }

  /** Shared enrichment pipeline behind both manual paste preview and extract-from-text. */
  private async previewFromEntries(userId: string, plan: Plan, parsed: ParsedEntry[]) {
    // --- Wiktionary first (free): gender + plural ---
    const wiktionary = await Promise.all(
      parsed.map((e) => this.vocab.lookupWord(e.german)),
    );

    // Assemble draft rows, merging paste + Wiktionary.
    const drafts = parsed.map((entry, i) => {
      const wk = wiktionary[i];
      const gender = entry.gender ?? wk.gender ?? null;
      const plural = wk.plural ?? null;
      const wkContributed = wk.found && (!!wk.gender || !!wk.plural);
      return {
        german: entry.german,
        gender,
        plural,
        english: entry.english ?? '',
        example: null as string | null,
        partOfSpeech: gender ? PartOfSpeech.NOUN : entry.partOfSpeech,
        level: '' as string,
        wkContributed,
        fieldsFilledByAI: [] as string[],
      };
    });

    // --- Which rows need AI? (english if absent, plus example + level always) ---
    const needsAi = (d: (typeof drafts)[number]) => !d.english || !d.example || !d.level;
    const aiIndexes = drafts.map((d, i) => (needsAi(d) ? i : -1)).filter((i) => i !== -1);

    // --- Cost control: Free is capped; Pro is unlimited ---
    const used = await this.getEnrichUsage(userId);
    const budget = plan === Plan.PRO ? aiIndexes.length : Math.max(0, CAPS.freeImportEnrichPerDay - used);
    const toEnrich = aiIndexes.slice(0, budget);

    if (toEnrich.length > 0) {
      const inputs: ImportGapInput[] = toEnrich.map((i) => ({
        german: drafts[i].german,
        gender: drafts[i].gender as 'der' | 'die' | 'das' | null,
        plural: drafts[i].plural,
        needEnglish: !drafts[i].english,
      }));
      const filled = await this.claude.enrichImportGaps(inputs);
      // Claude sometimes echoes the german with its article ("der Hund"); match tolerantly.
      const byGerman = new Map(filled.map((f) => [normalizeGerman(f.german), f]));

      for (const i of toEnrich) {
        const d = drafts[i];
        const f = byGerman.get(normalizeGerman(d.german));
        if (!f) continue;
        if (!d.english && f.english) {
          d.english = f.english;
          d.fieldsFilledByAI.push('english');
        }
        if (!d.example && f.example) {
          d.example = f.example;
          d.fieldsFilledByAI.push('example');
        }
        if (!d.level && f.level) {
          d.level = f.level;
          d.fieldsFilledByAI.push('level');
        }
      }

      if (plan !== Plan.PRO) await this.incrementEnrichUsage(userId, toEnrich.length);
    }

    // Rows that weren't AI-enriched still need a sensible default level.
    for (const d of drafts) if (!d.level) d.level = 'A1';

    // --- Dedupe against the caller's existing words ---
    const existing = await this.prisma.word.findMany({
      where: { ownerId: userId },
      select: { german: true },
    });
    const existingSet = new Set(existing.map((w) => w.german.toLowerCase()));

    const rows: PreviewRow[] = drafts.map((d) => ({
      german: d.german,
      gender: d.gender,
      english: d.english,
      plural: d.plural,
      example: d.example,
      partOfSpeech: d.partOfSpeech,
      level: d.level,
      source: d.fieldsFilledByAI.length ? 'claude' : d.wkContributed ? 'wiktionary' : 'manual',
      status: existingSet.has(d.german.toLowerCase()) ? 'duplicate' : 'new',
      fieldsFilledByAI: d.fieldsFilledByAI,
    }));

    const usedAfter = plan === Plan.PRO ? 0 : used + toEnrich.length;
    return {
      rows,
      capUsage: {
        plan,
        limit: plan === Plan.PRO ? null : CAPS.freeImportEnrichPerDay,
        used: usedAfter,
        enrichedThisRequest: toEnrich.length,
      },
    };
  }

  async commit(userId: string, dto: ImportCommitDto) {
    const deck = await this.prisma.deck.findUnique({ where: { id: dto.deckId } });
    if (!deck) throw new NotFoundException('Deck not found');
    if (deck.isCurated || deck.ownerId !== userId) {
      throw new ForbiddenException('You can only import into your own decks');
    }

    const tagIds = [...new Set(dto.tagIds ?? [])];
    if (tagIds.length > 0) {
      const owned = await this.prisma.tag.count({ where: { id: { in: tagIds }, ownerId: userId } });
      if (owned !== tagIds.length) {
        throw new BadRequestException('One or more tags do not exist or are not yours');
      }
    }

    const toCreate = dto.rows.filter((r) => r.status !== 'duplicate' || r.override);

    const wordIds: string[] = [];
    for (const r of toCreate) {
      const partOfSpeech = r.partOfSpeech ?? (r.gender ? PartOfSpeech.NOUN : PartOfSpeech.OTHER);
      const word = await this.prisma.word.create({
        data: {
          ownerId: userId,
          deckId: dto.deckId,
          german: r.german,
          english: r.english,
          gender: r.gender || null,
          plural: r.plural || null,
          example: r.example || null,
          partOfSpeech,
          level: r.level || 'A1',
          source: r.source || 'manual',
        },
      });
      wordIds.push(word.id);
    }

    if (tagIds.length > 0 && wordIds.length > 0) {
      const data: Prisma.WordTagCreateManyInput[] = [];
      for (const wordId of wordIds) for (const tagId of tagIds) data.push({ wordId, tagId });
      await this.prisma.wordTag.createMany({ data, skipDuplicates: true });
    }

    return {
      created: wordIds.length,
      wordIds,
      skippedDuplicates: dto.rows.length - toCreate.length,
    };
  }

  private async getEnrichUsage(userId: string): Promise<number> {
    const today = new Date().toISOString().slice(0, 10);
    const row = await this.prisma.dailyApiUsage.findUnique({
      where: { userId_date_endpoint: { userId, date: today, endpoint: ENRICH_ENDPOINT } },
    });
    return row?.count ?? 0;
  }

  private async incrementEnrichUsage(userId: string, by: number): Promise<void> {
    const today = new Date().toISOString().slice(0, 10);
    await this.prisma.dailyApiUsage.upsert({
      where: { userId_date_endpoint: { userId, date: today, endpoint: ENRICH_ENDPOINT } },
      create: { userId, date: today, endpoint: ENRICH_ENDPOINT, count: by },
      update: { count: { increment: by } },
    });
  }

  private async getExtractUsage(userId: string): Promise<number> {
    const today = new Date().toISOString().slice(0, 10);
    const row = await this.prisma.dailyApiUsage.findUnique({
      where: { userId_date_endpoint: { userId, date: today, endpoint: EXTRACT_ENDPOINT } },
    });
    return row?.count ?? 0;
  }

  private async incrementExtractUsage(userId: string): Promise<void> {
    const today = new Date().toISOString().slice(0, 10);
    await this.prisma.dailyApiUsage.upsert({
      where: { userId_date_endpoint: { userId, date: today, endpoint: EXTRACT_ENDPOINT } },
      create: { userId, date: today, endpoint: EXTRACT_ENDPOINT, count: 1 },
      update: { count: { increment: 1 } },
    });
  }
}
