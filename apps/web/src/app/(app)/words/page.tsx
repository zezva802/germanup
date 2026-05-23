'use client';

import { useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useVocab, useDeleteWord, useImportWords } from '@/hooks/use-vocab';
import { useVerbs, useDeleteVerb, useImportVerb, type UserVerb } from '@/hooks/use-verbs';
import { AddWordModal } from '@/components/vocabulary/add-word-modal';
import { Modal } from '@/components/ui/modal';
import { Spinner } from '@/components/ui/spinner';
import type { VocabWord } from '@germanup/types';

// ─── Types ────────────────────────────────────────────────────────────────────

type Filter = 'all' | 'nouns' | 'verbs';

// ─── Noun row ────────────────────────────────────────────────────────────────

const GENDER_COLOR: Record<string, string> = {
  der: '#60A5FA',
  die: '#F472B6',
  das: '#A78BFA',
};

function NounRow({ word, onDelete }: { word: VocabWord; onDelete: (id: string) => void }) {
  const [hov, setHov] = useState(false);
  const gColor = word.gender ? GENDER_COLOR[word.gender] : undefined;

  return (
    <div
      className="flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors cursor-default group"
      style={{ background: hov ? 'var(--s2)' : 'transparent' }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {gColor && (
        <div className="self-stretch rounded-full shrink-0" style={{ width: 3, background: gColor, minHeight: 20 }} />
      )}
      {word.gender && (
        <span className="text-xs font-bold w-6 shrink-0" style={{ color: gColor }}>{word.gender}</span>
      )}
      <span className="font-bold min-w-[130px]" style={{ fontSize: 14.5, color: 'var(--text)' }}>
        {word.german}
      </span>
      {word.plural && (
        <span className="text-xs min-w-[80px]" style={{ color: 'var(--text3)' }}>pl. {word.plural}</span>
      )}
      <span className="flex-1 text-sm" style={{ color: 'var(--text2)' }}>{word.english}</span>
      {word.flashcardStats?.mastered && (
        <span className="text-xs shrink-0" style={{ color: 'var(--green)' }}>✓</span>
      )}
      <button
        className="opacity-0 group-hover:opacity-100 text-sm transition-opacity shrink-0"
        style={{ color: '#EF4444' }}
        onClick={() => onDelete(word.id)}
      >
        ×
      </button>
    </div>
  );
}

// ─── Verb card (expandable) ───────────────────────────────────────────────────

const PRONOUNS = ['ich', 'du', 'er', 'wir', 'ihr', 'sie'] as const;

function VerbCard({ verb }: { verb: UserVerb }) {
  const [expanded, setExpanded] = useState(false);
  const { mutate: del } = useDeleteVerb();

  return (
    <div
      className="rounded-xl transition-colors"
      style={{
        border: `1px solid ${expanded ? 'var(--line2)' : 'var(--line)'}`,
        marginBottom: 4,
      }}
    >
      <div className="flex items-center gap-3 px-4 py-2.5">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-3 text-left flex-1"
        >
          <span className="font-bold text-sm" style={{ color: 'var(--text)' }}>{verb.infinitive}</span>
          {verb.isIrregular && (
            <span
              className="px-2 py-0.5 text-[10px] rounded-full font-bold"
              style={{ background: 'rgba(251,178,36,0.1)', color: 'var(--amber)' }}
            >
              irregular
            </span>
          )}
          <span className="ml-auto text-[10px]" style={{ color: 'var(--text3)', transition: 'transform .2s', display: 'inline-block', transform: expanded ? 'rotate(180deg)' : 'none' }}>▾</span>
        </button>
        <button
          className="text-lg leading-none transition-colors shrink-0"
          style={{ color: 'var(--text3)' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#EF4444')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text3)')}
          onClick={() => del(verb.id)}
        >
          ×
        </button>
      </div>

      {expanded && (
        <div className="px-4 pb-4">
          <div
            className="rounded-lg overflow-hidden text-xs"
            style={{ border: '1px solid var(--line)' }}
          >
            <div className="grid" style={{ gridTemplateColumns: '50px 1fr 1fr' }}>
              {['—', 'Präsens', 'Imperfekt'].map((h) => (
                <div key={h} className="px-3 py-2 font-semibold uppercase tracking-wide" style={{ fontSize: 10, color: 'var(--text3)', background: 'var(--s3)' }}>{h}</div>
              ))}
              {PRONOUNS.map((p) => (
                <>
                  <div key={`p-${p}`} className="px-3 py-1.5 font-bold" style={{ color: 'var(--text3)', fontSize: 11, borderTop: '1px solid var(--line)' }}>{p}</div>
                  <div key={`pra-${p}`} className="px-3 py-1.5" style={{ color: 'var(--text)', borderTop: '1px solid var(--line)' }}>{verb.praesens[p]}</div>
                  <div key={`imp-${p}`} className="px-3 py-1.5" style={{ color: 'var(--text)', borderTop: '1px solid var(--line)' }}>{verb.imperfekt[p]}</div>
                </>
              ))}
            </div>
          </div>
          <div className="flex gap-4 mt-2.5 text-xs" style={{ color: 'var(--text3)' }}>
            <span>Partizip II: <strong style={{ color: 'var(--text2)' }}>{verb.partizip2}</strong></span>
            <span>Hilfsverb: <strong style={{ color: 'var(--text2)' }}>{verb.hilfsverb}</strong></span>
          </div>
          {verb.example && (
            <p className="mt-1 text-xs italic" style={{ color: 'var(--text3)' }}>{verb.example}</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Import modal (Nouns + Verbs tabs) ───────────────────────────────────────

type ImportTab = 'nouns' | 'verbs';

function WordsImportModal({
  open,
  onClose,
  isPro,
}: {
  open: boolean;
  onClose: () => void;
  isPro: boolean;
}) {
  const [tab, setTab] = useState<ImportTab>('nouns');
  const [nounText, setNounText] = useState('');
  const [verbText, setVerbText] = useState('');

  const { mutate: importNouns, isPending: nounsLoading, error: nounsError } = useImportWords();
  const { mutate: importVerb,  isPending: verbLoading,  error: verbError  } = useImportVerb();

  const [nounSuccess, setNounSuccess] = useState(false);
  const [verbSuccess, setVerbSuccess] = useState(false);

  const handleNounImport = () => {
    const words = nounText.split('\n').map((w) => w.trim()).filter(Boolean).slice(0, 20);
    if (!words.length) return;
    importNouns(words, {
      onSuccess: () => {
        setNounSuccess(true);
        setNounText('');
        setTimeout(() => { setNounSuccess(false); onClose(); }, 1400);
      },
    });
  };

  const handleVerbImport = () => {
    const infinitive = verbText.trim();
    if (!infinitive) return;
    importVerb(infinitive, {
      onSuccess: () => {
        setVerbSuccess(true);
        setVerbText('');
        setTimeout(() => { setVerbSuccess(false); onClose(); }, 1400);
      },
    });
  };

  const handleClose = () => {
    if (nounsLoading || verbLoading) return;
    onClose();
  };

  const nounCount = nounText.split('\n').filter((w) => w.trim()).length;

  return (
    <Modal open={open} onClose={handleClose} title="Import words">
      {/* Tabs */}
      <div
        className="flex rounded-lg overflow-hidden mb-5"
        style={{ border: '1px solid var(--line)', background: 'var(--s2)' }}
      >
        {(['nouns', 'verbs'] as ImportTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 py-2 text-sm font-semibold transition-colors"
            style={{
              background: tab === t ? 'var(--s3)' : 'transparent',
              color: tab === t ? 'var(--text)' : 'var(--text2)',
              borderRight: t === 'nouns' ? '1px solid var(--line)' : 'none',
            }}
          >
            {t === 'nouns' ? 'Nouns & words' : 'Verbs'}
          </button>
        ))}
      </div>

      {tab === 'nouns' && (
        <>
          <p className="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text3)' }}>
            Enter words, one per line
          </p>
          <textarea
            className="w-full px-3 py-2.5 rounded-lg text-sm resize-none outline-none font-[inherit]"
            style={{
              background: 'var(--s2)',
              border: '1px solid var(--line2)',
              color: 'var(--text)',
              minHeight: 110,
              lineHeight: 1.6,
              transition: 'border-color .15s',
            }}
            placeholder={'Hund\nKatze\nBuch\nArbeit\n…'}
            value={nounText}
            onChange={(e) => setNounText(e.target.value)}
            onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
            onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--line2)')}
          />
          <p className="text-[11px] mt-1.5 mb-4" style={{ color: 'var(--text3)' }}>
            Gender, plural & translation looked up via Wiktionary (free).{' '}
            <span style={{ color: 'var(--text2)' }}>Max 20 words.</span>
          </p>
          {nounCount > 20 && (
            <p className="text-xs mb-2" style={{ color: '#EF4444' }}>Only first 20 will be imported</p>
          )}
          {(nounsError as Error)?.message && (
            <p className="text-xs mb-2" style={{ color: '#EF4444' }}>{(nounsError as Error).message}</p>
          )}
          {nounSuccess && (
            <p className="text-xs mb-2" style={{ color: 'var(--green)' }}>✓ Words imported!</p>
          )}
          <div className="flex justify-end gap-2 pt-4" style={{ borderTop: '1px solid var(--line)' }}>
            <button
              onClick={handleClose}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-75"
              style={{ background: 'var(--s3)', color: 'var(--text2)', border: '1px solid var(--line)' }}
              disabled={nounsLoading}
            >
              Cancel
            </button>
            <button
              onClick={handleNounImport}
              disabled={nounsLoading || !nounCount}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-85 disabled:opacity-40"
              style={{ background: 'var(--accent)', color: '#111' }}
            >
              {nounsLoading ? 'Importing…' : 'Import'}
            </button>
          </div>
        </>
      )}

      {tab === 'verbs' && (
        <>
          {!isPro && (
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs mb-4"
              style={{
                background: 'rgba(251,178,36,0.06)',
                border: '1px solid rgba(251,178,36,0.2)',
                color: 'var(--amber)',
              }}
            >
              ⭐ Pro — Claude generates all conjugation forms
            </div>
          )}
          <p className="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text3)' }}>
            Enter an infinitive
          </p>
          <input
            className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
            style={{
              background: 'var(--s2)',
              border: '1px solid var(--line2)',
              color: 'var(--text)',
              transition: 'border-color .15s',
            }}
            placeholder="e.g. sprechen"
            value={verbText}
            onChange={(e) => setVerbText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !isPro === false && handleVerbImport()}
            onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
            onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--line2)')}
            autoFocus={tab === 'verbs'}
          />
          <p className="text-[11px] mt-1.5 mb-4" style={{ color: 'var(--text3)' }}>
            Präsens, Imperfekt, Partizip II & Hilfsverb generated by Claude.
          </p>
          {(verbError as Error)?.message && (
            <p className="text-xs mb-2" style={{ color: '#EF4444' }}>{(verbError as Error).message}</p>
          )}
          {verbSuccess && (
            <p className="text-xs mb-2" style={{ color: 'var(--green)' }}>✓ Verb imported!</p>
          )}
          <div className="flex justify-end gap-2 pt-4" style={{ borderTop: '1px solid var(--line)' }}>
            <button
              onClick={handleClose}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-75"
              style={{ background: 'var(--s3)', color: 'var(--text2)', border: '1px solid var(--line)' }}
              disabled={verbLoading}
            >
              Cancel
            </button>
            <button
              onClick={isPro ? handleVerbImport : undefined}
              disabled={verbLoading || !verbText.trim() || !isPro}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-85 disabled:opacity-40"
              style={{ background: 'var(--accent)', color: '#111' }}
            >
              {verbLoading ? 'Importing…' : isPro ? 'Import' : 'Pro only'}
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}

// ─── Stat pill ────────────────────────────────────────────────────────────────

function StatPill({ dotColor, value, label }: { dotColor: string; value: number; label: string }) {
  return (
    <div
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs"
      style={{ background: 'var(--s2)', border: '1px solid var(--line)' }}
    >
      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: dotColor }} />
      <span className="font-bold" style={{ color: 'var(--text)' }}>{value}</span>
      <span style={{ color: 'var(--text3)' }}>{label}</span>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function WordsPage() {
  const { data: session } = useSession();
  const isPro = !!(session?.user && 'plan' in session.user && session.user.plan === 'PRO');

  const [filter, setFilter]   = useState<Filter>('all');
  const [search, setSearch]   = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const { data: vocabData, isLoading: vocabLoading } = useVocab({ limit: 500 });
  const { data: verbs, isLoading: verbsLoading }      = useVerbs();
  const { mutate: deleteWord } = useDeleteWord();

  const nouns    = vocabData?.data ?? [];
  const verbList = verbs ?? [];

  const masteredCount  = nouns.filter((w) => w.flashcardStats?.mastered).length;
  const learningCount  = nouns.length - masteredCount;

  const q = search.toLowerCase();

  const filteredNouns = useMemo(() => {
    if (filter === 'verbs') return [];
    if (!q) return nouns;
    return nouns.filter(
      (w) => w.german.toLowerCase().includes(q) || w.english.toLowerCase().includes(q),
    );
  }, [nouns, filter, q]);

  const filteredVerbs = useMemo(() => {
    if (filter === 'nouns') return [];
    if (!q) return verbList;
    return verbList.filter((v) => v.infinitive.toLowerCase().includes(q));
  }, [verbList, filter, q]);

  const isLoading = vocabLoading || verbsLoading;
  const isEmpty   = filteredNouns.length === 0 && filteredVerbs.length === 0;

  return (
    <div style={{ maxWidth: 780 }}>

      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text)' }}>
            Words
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text3)' }}>
            {nouns.length} nouns · {verbList.length} verbs · {masteredCount} mastered
          </p>
        </div>
        <div className="flex gap-2 items-center">
          {nouns.length > 0 && (
            <Link
              href="/words/flashcards"
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-75"
              style={{ background: 'var(--s2)', color: 'var(--text2)', border: '1px solid var(--line)' }}
            >
              Flashcards →
            </Link>
          )}
          <button
            onClick={() => setImportOpen(true)}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-75"
            style={{ background: 'var(--s2)', color: 'var(--text2)', border: '1px solid var(--line)' }}
          >
            ↑ Import
          </button>
          <button
            onClick={() => setAddOpen(true)}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-85"
            style={{ background: 'var(--accent)', color: '#111' }}
          >
            + Add
          </button>
        </div>
      </div>

      {/* Stats pills */}
      <div className="flex gap-2 mb-5">
        <StatPill dotColor="var(--green)" value={masteredCount} label="mastered" />
        <StatPill dotColor="var(--amber)" value={learningCount} label="learning" />
        <StatPill dotColor="var(--line2)" value={verbList.length} label="verbs" />
      </div>

      {/* Search + filter */}
      <div className="flex gap-3 items-center mb-4">
        <div className="relative" style={{ flex: 1, maxWidth: 320 }}>
          <span
            className="absolute left-3 top-1/2 -translate-y-1/2 text-xs pointer-events-none"
            style={{ color: 'var(--text3)' }}
          >
            🔍
          </span>
          <input
            type="text"
            className="w-full pl-8 pr-3 py-2 rounded-lg text-sm outline-none transition-colors"
            style={{
              background: 'var(--s2)',
              border: '1px solid var(--line2)',
              color: 'var(--text)',
            }}
            placeholder="Search words…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
            onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--line2)')}
          />
        </div>

        <div className="flex gap-1">
          {(['all', 'nouns', 'verbs'] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all capitalize"
              style={
                filter === f
                  ? { background: 'var(--text)', color: 'var(--bg)', border: '1px solid var(--text)' }
                  : { background: 'transparent', color: 'var(--text2)', border: '1px solid var(--line)' }
              }
            >
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Word list */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-7 w-7" style={{ color: 'var(--accent)' } as React.CSSProperties} />
        </div>
      ) : isEmpty ? (
        <div className="text-center py-16" style={{ color: 'var(--text3)' }}>
          <p className="text-3xl mb-3">📚</p>
          <p className="text-sm">
            {search ? 'No words match your search.' : 'No words yet — add your first word to get started.'}
          </p>
        </div>
      ) : (
        <>
          {filteredNouns.length > 0 && (
            <>
              <p
                className="text-[10px] font-bold uppercase tracking-widest px-3 mb-1.5"
                style={{ color: 'var(--text3)' }}
              >
                Nouns
              </p>
              <div className="mb-4">
                {filteredNouns.map((word) => (
                  <NounRow key={word.id} word={word} onDelete={deleteWord} />
                ))}
              </div>
            </>
          )}

          {filteredVerbs.length > 0 && (
            <>
              <p
                className="text-[10px] font-bold uppercase tracking-widest px-3 mb-1.5"
                style={{ color: 'var(--text3)', marginTop: filteredNouns.length > 0 ? 12 : 0 }}
              >
                Verbs
              </p>
              {filteredVerbs.map((verb) => (
                <VerbCard key={verb.id} verb={verb} />
              ))}
            </>
          )}
        </>
      )}

      <AddWordModal open={addOpen} onClose={() => setAddOpen(false)} />
      <WordsImportModal open={importOpen} onClose={() => setImportOpen(false)} isPro={isPro} />
    </div>
  );
}
