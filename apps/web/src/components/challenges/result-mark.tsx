// Small inline tick / cross for results breakdowns. No emoji.

export function ResultMark({
  ok,
  size = 14,
  okColor = '#4ade80',
  failColor = '#f87171',
}: {
  ok: boolean;
  size?: number;
  okColor?: string;
  failColor?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={ok ? okColor : failColor}
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0 }}
      aria-label={ok ? 'correct' : 'wrong'}
    >
      {ok ? <polyline points="20 6 9 17 4 12" /> : <path d="M18 6 6 18M6 6l12 12" />}
    </svg>
  );
}
