// Inline line-art icons for each challenge. No emoji, no external assets.
// Reused by the challenge hub and the bespoke challenge pages (DOG-92–100).

interface ChallengeIconProps {
  slug: string;
  size?: number;
  color?: string;
  className?: string;
}

export function ChallengeIcon({ slug, size = 22, color = 'currentColor', className }: ChallengeIconProps) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: color,
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className,
  };

  switch (slug) {
    // The Detective — magnifying glass
    case 'the-detective':
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      );
    // The Cipher — padlock
    case 'the-cipher':
      return (
        <svg {...common}>
          <rect x="4" y="11" width="16" height="9" rx="2" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
      );
    // The Forger — pen
    case 'the-forger':
      return (
        <svg {...common}>
          <path d="M5 17v3h3L18.5 9.5a2.12 2.12 0 0 0-3-3L5 17z" />
          <line x1="13.5" y1="8.5" x2="16.5" y2="11.5" />
        </svg>
      );
    // The Decoder — broadcast / signal waves
    case 'the-decoder':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="2" />
          <path d="M7.76 16.24a6 6 0 0 1 0-8.49M16.24 7.76a6 6 0 0 1 0 8.49" />
          <path d="M4.93 19.07a10 10 0 0 1 0-14.14M19.07 4.93a10 10 0 0 1 0 14.14" />
        </svg>
      );
    // The Echo — eye
    case 'the-echo':
      return (
        <svg {...common}>
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    // Fallback — small diamond marker
    default:
      return (
        <svg {...common}>
          <path d="M12 3l7 9-7 9-7-9z" />
        </svg>
      );
  }
}
