'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

interface AccentConfig {
  color: string;
  bg: string;
  dim: string;
  tintMain: string;
  tintSide: string;
}

const ACCENTS: Record<string, AccentConfig> = {
  dashboard: {
    color: '#d4d4d4', bg: 'rgba(212,212,212,0.06)', dim: 'rgba(212,212,212,0.11)',
    tintMain: '#111111', tintSide: '#181818',
  },
  grammar: {
    color: '#818CF8', bg: 'rgba(129,140,248,0.08)', dim: 'rgba(129,140,248,0.15)',
    tintMain: '#111318', tintSide: '#181a26',
  },
  words: {
    color: '#2DD4BF', bg: 'rgba(45,212,191,0.07)', dim: 'rgba(45,212,191,0.13)',
    tintMain: '#111515', tintSide: '#181f1e',
  },
  progress: {
    color: '#FB923C', bg: 'rgba(251,146,60,0.07)', dim: 'rgba(251,146,60,0.13)',
    tintMain: '#141210', tintSide: '#201a12',
  },
};

function getSection(pathname: string): string {
  if (pathname.startsWith('/grammar')) return 'grammar';
  if (
    pathname.startsWith('/words') ||
    pathname.startsWith('/vocabulary') ||
    pathname.startsWith('/verbs')
  ) return 'words';
  if (pathname.startsWith('/progress')) return 'progress';
  return 'dashboard';
}

export function ThemeAccent() {
  const pathname = usePathname();

  useEffect(() => {
    const a = ACCENTS[getSection(pathname)];
    const r = document.documentElement.style;
    r.setProperty('--accent',     a.color);
    r.setProperty('--accent-bg',  a.bg);
    r.setProperty('--accent-dim', a.dim);
    r.setProperty('--tint-main',  a.tintMain);
    r.setProperty('--tint-side',  a.tintSide);
  }, [pathname]);

  return null;
}
