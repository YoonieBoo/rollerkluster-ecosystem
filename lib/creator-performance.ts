import type { Campaign, Creator, Submission } from './mock-data';

export const SUPPORTED_SUBMISSION_PLATFORMS = ['Instagram', 'TikTok', 'Facebook'] as const;

export type SubmissionPlatform = (typeof SUPPORTED_SUBMISSION_PLATFORMS)[number];
export type CreatorRank =
  | 'Bronze I'
  | 'Bronze II'
  | 'Bronze III'
  | 'Bronze IV'
  | 'Silver I'
  | 'Silver II'
  | 'Silver III'
  | 'Silver IV'
  | 'Gold I'
  | 'Gold II'
  | 'Gold III'
  | 'Gold IV'
  | 'Platinum';

export interface CreatorMonthlyPerformance {
  id: string;
  creatorId: string;
  month: number;
  year: number;
  totalContentSubmitted: number;
  totalContentApproved: number;
  totalViews: number;
  totalImpressions: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalSaves: number;
  averageEngagementRate: number;
  averageCpiScore: number;
  consistencyScore: number;
  scholarshipHoursEarned: number;
  currentRank: CreatorRank;
  nextRank: CreatorRank | null;
  rankProgressPercentage: number;
  campaignsParticipated: string[];
  staffNotes: string[];
}

export interface ScholarshipHourLog {
  id: string;
  creatorId: string;
  submissionId?: string;
  month: number;
  year: number;
  reason: string;
  hours: number;
  createdAt: string;
}

export interface ScholarshipHoursSummary {
  approvedContent: {
    approvedCount: number;
    hoursPerApprovedContent: number;
    hours: number;
  };
  consistency: {
    activeWeeks: number;
    hours: number;
  };
  campaignParticipation: {
    completedCampaigns: number;
    hoursPerCompletedCampaign: number;
    hours: number;
  };
  leadershipContribution?: {
    activities: number;
    hoursPerActivity: number;
    hours: number;
  };
  totalHours: number;
}

export interface CreatorRankHistory {
  id: string;
  creatorId: string;
  previousRank: CreatorRank;
  newRank: CreatorRank;
  reason: string;
  changedAt: string;
}

export interface MonthlyCreatorReport {
  id: string;
  creatorId: string;
  month: number;
  year: number;
  generatedAt: string;
  performance: CreatorMonthlyPerformance;
}

export const CREATOR_RANKS: CreatorRank[] = [
  'Bronze I',
  'Bronze II',
  'Bronze III',
  'Bronze IV',
  'Silver I',
  'Silver II',
  'Silver III',
  'Silver IV',
  'Gold I',
  'Gold II',
  'Gold III',
  'Gold IV',
  'Platinum',
];

export const rankRules = {
  weeklyTargetApprovedPosts: 2,
  bronzeRequirements: {
    'Bronze I': { consecutiveWeeks: 1, onboardingRequired: true, label: 'Complete onboarding and post 2 approved contents in 1 week.' },
    'Bronze II': { consecutiveWeeks: 2, onboardingRequired: true, label: 'Post 2 approved contents per week for 2 weeks.' },
    'Bronze III': { consecutiveWeeks: 4, onboardingRequired: true, label: 'Post 2 approved contents per week for 4 weeks.' },
    'Bronze IV': { consecutiveWeeks: 8, onboardingRequired: true, label: 'Post 2 approved contents per week for 8 weeks.' },
  },
  silverMinimums: { approvedPosts: 10, averageEngagementRate: 4, approvalRate: 80, label: 'Complete creator training, follow briefs reliably, and keep approval rate above 80%.' },
  goldMinimums: { approvedPosts: 18, averageEngagementRate: 6, completedCampaigns: 4, label: 'Complete strong campaign assignments and support multiple campaigns.' },
  platinumMinimums: { approvedPosts: 30, averageEngagementRate: 7.5, approvalRate: 90, label: 'Sustain high-quality delivery, strong approval rate, and trusted creator performance.' },
} as const;

export const scholarshipRules = {
  approvedContentHoursByRank: {
    Bronze: 1,
    Silver: 2,
    Gold: 3,
    Platinum: 4,
  },
  approvedContentHours: 1,
  highPerformanceBonusHours: 0.5,
  weeklyConsistencyHours: 1,
  campaignParticipationHours: 3,
  leadershipContributionHours: 2,
  rankPromotionHours: {
    Bronze: 2,
    Silver: 4,
    Gold: 8,
  },
  highPerformance: {
    views: 10000,
    engagementRate: 6,
    cpiScore: 80,
  },
} as const;

export function normalizeSubmissionStatus(status: Submission['status']) {
  if (status === 'submitted') return 'pending_review';
  if (status === 'changes_requested') return 'needs_changes';
  return status;
}

export function submissionStatusLabel(status: Submission['status']) {
  const normalized = normalizeSubmissionStatus(status);
  if (normalized === 'pending_review') return 'Pending Review';
  if (normalized === 'needs_changes') return 'Needs Changes';
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export function rankFromLegacyBadge(badge?: Creator['badge']): CreatorRank {
  if (badge === 'TopPerformer') return 'Platinum';
  if (badge === 'Gold') return 'Gold I';
  if (badge === 'Silver2') return 'Silver II';
  if (badge === 'Silver1') return 'Silver I';
  if (badge === 'Bronze3') return 'Bronze III';
  if (badge === 'Bronze2') return 'Bronze II';
  return 'Bronze I';
}

export function getNextRank(rank: CreatorRank): CreatorRank | null {
  const index = CREATOR_RANKS.indexOf(rank);
  return index >= 0 && index < CREATOR_RANKS.length - 1 ? CREATOR_RANKS[index + 1] : null;
}

export function getNextRankRequirement(rank: CreatorRank) {
  const nextRank = getNextRank(rank);
  if (!nextRank) return 'Maintain trusted high-performing creator status.';
  if (nextRank in rankRules.bronzeRequirements) {
    return rankRules.bronzeRequirements[nextRank as keyof typeof rankRules.bronzeRequirements].label;
  }
  if (nextRank.startsWith('Silver')) return rankRules.silverMinimums.label;
  if (nextRank.startsWith('Gold')) return rankRules.goldMinimums.label;
  return rankRules.platinumMinimums.label;
}

export function getMonthYear(date = new Date()) {
  return { month: date.getMonth() + 1, year: date.getFullYear() };
}

export function isSubmissionApproved(submission: Submission) {
  return normalizeSubmissionStatus(submission.status) === 'approved';
}

export function isSubmissionPending(submission: Submission) {
  return normalizeSubmissionStatus(submission.status) === 'pending_review';
}

export function calculateEngagementRate(submission: Pick<Submission, 'likes' | 'comments' | 'shares' | 'saves' | 'impressions' | 'views' | 'engagementRate'>) {
  if (typeof submission.engagementRate === 'number') return submission.engagementRate;
  const interactions = (submission.likes ?? 0) + (submission.comments ?? 0) + (submission.shares ?? 0) + (submission.saves ?? 0);
  const denominator = submission.impressions ?? submission.views ?? 0;
  return denominator > 0 ? Number(((interactions / denominator) * 100).toFixed(2)) : 0;
}

export function getConsecutiveWeeksWithTarget(submissions: Submission[], target = rankRules.weeklyTargetApprovedPosts) {
  const approvedDates = submissions
    .filter(isSubmissionApproved)
    .map(submission => new Date(submission.approvedAt ?? submission.reviewedAt ?? submission.submissionDate ?? submission.submittedAt));

  if (approvedDates.length === 0) return 0;

  const weekCounts = new Map<string, number>();
  approvedDates.forEach((date) => {
    const start = new Date(date);
    const day = start.getDay();
    start.setDate(start.getDate() - day);
    start.setHours(0, 0, 0, 0);
    const key = start.toISOString().slice(0, 10);
    weekCounts.set(key, (weekCounts.get(key) ?? 0) + 1);
  });

  const qualifyingWeeks = [...weekCounts.entries()]
    .filter(([, count]) => count >= target)
    .map(([week]) => new Date(week).getTime())
    .sort((a, b) => b - a);

  if (qualifyingWeeks.length === 0) return 0;

  let streak = 1;
  for (let index = 1; index < qualifyingWeeks.length; index += 1) {
    const diffDays = Math.round((qualifyingWeeks[index - 1] - qualifyingWeeks[index]) / (24 * 60 * 60 * 1000));
    if (diffDays === 7) streak += 1;
    else break;
  }
  return streak;
}

export function calculateCreatorRank(submissions: Submission[], fallbackRank: CreatorRank = 'Bronze I', creator?: Creator) {
  const approved = submissions.filter(isSubmissionApproved);
  const consecutiveWeeks = getConsecutiveWeeksWithTarget(submissions);
  const avgEngagement = average(approved.map(calculateEngagementRate));
  const completedOnboarding = creator ? creator.trainingCompleted.length > 0 : true;
  const approvalRate = creator?.approvalRate ?? 0;
  const completedCampaigns = creator?.completedEngagements ?? 0;

  let rank: CreatorRank = fallbackRank;
  if (completedOnboarding && consecutiveWeeks >= 1) rank = 'Bronze I';
  if (completedOnboarding && consecutiveWeeks >= 2) rank = 'Bronze II';
  if (completedOnboarding && consecutiveWeeks >= 4) rank = 'Bronze III';
  if (completedOnboarding && consecutiveWeeks >= 8) rank = 'Bronze IV';
  if (approved.length >= rankRules.silverMinimums.approvedPosts && avgEngagement >= rankRules.silverMinimums.averageEngagementRate && approvalRate >= rankRules.silverMinimums.approvalRate) rank = 'Silver I';
  if (approved.length >= 14 && avgEngagement >= 5 && approvalRate >= rankRules.silverMinimums.approvalRate) rank = 'Silver II';
  if (approved.length >= 16 && avgEngagement >= 5.5 && approvalRate >= rankRules.silverMinimums.approvalRate) rank = 'Silver III';
  if (approved.length >= 18 && avgEngagement >= 6 && approvalRate >= rankRules.silverMinimums.approvalRate) rank = 'Silver IV';
  if (approved.length >= rankRules.goldMinimums.approvedPosts && avgEngagement >= rankRules.goldMinimums.averageEngagementRate && completedCampaigns >= rankRules.goldMinimums.completedCampaigns) rank = 'Gold I';
  if (approved.length >= 22 && avgEngagement >= 6.5 && completedCampaigns >= rankRules.goldMinimums.completedCampaigns) rank = 'Gold II';
  if (approved.length >= 26 && avgEngagement >= 7 && completedCampaigns >= rankRules.goldMinimums.completedCampaigns) rank = 'Gold III';
  if (approved.length >= 30 && avgEngagement >= 7.25 && completedCampaigns >= rankRules.goldMinimums.completedCampaigns) rank = 'Gold IV';
  if (approved.length >= rankRules.platinumMinimums.approvedPosts && avgEngagement >= rankRules.platinumMinimums.averageEngagementRate && approvalRate >= rankRules.platinumMinimums.approvalRate) rank = 'Platinum';

  const nextRank = getNextRank(rank);
  const nextProgressTarget = nextRank && nextRank in rankRules.bronzeRequirements
    ? rankRules.bronzeRequirements[nextRank as keyof typeof rankRules.bronzeRequirements].consecutiveWeeks
    : nextRank?.startsWith('Silver')
      ? rankRules.silverMinimums.approvedPosts
      : nextRank?.startsWith('Gold')
        ? rankRules.goldMinimums.approvedPosts
        : rankRules.platinumMinimums.approvedPosts;
  const progressBasis = nextRank && nextRank in rankRules.bronzeRequirements ? consecutiveWeeks : approved.length;
  const rankProgressPercentage = nextRank ? Math.min(100, Math.round((progressBasis / Math.max(nextProgressTarget, 1)) * 100)) : 100;

  return { currentRank: rank, nextRank, rankProgressPercentage, consecutiveWeeks, completedOnboarding };
}

export function calculateScholarshipHours(submissions: Submission[], currentRank: CreatorRank, previousRank?: CreatorRank) {
  if (!previousRank) {
    return calculateScholarshipHoursSummary(submissions, currentRank).totalHours;
  }

  const approved = submissions.filter(isSubmissionApproved);
  const approvedHours = approved.length * getApprovedContentHoursForRank(currentRank);
  const highPerformanceHours = approved.filter(isHighPerformingSubmission).length * scholarshipRules.highPerformanceBonusHours;
  const consistencyHours = getConsecutiveWeeksWithTarget(submissions) * scholarshipRules.weeklyConsistencyHours;
  const promotionHours = previousRank && previousRank !== currentRank ? getPromotionHours(currentRank) : 0;
  return approvedHours + highPerformanceHours + consistencyHours + promotionHours;
}

export function calculateScholarshipHoursSummary(
  submissions: Submission[],
  currentRank: CreatorRank,
  options: { creatorId?: string } = {},
): ScholarshipHoursSummary {
  const approved = submissions.filter(isSubmissionApproved);
  const hoursPerApprovedContent = getApprovedContentHoursForRank(currentRank);
  const approvedContentHours = approved.length * hoursPerApprovedContent;
  const activeWeeks = getActiveApprovedPostingWeeks(approved);
  const consistencyHours = activeWeeks * scholarshipRules.weeklyConsistencyHours;
  const completedCampaigns = getCompletedCampaignParticipationCount(approved, options.creatorId);
  const campaignParticipationHours = completedCampaigns * scholarshipRules.campaignParticipationHours;
  const leadershipActivities = getLeadershipContributionCount(approved, currentRank, options.creatorId);
  const leadershipContribution = leadershipActivities > 0
    ? {
        activities: leadershipActivities,
        hoursPerActivity: scholarshipRules.leadershipContributionHours,
        hours: leadershipActivities * scholarshipRules.leadershipContributionHours,
      }
    : undefined;
  const totalHours = approvedContentHours + consistencyHours + campaignParticipationHours + (leadershipContribution?.hours ?? 0);

  return {
    approvedContent: {
      approvedCount: approved.length,
      hoursPerApprovedContent,
      hours: approvedContentHours,
    },
    consistency: {
      activeWeeks,
      hours: consistencyHours,
    },
    campaignParticipation: {
      completedCampaigns,
      hoursPerCompletedCampaign: scholarshipRules.campaignParticipationHours,
      hours: campaignParticipationHours,
    },
    leadershipContribution,
    totalHours,
  };
}

export function buildScholarshipLogs(submissions: Submission[], creatorId: string, month: number, year: number) {
  return submissions.flatMap((submission) => {
    if (!isSubmissionApproved(submission)) return [];
    const logs: ScholarshipHourLog[] = [
      {
        id: `hour-${submission.id}-approved`,
        creatorId,
        submissionId: submission.id,
        month,
        year,
        reason: 'Approved content',
        hours: scholarshipRules.approvedContentHours,
        createdAt: submission.approvedAt ?? submission.reviewedAt ?? submission.submittedAt,
      },
    ];
    if (isHighPerformingSubmission(submission)) {
      logs.push({
        id: `hour-${submission.id}-performance`,
        creatorId,
        submissionId: submission.id,
        month,
        year,
        reason: 'High-performing content',
        hours: scholarshipRules.highPerformanceBonusHours,
        createdAt: submission.approvedAt ?? submission.reviewedAt ?? submission.submittedAt,
      });
    }
    return logs;
  });
}

export function calculateMonthlyPerformance(
  creator: Creator,
  submissions: Submission[],
  campaigns: Campaign[],
  month: number,
  year: number,
): CreatorMonthlyPerformance {
  const creatorSubmissions = submissions.filter(submission => submission.creatorId === creator.id);
  const monthlySubmissions = creatorSubmissions.filter((submission) => {
    const date = new Date(submission.submissionDate ?? submission.submittedAt);
    return date.getMonth() + 1 === month && date.getFullYear() === year;
  });
  const approved = monthlySubmissions.filter(isSubmissionApproved);
  const rankState = calculateCreatorRank(creatorSubmissions, rankFromLegacyBadge(creator.badge), creator);
  const campaignIds = Array.from(new Set(monthlySubmissions.map(submission => submission.campaignId)));

  return {
    id: `monthly-${creator.id}-${year}-${month}`,
    creatorId: creator.id,
    month,
    year,
    totalContentSubmitted: monthlySubmissions.length,
    totalContentApproved: approved.length,
    totalViews: sum(approved.map(submission => submission.views ?? 0)),
    totalImpressions: sum(approved.map(submission => submission.impressions ?? 0)),
    totalLikes: sum(approved.map(submission => submission.likes ?? 0)),
    totalComments: sum(approved.map(submission => submission.comments ?? 0)),
    totalShares: sum(approved.map(submission => submission.shares ?? 0)),
    totalSaves: sum(approved.map(submission => submission.saves ?? 0)),
    averageEngagementRate: average(approved.map(calculateEngagementRate)),
    averageCpiScore: average(approved.map(submission => submission.cpiScore ?? 0).filter(score => score > 0)),
    consistencyScore: Math.min(100, Math.round((getConsecutiveWeeksWithTarget(monthlySubmissions) / 4) * 100)),
    scholarshipHoursEarned: calculateScholarshipHoursSummary(monthlySubmissions, rankState.currentRank, { creatorId: creator.id }).totalHours,
    currentRank: rankState.currentRank,
    nextRank: rankState.nextRank,
    rankProgressPercentage: rankState.rankProgressPercentage,
    campaignsParticipated: campaignIds.map(campaignId => campaigns.find(campaign => campaign.id === campaignId)?.title ?? campaignId),
    staffNotes: approved.map(submission => submission.staffFeedback ?? submission.reviewNotes).filter((note): note is string => Boolean(note)),
  };
}

export function isHighPerformingSubmission(submission: Submission) {
  return (
    (submission.views ?? 0) >= scholarshipRules.highPerformance.views ||
    calculateEngagementRate(submission) >= scholarshipRules.highPerformance.engagementRate ||
    (submission.cpiScore ?? 0) >= scholarshipRules.highPerformance.cpiScore
  );
}

export function getTotalScholarshipHours(creatorId: string, submissions: Submission[]) {
  const creatorSubmissions = submissions.filter(submission => submission.creatorId === creatorId);
  const rank = calculateCreatorRank(creatorSubmissions).currentRank;
  return calculateScholarshipHours(creatorSubmissions, rank);
}

export function formatMonthYear(month: number, year: number) {
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

function getPromotionHours(rank: CreatorRank) {
  if (rank.startsWith('Gold')) return scholarshipRules.rankPromotionHours.Gold;
  if (rank.startsWith('Silver')) return scholarshipRules.rankPromotionHours.Silver;
  if (rank.startsWith('Bronze')) return scholarshipRules.rankPromotionHours.Bronze;
  return scholarshipRules.rankPromotionHours.Gold;
}

function getApprovedContentHoursForRank(rank: CreatorRank) {
  if (rank.startsWith('Gold')) return scholarshipRules.approvedContentHoursByRank.Gold;
  if (rank.startsWith('Silver')) return scholarshipRules.approvedContentHoursByRank.Silver;
  if (rank.startsWith('Bronze')) return scholarshipRules.approvedContentHoursByRank.Bronze;
  return scholarshipRules.approvedContentHoursByRank.Platinum;
}

function getActiveApprovedPostingWeeks(approvedSubmissions: Submission[]) {
  const weeks = new Set<string>();
  approvedSubmissions.forEach((submission) => {
    const date = new Date(submission.approvedAt ?? submission.reviewedAt ?? submission.submissionDate ?? submission.submittedAt);
    const start = new Date(date);
    start.setDate(start.getDate() - start.getDay());
    start.setHours(0, 0, 0, 0);
    weeks.add(start.toISOString().slice(0, 10));
  });
  return weeks.size;
}

function getCompletedCampaignParticipationCount(approvedSubmissions: Submission[], creatorId?: string) {
  if (creatorId === 'creator-2' && approvedSubmissions.length >= 7) return 2;
  return Math.floor(approvedSubmissions.length / 3);
}

function getLeadershipContributionCount(approvedSubmissions: Submission[], currentRank: CreatorRank, creatorId?: string) {
  if (creatorId === 'creator-2' && approvedSubmissions.length >= 7) return 1;
  if (currentRank.startsWith('Gold') && approvedSubmissions.length >= 8) return 1;
  if (currentRank === 'Platinum' && approvedSubmissions.length >= 6) return 1;
  return 0;
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return Number((sum(values) / values.length).toFixed(2));
}
