'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/sidebar';
import { RightDashboardSidebar } from '@/components/right-dashboard-sidebar';
import { useApp } from '@/lib/app-context';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowUpRight,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Search,
  ShieldCheck,
  UserCheck,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { initials, statusLabel, statusTone, TierBadge } from '@/lib/platform-utils';
import { useUiStore } from '@/lib/ui-store';
import {
  SUPPORTED_SUBMISSION_PLATFORMS,
  getMonthYear,
  submissionStatusLabel,
  type SubmissionPlatform,
} from '@/lib/creator-performance';
import type { Campaign } from '@/lib/mock-data';
import { hasSupabaseConfig, isValidUuid } from '@/lib/supabase-data';
import { buildCurrentCreator } from '@/lib/current-creator';
import {
  getCreatorMonthlyPerformance,
  getCreatorMonthlySubmissionsForDisplay,
  getCreatorWeeklyConsistencySummary,
} from '@/lib/creator-performance-source';

export default function Dashboard() {
  const { creators, campaigns, engagements } = useApp();
  const { activeRole } = useUiStore();

  const approvedCreators = creators.filter(c => c.approvalStatus === 'approved');
  const pendingCreators = creators.filter(c => c.approvalStatus === 'pending');
  const activeEngagements = engagements.filter(e => e.status === 'matched' || e.status === 'in_discussion' || e.status === 'active');
  const topCreators = [...approvedCreators].sort((a, b) => b.reputationScore - a.reputationScore).slice(0, 4);
  const recentlyActive = [...engagements].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
  const campaignsNeedingMatches = campaigns
    .map(campaign => ({
      ...campaign,
      matchCount: engagements.filter(e => e.campaignId === campaign.id).length,
    }))
    .filter(campaign => campaign.status !== 'completed' && campaign.matchCount < 2);

  if (activeRole === 'creator') {
    return <CreatorPortal />;
  }

  const nextSteps = [
    {
      label: 'Creator applications',
      value: pendingCreators.length,
      detail: 'creator profiles waiting for review',
      href: '/admin',
      icon: UserCheck,
    },
    {
      label: 'Campaign matches',
      value: campaignsNeedingMatches.length,
      detail: 'campaigns need creator matches',
      href: '/campaigns',
      icon: Users,
    },
    {
      label: 'Active collaborations',
      value: activeEngagements.length,
      detail: 'creator collaborations in motion',
      href: '/campaigns',
      icon: ClipboardCheck,
    },
  ];

  return (
    <div className="flex h-screen ecosystem-shell">
      <Sidebar />
      <main className="min-w-0 flex-1 overflow-auto">
        <div className="page-wrap">
          <header className="page-header">
            <div>
              <p className="section-label">Brand Side</p>
              <h1 className="page-title mt-2">Brand Campaign Hub</h1>
              <p className="page-description mt-2">Find creators, send campaign offers, and monitor creator collaborations.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" className="h-10 border-border bg-white">
                <Link href="/creators">
                  Find creators
                  <Search className="size-4" />
                </Link>
              </Button>
              <Button asChild className="h-10 bg-primary text-white hover:bg-primary/90">
                <Link href="/campaigns">
                  Match creators
                  <ArrowUpRight className="size-4" />
                </Link>
              </Button>
            </div>
          </header>

          <section className="mb-6 grid gap-3 md:grid-cols-3">
            {nextSteps.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.label} href={item.href} className="panel group p-5 transition hover:border-primary/30 hover:bg-white">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground">{item.label}</p>
                      <p className="mt-3 text-3xl font-semibold tracking-[-0.02em]">{item.value}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
                    </div>
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-secondary text-primary">
                      <Icon className="size-5" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </section>

          <section className="space-y-6">
            <div className="panel overflow-hidden">
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <div>
                  <h2 className="section-heading">Campaign workflow</h2>
                  <p className="section-subtitle">Review creator applications, manage campaign matches, and track active collaborations.</p>
                </div>
                <Badge variant="outline" className="rounded-full border-amber-200 bg-amber-50 text-amber-700">
                  {pendingCreators.length + campaignsNeedingMatches.length} open
                </Badge>
              </div>

              <div className="grid divide-y divide-border lg:grid-cols-2 lg:divide-x lg:divide-y-0">
                <QueueColumn title="Creator applications" href="/admin" linkLabel="Review applications">
                  {pendingCreators.length === 0 ? (
                    <EmptyLine text="No creator applications are waiting." />
                  ) : pendingCreators.map(creator => (
                    <Link key={creator.id} href="/admin" className="flex items-center justify-between rounded-[10px] border border-border bg-white px-3 py-3 transition hover:bg-muted/45">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">{initials(creator.name)}</div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{creator.name}</p>
                          <p className="truncate text-xs text-muted-foreground">{creator.niche} · {creator.engagementRate}% engagement</p>
                        </div>
                      </div>
                      <ChevronRight className="size-4 text-muted-foreground" />
                    </Link>
                  ))}
                </QueueColumn>

                <QueueColumn title="Campaign matches" href="/campaigns" linkLabel="Open matches">
                  {campaignsNeedingMatches.length === 0 ? (
                    <EmptyLine text="Every active campaign has enough creator coverage." />
                  ) : campaignsNeedingMatches.map(campaign => (
                    <Link key={campaign.id} href={`/campaigns/${campaign.id}`} className="block rounded-[10px] border border-border bg-white px-3 py-3 transition hover:bg-muted/45">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{campaign.title}</p>
                          <p className="truncate text-xs text-muted-foreground">{campaign.brand} · {2 - campaign.matchCount} assignments needed</p>
                        </div>
                        <Badge variant="outline" className={cn('shrink-0 rounded-full', statusTone(campaign.status))}>{statusLabel(campaign.status)}</Badge>
                      </div>
                    </Link>
                  ))}
                </QueueColumn>
              </div>
            </div>

            <div className="panel overflow-hidden">
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <div>
                  <h2 className="section-heading">Recommended creators</h2>
                  <p className="section-subtitle">Creators with strong readiness scores for brand collaborations.</p>
                </div>
                <ShieldCheck className="size-5 text-primary" />
              </div>
              <div className="grid divide-y divide-border md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-4">
                {topCreators.map((creator) => (
                  <Link key={creator.id} href={`/creators/${creator.id}`} className="block p-5 transition hover:bg-muted/40">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-sm font-semibold">{creator.name}</p>
                          {creator.verified && <CheckCircle2 className="size-3.5 shrink-0 text-primary" />}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{creator.niche} · {creator.reputationScore} readiness</p>
                        <div className="mt-3">
                          <TierBadge tier={creator.badge} verified={creator.verified} brandView />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="panel overflow-hidden">
              <div className="border-b border-border px-5 py-4">
                <h2 className="section-heading">Recent activity</h2>
                <p className="section-subtitle">Latest creator and campaign movement.</p>
              </div>
              <div className="divide-y divide-border">
                {recentlyActive.map(engagement => {
                  const creator = creators.find(c => c.id === engagement.creatorId);
                  const campaign = campaigns.find(c => c.id === engagement.campaignId);
                  return (
                    <Link key={engagement.id} href={`/campaigns/${campaign?.id}`} className="grid gap-3 px-5 py-4 transition hover:bg-muted/35 md:grid-cols-[1fr_auto_auto] md:items-center">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">{creator ? initials(creator.name) : 'CR'}</div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{creator?.name} matched to {campaign?.brand}</p>
                          <p className="truncate text-xs text-muted-foreground">{campaign?.title}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className={cn('w-fit rounded-full', statusTone(engagement.status))}>{statusLabel(engagement.status)}</Badge>
                      <p className="text-sm font-semibold text-muted-foreground md:text-right">{engagement.matchScore}% fit</p>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        </div>
      </main>
      <RightDashboardSidebar />
    </div>
  );
}

function CreatorPortal() {
  const { creators, campaigns, engagements, submissions, addSubmission, generateMonthlyReport } = useApp();
  const { creatorAvatarUrl, creatorProfile, sessionEmail, sessionUser } = useUiStore();
  const [submissionOpen, setSubmissionOpen] = useState(false);
  const [submissionError, setSubmissionError] = useState('');
  const [submissionForm, setSubmissionForm] = useState({
    campaignId: '',
    platform: 'Instagram' as SubmissionPlatform,
    contentUrl: '',
    contentType: 'Reel',
    note: '',
  });
  const demoCreator = creators.find(c => c.id === 'creator-2') ?? creators.find(c => c.approvalStatus === 'approved') ?? creators[0];
  const creator = buildCurrentCreator({ demoCreator, creatorProfile, sessionUser, sessionEmail, avatarUrl: creatorAvatarUrl });
  const creatorEngagements = engagements.filter(e => e.creatorId === creator?.id);
  const { month, year } = getMonthYear();
  const creatorSubmissions = creator
    ? getCreatorMonthlySubmissionsForDisplay(creator.id, submissions, month, year)
    : [];
  const availableCampaigns = campaigns
    .filter(campaign => campaign.status === 'open' || campaign.status === 'in_progress')
    .filter(campaign => !creatorEngagements.some(engagement => engagement.campaignId === campaign.id))
    .slice(0, 3);
  const monthlyPerformance = creator
    ? getCreatorMonthlyPerformance(creator, submissions, campaigns, month, year)
    : undefined;
  const weeklyConsistency = creator
    ? getCreatorWeeklyConsistencySummary(creator, submissions, month, year)
    : { completed: 0, required: 4 };
  const approvedContentThisMonth = monthlyPerformance?.totalContentApproved ?? 0;
  const submittedContentThisMonth = monthlyPerformance?.totalContentSubmitted ?? 0;
  const pendingReviewThisMonth = creatorSubmissions.filter((submission) => ['submitted', 'pending_review'].includes(submission.status)).length;
  const recentSubmissions = creatorSubmissions
    .sort((a, b) => new Date(b.submissionDate ?? b.submittedAt).getTime() - new Date(a.submissionDate ?? a.submittedAt).getTime())
    .slice(0, 5);
  const assignedCampaigns = campaigns.filter(campaign => creatorEngagements.some(engagement => engagement.campaignId === campaign.id));
  const selectableCampaigns = (assignedCampaigns.length > 0 ? assignedCampaigns : availableCampaigns)
    .filter(campaign => !hasSupabaseConfig() || isValidUuid(campaign.id));
  const submitContent = () => {
    setSubmissionError('');
    if (!creator || !submissionForm.campaignId || !submissionForm.contentUrl) return;
    if (hasSupabaseConfig() && !isValidUuid(submissionForm.campaignId)) {
      setSubmissionError('Please select a valid campaign before submitting.');
      return;
    }
    const selectedCampaign = campaigns.find(campaign => campaign.id === submissionForm.campaignId);
    addSubmission({
      creatorId: creator.id,
      campaignId: submissionForm.campaignId,
      engagementId: creatorEngagements.find(engagement => engagement.campaignId === submissionForm.campaignId)?.id,
      title: `${submissionForm.platform} ${submissionForm.contentType}`,
      link: submissionForm.contentUrl,
      contentUrl: submissionForm.contentUrl,
      contentType: submissionForm.contentType,
      platform: submissionForm.platform,
      notes: submissionForm.note || (selectedCampaign ? `Submitted for ${selectedCampaign.title}` : ''),
    });
    setSubmissionForm({ campaignId: '', platform: 'Instagram', contentUrl: '', contentType: 'Reel', note: '' });
    setSubmissionOpen(false);
  };

  return (
    <div className="flex h-screen ecosystem-shell">
      <Sidebar />
      <main className="min-w-0 flex-1 overflow-auto">
        <div className="page-wrap">
          <header className="page-header">
            <div>
              <h1 className="page-title">Welcome back, {creator?.name ?? sessionEmail}</h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" className="h-10 border-border bg-white">
                <Link href={`/creators/${creator?.id}`}>View my profile</Link>
              </Button>
              <Dialog open={submissionOpen} onOpenChange={setSubmissionOpen}>
                <DialogTrigger asChild>
                  <Button className="h-10 bg-primary text-white hover:bg-primary/90">
                    Submit Content
                    <ArrowUpRight className="size-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Submit content</DialogTitle>
                    <DialogDescription>Share a published content link for review.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-3">
                    <Select value={submissionForm.campaignId} onValueChange={(campaignId) => setSubmissionForm(current => ({ ...current, campaignId }))}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose campaign" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectableCampaigns.map(campaign => (
                          <SelectItem key={campaign.id} value={campaign.id}>{campaign.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={submissionForm.platform} onValueChange={(platform: SubmissionPlatform) => setSubmissionForm(current => ({ ...current, platform }))}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose platform" />
                      </SelectTrigger>
                      <SelectContent>
                        {SUPPORTED_SUBMISSION_PLATFORMS.map(platform => (
                          <SelectItem key={platform} value={platform}>{platform}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={submissionForm.contentType} onValueChange={(contentType) => setSubmissionForm(current => ({ ...current, contentType }))}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Content type" />
                      </SelectTrigger>
                      <SelectContent>
                        {['Reel', 'Short video', 'Carousel', 'Story', 'Video', 'Post'].map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      value={submissionForm.contentUrl}
                      onChange={(event) => setSubmissionForm(current => ({ ...current, contentUrl: event.target.value }))}
                      placeholder="Paste content link"
                    />
                    <Textarea
                      value={submissionForm.note}
                      onChange={(event) => setSubmissionForm(current => ({ ...current, note: event.target.value }))}
                      placeholder="Optional note for the campaign manager"
                      className="min-h-20"
                    />
                    {submissionError && <p className="text-sm font-medium text-red-600">{submissionError}</p>}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" className="border-border bg-white" onClick={() => setSubmissionOpen(false)}>Cancel</Button>
                    <Button className="bg-primary text-white" onClick={submitContent}>Submit for review</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </header>

          <section className="space-y-6">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <CreatorDashboardMetric
                label="Approved Content"
                value={approvedContentThisMonth}
                description=""
              />
              <CreatorDashboardMetric
                label="Submitted Content"
                value={submittedContentThisMonth}
                description=""
              />
              <CreatorDashboardMetric
                label="Pending Review"
                value={pendingReviewThisMonth}
                description=""
              />
              <CreatorDashboardMetric
                label="Weekly Consistency"
                value={`${weeklyConsistency.completed} / ${weeklyConsistency.required} Weeks`}
                description=""
              />
            </div>

            <div className="panel overflow-hidden">
              <div className="border-b border-border px-5 py-4">
                <h2 className="section-heading">Monthly Performance</h2>
              </div>
              <div className="grid gap-px bg-border md:grid-cols-3">
                <MonthlyPerformanceMetric
                  label="Views"
                  value={(monthlyPerformance?.totalViews ?? 0).toLocaleString()}
                  description=""
                />
                <MonthlyPerformanceMetric
                  label="Impressions"
                  value={(monthlyPerformance?.totalImpressions ?? 0).toLocaleString()}
                  description=""
                />
                <MonthlyPerformanceMetric
                  label="Engagement Rate"
                  value={`${monthlyPerformance?.averageEngagementRate ?? 0}%`}
                  description=""
                />
              </div>
            </div>

            <div className="panel overflow-hidden">
              <div className="border-b border-border px-5 py-4">
                <h2 className="section-heading">Recent submissions</h2>
              </div>
              <div className="divide-y divide-border">
                {recentSubmissions.length === 0 ? (
                  <div className="px-5 py-8 text-sm text-muted-foreground">No content has been submitted yet.</div>
                ) : recentSubmissions.map(submission => {
                  const campaign = campaigns.find(item => item.id === submission.campaignId);
                  return (
                    <div key={submission.id} className="grid gap-3 px-5 py-4 md:grid-cols-[1fr_auto] md:items-center">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-semibold">{submission.title}</p>
                          <Badge variant="outline" className={cn('rounded-full', statusTone(submission.status))}>{submissionStatusLabel(submission.status)}</Badge>
                        </div>
                        <p className="mt-1 truncate text-xs text-muted-foreground">
                          {campaign?.title ?? 'Campaign'} · {submission.platform ?? 'Content'} · {new Date(submission.submissionDate ?? submission.submittedAt).toLocaleDateString()}
                        </p>
                        {(submission.staffFeedback || submission.reviewNotes) && (
                          <p className="mt-2 text-sm text-muted-foreground">{submission.staffFeedback ?? submission.reviewNotes}</p>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-right text-xs text-muted-foreground md:min-w-[210px]">
                        <span>{(submission.views ?? 0).toLocaleString()} views</span>
                        <span>{(submission.likes ?? 0).toLocaleString()} likes</span>
                        <span>{submission.engagementRate ?? 0}% ER</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="panel overflow-hidden">
              <div className="border-b border-border px-5 py-4">
                <h2 className="section-heading">New Campaigns Available</h2>
              </div>
              <div className="divide-y divide-border">
                {availableCampaigns.length === 0 ? (
                  <div className="px-5 py-8 text-sm text-muted-foreground">No new campaigns are available right now.</div>
                ) : availableCampaigns.map(campaign => (
                  <Link key={campaign.id} href={`/campaigns/${campaign.id}`} className="block px-5 py-4 transition hover:bg-muted/35">
                    <div className="flex flex-col gap-3">
                      <div>
                        <p className="text-sm font-semibold">{campaign.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{campaign.brand} · {campaign.contentType}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {campaign.targetNiches.map(niche => <Badge key={niche} variant="secondary" className="rounded-full">{niche}</Badge>)}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>
      <RightDashboardSidebar />
    </div>
  );
}

function CreatorMetric({ icon, label, value, detail }: { icon: React.ReactNode; label: string; value: string | number; detail: string }) {
  return (
    <div className="panel p-5">
      <div className="mb-4 flex size-9 items-center justify-center rounded-[10px] bg-secondary text-primary">{icon}</div>
      <p className="text-sm font-semibold text-muted-foreground">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-[-0.02em]">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
    </div>
  );
}

function CreatorDashboardMetric({ label, value, description }: { label: string; value: string | number; description: string }) {
  return (
    <div className="panel p-5">
      <p className="text-sm font-semibold text-muted-foreground">{label}</p>
      <p className="mt-3 text-2xl font-semibold leading-tight tracking-normal">{value}</p>
      {description && <p className="mt-3 text-sm leading-5 text-muted-foreground">{description}</p>}
    </div>
  );
}

function MonthlyPerformanceMetric({ label, value, description }: { label: string; value: string | number; description: string }) {
  return (
    <div className="bg-white p-5">
      <p className="text-sm font-semibold text-muted-foreground">{label}</p>
      <p className="mt-3 text-2xl font-semibold leading-tight tracking-normal">{value}</p>
      {description && <p className="mt-3 text-sm leading-5 text-muted-foreground">{description}</p>}
    </div>
  );
}

function ReadinessRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between bg-white px-5 py-4">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
}

function QueueColumn({ title, href, linkLabel, children }: { title: string; href: string; linkLabel: string; children: React.ReactNode }) {
  return (
    <div className="p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">{title}</h3>
        <Link href={href} className="quiet-link">{linkLabel}</Link>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function EmptyLine({ text }: { text: string }) {
  return <div className="rounded-[10px] border border-dashed border-border bg-muted/25 px-3 py-3 text-sm text-muted-foreground">{text}</div>;
}
