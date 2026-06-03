import { Injectable, ServiceUnavailableException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PollyClient, SynthesizeSpeechCommand } from '@aws-sdk/client-polly';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { createHash } from 'crypto';

/**
 * Cloud-TTS (DOG-119): synthesize German audio with AWS Polly and cache it in S3.
 *
 * Degrades gracefully: if AWS env vars are absent the service reports `enabled = false`
 * and callers surface a 503, so the app keeps using free Web Speech with no cloud config.
 * Object keys are content-addressed (hash of voice+text) so identical words across decks
 * reuse one file and re-runs are idempotent.
 */
const VOICE_ID = 'Vicki'; // de-DE neural voice

@Injectable()
export class TtsService {
  private readonly region?: string;
  private readonly bucket?: string;
  private readonly polly?: PollyClient;
  private readonly s3?: S3Client;
  readonly enabled: boolean;

  constructor(config: ConfigService) {
    this.region = config.get<string>('AWS_REGION');
    this.bucket = config.get<string>('TTS_S3_BUCKET');
    const accessKeyId = config.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = config.get<string>('AWS_SECRET_ACCESS_KEY');

    this.enabled = Boolean(this.region && this.bucket && accessKeyId && secretAccessKey);
    if (this.enabled) {
      const credentials = { accessKeyId: accessKeyId!, secretAccessKey: secretAccessKey! };
      this.polly = new PollyClient({ region: this.region, credentials });
      this.s3 = new S3Client({ region: this.region, credentials });
    }
  }

  /** Synthesize `text` to MP3, store it in S3 (idempotent), and return the public URL. */
  async synthesizeAndStore(text: string): Promise<string> {
    if (!this.enabled || !this.polly || !this.s3) {
      throw new ServiceUnavailableException('Cloud TTS is not configured');
    }
    const clean = text.trim();
    const key = `tts/${VOICE_ID.toLowerCase()}/${this.hash(clean)}.mp3`;

    try {
      const speech = await this.polly.send(
        new SynthesizeSpeechCommand({
          Text: clean,
          VoiceId: VOICE_ID,
          Engine: 'neural',
          LanguageCode: 'de-DE',
          OutputFormat: 'mp3',
        }),
      );

      const stream = speech.AudioStream as
        | (NodeJS.ReadableStream & { transformToByteArray?: () => Promise<Uint8Array> })
        | undefined;
      if (!stream) throw new Error('Polly returned no audio');
      const body =
        typeof stream.transformToByteArray === 'function'
          ? await stream.transformToByteArray()
          : await streamToBuffer(stream);

      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: body,
          ContentType: 'audio/mpeg',
          CacheControl: 'public, max-age=31536000, immutable',
        }),
      );

      return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
    } catch (err) {
      throw new InternalServerErrorException(`TTS generation failed: ${(err as Error).message}`);
    }
  }

  private hash(text: string): string {
    return createHash('sha1').update(`${VOICE_ID}:${text}`).digest('hex');
  }
}

async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : (chunk as Buffer));
  }
  return Buffer.concat(chunks);
}
