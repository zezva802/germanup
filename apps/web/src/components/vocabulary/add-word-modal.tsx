'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useWordLookup, useAddWord } from '@/hooks/use-vocab';
import { cn } from '@/lib/utils';

const LEVELS = ['A1', 'A2', 'A3'];
const GENDERS = ['der', 'die', 'das'];

interface AddWordModalProps {
  open: boolean;
  onClose: () => void;
}

export function AddWordModal({ open, onClose }: AddWordModalProps) {
  const [german, setGerman] = useState('');
  const [english, setEnglish] = useState('');
  const [gender, setGender] = useState('');
  const [plural, setPlural] = useState('');
  const [level, setLevel] = useState('A1');
  const [lookupWord, setLookupWord] = useState('');

  const { data: lookup, isFetching: looking } = useWordLookup(lookupWord);
  const { mutate: addWord, isPending, error, isSuccess } = useAddWord();

  // Auto-fill gender/plural when Wiktionary returns data
  useEffect(() => {
    if (lookup?.found) {
      if (lookup.gender) setGender(lookup.gender);
      if (lookup.plural) setPlural(lookup.plural);
    }
  }, [lookup]);

  // Trigger lookup 600ms after user stops typing
  useEffect(() => {
    if (!german.trim()) return;
    const t = setTimeout(() => {
      setLookupWord(german.trim());
    }, 600);
    return () => clearTimeout(t);
  }, [german]);

  const handleClose = () => {
    setGerman(''); setEnglish(''); setGender('');
    setPlural(''); setLevel('A1'); setLookupWord('');
    onClose();
  };

  const handleAdd = () => {
    if (!german.trim() || !english.trim()) return;
    addWord(
      { german: german.trim(), english: english.trim(), level, gender: gender || undefined, plural: plural || undefined },
      { onSuccess: handleClose },
    );
  };

  return (
    <Modal open={open} onClose={handleClose} title="Add word">
      <p className="text-sm text-gray-500 mb-4">
        Type the German word — gender and plural are looked up automatically.
      </p>

      {/* German word */}
      <div className="mb-3">
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">German word</label>
        <div className="relative mt-1">
          <input
            value={german}
            onChange={(e) => setGerman(e.target.value)}
            placeholder="e.g. Hund"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 pr-8"
          />
          {looking && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <Spinner className="w-4 h-4 text-gray-400" />
            </div>
          )}
          {lookup?.found && !looking && (
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-green-500 text-sm">✓</span>
          )}
          {lookup && !lookup.found && !looking && german === lookupWord && (
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">?</span>
          )}
        </div>
        {lookup && !lookup.found && !looking && german === lookupWord && (
          <p className="text-xs text-gray-400 mt-1">Not found in Wiktionary — fill in manually below.</p>
        )}
      </div>

      {/* English translation */}
      <div className="mb-3">
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">English translation</label>
        <input
          value={english}
          onChange={(e) => setEnglish(e.target.value)}
          placeholder="e.g. dog"
          className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {/* Gender + Plural */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Gender
            {lookup?.found && lookup.gender && (
              <span className="ml-1 text-green-500 normal-case font-normal">auto-filled</span>
            )}
          </label>
          <div className="flex gap-1.5 mt-1">
            {GENDERS.map((g) => (
              <button
                key={g}
                onClick={() => setGender(g === gender ? '' : g)}
                className={cn(
                  'flex-1 py-1.5 rounded-lg text-sm font-medium border transition-colors',
                  gender === g
                    ? g === 'der' ? 'border-blue-400 bg-blue-50 text-blue-700'
                    : g === 'die' ? 'border-pink-400 bg-pink-50 text-pink-700'
                    : 'border-green-400 bg-green-50 text-green-700'
                    : 'border-gray-200 text-gray-500 hover:bg-gray-50',
                )}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Plural
            {lookup?.found && lookup.plural && (
              <span className="ml-1 text-green-500 normal-case font-normal">auto-filled</span>
            )}
          </label>
          <input
            value={plural}
            onChange={(e) => setPlural(e.target.value)}
            placeholder="e.g. Hunde"
            className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* Level */}
      <div className="mb-5">
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Level</label>
        <div className="flex gap-2 mt-1">
          {LEVELS.map((l) => (
            <button
              key={l}
              onClick={() => setLevel(l)}
              className={cn(
                'px-4 py-1.5 rounded-lg text-sm font-medium border transition-colors',
                level === l
                  ? 'border-brand-500 bg-brand-50 text-brand-700'
                  : 'border-gray-200 text-gray-500 hover:bg-gray-50',
              )}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 mb-3">{(error as Error).message}</p>
      )}

      <div className="flex gap-3 justify-end">
        <Button variant="secondary" onClick={handleClose} disabled={isPending}>
          Cancel
        </Button>
        <Button
          onClick={handleAdd}
          loading={isPending}
          disabled={!german.trim() || !english.trim()}
        >
          Add word
        </Button>
      </div>
    </Modal>
  );
}
