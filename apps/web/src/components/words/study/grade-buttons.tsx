'use client';

import type { ReviewGrade } from '@/types/words';

const GRADES: { grade: ReviewGrade; label: string; key: string; color: string }[] = [
  { grade: 'AGAIN', label: 'Again', key: '1', color: '#EF4444' },
  { grade: 'GOOD', label: 'Good', key: '2', color: 'var(--green)' },
  { grade: 'EASY', label: 'Easy', key: '3', color: '#60A5FA' },
];

export function GradeButtons({ onGrade }: { onGrade: (g: ReviewGrade) => void }) {
  return (
    <div className="flex gap-2">
      {GRADES.map(({ grade, label, key, color }) => (
        <button
          key={grade}
          onClick={() => onGrade(grade)}
          className="flex flex-1 flex-col items-center gap-0.5 rounded-lg py-2.5 text-sm font-semibold transition-colors hover:opacity-85"
          style={{ background: 'var(--s2)', border: `1px solid ${color}`, color }}
        >
          {label}
          <span className="text-[10px] font-normal" style={{ color: 'var(--text3)' }}>{key}</span>
        </button>
      ))}
    </div>
  );
}
