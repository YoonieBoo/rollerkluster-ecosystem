'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Sidebar } from '@/components/sidebar';
import { useApp } from '@/lib/app-context';
import { Badge } from '@/components/ui/badge';
import { useUiStore } from '@/lib/ui-store';
import { getMonthYear, formatMonthYear } from '@/lib/creator-performance';
import { openCreatorReportDocument } from '@/lib/creator-report-document';
import { getCreatorMonthlySubmissionsForDisplay } from '@/lib/creator-performance-source';

type InboxItem = {
  id: string;
  title: string;
  meta: string;
  tone: 'warning' | 'info' | 'success';
  href?: string;
  onClick?: () => void;
};

export default function NotificationsPage() {
  const { creators, campaigns, engagements, submissions, generateMonthlyReport } = useApp();
  const { activeRole, creatorInvitationStatus } = useUiStore();
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const pending = creators.filter(c => c.approvalStatus === 'pending');
  const openCampaigns = campaigns.filter(c => c.status !== 'completed');
  const latest = engagements.slice().reverse();
  const creator = creators.find(c => c.id === 'creator-2') ?? creators.find(c => c.approvalStatus === 'approved') ?? creators[0];
  const creatorEngagements = engagements.filter(engagement => engagement.creatorId === creator?.id);
  const { month, year } = getMonthYear();
  const creatorSubmissions = creator
    ? getCreatorMonthlySubmissionsForDisplay(creator.id, submissions, month, year)
    : [];

  const markRead = (id: string) => {
    setReadIds(current => new Set(current).add(id));
  };

  const brandNotifications: InboxItem[] = [
    ...pending.map(c => ({
      id: `creator-application-${c.id}`,
      title: `${c.name} has a creator application`,
      meta: `${c.niche} capability profile`,
      tone: 'warning' as const,
      href: '/admin',
    })),
    ...openCampaigns.map(c => ({
      id: `campaign-match-${c.id}`,
      title: `${c.title} needs campaign match review`,
      meta: `${c.brand} · ${c.status.replace('_', ' ')}`,
      tone: 'info' as const,
      href: `/campaigns/${c.id}`,
    })),
    ...latest.map(e => ({
      id: `engagement-${e.id}`,
      title: `Collaboration status changed to ${e.status.replace('_', ' ')}`,
      meta: `${e.matchScore}% creator fit score`,
      tone: 'success' as const,
      href: `/campaigns/${e.campaignId}`,
    })),
  ].slice(0, 12);

  const creatorNotifications: InboxItem[] = [
    ...(creatorInvitationStatus !== 'declined'
      ? [{
          id: 'invitation-au-creator-campus-2026',
          title: 'AU Creator Campus Program 2026 invited you to participate.',
          meta: 'Assumption University Student Affairs Office · Open invitation',
          tone: 'info' as const,
          href: '/campaigns/au-creator-campus-2026',
        }]
      : []),
    ...creatorEngagements
      .filter(engagement => engagement.status === 'matched' || engagement.status === 'in_discussion')
      .map(engagement => {
        const campaign = campaigns.find(campaign => campaign.id === engagement.campaignId);
        const campaignTitle = campaign?.title ?? 'A campaign';
        return {
          id: `invitation-${engagement.id}`,
          title: `${campaignTitle} invited you to participate.`,
          meta: `${campaign?.brand ?? 'Brand'} · Open the campaign brief`,
          tone: 'info' as const,
          href: `/campaigns/${engagement.campaignId}`,
        };
      }),
    ...creatorEngagements
      .filter(engagement => engagement.status === 'active')
      .map(engagement => {
        const campaign = campaigns.find(campaign => campaign.id === engagement.campaignId);
        return {
          id: `brief-updated-${engagement.id}`,
          title: `${campaign?.title ?? 'Campaign'} brief was updated.`,
          meta: 'Review the latest direction before creating content.',
          tone: 'info' as const,
          href: `/campaigns/${engagement.campaignId}`,
        };
      }),
    ...creatorSubmissions.map(submission => {
      const campaign = campaigns.find(campaign => campaign.id === submission.campaignId);
      const campaignName = campaign?.title ?? 'Campaign';
      const platform = submission.platform ?? 'content';

      if (submission.status === 'approved') {
        return {
          id: `submission-approved-${submission.id}`,
          title: `Your ${platform} content was approved.`,
          meta: `${campaignName} · Open your submission report`,
          tone: 'success' as const,
          href: `/submissions/${submission.id}`,
        };
      }

      if (submission.status === 'needs_changes' || submission.status === 'changes_requested') {
        return {
          id: `submission-changes-${submission.id}`,
          title: `Changes requested for your ${platform} content.`,
          meta: submission.staffFeedback ?? submission.reviewNotes ?? `${campaignName} · View feedback`,
          tone: 'warning' as const,
          href: `/submissions/${submission.id}`,
        };
      }

      if (submission.status === 'rejected') {
        return {
          id: `submission-rejected-${submission.id}`,
          title: `Your ${platform} content was not approved.`,
          meta: submission.rejectedReason ?? submission.staffFeedback ?? `${campaignName} · View feedback`,
          tone: 'warning' as const,
          href: `/submissions/${submission.id}`,
        };
      }

      return {
        id: `submission-pending-${submission.id}`,
        title: `Your ${platform} content is pending review.`,
        meta: `${campaignName} · We will notify you when feedback is ready`,
        tone: 'info' as const,
        href: `/submissions/${submission.id}`,
      };
    }),
    ...(creatorSubmissions.some(submission => submission.status === 'approved') && creator
      ? [{
          id: `monthly-report-${creator.id}-${year}-${month}`,
          title: 'Your monthly creator report is ready.',
          meta: `${formatMonthYear(month, year)} · Open report`,
          tone: 'success' as const,
          onClick: () => openCreatorReportDocument(creator.name, generateMonthlyReport(creator.id, month, year), campaigns, submissions),
        }]
      : []),
    ...(creator && creator.badge && creator.badge !== 'Bronze1'
      ? [{
          id: `rank-${creator.id}-${creator.badge}`,
          title: `Congratulations! You advanced to ${formatRankName(creator.badge)}.`,
          meta: 'View your rank progress.',
          tone: 'success' as const,
          href: '/leaderboard',
        }]
      : []),
  ].slice(0, 12);

  const notifications = activeRole === 'creator' ? creatorNotifications : brandNotifications;
  const heading = activeRole === 'creator' ? 'Creator Inbox' : 'Brand Inbox';
  const eyebrow = activeRole === 'creator' ? 'Creator messages' : 'Brand alerts';
  const subtitle = activeRole === 'creator'
    ? 'Campaign invitations, submission updates, feedback, and rank progress.'
    : 'Creator applications, campaign match movement, and collaboration status changes.';

  return (
    <div className="flex h-screen ecosystem-shell">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-[1100px] px-7 py-6">
          <header className="mb-6 border-b border-border pb-5">
            <p className="section-label">{eyebrow}</p>
            <h1 className="mt-2 text-[30px] font-semibold leading-tight">{heading}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          </header>

          <div className="panel overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="text-base font-semibold">Today</h2>
              <Badge variant="secondary" className="rounded-full">{notifications.length} updates</Badge>
            </div>
            <div className="divide-y divide-border">
              {notifications.map((item) => (
                <InboxRow
                  key={item.id}
                  item={item}
                  read={readIds.has(item.id)}
                  onRead={() => markRead(item.id)}
                />
              ))}
              {notifications.length === 0 && (
                <div className="px-5 py-10 text-center text-sm text-muted-foreground">
                  No messages right now.
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function InboxRow({ item, read, onRead }: { item: InboxItem; read: boolean; onRead: () => void }) {
  const className = [
    'flex w-full cursor-pointer items-center gap-4 px-5 py-4 text-left transition hover:bg-muted/45',
    read ? 'bg-muted/20 text-muted-foreground' : 'bg-white text-foreground',
  ].join(' ');
  const content = (
    <>
      <span className={read ? 'size-2.5 shrink-0 rounded-full bg-gray-300' : 'size-2.5 shrink-0 rounded-full bg-primary'} />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{item.title}</span>
        <span className="mt-1 block text-xs text-muted-foreground">{item.meta}</span>
      </span>
      <span className={read ? 'text-xs font-semibold text-muted-foreground' : 'text-xs font-semibold text-primary'}>
        {read ? 'Read' : 'Unread'}
      </span>
    </>
  );

  if (item.href) {
    return (
      <Link href={item.href} onClick={onRead} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        onRead();
        item.onClick?.();
      }}
      className={className}
    >
      {content}
    </button>
  );
}

function formatRankName(rank: string) {
  const legacyRanks: Record<string, string> = {
    Bronze1: 'Bronze I',
    Bronze2: 'Bronze II',
    Bronze3: 'Bronze III',
    Silver1: 'Silver I',
    Silver2: 'Silver II',
    TopPerformer: 'Gold I',
  };
  return legacyRanks[rank] ?? rank;
}
