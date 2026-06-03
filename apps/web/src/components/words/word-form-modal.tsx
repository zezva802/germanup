'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Dialog } from './dialog';
import { TagPicker } from './tag-picker';
import { SparklesIcon, SpeakerIcon } from './icons';
import { useCreateWord, useUpdateWord, useGenerateExample, useGenerateAudio } from '@/hooks/use-words';
import { useSubscriptionStatus } from '@/hooks/use-subscription';
import type { DeckSummary, Word, PartOfSpeech } from '@/types/words';

const GENDERS = ['der', 'die', 'das'] as const;
const POS: PartOfSpeech[] = ['NOUN', 'VERB', 'ADJ', 'ADV', 'OTHER'];

const fieldStyle = { background: 'var(--s3)', border: '1px solid var(--line)', color: 'var(--text)' };

interface WordFormModalProps {
  open: boolean;
  onClose: () => void;
  ownedDecks: DeckSummary[];
  defaultDeckId?: string;
  /** When provided, the modal edits this word instead of creating one. */
  editing?: Word;
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="mb-1 text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text3)' }}>{children}</div>;
}

export function WordFormModal({ open, onClose, ownedDecks, defaultDeckId, editing }: WordFormModalProps) {
  const router = useRouter();
  const createWord = useCreateWord();
  const updateWord = useUpdateWord();
  const generateExample = useGenerateExample();
  const generateAudio = useGenerateAudio();
  const { data: subscription } = useSubscriptionStatus();
  const isPro = subscription?.plan === 'PRO';
  // On-demand AI is owner-only; curated/shared words have ownerId === null.
  const canGenerateExample = !!editing && !!editing.ownerId;
  const [audioUrl, setAudioUrl] = useState(editing?.audioUrl ?? '');

  const [deckId, setDeckId] = useState(editing?.deckId ?? defaultDeckId ?? ownedDecks[0]?.id ?? '');
  const [german, setGerman] = useState(editing?.german ?? '');
  const [english, setEnglish] = useState(editing?.english ?? '');
  const [gender, setGender] = useState(editing?.gender ?? '');
  const [plural, setPlural] = useState(editing?.plural ?? '');
  const [example, setExample] = useState(editing?.example ?? '');
  const [partOfSpeech, setPartOfSpeech] = useState<PartOfSpeech>(editing?.partOfSpeech ?? 'NOUN');
  const [level, setLevel] = useState(editing?.level ?? 'A1');
  const [tagIds, setTagIds] = useState<string[]>(editing?.tags?.map((t) => t.tagId) ?? []);
  const [error, setError] = useState('');
  const [looking, setLooking] = useState(false);

  const busy = createWord.isPending || updateWord.isPending;

  const lookup = async () => {
    if (german.trim().length < 2) return;
    setLooking(true);
    try {
      const res = await api.get<{ gender: string | null; plural: string | null }>('/vocab/lookup', { params: { word: german.trim() } });
      if (res.data.gender) setGender(res.data.gender);
      if (res.data.plural) setPlural(res.data.plural);
    } catch {
      /* lookup is best-effort */
    } finally {
      setLooking(false);
    }
  };

  const genExample = async () => {
    if (!editing) return;
    if (!isPro) { router.push('/pricing'); return; }
    setError('');
    try {
      const updated = await generateExample.mutateAsync(editing.id);
      setExample(updated.example ?? '');
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const genAudio = async () => {
    if (!editing) return;
    if (!isPro) { router.push('/pricing'); return; }
    setError('');
    try {
      const updated = await generateAudio.mutateAsync(editing.id);
      setAudioUrl(updated.audioUrl ?? '');
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const playAudio = () => {
    if (audioUrl) void new Audio(audioUrl).play().catch(() => undefined);
  };

  const submit = async () => {
    setError('');
    if (!german.trim() || !english.trim()) {
      setError('German and English are required.');
      return;
    }
    try {
      if (editing) {
        await updateWord.mutateAsync({
          id: editing.id, german: german.trim(), english: english.trim(),
          gender: gender || null, plural: plural || null, example: example || null,
          partOfSpeech, level, tagIds,
        });
      } else {
        if (!deckId) { setError('Pick a deck.'); return; }
        const created = await createWord.mutateAsync({
          deckId, german: german.trim(), english: english.trim(),
          gender: gender || null, plural: plural || null, example: example || null,
          partOfSpeech, level,
        });
        if (tagIds.length) await updateWord.mutateAsync({ id: created.id, tagIds });
      }
      onClose();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title={editing ? 'Edit word' : 'Add word'}>
      <div className="space-y-3">
        {!editing && (
          <div>
            <Label>Deck</Label>
            <select value={deckId} onChange={(e) => setDeckId(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={fieldStyle}>
              {ownedDecks.map((d) => <option key={d.id} value={d.id}>{d.title}</option>)}
            </select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>German</Label>
            <div className="flex gap-1.5">
              <input value={german} onChange={(e) => setGerman(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={fieldStyle} />
              <Button size="sm" variant="secondary" loading={looking} onClick={lookup} type="button">Look up</Button>
            </div>
          </div>
          <div>
            <Label>English</Label>
            <input value={english} onChange={(e) => setEnglish(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={fieldStyle} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Gender</Label>
            <div className="flex gap-1.5">
              {GENDERS.map((g) => (
                <button key={g} type="button" onClick={() => setGender(g === gender ? '' : g)}
                  className={cn('flex-1 rounded-lg py-2 text-sm transition-colors')}
                  style={{ background: gender === g ? 'var(--accent-bg)' : 'var(--s3)', color: gender === g ? 'var(--accent)' : 'var(--text2)', border: `1px solid ${gender === g ? 'var(--accent)' : 'var(--line)'}` }}>
                  {g}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>Plural</Label>
            <input value={plural} onChange={(e) => setPlural(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={fieldStyle} />
          </div>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <Label>Example</Label>
            {canGenerateExample && (
              <button
                type="button"
                onClick={genExample}
                disabled={generateExample.isPending}
                className="inline-flex items-center gap-1 text-[11px] font-medium transition-opacity hover:opacity-80 disabled:opacity-40"
                style={{ color: isPro ? 'var(--accent)' : 'var(--text3)' }}
                title={isPro ? 'Generate an example with AI' : 'Pro feature'}
              >
                <SparklesIcon width={12} height={12} />
                {generateExample.isPending ? 'Generating…' : isPro ? 'Generate with AI' : 'Generate (Pro)'}
              </button>
            )}
          </div>
          <input value={example} onChange={(e) => setExample(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={fieldStyle} />
        </div>

        {canGenerateExample && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={genAudio}
              disabled={generateAudio.isPending}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-opacity hover:opacity-80 disabled:opacity-40"
              style={{ background: 'var(--s3)', border: '1px solid var(--line)', color: isPro ? 'var(--text2)' : 'var(--text3)' }}
              title={isPro ? 'Generate spoken audio with AWS Polly' : 'Pro feature'}
            >
              <SpeakerIcon width={13} height={13} />
              {generateAudio.isPending ? 'Generating audio…' : audioUrl ? 'Regenerate audio' : isPro ? 'Generate audio' : 'Generate audio (Pro)'}
            </button>
            {audioUrl && (
              <button type="button" onClick={playAudio} className="text-xs font-medium transition-opacity hover:opacity-80" style={{ color: 'var(--accent)' }}>
                Play
              </button>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Part of speech</Label>
            <select value={partOfSpeech} onChange={(e) => setPartOfSpeech(e.target.value as PartOfSpeech)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={fieldStyle}>
              {POS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <Label>Level</Label>
            <select value={level} onChange={(e) => setLevel(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={fieldStyle}>
              {['A1', 'A2', 'A3'].map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        </div>

        <div>
          <Label>Tags</Label>
          <TagPicker selected={tagIds} onChange={setTagIds} />
        </div>

        {error && <p className="text-sm" style={{ color: '#EF4444' }}>{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={onClose} type="button">Cancel</Button>
          <Button variant="primary" loading={busy} onClick={submit} type="button">{editing ? 'Save' : 'Add word'}</Button>
        </div>
      </div>
    </Dialog>
  );
}
