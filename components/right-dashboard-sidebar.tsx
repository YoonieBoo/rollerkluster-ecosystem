'use client';

import Link from 'next/link';
import { Bell, UserCircle } from 'lucide-react';
import { RankBadgeIcon } from '@/components/rank-badge';
import { initials } from '@/lib/platform-utils';
import { useApp } from '@/lib/app-context';
import { useUiStore } from '@/lib/ui-store';
import { getMonthYear, getNextRank, type CreatorRank } from '@/lib/creator-performance';
import { getCreatorMonthlyPerformance } from '@/lib/creator-performance-source';

export function RightDashboardSidebar() {
  const { activeRole, creatorProfile, creatorInvitationStatus } = useUiStore();
  const { creators, campaigns, engagements, submissions } = useApp();
  const creator = creators.find(item => item.id === 'creator-2') ?? creators.find(item => item.approvalStatus === 'approved') ?? creators[0];
  const { month, year } = getMonthYear();
  const performance = creator ? getCreatorMonthlyPerformance(creator, submissions, campaigns, month, year) : null;
  const currentRank = creatorProfile?.creatorRank ?? performance?.currentRank ?? 'Bronze I';
  const nextRank = creatorProfile ? getNextRank(currentRank as CreatorRank) : performance?.nextRank ?? 'Bronze II';
  const rankProgress = Math.min(100, Math.max(0, performance?.rankProgressPercentage ?? 0));
  const totalFollowers = creatorProfile?.followerCount ?? creator?.platforms.reduce((sum, platform) => sum + platform.followers, 0) ?? 0;
  const followerDisplay = totalFollowers >= 1000 ? `${Math.round(totalFollowers / 1000)}K` : totalFollowers.toLocaleString();

  if (activeRole === 'admin') {
    const approvedCreators = creators.filter(item => item.approvalStatus === 'approved');
    const activeCollaborations = engagements.filter(item => ['matched', 'in_discussion', 'active'].includes(item.status));
    const invitations = engagements.filter(item => item.status === 'matched' || item.status === 'in_discussion').slice(0, 3);

    return (
      <aside className="right-dashboard-sidebar">
        <SidebarCard>
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-blue-50 text-primary">
              <UserCircle className="size-6" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">Brand Workspace</p>
              <p className="text-xs text-muted-foreground">Creator collaboration overview</p>
            </div>
          </div>
        </SidebarCard>

        <SidebarCard title="Creator Network">
          <StatRow label="Recommended creators" value={approvedCreators.length} />
          <StatRow label="Active collaborations" value={activeCollaborations.length} />
          <StatRow label="Campaign invitations" value={invitations.length} />
        </SidebarCard>

        <SidebarCard title="Campaign Invitations">
          <div className="space-y-3">
            {invitations.map((item) => {
              const campaign = campaigns.find(campaignItem => campaignItem.id === item.campaignId);
              const invitedCreator = creators.find(creatorItem => creatorItem.id === item.creatorId);
              return (
                <Link key={item.id} href={`/campaigns/${campaign?.id ?? item.campaignId}`} className="block rounded-xl border border-border bg-white p-3 transition hover:border-primary/30 hover:bg-blue-50/40">
                  <p className="truncate text-sm font-semibold text-foreground">{campaign?.title ?? 'Campaign invitation'}</p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{invitedCreator?.name ?? 'Creator'} · {item.status.replace('_', ' ')}</p>
                </Link>
              );
            })}
          </div>
        </SidebarCard>
      </aside>
    );
  }

  return (
    <aside className="right-dashboard-sidebar">
      <SidebarCard>
        <div className="flex items-center gap-3">
          <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-blue-50 text-primary">
            {creator?.avatar ? (
              <img src={creator.avatar} alt={creator.name} className="size-full object-cover" />
            ) : (
              <span className="text-sm font-semibold">{initials(creator?.name ?? 'Creator')}</span>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2">
              <p className="truncate text-sm font-semibold text-foreground">{creator?.name ?? 'Creator Profile'}</p>
              <RankBadgeIcon rank={currentRank} className="size-5 shrink-0" />
            </div>
            <p className="truncate text-xs text-muted-foreground">{currentRank} Creator</p>
          </div>
        </div>
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span>Next: {nextRank ?? 'Highest rank'}</span>
            <span>{rankProgress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${rankProgress}%` }} />
          </div>
        </div>
        <div className="mt-5 space-y-3">
          <ProfileInfoRow label="Category" value={creator?.niche ?? 'Campus Lifestyle'} />
          <ProfileInfoRow label="University" value="Assumption University" />
          <ProfileInfoRow label="Followers" value={followerDisplay} />
          <ProfileInfoRow label="Engagement Rate" value={`${performance?.averageEngagementRate ?? creator?.engagementRate ?? 7.13}%`} />
          <ProfileInfoRow label="Content Style" value="Campus storytelling, Short-form video" />
        </div>
        {creator?.platforms && creator.platforms.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {creator.platforms.map(platform => (
              <span key={platform.name} className="rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                {platform.name}
              </span>
            ))}
          </div>
        )}
      </SidebarCard>

      <SidebarCard title="Campaign Invitations">
        <Link href="/campaigns/au-creator-campus-2026" className="block rounded-xl border border-blue-100 bg-blue-50 p-3 transition hover:border-primary/30">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-blue-950">AU Creator Campus Program 2026</p>
              <p className="mt-1 text-xs text-blue-800">{creatorInvitationStatus === 'accepted' ? 'Accepted' : 'Invitation Pending'}</p>
            </div>
            <Bell className="size-4 shrink-0 text-primary" />
          </div>
        </Link>
      </SidebarCard>
    </aside>
  );
}

function SidebarCard({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-white p-4 shadow-sm">
      {title && <h2 className="mb-4 text-sm font-semibold text-foreground">{title}</h2>}
      {children}
    </section>
  );
}

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-3 last:border-b-0">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold text-foreground">{value}</span>
    </div>
  );
}

function ProfileInfoRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold leading-5 text-foreground">{value}</p>
    </div>
  );
}
