'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import { Sidebar } from '@/components/sidebar';
import { useApp } from '@/lib/app-context';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CheckCircle2, ChevronsUpDown, MoreHorizontal, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { brandRankLabel, statusTone } from '@/lib/platform-utils';
import { RankBadge } from '@/components/rank-badge';
import {
  getMonthYear,
  getNextRankRequirement,
  getTotalScholarshipHours,
  submissionStatusLabel,
  type CreatorRank,
} from '@/lib/creator-performance';
import { getCreatorMonthlyPerformance } from '@/lib/creator-performance-source';
import type { Submission } from '@/lib/mock-data';

const creatorApprovalStatusStyles = {
  pending: 'border-amber-200 bg-amber-50 text-amber-700',
  approved: 'border-green-200 bg-green-50 text-green-700',
  rejected: 'border-red-200 bg-red-50 text-red-700',
};

function approvalStatusLabel(status: string) {
  if (status === 'pending') return 'Pending';
  if (status === 'approved') return 'Approved';
  if (status === 'rejected') return 'Rejected';
  return status;
}

function rankLabel(rank?: string) {
  if (!rank) return 'Bronze I';
  if (rank === 'TopPerformer') return 'Platinum';
  if (rank === 'Gold') return 'Gold I';
  if (rank === 'Silver2') return 'Silver II';
  if (rank === 'Silver1') return 'Silver I';
  if (rank === 'Bronze3') return 'Bronze III';
  if (rank === 'Bronze2') return 'Bronze II';
  if (rank === 'Bronze1') return 'Bronze I';
  return rank;
}

function brandRank(rank?: string) {
  return brandRankLabel(rank);
}

function initials(name: string) {
  return name.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase();
}

type ReviewDraft = {
  feedback: string;
  rejectedReason: string;
  views: string;
  impressions: string;
  likes: string;
  comments: string;
  shares: string;
  saves: string;
  engagementRate: string;
  cpiScore: string;
};

const emptyReviewDraft: ReviewDraft = {
  feedback: '',
  rejectedReason: '',
  views: '',
  impressions: '',
  likes: '',
  comments: '',
  shares: '',
  saves: '',
  engagementRate: '',
  cpiScore: '',
};

type RealCreatorApplication = {
  userId: string;
  creatorName: string | null;
  email: string | null;
  platform: string;
  socialHandle: string;
  followerCount: number;
  contentCategories: string[];
  university: string | null;
  faculty: string | null;
  language: string | null;
  province: string | null;
  country: string | null;
  verificationStatus: string;
  createdAt: string;
};

export default function GovernanceAdmin() {
  const { creators, campaigns, engagements, submissions, approveCreator, rejectCreator, reviewSubmission, updateEngagementStatus } = useApp();
  const [activeTab, setActiveTab] = useState<'approvals' | 'submissions' | 'performance' | 'ranks'>('approvals');
  const [reviewDrafts, setReviewDrafts] = useState<Record<string, ReviewDraft>>({});
  const [realApplicants, setRealApplicants] = useState<RealCreatorApplication[]>([]);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  useEffect(() => {
    void fetchRealApplicants();
  }, []);

  const fetchRealApplicants = async () => {
    if (!supabase) return;
    const { data } = await supabase
      .from('creator_profiles')
      .select('user_id, creator_name, platform, social_handle, follower_count, content_categories, university, faculty, language, province, country, verification_status, created_at')
      .order('created_at', { ascending: false });
    if (!data) return;
    const userIds = data.map(row => row.user_id as string);
    const { data: users } = await supabase
      .from('users')
      .select('id, email')
      .in('id', userIds);
    const emailMap = Object.fromEntries((users ?? []).map(u => [u.id as string, u.email as string]));
    setRealApplicants(data.map(row => ({
      userId: row.user_id as string,
      creatorName: row.creator_name as string | null,
      email: emailMap[row.user_id as string] ?? null,
      platform: row.platform as string,
      socialHandle: row.social_handle as string,
      followerCount: row.follower_count as number,
      contentCategories: (row.content_categories as string[]) ?? [],
      university: row.university as string | null,
      faculty: row.faculty as string | null,
      language: row.language as string | null,
      province: row.province as string | null,
      country: row.country as string | null,
      verificationStatus: row.verification_status as string,
      createdAt: row.created_at as string,
    })));
  };

  const approveRealCreator = async (userId: string) => {
    if (!supabase) return;
    setApprovingId(userId);
    await supabase.from('creator_profiles').update({ verification_status: 'verified' }).eq('user_id', userId);
    await fetchRealApplicants();
    setApprovingId(null);
  };

  const rejectRealCreator = async (userId: string) => {
    if (!supabase) return;
    setApprovingId(userId);
    await supabase.from('creator_profiles').update({ verification_status: 'rejected' }).eq('user_id', userId);
    await fetchRealApplicants();
    setApprovingId(null);
  };

  const pendingCreators = creators.filter(c => c.approvalStatus === 'pending');
  const recentActivity = engagements
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);
  const campaignInvitations = engagements
    .filter(engagement => engagement.status === 'matched' || engagement.status === 'in_discussion')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const { month, year } = getMonthYear();
  const approvedCreators = creators.filter(c => c.approvalStatus === 'approved');
  const monthlyPerformance = approvedCreators.map(creator => getCreatorMonthlyPerformance(creator, submissions, campaigns, month, year));
  const pendingSubmissions = submissions.filter(submission => submission.status === 'pending_review' || submission.status === 'submitted');
  const topPerformingCreators = [...monthlyPerformance].sort((a, b) => b.totalViews - a.totalViews).slice(0, 5);
  const closeToNextRank = monthlyPerformance.filter(performance => performance.rankProgressPercentage >= 70 && performance.nextRank).slice(0, 5);
  const totalHoursThisMonth = monthlyPerformance.reduce((sum, performance) => sum + performance.scholarshipHoursEarned, 0);

  const getDraft = (submissionId: string) => reviewDrafts[submissionId] ?? emptyReviewDraft;
  const updateDraft = (submissionId: string, field: keyof ReviewDraft, value: string) => {
    setReviewDrafts(current => ({
      ...current,
      [submissionId]: {
        ...emptyReviewDraft,
        ...current[submissionId],
        [field]: value,
      },
    }));
  };
  const reviewWithDraft = (submission: Submission, status: Submission['status']) => {
    const draft = getDraft(submission.id);
    reviewSubmission(submission.id, status, draft.feedback || draft.rejectedReason, {
      staffFeedback: draft.feedback,
      rejectedReason: draft.rejectedReason,
      views: toOptionalNumber(draft.views),
      impressions: toOptionalNumber(draft.impressions),
      likes: toOptionalNumber(draft.likes),
      comments: toOptionalNumber(draft.comments),
      shares: toOptionalNumber(draft.shares),
      saves: toOptionalNumber(draft.saves),
      engagementRate: toOptionalNumber(draft.engagementRate),
      cpiScore: toOptionalNumber(draft.cpiScore),
    });
  };

  const getEngagementStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'active':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'in_discussion':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'matched':
        return 'bg-primary/10 text-primary border-primary/20';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    if (status === 'in_discussion') return 'In Discussion';
    if (status === 'in_progress') return 'In Progress';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="flex h-screen ecosystem-shell">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="page-wrap">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Brand Campaign Hub</h1>
            <p className="text-muted-foreground mt-1">Find creators, send campaign offers, and monitor creator collaborations.</p>
          </div>

          {/* Tabs */}
          <div className="mb-6 flex gap-2 overflow-x-auto border-b border-border pb-px">
            {(['approvals', 'submissions', 'performance', 'ranks'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`shrink-0 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab === 'approvals' && 'Creator Applications'}
                {tab === 'submissions' && 'Submission Queue'}
                {tab === 'performance' && 'Monthly Performance'}
                {tab === 'ranks' && 'Ranks & Hours'}
              </button>
            ))}
          </div>

          {/* Content */}
          {activeTab === 'approvals' && (
            <div className="space-y-6">
              {realApplicants.length === 0 ? (
                <Card className="p-12 text-center border border-border rounded-xl shadow-sm">
                  <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <p className="text-foreground font-medium">No creator applications are waiting.</p>
                  <p className="text-muted-foreground text-sm">All submitted creator profiles have been reviewed.</p>
                </Card>
              ) : (
                <div className="overflow-hidden rounded-xl border border-border bg-white shadow-[0_1px_2px_rgba(17,24,39,0.03)]">
                  <div className="hidden grid-cols-[minmax(220px,1.6fr)_minmax(120px,1fr)_110px_140px_130px_80px] items-center gap-5 border-b border-border bg-white px-6 py-3 text-xs font-semibold text-gray-400 xl:grid">
                    {['Creator', 'Platform', 'Applied', 'Categories', 'Status', 'Action'].map((label) => (
                      <span key={label} className={cn('inline-flex items-center gap-1', label === 'Action' && 'justify-end')}>
                        {label}
                        <ChevronsUpDown className="size-3 text-gray-300" />
                      </span>
                    ))}
                  </div>

                  <div className="divide-y divide-gray-100">
                    {realApplicants.map(applicant => {
                      const statusStyle = applicant.verificationStatus === 'verified'
                        ? creatorApprovalStatusStyles.approved
                        : applicant.verificationStatus === 'rejected'
                          ? creatorApprovalStatusStyles.rejected
                          : creatorApprovalStatusStyles.pending;
                      const statusText = applicant.verificationStatus === 'verified' ? 'Approved'
                        : applicant.verificationStatus === 'rejected' ? 'Rejected' : 'Pending';
                      const displayName = applicant.creatorName ?? applicant.email ?? 'Creator';
                      const isActing = approvingId === applicant.userId;
                      return (
                        <div
                          key={applicant.userId}
                          className="grid gap-4 bg-white px-4 py-5 transition hover:bg-gray-50/60 xl:grid-cols-[minmax(220px,1.6fr)_minmax(120px,1fr)_110px_140px_130px_80px] xl:items-center xl:gap-5 xl:px-6 xl:py-4"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-primary">
                              {initials(displayName)}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-foreground">{displayName}</p>
                              <p className="mt-0.5 truncate text-xs text-muted-foreground">{applicant.email ?? ''}</p>
                              {(applicant.university ?? applicant.faculty) && (
                                <p className="mt-0.5 truncate text-xs text-muted-foreground">{[applicant.faculty, applicant.university].filter(Boolean).join(' · ')}</p>
                              )}
                            </div>
                          </div>

                          <div>
                            <p className="mb-1 text-[11px] font-semibold uppercase text-muted-foreground xl:hidden">Platform</p>
                            <p className="text-sm font-medium text-gray-500">{applicant.platform}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">{applicant.socialHandle}</p>
                          </div>

                          <div>
                            <p className="mb-1 text-[11px] font-semibold uppercase text-muted-foreground xl:hidden">Applied</p>
                            <p className="text-sm font-medium text-gray-500">{new Date(applicant.createdAt).toLocaleDateString()}</p>
                          </div>

                          <div>
                            <p className="mb-1 text-[11px] font-semibold uppercase text-muted-foreground xl:hidden">Categories</p>
                            <p className="text-sm font-medium text-gray-500 truncate">{applicant.contentCategories.slice(0, 2).join(', ') || '—'}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">{applicant.followerCount.toLocaleString()} followers</p>
                          </div>

                          <div className="flex items-center justify-between gap-3 xl:justify-start">
                            <p className="text-[11px] font-semibold uppercase text-muted-foreground xl:hidden">Status</p>
                            <span className={cn('inline-flex min-w-[78px] justify-center rounded-full border px-3 py-1.5 text-xs font-semibold', statusStyle)}>
                              {statusText}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-3 xl:justify-end">
                            <p className="text-[11px] font-semibold uppercase text-muted-foreground xl:hidden">Action</p>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="size-8 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700" disabled={isActing}>
                                  <MoreHorizontal className="size-4" />
                                  <span className="sr-only">Actions for {displayName}</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-36">
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => void approveRealCreator(applicant.userId)} className="text-green-700 focus:text-green-700">
                                  Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem variant="destructive" onClick={() => void rejectRealCreator(applicant.userId)}>
                                  Reject
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'submissions' && (
            <div className="space-y-4">
              {submissions.length === 0 ? (
                <Card className="p-12 text-center border border-border rounded-xl shadow-sm">
                  <p className="text-foreground font-medium">No creator content has been submitted yet.</p>
                  <p className="text-muted-foreground text-sm">New content links will appear here for review.</p>
                </Card>
              ) : submissions.map(submission => {
                const creator = creators.find(item => item.id === submission.creatorId);
                const campaign = campaigns.find(item => item.id === submission.campaignId);
                const draft = getDraft(submission.id);
                return (
                  <Card key={submission.id} className="border border-border rounded-xl shadow-sm overflow-hidden">
                    <div className="grid gap-5 p-5 lg:grid-cols-[1fr_400px]">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-semibold">{submission.title}</h3>
                          <Badge variant="outline" className={cn('rounded-full', statusTone(submission.status))}>{submissionStatusLabel(submission.status)}</Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {creator?.name ?? 'Creator'} · {campaign?.title ?? 'Campaign'} · {submission.platform ?? 'Content'} · {new Date(submission.submissionDate ?? submission.submittedAt).toLocaleDateString()}
                        </p>
                        <Button asChild variant="outline" size="sm" className="mt-3 h-8 border-border bg-white text-xs">
                          <a href={submission.contentUrl ?? submission.link} target="_blank" rel="noreferrer">Open Link</a>
                        </Button>
                        {submission.notes && <p className="mt-3 text-sm text-muted-foreground">{submission.notes}</p>}
                        {(submission.staffFeedback || submission.reviewNotes) && (
                          <div className="mt-4 rounded-lg border border-border bg-muted/35 p-3 text-sm text-muted-foreground">
                            {submission.staffFeedback ?? submission.reviewNotes}
                          </div>
                        )}
                      </div>
                      <div className="space-y-3">
                        <div className="grid gap-2 sm:grid-cols-2">
                          <MetricInput label="Views" value={draft.views} onChange={(value) => updateDraft(submission.id, 'views', value)} />
                          <MetricInput label="Impressions" value={draft.impressions} onChange={(value) => updateDraft(submission.id, 'impressions', value)} />
                          <MetricInput label="Likes" value={draft.likes} onChange={(value) => updateDraft(submission.id, 'likes', value)} />
                          <MetricInput label="Comments" value={draft.comments} onChange={(value) => updateDraft(submission.id, 'comments', value)} />
                          <MetricInput label="Shares" value={draft.shares} onChange={(value) => updateDraft(submission.id, 'shares', value)} />
                          <MetricInput label="Saves" value={draft.saves} onChange={(value) => updateDraft(submission.id, 'saves', value)} />
                          <MetricInput label="Engagement %" value={draft.engagementRate} onChange={(value) => updateDraft(submission.id, 'engagementRate', value)} />
                          <MetricInput label="CPI score" value={draft.cpiScore} onChange={(value) => updateDraft(submission.id, 'cpiScore', value)} />
                        </div>
                        <Textarea
                          value={draft.feedback}
                          onChange={(event) => updateDraft(submission.id, 'feedback', event.target.value)}
                          placeholder="Feedback for creator"
                          className="min-h-20 bg-white"
                        />
                        <Textarea
                          value={draft.rejectedReason}
                          onChange={(event) => updateDraft(submission.id, 'rejectedReason', event.target.value)}
                          placeholder="Rejected reason, if needed"
                          className="min-h-16 bg-white"
                        />
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" className="h-8 bg-primary text-xs" onClick={() => reviewWithDraft(submission, 'approved')}>Approve</Button>
                          <Button size="sm" variant="outline" className="h-8 border-border bg-white text-xs" onClick={() => reviewWithDraft(submission, 'needs_changes')}>Request changes</Button>
                          <Button size="sm" variant="outline" className="h-8 border-red-200 bg-red-50 text-xs text-red-700 hover:bg-red-100" onClick={() => reviewWithDraft(submission, 'rejected')}>Reject</Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {activeTab === 'performance' && (
            <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
              <Card className="border border-border rounded-xl shadow-sm overflow-hidden">
                <div className="border-b border-border px-5 py-4">
                  <h2 className="text-lg font-semibold">Monthly creator performance</h2>
                  <p className="text-sm text-muted-foreground">{month}/{year} totals from approved submissions.</p>
                </div>
                <div className="divide-y divide-border">
                  {monthlyPerformance.map(performance => {
                    const creator = creators.find(item => item.id === performance.creatorId);
                    return (
                      <div key={performance.id} className="grid gap-4 px-5 py-4 xl:grid-cols-[1fr_90px_90px_110px_110px] xl:items-center">
                        <div>
                          <p className="text-sm font-semibold">{creator?.name}</p>
                          <p className="text-xs text-muted-foreground">{brandRank(performance.currentRank)} · {performance.totalContentSubmitted} submitted</p>
                        </div>
                        <AdminMetric label="Approved" value={performance.totalContentApproved} />
                        <AdminMetric label="Views" value={performance.totalViews.toLocaleString()} />
                        <AdminMetric label="Engagement" value={`${performance.averageEngagementRate}%`} />
                        <AdminMetric label="Hours" value={performance.scholarshipHoursEarned} />
                      </div>
                    );
                  })}
                </div>
              </Card>
              <div className="space-y-4">
                <Card className="p-5 border border-border rounded-xl shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Scholarship hours</p>
                      <p className="mt-2 text-3xl font-semibold">{totalHoursThisMonth}</p>
                    </div>
                    <GraduationCap className="size-5 text-primary" />
                  </div>
                </Card>
                <Card className="p-5 border border-border rounded-xl shadow-sm">
                  <h3 className="text-sm font-semibold">Top performing creators</h3>
                  <div className="mt-4 space-y-3">
                    {topPerformingCreators.map(performance => {
                      const creator = creators.find(item => item.id === performance.creatorId);
                      return (
                        <div key={performance.id} className="flex items-center justify-between gap-3 text-sm">
                          <span className="truncate">{creator?.name}</span>
                          <span className="font-semibold">{performance.totalViews.toLocaleString()} views</span>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'ranks' && (
            <div className="grid gap-4">
              {monthlyPerformance.map(performance => {
                const creator = creators.find(item => item.id === performance.creatorId);
                return (
                  <Card key={performance.id} className="p-5 border border-border rounded-xl shadow-sm">
                    <div className="grid gap-4 lg:grid-cols-[1fr_360px_140px] lg:items-center">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-semibold">{creator?.name}</h3>
                          <RankBadge rank={brandRank(performance.currentRank)} />
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{getNextRankRequirement(performance.currentRank as CreatorRank)}</p>
                      </div>
                      <div>
                        <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                          <span>{performance.nextRank ? `Next: ${performance.nextRank}` : 'Highest rank'}</span>
                          <span>{performance.rankProgressPercentage}%</span>
                        </div>
                        <Progress value={performance.rankProgressPercentage} />
                      </div>
                      <div className="text-sm lg:text-right">
                        <p className="font-semibold">{getTotalScholarshipHours(performance.creatorId, submissions)} hours</p>
                        <p className="text-xs text-muted-foreground">total earned</p>
                      </div>
                    </div>
                  </Card>
                );
              })}
              {closeToNextRank.length > 0 && (
                <Card className="p-5 border border-border rounded-xl shadow-sm">
                  <h3 className="text-sm font-semibold">Creators close to next rank</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {closeToNextRank.map(performance => {
                      const creator = creators.find(item => item.id === performance.creatorId);
                      return <Badge key={performance.id} variant="secondary" className="rounded-full">{creator?.name} · {performance.rankProgressPercentage}%</Badge>;
                    })}
                  </div>
                </Card>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

function MetricInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-1">
      <span className="text-[11px] font-semibold text-muted-foreground">{label}</span>
      <Input value={value} onChange={(event) => onChange(event.target.value)} inputMode="decimal" className="h-9 bg-white" />
    </label>
  );
}

function AdminMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase text-muted-foreground xl:hidden">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}

function toOptionalNumber(value: string) {
  if (value.trim() === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}
