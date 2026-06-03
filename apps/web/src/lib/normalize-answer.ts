// Answer normalization + comparison for the study type/listening modes (DOG-109).
// Typing-tolerance tuning lives here (DOG-121). NOTE: regression tests for this module are
// deferred — apps/web has no test runner configured; revisit when one is added (vitest/jest).

export interface NormalizeOptions {
  /** Strip a leading definite article (der/die/das) before comparing. Default true. */
  ignoreArticle?: boolean;
}

/** Lower-case, fold umlauts/ß, trim edge punctuation, collapse whitespace, optionally drop a leading article. */
export function normalize(input: string, opts: NormalizeOptions = {}): string {
  const ignoreArticle = opts.ignoreArticle ?? true;
  let s = (input ?? '').trim().toLowerCase();
  s = s
    .replace(/ß/g, 'ss')
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue');
  // Trim surrounding punctuation (e.g. a typed trailing period or quotes) but keep internal marks.
  s = s.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
  s = s.replace(/\s+/g, ' ');
  if (ignoreArticle) s = s.replace(/^(der|die|das)\s+/, '');
  return s.trim();
}

/** Levenshtein edit distance (small inputs). */
function editDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  let cur = new Array<number>(n + 1);
  for (let i = 1; i <= m; i++) {
    cur[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(cur[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    [prev, cur] = [cur, prev];
  }
  return prev[n];
}

export type AnswerVerdict = 'correct' | 'close' | 'wrong';

/** Compare a typed answer to the target; 'close' = within the length-aware typo tolerance. */
export function compareAnswer(input: string, target: string, opts?: NormalizeOptions): AnswerVerdict {
  const a = normalize(input, opts);
  const b = normalize(target, opts);
  if (!a) return 'wrong';
  if (a === b) return 'correct';
  // Longer answers may carry a second slip; short ones stay strict to avoid false accepts.
  const tolerance = b.length >= 8 ? 2 : 1;
  return editDistance(a, b) <= tolerance ? 'close' : 'wrong';
}
