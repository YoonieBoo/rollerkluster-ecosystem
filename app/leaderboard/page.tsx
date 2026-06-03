'use client';

import { Sidebar } from '@/components/sidebar';
import { useApp } from '@/lib/app-context';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, TrendingUp, Crown, Zap, Star } from 'lucide-react';
import type { Creator } from '@/lib/mock-data';
import { RankBadgeIcon } from '@/components/rank-badge';
import { getMonthYear } from '@/lib/creator-performance';
import { getCreatorMonthlyPerformance } from '@/lib/creator-performance-source';
import { useUiStore } from '@/lib/ui-store';
import { brandRankLabel } from '@/lib/platform-utils';

export default function Leaderboard() {
  const { creators, submissions, campaigns } = useApp();
  const { activeRole, creatorInvitationStatus } = useUiStore();
  const { month, year } = getMonthYear();

  const topCreators = creators
    .filter(c => c.approvalStatus === 'approved')
    .sort((a, b) => b.reputationScore - a.reputationScore)
    .slice(0, 10);

  const topRising = creators
    .filter(c => c.approvalStatus === 'approved')
    .filter(c => new Date(c.joinedDate) > new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000))
    .sort((a, b) => b.reputationScore - a.reputationScore)
    .slice(0, 5);

  const recentlyVerified = creators
    .filter(c => c.approvalStatus === 'approved' && c.verified)
    .sort((a, b) => new Date(b.joinedDate).getTime() - new Date(a.joinedDate).getTime())
    .slice(0, 5);

  const getCreatorRow = (creator: Creator, rank?: number) => {
    const performance = getCreatorMonthlyPerformance(creator, submissions, campaigns, month, year);
    const displayRank = activeRole === 'admin' ? brandRankLabel(performance.currentRank) : performance.currentRank;
    return (
      <Link key={creator.id} href={`/creators/${creator.id}`}>
        <div className="p-4 bg-card hover:bg-card/80 rounded-lg border border-border transition-colors cursor-pointer flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            {rank && (
              <div className="w-8 h-8 flex items-center justify-center font-bold rounded-full bg-primary text-white">
                {rank}
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-semibold text-foreground">{creator.name}</p>
                {creator.verified && (
                  <CheckCircle2 className="w-4 h-4 text-blue-500" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">{creator.niche}</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Rank Progress</p>
              <p className="font-bold text-foreground">{performance.rankProgressPercentage}%</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Approved</p>
              <p className="font-bold text-foreground">{performance.totalContentApproved}</p>
            </div>
            <div className="inline-flex items-center gap-1 rounded border border-border bg-white px-2 py-1 text-xs font-semibold text-foreground">
              <RankBadgeIcon rank={displayRank} className="size-4" />
              {displayRank}
            </div>
          </div>
        </div>
      </Link>
    );
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Badges & Progress</h1>
            <p className="text-muted-foreground mt-1">Track creator readiness, reputation, verification, and engagement completion across the ecosystem.</p>
          </div>

          {creatorInvitationStatus === 'accepted' && (
            <Card className="mb-8 border border-blue-100 bg-blue-50/60 p-5 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-blue-800">Accepted campaign invitation</p>
                  <h2 className="mt-1 text-lg font-semibold text-foreground">AU Creator Campus Program 2026</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Counts toward rank progression contribution and verified creator activity.</p>
                </div>
                <Badge variant="outline" className="w-fit rounded-full border-blue-200 bg-white text-blue-700">Accepted</Badge>
              </div>
            </Card>
          )}

          {/* Top Creators */}
          <Card className="border border-border rounded-xl shadow-sm overflow-hidden mb-8">
            <div className="border-b border-border bg-blue-50/60 p-6">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-500" />
                Creator Readiness Ranking
              </h2>
              <p className="text-sm text-muted-foreground mt-1">Approved creators ordered by readiness score and engagement reliability.</p>
            </div>
            <div className="p-6 space-y-3">
              {topCreators.map((creator, idx) => getCreatorRow(creator, idx + 1))}
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Top Rising Creators */}
            <Card className="border border-border rounded-xl shadow-sm overflow-hidden">
              <div className="border-b border-border bg-emerald-50/60 p-6">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  Progressing Creators
                </h2>
                <p className="text-xs text-muted-foreground mt-1">Recently added creators building readiness and engagement history.</p>
              </div>
              <div className="p-6 space-y-3">
                {topRising.map(creator => getCreatorRow(creator))}
                {topRising.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No progressing creators recorded yet.</p>
                )}
              </div>
            </Card>

            {/* Recently Verified */}
            <Card className="border border-border rounded-xl shadow-sm overflow-hidden">
              <div className="border-b border-border bg-blue-50/60 p-6">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Zap className="w-5 h-5 text-blue-500" />
                  Recently Verified
                </h2>
                <p className="text-xs text-muted-foreground mt-1">Creator profiles recently approved through profile review.</p>
              </div>
              <div className="p-6 space-y-3">
                {recentlyVerified.map(creator => getCreatorRow(creator))}
                {recentlyVerified.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No recently verified creator profiles.</p>
                )}
              </div>
            </Card>
          </div>

          {/* Achievement Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
            <Card className="p-6 border border-border rounded-xl shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Engagement Quality</h3>
                  <p className="text-xs text-muted-foreground mt-1">Strongest engagement rates among approved creators.</p>
                </div>
                <Star className="w-5 h-5 text-amber-500" />
              </div>
              <div className="space-y-2">
                {creators
                  .filter(c => c.approvalStatus === 'approved')
                  .sort((a, b) => b.engagementRate - a.engagementRate)
                  .slice(0, 3)
                  .map((creator, idx) => (
                    <div key={creator.id} className="flex items-center justify-between p-2 bg-background rounded">
                      <p className="text-sm font-medium text-foreground">{creator.name}</p>
                      <p className="text-sm font-bold text-primary">{creator.engagementRate}%</p>
                    </div>
                  ))}
              </div>
            </Card>

            <Card className="p-6 border border-border rounded-xl shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Readiness Quality</h3>
                  <p className="text-xs text-muted-foreground mt-1">Highest readiness and content evaluation scores.</p>
                </div>
                <Zap className="w-5 h-5 text-blue-500" />
              </div>
              <div className="space-y-2">
                {creators
                  .filter(c => c.approvalStatus === 'approved')
                  .sort((a, b) => b.contentQualityScore - a.contentQualityScore)
                  .slice(0, 3)
                  .map((creator, idx) => (
                    <div key={creator.id} className="flex items-center justify-between p-2 bg-background rounded">
                      <p className="text-sm font-medium text-foreground">{creator.name}</p>
                      <p className="text-sm font-bold text-primary">{creator.contentQualityScore.toFixed(1)}</p>
                    </div>
                  ))}
              </div>
            </Card>

            <Card className="p-6 border border-border rounded-xl shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Engagement Experience</h3>
                  <p className="text-xs text-muted-foreground mt-1">Most completed structured creator-brand engagements.</p>
                </div>
                <Crown className="w-5 h-5 text-amber-500" />
              </div>
              <div className="space-y-2">
                {creators
                  .filter(c => c.approvalStatus === 'approved')
                  .sort((a, b) => b.completedEngagements - a.completedEngagements)
                  .slice(0, 3)
                  .map((creator, idx) => (
                    <div key={creator.id} className="flex items-center justify-between p-2 bg-background rounded">
                      <p className="text-sm font-medium text-foreground">{creator.name}</p>
                      <p className="text-sm font-bold text-primary">{creator.completedEngagements}</p>
                    </div>
                  ))}
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
