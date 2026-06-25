'use client';

import { useState, type Dispatch, type SetStateAction } from 'react';
import { Sidebar } from '@/components/sidebar';
import { SubmissionFlowScreen } from '@/components/submission-flow-screen';
import { useApp } from '@/lib/app-context';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, CheckCircle2, Clock, Mail, MessageSquare, Plus, UserX, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { initials, statusLabel, statusTone } from '@/lib/platform-utils';
import { useUiStore } from '@/lib/ui-store';
import { SUPPORTED_SUBMISSION_PLATFORMS, submissionStatusLabel, type SubmissionPlatform } from '@/lib/creator-performance';
import type { Campaign, Creator, Engagement, Submission } from '@/lib/mock-data';
import { hasSupabaseConfig, isValidUuid } from '@/lib/supabase-data';

function getCampaignFitScore(creator: Creator, campaign: Campaign) {
  const nicheFit = campaign.targetNiches.includes(creator.niche) ? 35 : 0;
  const platformFit = creator.platforms.some(platform => campaign.targetPlatforms.includes(platform.name)) ? 35 : 0;
  const followerFit = creator.platforms.reduce((sum, platform) => sum + platform.followers, 0) >= campaign.minFollowers ? 15 : 0;
  const readinessFit = Math.min(15, Math.round(creator.reputationScore / 7));
  return nicheFit + platformFit + followerFit + readinessFit;
}

export default function CampaignDetail() {
  const { campaigns, creators, engagements, submissions, createEngagement, updateEngagementStatus, addSubmission, reviewSubmission } = useApp();
  const { activeRole, creatorInvitationStatus, creatorProfile, sessionUser, setCreatorInvitationStatus } = useUiStore();
  const [submissionForm, setSubmissionForm] = useState({ title: '', link: '', notes: '', platform: 'Instagram' as SubmissionPlatform });
  const [submissionError, setSubmissionError] = useState('');
  const params = useParams();
  const campaignId = params.id as string;

  const campaign = campaigns.find(c => c.id === campaignId);
  const campaignEngagements = engagements.filter(e => e.campaignId === campaignId);

  if (activeRole === 'creator' && campaignId === 'au-creator-campus-2026') {
    return (
      <AuCreatorCampusInvitation
        status={creatorInvitationStatus}
        onAccept={() => setCreatorInvitationStatus('accepted')}
        onDecline={() => setCreatorInvitationStatus('declined')}
      />
    );
  }

  if (!campaign) {
    return (
      <div className="flex h-screen ecosystem-shell">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="p-8 text-center">
            <p className="text-muted-foreground">Campaign not found</p>
          </div>
      </main>
    </div>
    );
  }

  const acceptedEngagements = campaignEngagements.filter(e => e.status === 'accepted');
  const confirmedEngagements = campaignEngagements.filter(e => e.status === 'active' || e.status === 'completed');
  const discussionEngagements = campaignEngagements.filter(e => e.status === 'in_discussion');
  const suggestedEngagements = campaignEngagements.filter(e => e.status === 'matched');
  const declinedEngagements = campaignEngagements.filter(e => e.status === 'declined');
  const campaignSubmissions = submissions.filter(submission => submission.campaignId === campaign.id);
  const suggestedCreators = creators
    .filter(creator => creator.approvalStatus === 'approved')
    .filter(creator => !campaignEngagements.some(engagement => engagement.creatorId === creator.id))
    .sort((a, b) => getCampaignFitScore(b, campaign) - getCampaignFitScore(a, campaign));
  const currentCreatorId = creatorProfile?.userId ?? sessionUser?.id ?? 'creator-1';
  const creatorEngagement = campaignEngagements.find(engagement => engagement.creatorId === currentCreatorId);
  const acceptedCount = acceptedEngagements.length + confirmedEngagements.length;
  const completion = campaign.status === 'completed' ? 100 : Math.min(100, Math.round((acceptedCount / 2) * 100));

  if (activeRole === 'creator') {
    return (
      <CreatorCampaignBrief
        campaign={campaign}
        creatorEngagement={creatorEngagement}
        submissionForm={submissionForm}
        setSubmissionForm={setSubmissionForm}
        submissionError={submissionError}
        setSubmissionError={setSubmissionError}
        addSubmission={addSubmission}
        updateEngagementStatus={updateEngagementStatus}
      />
    );
  }

  return (
    <div className="flex h-screen ecosystem-shell">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="page-wrap">
          <Link href="/campaigns" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">
            <ArrowLeft className="size-4" />
            Back to campaigns
          </Link>

          <section className="panel mb-6 overflow-hidden">
            <div className="border-b border-border bg-white px-4 py-5 sm:px-6 sm:py-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <h1 className="page-title">{campaign.title}</h1>
                    <Badge variant="outline" className={cn('rounded-full', statusTone(campaign.status))}>{statusLabel(campaign.status)}</Badge>
                  </div>
                  <p className="text-sm font-semibold text-primary">{campaign.brand}</p>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">{campaign.description}</p>
                </div>
                {campaign.status === 'draft' ? (
                  <Button className="bg-primary text-white hover:bg-primary/90">Approve request</Button>
                ) : (
                  <Button
                    className="bg-primary text-white hover:bg-primary/90"
                    onClick={() => suggestedCreators[0] && createEngagement(campaign.id, suggestedCreators[0].id, 84)}
                  >
                    <Plus className="size-4" />
                    Invite top creator
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-px bg-border md:grid-cols-4">
              <HeroMetric label="Budget" value={`$${(campaign.budget / 1000).toFixed(0)}K`} />
              <HeroMetric label="Pending invites" value={suggestedEngagements.length + discussionEngagements.length} />
              <HeroMetric label="Accepted" value={acceptedCount} />
              <HeroMetric label="End date" value={new Date(campaign.endDate).toLocaleDateString()} />
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <section className="space-y-6">
              <div className="panel p-5">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <h2 className="section-heading">Matching progress</h2>
                    <p className="section-subtitle">Accepted creator coverage for this campaign brief.</p>
                  </div>
                  <span className="text-sm font-semibold">{completion}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${completion}%` }} />
                </div>
              </div>

              <AssignmentSection
                title="Active assignments"
                icon={<CheckCircle2 className="size-4" />}
                items={confirmedEngagements}
                creators={creators}
                action="Mark complete"
                onAction={(engagementId) => updateEngagementStatus(engagementId, 'completed')}
              />
              <AssignmentSection
                title="Accepted invites"
                icon={<CheckCircle2 className="size-4" />}
                items={acceptedEngagements}
                creators={creators}
                action="Start work"
                primary
                onAction={(engagementId) => updateEngagementStatus(engagementId, 'active')}
              />
              <AssignmentSection
                title="In discussion"
                icon={<Clock className="size-4" />}
                items={discussionEngagements}
                creators={creators}
                action="Start work"
                onAction={(engagementId) => updateEngagementStatus(engagementId, 'active')}
              />
              <AssignmentSection
                title="Pending invitations"
                icon={<Users className="size-4" />}
                items={suggestedEngagements}
                creators={creators}
                action="Start discussion"
                primary
                onAction={(engagementId) => updateEngagementStatus(engagementId, 'in_discussion')}
              />
              <AssignmentSection
                title="Declined invites"
                icon={<UserX className="size-4" />}
                items={declinedEngagements}
                creators={creators}
                action="Reopen"
                onAction={(engagementId) => updateEngagementStatus(engagementId, 'matched')}
              />

              {suggestedCreators.length > 0 && (
                <div className="panel overflow-hidden">
                  <div className="border-b border-border px-5 py-4">
                    <h2 className="section-heading">Creator suggestions</h2>
                    <p className="section-subtitle">All signed-up creators who are not assigned yet, sorted by brief fit.</p>
                  </div>
                  <div className="divide-y divide-border">
                    {suggestedCreators.map(creator => (
                      <div key={creator.id} className="grid gap-3 px-5 py-4 md:grid-cols-[1fr_auto] md:items-center">
                        <Link href={`/creators/${creator.id}`} className="flex min-w-0 items-center gap-3">
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">{initials(creator.name)}</div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">{creator.name}</p>
                            <p className="truncate text-xs text-muted-foreground">{creator.niche} · {creator.reputationScore} readiness score · {getCampaignFitScore(creator, campaign)}% fit</p>
                          </div>
                        </Link>
                        <Button size="sm" className="h-8 bg-primary text-xs" onClick={() => createEngagement(campaign.id, creator.id, Math.min(96, creator.reputationScore))}>Send invite</Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <SubmissionReview submissions={campaignSubmissions} creators={creators} reviewSubmission={reviewSubmission} />

              {campaignEngagements.length === 0 && (
                <div className="panel p-8 text-center">
                  <p className="text-sm font-semibold">No creator assignments yet</p>
                  <p className="mt-1 text-sm text-muted-foreground">Add creators based on category, platform fit, and readiness.</p>
                </div>
              )}
            </section>

            <aside className="space-y-6">
              <BriefPanel title="Creator requirements" items={campaign.requirements} />
              <BriefPanel title="Campaign goals" items={campaign.goals} />
              <div className="panel p-5">
                <h2 className="section-heading">Engagement scope</h2>
                <div className="mt-4 space-y-4">
                  <TagGroup label="Categories" items={campaign.targetNiches} />
                  <TagGroup label="Platforms" items={campaign.targetPlatforms} />
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">Content type</p>
                    <p className="mt-1 text-sm font-semibold">{campaign.contentType}</p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}

function CreatorCampaignBrief({
  campaign,
  creatorEngagement,
  submissionForm,
  setSubmissionForm,
  submissionError,
  setSubmissionError,
  addSubmission,
  updateEngagementStatus,
}: {
  campaign: Campaign;
  creatorEngagement: Engagement | undefined;
  submissionForm: { title: string; link: string; notes: string; platform: SubmissionPlatform };
  setSubmissionForm: Dispatch<SetStateAction<{ title: string; link: string; notes: string; platform: SubmissionPlatform }>>;
  submissionError: string;
  setSubmissionError: Dispatch<SetStateAction<string>>;
  addSubmission: (submission: Omit<Submission, 'id' | 'status' | 'submittedAt'> & { status?: Submission['status'] }) => Promise<Submission>;
  updateEngagementStatus: (engagementId: string, status: Engagement['status']) => Promise<void>;
}) {
  const invitationPending = creatorEngagement?.status === 'matched' || creatorEngagement?.status === 'in_discussion';
  const canSubmit = creatorEngagement?.status === 'accepted' || creatorEngagement?.status === 'active';
  const [submissionSubmitting, setSubmissionSubmitting] = useState(false);
  const [submissionFlowStatus, setSubmissionFlowStatus] = useState<'processing' | 'success' | null>(null);
  const [statusUpdating, setStatusUpdating] = useState<Engagement['status'] | null>(null);

  const updateInvitation = async (status: Engagement['status']) => {
    if (!creatorEngagement) return;
    setSubmissionError('');
    setStatusUpdating(status);
    try {
      await updateEngagementStatus(creatorEngagement.id, status);
    } catch (error) {
      setSubmissionError(error instanceof Error ? error.message : 'Could not update invitation status.');
    } finally {
      setStatusUpdating(null);
    }
  };

  const submitContent = async () => {
    setSubmissionError('');
    if (!submissionForm.title || !submissionForm.link) {
      setSubmissionError('Add a content title and link before submitting.');
      return;
    }
    if (hasSupabaseConfig() && !isValidUuid(campaign.id)) {
      setSubmissionError('Please select a valid campaign before submitting.');
      return;
    }
    setSubmissionSubmitting(true);
    setSubmissionFlowStatus('processing');
    try {
      await addSubmission({
        engagementId: creatorEngagement?.id,
        creatorId: creatorEngagement?.creatorId ?? 'creator-1',
        campaignId: campaign.id,
        title: submissionForm.title,
        link: submissionForm.link,
        contentUrl: submissionForm.link,
        contentType: submissionForm.title,
        platform: submissionForm.platform,
        notes: submissionForm.notes,
      });
      setSubmissionForm({ title: '', link: '', notes: '', platform: 'Instagram' });
      setSubmissionFlowStatus('success');
    } catch (error) {
      setSubmissionError(error instanceof Error ? error.message : 'Submission failed. Please try again.');
      setSubmissionFlowStatus(null);
    } finally {
      setSubmissionSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen ecosystem-shell">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className={cn('page-wrap', invitationPending && 'pb-24 sm:pb-0')}>
          <Link href="/" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">
            <ArrowLeft className="size-4" />
            Back to home
          </Link>

          <section className="panel mb-6 overflow-hidden">
            <div className="border-b border-border bg-white px-6 py-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <h1 className="page-title">{campaign.title}</h1>
                    <Badge variant="outline" className={cn('rounded-full', statusTone(creatorEngagement?.status ?? campaign.status))}>
                      {creatorEngagement ? statusLabel(creatorEngagement.status) : statusLabel(campaign.status)}
                    </Badge>
                  </div>
                  <p className="text-sm font-semibold text-primary">{campaign.brand}</p>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">{campaign.description}</p>
                </div>
                {invitationPending && creatorEngagement && (
                  <InviteActions
                    className="hidden sm:flex"
                    onAccept={() => updateInvitation('accepted')}
                    onDecline={() => updateInvitation('declined')}
                    updating={statusUpdating}
                  />
                )}
              </div>
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
            <section className="space-y-6">
              <div className="panel overflow-hidden">
                <div className="border-b border-border px-5 py-4">
                  <h2 className="section-heading">Campaign Brief</h2>
                </div>
                <div className="grid gap-px bg-border md:grid-cols-2">
                  <BriefDetail label="Campaign goal" value={campaign.goals.join(' ')} />
                  <BriefDetail label="Content direction" value={campaign.contentType} />
                  <BriefDetail label="Platforms" value={campaign.targetPlatforms.join(', ')} />
                  <BriefDetail label="Deadline" value={new Date(campaign.endDate).toLocaleDateString()} />
                  <BriefDetail label="Hashtags" value={campaign.hashtags?.join(' ') || 'Campaign hashtags will be confirmed by the manager.'} />
                  <BriefDetail label="Mentions" value={campaign.mentions?.join(' ') || 'Brand mentions will be confirmed by the manager.'} />
                  <BriefDetail label="CTA" value={campaign.cta || 'Use the campaign call to action provided by the manager.'} />
                  <BriefDetail label="Poster images" value={campaign.posterImages?.length ? `${campaign.posterImages.length} reference images available` : 'No poster images attached yet.'} />
                </div>
              </div>

              {canSubmit && creatorEngagement?.status !== 'declined' && (
                <div className="panel p-5">
                  <h2 className="section-heading">Submit Content</h2>
                  <div className="mt-4 grid gap-3">
                    <Input placeholder="Content title" value={submissionForm.title} onChange={(event) => setSubmissionForm({ ...submissionForm, title: event.target.value })} />
                    <Select value={submissionForm.platform} onValueChange={(platform: SubmissionPlatform) => setSubmissionForm({ ...submissionForm, platform })}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose platform" />
                      </SelectTrigger>
                      <SelectContent>
                        {SUPPORTED_SUBMISSION_PLATFORMS.map(platform => (
                          <SelectItem key={platform} value={platform}>{platform}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input placeholder="Paste content link" value={submissionForm.link} onChange={(event) => setSubmissionForm({ ...submissionForm, link: event.target.value })} />
                    <Textarea placeholder="Optional note for the campaign manager" value={submissionForm.notes} onChange={(event) => setSubmissionForm({ ...submissionForm, notes: event.target.value })} />
                    {submissionError && <p className="text-sm font-medium text-red-600">{submissionError}</p>}
                    <Button className="w-fit bg-primary text-white" onClick={submitContent} disabled={submissionSubmitting}>
                      {submissionSubmitting ? 'Submitting...' : 'Submit for review'}
                    </Button>
                  </div>
                </div>
              )}
            </section>

            <aside className="space-y-6">
              <BriefPanel title="Requirements" items={campaign.requirements} />
            </aside>
          </div>
        </div>
      </main>
      <SubmissionFlowScreen
        open={submissionFlowStatus !== null}
        status={submissionFlowStatus ?? 'processing'}
        onClose={() => setSubmissionFlowStatus(null)}
      />
      {invitationPending && creatorEngagement && (
        <InviteActions
          className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-white p-3 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] sm:hidden"
          onAccept={() => updateInvitation('accepted')}
          onDecline={() => updateInvitation('declined')}
          updating={statusUpdating}
        />
      )}
    </div>
  );
}

function InviteActions({
  className,
  onAccept,
  onDecline,
  updating,
}: {
  className?: string;
  onAccept: () => void;
  onDecline: () => void;
  updating: Engagement['status'] | null;
}) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      <Button
        variant="outline"
        className="min-w-0 flex-1 border-border bg-white sm:flex-none"
        onClick={onDecline}
        disabled={Boolean(updating)}
      >
        {updating === 'declined' ? 'Declining...' : 'Decline'}
      </Button>
      <Button
        className="min-w-0 flex-1 bg-primary text-white sm:flex-none"
        onClick={onAccept}
        disabled={Boolean(updating)}
      >
        {updating === 'accepted' ? 'Accepting...' : 'Accept'}
      </Button>
    </div>
  );
}

function HeroMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-2 text-xl font-semibold">{value}</p>
    </div>
  );
}

function BriefDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white p-4">
      <p className="text-xs font-semibold uppercase text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm leading-6 text-foreground">{value}</p>
    </div>
  );
}

function BriefPanel({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="panel p-5">
      <h2 className="section-heading">{title}</h2>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item} className="flex gap-2 text-sm leading-6">
            <CheckCircle2 className="mt-1 size-4 shrink-0 text-primary" />
            <p>{item}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function AuCreatorCampusInvitation({
  status,
  onAccept,
  onDecline,
}: {
  status: 'pending' | 'accepted' | 'declined';
  onAccept: () => void;
  onDecline: () => void;
}) {
  const statusLabel = status === 'accepted' ? 'Accepted' : status === 'declined' ? 'Declined' : 'Invitation Pending';

  return (
    <div className="flex h-screen ecosystem-shell">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="page-wrap max-w-[1040px]">
          <Link href="/notifications" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">
            <ArrowLeft className="size-4" />
            Back to inbox
          </Link>

          <section className="panel overflow-hidden">
            <div className="border-b border-border bg-white px-6 py-6">
              <div>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <h1 className="page-title">AU Creator Campus Program 2026</h1>
                  <Badge variant="outline" className={cn('rounded-full', statusTone(status === 'pending' ? 'pending_review' : status))}>
                    {statusLabel}
                  </Badge>
                </div>
                <p className="text-sm font-semibold text-primary">Invitation from Assumption University</p>
                <p className="mt-2 text-sm text-muted-foreground">Received: June 1, 2026</p>
                <p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground">
                  Help showcase student life, campus culture, university activities, and scholarship opportunities through authentic creator content.
                </p>
                <div className="mt-5 grid gap-2 sm:flex sm:flex-wrap sm:items-center">
                  <Button className="w-full bg-primary text-white sm:w-auto" onClick={onAccept} disabled={status === 'accepted'}>
                    Accept Campaign
                  </Button>
                  <Button asChild variant="outline" className="w-full border-border bg-white sm:w-auto">
                    <a href="#campaign-brief">View Full Brief</a>
                  </Button>
                  <Button asChild variant="outline" className="w-full border-border bg-white sm:w-auto">
                    <a href="mailto:creators@rollerkluster.com?subject=AU%20Creator%20Campus%20Program%202026">
                      <MessageSquare className="size-4" />
                      Message Manager
                    </a>
                  </Button>
                  <Button variant="ghost" className="w-full text-red-600 hover:bg-red-50 hover:text-red-700 sm:w-auto" onClick={onDecline} disabled={status === 'declined'}>
                    Decline
                  </Button>
                </div>
              </div>
            </div>
          </section>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px]">
            <section className="min-w-0 space-y-6">
              <InvitationSection title="Campaign Overview">
                <p>Help showcase student life, campus culture, university activities, and scholarship opportunities through authentic creator content.</p>
                <p className="mt-3">This campaign aims to increase awareness of student engagement opportunities and highlight the experiences of active student leaders and scholarship recipients.</p>
              </InvitationSection>

              <InvitationSection title="Why You Were Selected">
                <ul className="grid gap-2">
                  {[
                    'Gold I creator status',
                    'Consistent content performance',
                    'Strong engagement rate above ecosystem average',
                    'Active participation in previous campus campaigns',
                  ].map(item => <li key={item} className="flex gap-2"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />{item}</li>)}
                </ul>
              </InvitationSection>

              <InvitationSection title="Campaign Details">
                <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-2">
                  <InvitationDetail label="Campaign Duration" value="June 1, 2026 - June 30, 2026" />
                  <InvitationDetail label="Content Required" value="2 Reels, 1 Story Set" />
                  <InvitationDetail label="Platforms" value="Instagram, TikTok" />
                  <InvitationDetail label="Target Audience" value="Current students, prospective students, parents, university community" />
                </div>
              </InvitationSection>

              <InvitationSection title="Deliverables">
                <table className="w-full border-collapse text-sm">
                  <tbody>
                    {[
                      ['Content #1', 'Campus Life Reel'],
                      ['Content #2', 'Student Experience Reel'],
                      ['Content #3', 'Story Coverage of Campus Activities'],
                    ].map(([label, value]) => (
                      <tr key={label} className="border-b border-border last:border-0">
                        <td className="w-32 py-3 pr-4 font-semibold text-muted-foreground">{label}</td>
                        <td className="py-3 font-semibold text-foreground">{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </InvitationSection>

              <InvitationSection title="Rewards & Benefits">
                <ul className="grid gap-2">
                  {[
                    'Rank progression contribution',
                    'Verified creator activity record',
                    'Scholarship participation credit',
                    'Featured creator badge eligibility',
                  ].map(item => <li key={item} className="flex gap-2"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />{item}</li>)}
                </ul>
              </InvitationSection>

              <InvitationSection title="Key Message">
                <p>Show authentic student experiences and opportunities available through the Assumption University creator ecosystem.</p>
              </InvitationSection>
            </section>

            <aside className="min-w-0 space-y-6">
              <InvitationSection title="Timeline">
                <div className="space-y-4">
                  <TimelineRow label="Invitation Accepted" value="June 3" />
                  <TimelineRow label="Content Submission Deadline" value="June 25" />
                  <TimelineRow label="Review Completion" value="June 28" />
                  <TimelineRow label="Campaign Completion" value="June 30" />
                </div>
              </InvitationSection>

              <InvitationSection title="Contact">
                <p className="text-sm font-semibold">Campaign Manager</p>
                <p className="mt-1 text-sm text-muted-foreground">Student Affairs Office</p>
                <p className="mt-4 text-sm font-semibold">Support</p>
                <a className="mt-1 inline-flex items-center gap-2 text-sm font-semibold text-primary" href="mailto:creators@rollerkluster.com">
                  <Mail className="size-4" />
                  creators@rollerkluster.com
                </a>
              </InvitationSection>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}

function InvitationSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section id={title === 'Campaign Overview' ? 'campaign-brief' : undefined} className="panel p-5">
      <h2 className="section-heading">{title}</h2>
      <div className="mt-4 text-sm leading-6 text-foreground">{children}</div>
    </section>
  );
}

function InvitationDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white p-4">
      <p className="text-xs font-semibold uppercase text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm font-semibold leading-6">{value}</p>
    </div>
  );
}

function TimelineRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-l-2 border-primary/30 pl-4">
      <p className="text-xs font-semibold uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function TagGroup({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map(item => <Badge key={item} variant="secondary" className="rounded-full">{item}</Badge>)}
      </div>
    </div>
  );
}

function AssignmentSection({
  title,
  icon,
  items,
  creators,
  action,
  onAction,
  primary = false,
}: {
  title: string;
  icon: React.ReactNode;
  items: { id: string; creatorId: string; matchScore: number; status: string }[];
  creators: { id: string; name: string; niche: string }[];
  action: string;
  onAction?: (engagementId: string) => void;
  primary?: boolean;
}) {
  if (items.length === 0) return null;

  return (
    <div className="panel overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border px-5 py-4">
        <span className="flex size-8 items-center justify-center rounded-full bg-secondary text-primary">{icon}</span>
        <h2 className="section-heading">{title}</h2>
      </div>
      <div className="divide-y divide-border">
        {items.map(engagement => {
          const creator = creators.find(c => c.id === engagement.creatorId);
          return (
            <div key={engagement.id} className="grid gap-3 px-5 py-4 md:grid-cols-[1fr_auto_auto] md:items-center">
              <Link href={`/creators/${creator?.id}`} className="flex min-w-0 items-center gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">{creator ? initials(creator.name) : 'CR'}</div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{creator?.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{creator?.niche} · {engagement.matchScore}% fit</p>
                </div>
              </Link>
              <Badge variant="outline" className={cn('w-fit rounded-full', statusTone(engagement.status))}>{statusLabel(engagement.status)}</Badge>
              <Button variant={primary ? 'default' : 'outline'} size="sm" className={cn('h-8 text-xs', !primary && 'border-border bg-white')} onClick={() => onAction?.(engagement.id)}>
                {action}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SubmissionReview({
  submissions,
  creators,
  reviewSubmission,
}: {
  submissions: Submission[];
  creators: { id: string; name: string }[];
  reviewSubmission: (submissionId: string, status: Submission['status'], reviewNotes?: string) => void;
}) {
  if (submissions.length === 0) return null;

  return (
    <div className="panel overflow-hidden">
      <div className="border-b border-border px-5 py-4">
        <h2 className="section-heading">Creator submissions</h2>
        <p className="section-subtitle">Review creator work, approve it, or request changes.</p>
      </div>
      <div className="divide-y divide-border">
        {submissions.map(submission => {
          const creator = creators.find(item => item.id === submission.creatorId);
          return (
            <div key={submission.id} className="grid gap-4 px-5 py-4 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold">{submission.title}</p>
                  <Badge variant="outline" className={cn('rounded-full', statusTone(submission.status))}>{submissionStatusLabel(submission.status)}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{creator?.name} · {new Date(submission.submittedAt).toLocaleDateString()}</p>
                <a href={submission.link} className="mt-2 block text-sm font-semibold text-primary" target="_blank" rel="noreferrer">{submission.link}</a>
                {submission.notes && <p className="mt-2 text-sm text-muted-foreground">{submission.notes}</p>}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" className="h-8 bg-primary text-xs" onClick={() => reviewSubmission(submission.id, 'approved', 'Approved for campaign completion.')}>Approve</Button>
                <Button size="sm" variant="outline" className="h-8 border-border bg-white text-xs" onClick={() => reviewSubmission(submission.id, 'changes_requested', 'Please revise based on campaign requirements.')}>Request changes</Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
