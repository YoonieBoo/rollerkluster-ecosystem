'use client';

import { useId } from 'react';
import { cn } from '@/lib/utils';

type RankFamily = 'bronze' | 'silver' | 'gold' | 'platinum';

const rankColors: Record<RankFamily, { outer: string; mid: string; inner: string; accent: string; glow: string }> = {
  bronze: {
    outer: '#7c2d12',
    mid: '#c2410c',
    inner: '#fdba74',
    accent: '#fff7ed',
    glow: '#fed7aa',
  },
  silver: {
    outer: '#475569',
    mid: '#94a3b8',
    inner: '#f7ecfb',
    accent: '#f8fafc',
    glow: '#dcb1ef',
  },
  gold: {
    outer: '#92400e',
    mid: '#f59e0b',
    inner: '#fde68a',
    accent: '#fffbeb',
    glow: '#fef3c7',
  },
  platinum: {
    outer: '#4c1d95',
    mid: '#8b5cf6',
    inner: '#ddd6fe',
    accent: '#faf5ff',
    glow: '#e9d5ff',
  },
};

export function rankFamilyFromRank(rank?: string): RankFamily {
  if (!rank) return 'bronze';
  if (rank === 'TopPerformer' || rank.startsWith('Platinum')) return 'platinum';
  if (rank.startsWith('Gold')) return 'gold';
  if (rank.startsWith('Silver')) return 'silver';
  return 'bronze';
}

export function RankBadgeIcon({ rank, className, title }: { rank?: string; className?: string; title?: string }) {
  const id = useId().replace(/:/g, '');
  const family = rankFamilyFromRank(rank);
  const colors = rankColors[family];
  const gradientId = `rank-${family}-gradient-${id}`;
  const shineId = `rank-${family}-shine-${id}`;

  return (
    <svg
      viewBox="0 0 64 64"
      role="img"
      aria-label={title ?? `${family} rank badge`}
      className={cn('size-8 shrink-0 drop-shadow-sm', className)}
    >
      <defs>
        <linearGradient id={gradientId} x1="10" x2="54" y1="8" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={colors.accent} />
          <stop offset="0.42" stopColor={colors.inner} />
          <stop offset="1" stopColor={colors.mid} />
        </linearGradient>
        <linearGradient id={shineId} x1="20" x2="44" y1="14" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.82" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0.08" />
        </linearGradient>
      </defs>
      <path d="M12 22 5 28l10 4v8l17 14 17-14v-8l10-4-7-6-8 2-12-10-12 10-8-2Z" fill={colors.glow} opacity="0.48" />
      <path d="M32 5 52 16v22L32 58 12 38V16L32 5Z" fill={colors.outer} />
      <path d="M32 10 47 18.5V36L32 51 17 36V18.5L32 10Z" fill={`url(#${gradientId})`} />
      <path d="M32 15 42 21v12.5L32 43.5 22 33.5V21l10-6Z" fill={colors.mid} opacity="0.85" />
      <path d="M32 19 38 27l-6 8-6-8 6-8Z" fill={colors.accent} opacity="0.9" />
      <path d="M22 21 32 15l10 6-10 5-10-5Z" fill={`url(#${shineId})`} opacity="0.72" />
      <path d="M17 18.5 32 10l15 8.5" fill="none" stroke="#ffffff" strokeOpacity="0.32" strokeWidth="2" strokeLinecap="round" />
      {family === 'gold' && (
        <path d="M32 17.5 34.2 24l6.8.1-5.4 4.1 2 6.5-5.6-3.8-5.6 3.8 2-6.5-5.4-4.1 6.8-.1L32 17.5Z" fill={colors.accent} opacity="0.92" />
      )}
      {family === 'platinum' && (
        <path d="M32 17 40 25l-8 12-8-12 8-8Z" fill={colors.accent} opacity="0.88" />
      )}
    </svg>
  );
}

export function RankBadge({ rank, className }: { rank?: string; className?: string }) {
  const family = rankFamilyFromRank(rank);

  return (
    <span className={cn('inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold', badgeTone[family], className)}>
      <RankBadgeIcon rank={rank} className="size-5" />
      {rank ?? 'Bronze I'}
    </span>
  );
}

const badgeTone: Record<RankFamily, string> = {
  bronze: 'border-orange-200 bg-orange-50 text-orange-800',
  silver: 'border-slate-200 bg-slate-50 text-slate-700',
  gold: 'border-amber-200 bg-amber-50 text-amber-800',
  platinum: 'border-violet-200 bg-violet-50 text-violet-800',
};
