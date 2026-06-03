import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PartOfSpeech } from '@prisma/client';
import Anthropic from '@anthropic-ai/sdk';

export interface VocabEnrichInput {
  german: string;
  gender: 'der' | 'die' | 'das' | null;
  plural: string | null;
}

export interface VocabImportItem {
  german: string;
  english: string;
  gender?: 'der' | 'die' | 'das' | null;
  plural?: string | null;
  example?: string | null;
  level: 'A1' | 'A2' | 'A3';
}

export interface ImportGapInput {
  german: string;
  gender: 'der' | 'die' | 'das' | null;
  plural: string | null;
  /** Whether the pasted text already supplied an English translation. */
  needEnglish: boolean;
}

export interface ImportGapResult {
  german: string;
  english: string;
  example: string;
  level: 'A1' | 'A2' | 'A3';
}

export interface VerbConjugationMap {
  ich: string;
  du: string;
  er: string;
  wir: string;
  ihr: string;
  sie: string;
}

export interface VerbImportResult {
  infinitive: string;
  isIrregular: boolean;
  praesens: VerbConjugationMap;
  imperfekt: VerbConjugationMap;
  partizip2: string;
  hilfsverb: 'haben' | 'sein';
  example: string;
}

const MODEL = 'claude-sonnet-4-6';

function stripFences(text: string): string {
  return text.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '').trim();
}

@Injectable()
export class ClaudeService {
  private client: Anthropic;

  constructor(private config: ConfigService) {
    this.client = new Anthropic({
      apiKey: config.get<string>('anthropic.apiKey'),
    });
  }

  // Words come in with gender/plural pre-filled from Wiktionary.
  // Claude only adds: english translation, example sentence, level.
  async enrichVocabulary(words: VocabEnrichInput[]): Promise<VocabImportItem[]> {
    const wordList = words
      .map((w) => {
        const hints: string[] = [];
        if (w.gender) hints.push(`gender: ${w.gender}`);
        if (w.plural) hints.push(`plural: ${w.plural}`);
        return hints.length ? `${w.german} (${hints.join(', ')})` : w.german;
      })
      .join(', ');

    const prompt = `For each German word, return English translation, a simple A1 example sentence, and level (A1/A2/A3).
Return ONLY this JSON:
{"words":[{"german":"string","english":"string","example":"string","level":"A1"|"A2"|"A3"}]}
Words: ${wordList}`;

    try {
      const message = await this.client.messages.create({
        model: MODEL,
        max_tokens: 1024,
        temperature: 0,
        messages: [{ role: 'user', content: prompt }],
      });

      const text = message.content[0].type === 'text' ? message.content[0].text : '';
      const parsed = JSON.parse(stripFences(text)) as { words: Array<{ german: string; english: string; example: string; level: 'A1' | 'A2' | 'A3' }> };

      // Merge Claude output with pre-filled Wiktionary data
      return parsed.words.map((w) => {
        const original = words.find((o) => o.german.toLowerCase() === w.german.toLowerCase());
        return {
          german: w.german,
          english: w.english,
          gender: original?.gender ?? null,
          plural: original?.plural ?? null,
          example: w.example,
          level: w.level,
        };
      });
    } catch (err) {
      throw new InternalServerErrorException(
        `Claude vocabulary enrichment failed: ${(err as Error).message}`,
      );
    }
  }

  /**
   * Import gap-fill (DOG-105): fill ONLY the missing fields (English if absent, plus a simple
   * example sentence and CEFR level) for a batch of entries in a single prompt-cached call.
   * Gender/plural come pre-filled from Wiktionary and are passed only as hints. temperature: 0.
   */
  async enrichImportGaps(entries: ImportGapInput[]): Promise<ImportGapResult[]> {
    if (entries.length === 0) return [];

    const wordList = entries
      .map((e) => {
        const hints: string[] = [];
        if (e.gender) hints.push(`gender: ${e.gender}`);
        if (e.plural) hints.push(`plural: ${e.plural}`);
        if (!e.needEnglish) hints.push('english: already known (still echo it back)');
        return hints.length ? `${e.german} (${hints.join(', ')})` : e.german;
      })
      .join('\n');

    try {
      const message = await this.client.messages.create({
        model: MODEL,
        max_tokens: Math.min(4096, 256 + entries.length * 80),
        temperature: 0,
        system: [
          {
            type: 'text' as const,
            text: 'You enrich German vocabulary for an A1 learning app. For each German word given, return its English translation, a simple example sentence (A1-appropriate German), and CEFR level (A1, A2, or A3). Echo the german exactly as provided. Return ONLY valid JSON of the form {"words":[{"german":"string","english":"string","example":"string","level":"A1"|"A2"|"A3"}]} with no extra text.',
            // @ts-expect-error cache_control is supported but not yet in SDK types
            cache_control: { type: 'ephemeral' },
          },
        ],
        messages: [{ role: 'user', content: `Words:\n${wordList}` }],
      });

      const text = message.content[0].type === 'text' ? message.content[0].text : '';
      const parsed = JSON.parse(stripFences(text)) as { words: ImportGapResult[] };
      return parsed.words;
    } catch (err) {
      throw new InternalServerErrorException(
        `Claude import enrichment failed: ${(err as Error).message}`,
      );
    }
  }

  /**
   * On-demand example sentence (DOG-114): one natural, level-appropriate German sentence
   * that uses the given word. temperature: 0, system prompt cached.
   */
  async generateExample(input: {
    german: string;
    english: string;
    gender: 'der' | 'die' | 'das' | null;
    partOfSpeech: PartOfSpeech;
    level: string;
  }): Promise<string> {
    const hints: string[] = [`part of speech: ${input.partOfSpeech.toLowerCase()}`];
    if (input.gender) hints.push(`gender: ${input.gender}`);
    if (input.english) hints.push(`english: ${input.english}`);

    try {
      const message = await this.client.messages.create({
        model: MODEL,
        max_tokens: 256,
        temperature: 0,
        system: [
          {
            type: 'text' as const,
            text: 'You write example sentences for a German learning app aimed at English speakers. Given one German word and its CEFR level, return ONE natural German sentence that uses the word and is appropriate for that level (short, simple vocabulary, correct grammar). Return ONLY valid JSON of the form {"example":"string"} with no extra text.',
            // @ts-expect-error cache_control is supported but not yet in SDK types
            cache_control: { type: 'ephemeral' },
          },
        ],
        messages: [
          {
            role: 'user',
            content: `Word: ${input.german} (${hints.join(', ')})\nLevel: ${input.level}`,
          },
        ],
      });

      const text = message.content[0].type === 'text' ? message.content[0].text : '';
      const parsed = JSON.parse(stripFences(text)) as { example: string };
      return parsed.example;
    } catch (err) {
      throw new InternalServerErrorException(
        `Claude example generation failed: ${(err as Error).message}`,
      );
    }
  }

  async importVerb(infinitive: string): Promise<VerbImportResult> {
    const prompt = `For the German verb "${infinitive}", return ONLY this JSON:
{"infinitive":"string","isIrregular":boolean,"praesens":{"ich":"","du":"","er":"","wir":"","ihr":"","sie":""},"imperfekt":{"ich":"","du":"","er":"","wir":"","ihr":"","sie":""},"partizip2":"string","hilfsverb":"haben"|"sein","example":"simple A1 sentence"}`;

    try {
      const message = await this.client.messages.create({
        model: MODEL,
        max_tokens: 512,
        temperature: 0,
        messages: [{ role: 'user', content: prompt }],
      });

      const text = message.content[0].type === 'text' ? message.content[0].text : '';
      return JSON.parse(stripFences(text)) as VerbImportResult;
    } catch (err) {
      throw new InternalServerErrorException(
        `Claude verb import failed: ${(err as Error).message}`,
      );
    }
  }

  async correctTranslation(topic: string, task: string, answer: string): Promise<object> {
    try {
      const message = await this.client.messages.create({
        model: MODEL,
        max_tokens: 512,
        temperature: 0,
        system: [
          {
            type: 'text' as const,
            text: 'You are a strict but encouraging German A1 tutor for English speakers. Always write explanation and encouragement in English. Evaluate student answers and return ONLY valid JSON, no extra text.',
            // @ts-expect-error cache_control is supported but not yet in SDK types
            cache_control: { type: 'ephemeral' },
          },
        ],
        messages: [
          {
            role: 'user',
            content: `Topic: ${topic}
Task: ${task}
Student answer: ${answer}

Return ONLY:
{"correct":boolean,"corrected":"string","errors":[{"wrong":"string","right":"string","rule":"string"}],"explanation":"max 2 sentences","encouragement":"short"}`,
          },
        ],
      });

      const text = message.content[0].type === 'text' ? message.content[0].text : '{}';
      return JSON.parse(stripFences(text)) as object;
    } catch (err) {
      throw new InternalServerErrorException(
        `Claude correction failed: ${(err as Error).message}`,
      );
    }
  }

  async correctFreeWrite(topic: string, task: string, requiredElements: string[], sentence: string): Promise<object> {
    try {
      const message = await this.client.messages.create({
        model: MODEL,
        max_tokens: 512,
        temperature: 0,
        system: [
          {
            type: 'text' as const,
            text: 'You are a strict but encouraging German A1 tutor for English speakers. Always write explanation and encouragement in English. Evaluate student answers and return ONLY valid JSON, no extra text.',
            // @ts-expect-error cache_control is supported but not yet in SDK types
            cache_control: { type: 'ephemeral' },
          },
        ],
        messages: [
          {
            role: 'user',
            content: `Topic: ${topic}
Exercise instruction: ${task}
Required grammar elements: ${requiredElements.length ? requiredElements.join(', ') : 'general A1 grammar'}
Student sentence: ${sentence}

Check: (1) grammar correctness, (2) whether the student followed the exercise instruction.
Return ONLY:
{"correct":boolean,"corrected":"string","missingElements":["string"],"errors":[{"wrong":"string","right":"string","rule":"string"}],"explanation":"max 2 sentences","encouragement":"short"}`,
          },
        ],
      });

      const text = message.content[0].type === 'text' ? message.content[0].text : '{}';
      return JSON.parse(stripFences(text)) as object;
    } catch (err) {
      throw new InternalServerErrorException(
        `Claude correction failed: ${(err as Error).message}`,
      );
    }
  }

  async *correctTranslationStream(topic: string, task: string, answer: string): AsyncGenerator<string> {
    const stream = this.client.messages.stream({
      model: MODEL,
      max_tokens: 512,
      temperature: 0,
      system: [
        {
          type: 'text' as const,
          text: 'You are a strict but encouraging German A1 tutor for English speakers. Always write explanation and encouragement in English.\n\nRespond in EXACTLY this format:\nLine 1: {"correct":boolean,"corrected":"string","errors":[{"wrong":"string","right":"string","rule":"string"}]}\nLine 2: ---\nLine 3+: Explanation (2 sentences max).\n💬 Short encouragement.',
          // @ts-expect-error cache_control is supported but not yet in SDK types
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [
        {
          role: 'user',
          content: `Topic: ${topic}\nTask: ${task}\nStudent answer: ${answer}`,
        },
      ],
    });
    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        yield event.delta.text;
      }
    }
  }

  async *correctFreeWriteStream(topic: string, task: string, requiredElements: string[], sentence: string): AsyncGenerator<string> {
    const stream = this.client.messages.stream({
      model: MODEL,
      max_tokens: 512,
      temperature: 0,
      system: [
        {
          type: 'text' as const,
          text: 'You are a strict but encouraging German A1 tutor for English speakers. Always write explanation and encouragement in English.\n\nRespond in EXACTLY this format:\nLine 1: {"correct":boolean,"corrected":"string","missingElements":["string"],"errors":[{"wrong":"string","right":"string","rule":"string"}]}\nLine 2: ---\nLine 3+: Explanation (2 sentences max, check grammar AND whether student followed the exercise instruction).\n💬 Short encouragement.',
          // @ts-expect-error cache_control is supported but not yet in SDK types
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [
        {
          role: 'user',
          content: `Topic: ${topic}\nExercise instruction: ${task}\nRequired grammar elements: ${requiredElements.length ? requiredElements.join(', ') : 'general A1 grammar'}\nStudent sentence: ${sentence}`,
        },
      ],
    });
    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        yield event.delta.text;
      }
    }
  }
}
