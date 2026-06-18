'use client';

import { useMemo, useRef, useState } from 'react';
import { Sidebar } from '@/components/sidebar';
import { useApp } from '@/lib/app-context';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ArrowLeft, Briefcase, Camera, CheckCircle2, Mail, MapPin, MoreHorizontal, Pencil, Users } from 'lucide-react';
import { initials, statusLabel, statusTone } from '@/lib/platform-utils';
import { cn } from '@/lib/utils';
import { getMonthYear } from '@/lib/creator-performance';
import type { Creator, CreatorEvaluation } from '@/lib/mock-data';
import { RankBadge } from '@/components/rank-badge';
import { getCreatorMonthlyPerformance } from '@/lib/creator-performance-source';
import { useUiStore } from '@/lib/ui-store';
import { buildCurrentCreator } from '@/lib/current-creator';

export default function CreatorProfile() {
  const { creators, engagements, campaigns, submissions } = useApp();
  const { activeRole, creatorAvatarUrl, creatorInvitationStatus, creatorProfile, saveCreatorAvatar, sessionEmail, sessionUser } = useUiStore();
  const params = useParams();
  const creatorId = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarError, setAvatarError] = useState('');

  const demoCreator = creators.find(c => c.id === 'creator-2') ?? creators.find(c => c.approvalStatus === 'approved') ?? creators[0];
  const storedCreator = creators.find(c => c.id === creatorId);
  const creator = activeRole === 'creator' && creatorProfile && creatorId === creatorProfile.userId
    ? buildCurrentCreator({ demoCreator, creatorProfile, sessionUser, sessionEmail, avatarUrl: creatorAvatarUrl })
    : storedCreator;
  const resolvedCreatorId = creator?.id ?? creatorId;
  const creatorEngagements = engagements.filter(e => e.creatorId === resolvedCreatorId);
  const { month, year } = getMonthYear();
  const totalFollowers = useMemo(
    () => creator?.platforms.reduce((sum, platform) => sum + platform.followers, 0) ?? 0,
    [creator],
  );
  const rankState = creator ? getCreatorMonthlyPerformance(creator, submissions, campaigns, month, year) : undefined;
  const displayRank = activeRole === 'creator' && creatorProfile ? creatorProfile.creatorRank : rankState?.currentRank ?? 'Bronze I';
  const primaryPlatform = creator?.platforms[0];
  const creatorTitle = `${displayRank} Campus Creator`;
  const profileTags = [
    ...(creator?.contentCategories ?? []),
    ...(creator?.isScholarshipStudent ? ['Scholarship student'] : []),
  ].filter(Boolean);
  const acceptedCampusInvitation = creator?.id === 'creator-2' && creatorInvitationStatus === 'accepted';
  const canEditOwnProfile = activeRole === 'creator' && creatorProfile && creator?.id === creatorProfile.userId;

  const uploadAvatar = async (file?: File) => {
    if (!file) return;
    setAvatarError('');
    try {
      await saveCreatorAvatar(file);
    } catch (error) {
      setAvatarError(error instanceof Error ? error.message : 'Could not upload profile photo.');
    }
  };

  if (!creator) {
    return (
      <div className="flex h-screen ecosystem-shell">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="p-8 text-center text-muted-foreground">Creator not found</div>
      </main>
    </div>
    );
  }

  return (
    <div className="flex h-screen ecosystem-shell">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="page-wrap">
          {activeRole === 'admin' && (
            <Link href="/creators" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">
              <ArrowLeft className="size-4" />
              Back to Creator Discovery
            </Link>
          )}

          <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
            <aside className="space-y-5">
              <section className="panel overflow-hidden">
                <div className="relative bg-muted">
                  <div className="aspect-[4/5] w-full bg-[linear-gradient(145deg,#f7ecfb,#f8fafc)]">
                    {creator.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={creator.avatar} alt={creator.name} className="size-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <div className="flex size-28 items-center justify-center rounded-full bg-primary text-4xl font-semibold text-white shadow-sm">
                          {initials(creator.name)}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="absolute bottom-4 left-4">
                    <RankBadge rank={displayRank} className="bg-white/95" />
                  </div>
                  {canEditOwnProfile && (
                    <div className="absolute bottom-4 right-4">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp"
                        className="hidden"
                        onChange={(event) => void uploadAvatar(event.target.files?.[0])}
                      />
                      <Button type="button" size="sm" className="h-9 bg-white text-foreground hover:bg-white/90" onClick={() => fileInputRef.current?.click()}>
                        <Camera className="size-4" />
                        Edit photo
                      </Button>
                    </div>
                  )}
                </div>
                <div className="space-y-5 p-5">
                  {avatarError && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{avatarError}</p>}
                  <ProfileInfo icon={<MapPin className="size-4" />} label="University" value="Assumption University" />
                  <ProfileInfo icon={<Users className="size-4" />} label="Followers" value={totalFollowers.toLocaleString()} />
                  {activeRole === 'admin' && (
                    <div>
                      <p className="text-xs font-semibold uppercase text-muted-foreground">Contact</p>
                      <div className="mt-3 grid gap-2">
                        <a className="inline-flex items-center gap-2 text-sm font-semibold text-primary" href={`mailto:${primaryPlatform?.handle.replace('@', '') || 'creator'}@rollerkluster.com`}>
                          <Mail className="size-4" />
                          Message creator
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            </aside>

            <section className="space-y-5">
              <section className={cn('panel p-6', activeRole === 'creator' && 'relative pr-16')}>
                {activeRole === 'creator' && (
                  <div className="absolute right-5 top-5">
                    <Button asChild variant="outline" size="icon" className="size-10 shrink-0 border-border bg-white">
                      <Link href="/account?mode=edit" aria-label="Edit profile" title="Edit profile">
                        <Pencil className="size-4" />
                      </Link>
                    </Button>
                  </div>
                )}
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 lg:max-w-[560px]">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <h1 className="page-title truncate">{creator.name}</h1>
                        {creator.verified && <CheckCircle2 className="size-5 shrink-0 text-primary" />}
                      </div>
                      {activeRole === 'admin' && <ProfileActionsMenu activeRole={activeRole} visibility="mobile" />}
                    </div>
                    <p className="mt-1 text-sm font-semibold text-primary">{creatorTitle}</p>
                    <p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground">{creator.bio}</p>
                    {profileTags.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {profileTags.map(tag => <Badge key={tag} variant="secondary" className="rounded-full">{tag}</Badge>)}
                      </div>
                    )}
                  </div>
                  {activeRole === 'admin' && (
                    <div className="flex shrink-0 flex-row flex-nowrap items-center gap-2">
                      <Button variant="outline" className="h-10 shrink-0 whitespace-nowrap border-border bg-white">
                        <Mail className="size-4" />
                        Message
                      </Button>
                      <Button className="h-10 shrink-0 whitespace-nowrap bg-primary text-white">
                        <Briefcase className="size-4" />
                        Invite to Campaign
                      </Button>
                      <ProfileActionsMenu activeRole={activeRole} visibility="desktop" />
                    </div>
                  )}
                </div>

              </section>

              <section className="panel overflow-hidden">
                <div className="border-b border-border px-5 py-4">
                  <h2 className="section-heading">Campaign Activity</h2>
                  <p className="section-subtitle">Campaigns this creator has joined or been invited to.</p>
                </div>
                <CampaignActivityList
                  acceptedCampusInvitation={acceptedCampusInvitation}
                  creatorEngagements={creatorEngagements}
                  campaigns={campaigns}
                />
              </section>

              <section className="panel overflow-hidden">
                <div className="border-b border-border px-5 py-4">
                  <h2 className="section-heading">Feedback Highlights</h2>
                  <p className="section-subtitle">Short review notes from completed collaborations.</p>
                </div>
                <ReviewList creator={creator} />
              </section>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

function ProfileInfo({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex gap-3 rounded-[10px] border border-border bg-white p-3">
      <div className="mt-0.5 text-primary">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase text-muted-foreground">{label}</p>
        <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}

function ProfileActionsMenu({ activeRole, visibility }: { activeRole: 'admin' | 'creator'; visibility: 'mobile' | 'desktop' }) {
  const brandActions = [
    { href: '/creators', label: 'Compare creators' },
    { href: '/campaigns', label: 'View campaigns' },
  ];
  const actions = activeRole === 'creator' ? [] : brandActions;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={cn(
            'size-10 shrink-0 border-border bg-white',
            visibility === 'mobile' && 'lg:hidden',
            visibility === 'desktop' && 'hidden lg:inline-flex',
          )}
        >
          <MoreHorizontal className="size-4" />
          <span className="sr-only">Profile actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {actions.map(action => (
          <DropdownMenuItem key={action.label} asChild>
            <Link href={action.href}>{action.label}</Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function CampaignActivityList({
  acceptedCampusInvitation,
  creatorEngagements,
  campaigns,
}: {
  acceptedCampusInvitation: boolean;
  creatorEngagements: { id: string; campaignId: string; status: string }[];
  campaigns: { id: string; title: string; brand: string }[];
}) {
  if (creatorEngagements.length === 0 && !acceptedCampusInvitation) {
    return <div className="p-5 text-sm text-muted-foreground">No campaign activity yet.</div>;
  }

  return (
    <div className="divide-y divide-border">
      {acceptedCampusInvitation && (
        <div className="grid gap-3 px-5 py-4 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="text-sm font-semibold">AU Creator Campus Program 2026</p>
            <p className="text-xs text-muted-foreground">Assumption University Student Affairs Office · Campus creator campaign</p>
          </div>
          <Badge variant="outline" className="w-fit rounded-full border-primary/20 bg-primary/10 text-primary">Accepted</Badge>
        </div>
      )}
      {creatorEngagements.map(engagement => {
        const campaign = campaigns.find(item => item.id === engagement.campaignId);
        return (
          <Link key={engagement.id} href={`/campaigns/${campaign?.id}`} className="grid gap-3 px-5 py-4 transition hover:bg-muted/35 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="text-sm font-semibold">{campaign?.title ?? 'Campaign'}</p>
              <p className="text-xs text-muted-foreground">{campaign?.brand ?? 'Brand'}</p>
            </div>
            <Badge variant="outline" className={cn('w-fit rounded-full', statusTone(engagement.status))}>{statusLabel(engagement.status)}</Badge>
          </Link>
        );
      })}
    </div>
  );
}

function ReviewList({ creator }: { creator: Creator }) {
  if (creator.evaluations.length === 0) {
    return <div className="p-5 text-sm text-muted-foreground">No engagement evaluations have been recorded yet.</div>;
  }

  return (
    <div className="divide-y divide-border">
      {creator.evaluations.map((evaluation: CreatorEvaluation) => (
        <div key={evaluation.id} className="p-5">
          <div className="mb-3 flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold">Engagement evaluation</p>
              <p className="text-xs text-muted-foreground">{new Date(evaluation.evaluatedAt).toLocaleDateString()} · {evaluation.evaluatedBy}</p>
            </div>
            <Badge variant="secondary" className="rounded-full">Manager rated</Badge>
          </div>
          <div className="grid gap-2 md:grid-cols-5">
            {[
              ['Content', evaluation.contentQuality],
              ['Communication', evaluation.communication],
              ['Deadline', evaluation.deadlineCompletion],
              ['Professionalism', evaluation.professionalism],
              ['Campaign fit', evaluation.campaignFit],
            ].map(([label, value]) => (
              <div key={label} className="rounded-[10px] bg-muted/45 p-3">
                <p className="text-[11px] font-semibold uppercase text-muted-foreground">{label}</p>
                <p className="mt-1 text-sm font-semibold">{value}/5</p>
              </div>
            ))}
          </div>
          <p className="mt-3 rounded-[10px] border border-border bg-white p-3 text-sm text-muted-foreground">{evaluation.notes}</p>
        </div>
      ))}
    </div>
  );
}
