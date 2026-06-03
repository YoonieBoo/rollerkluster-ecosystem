import React from 'react';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { getBadgeColor } from '@/lib/mock-data';
import { RankBadgeIcon } from '@/components/rank-badge';
import { brandRankLabel } from '@/lib/platform-utils';

interface CreatorCardProps {
  id: string;
  name: string;
  niche: string;
  avatar?: string;
  platforms?: { name: string; followers: number }[];
  reputationScore?: number;
  badge?: string | undefined;
  verified?: boolean;
}

export default function CreatorCard({ id, name, niche, avatar, platforms = [], reputationScore = 0, badge, verified }: CreatorCardProps) {
  const displayBadge = brandRankLabel(badge);
  return (
    <Link href={`/creators/${id}`} className="group block">
      <div className="premium-card p-4 transition-transform hover:-translate-y-1">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center overflow-hidden">
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar} alt={name} className="w-full h-full object-cover" />
            ) : (
              <div className="text-lg font-semibold text-primary">{name.split(' ').map(n => n[0]).join('').slice(0,2)}</div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground truncate">{name}</h3>
              {verified && <CheckCircle2 className="w-4 h-4 text-primary/80" />}
              {badge && (
                <div className={`badge-premium ml-auto inline-flex items-center gap-1 ${getBadgeColor(badge)}`}>
                  <RankBadgeIcon rank={displayBadge} className="size-4" />
                  {displayBadge}
                </div>
              )}
            </div>

            <p className="text-xs muted-text mt-1 truncate">{niche}</p>

            <div className="mt-3 flex items-center gap-2">
              {platforms.slice(0,3).map(p => (
                <div key={p.name} className="platform-pill" title={`${p.name} • ${p.followers.toLocaleString()}`}>
                  {p.name}
                </div>
              ))}
              <div className="ml-auto text-right">
                <p className="text-xs muted-text">Score</p>
                <p className="font-semibold text-foreground">{reputationScore}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
