'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Sidebar } from '@/components/sidebar';
import { useApp } from '@/lib/app-context';
import { Badge } from '@/components/ui/badge';
import { useUiStore } from '@/lib/ui-store';
import { buildCurrentCreator } from '@/lib/current-creator';

type InboxItem = {
  id: string;
  title: string;
  meta: string;
  tone: 'warning' | 'info' | 'success';
  href?: string;
  onClick?: () => void;
};

export default function NotificationsPage() {
  const { creators, campaigns, engagements } = useApp();
  const { activeRole, creatorAvatarUrl, creatorProfile, sessionEmail, sessionUser } = useUiStore();
  const [readIds, setReadIds] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set();

    try {
      return new Set(JSON.parse(window.localStorage.getItem('rollerkluster-read-notifications') ?? '[]'));
    } catch {
      return new Set();
    }
  });
  const pending = creators.filter(c => c.approvalStatus === 'pending');
  const openCampaigns = campaigns.filter(c => c.status !== 'completed');
  const latest = engagements.slice().reverse();
  const demoCreator = creators.find(c => c.id === 'creator-2') ?? creators.find(c => c.approvalStatus === 'approved') ?? creators[0];
  const creator = buildCurrentCreator({ demoCreator, creatorProfile, sessionUser, sessionEmail, avatarUrl: creatorAvatarUrl });
  const creatorEngagements = engagements.filter(engagement => engagement.creatorId === creator?.id);

  const markRead = (id: string) => {
    setReadIds(current => {
      const next = new Set(current).add(id);
      window.localStorage.setItem('rollerkluster-read-notifications', JSON.stringify([...next]));
      return next;
    });
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
    ...creatorEngagements
      .filter(engagement => engagement.status === 'matched' || engagement.status === 'in_discussion' || engagement.status === 'accepted')
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
  ].slice(0, 12);

  const notifications = activeRole === 'creator' ? creatorNotifications : brandNotifications;
  const heading = activeRole === 'creator' ? 'Invites' : 'Brand Inbox';
  const eyebrow = activeRole === 'creator' ? 'Creator invitations' : 'Brand alerts';
  const subtitle = activeRole === 'creator'
    ? 'Campaign invitations from brands and campaign owners.'
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
              <Badge variant="secondary" className="rounded-full">{notifications.length} {activeRole === 'creator' ? 'invites' : 'updates'}</Badge>
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
                  {activeRole === 'creator' ? 'No campaign invitations right now.' : 'No messages right now.'}
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
      {!read && <span className="size-2.5 shrink-0 rounded-full bg-primary" />}
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{item.title}</span>
        <span className="mt-1 block text-xs text-muted-foreground">{item.meta}</span>
      </span>
      {!read && <span className="text-xs font-semibold text-primary">Unread</span>}
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
