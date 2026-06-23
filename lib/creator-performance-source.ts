import type { Campaign, Creator, Submission } from './mock-data';
import {
  calculateMonthlyPerformance,
  getConsecutiveWeeksWithTarget,
  type CreatorMonthlyPerformance,
} from './creator-performance';

const demoCreatorId = 'creator-1';
const demoSubmitted = 8;
const demoApproved = 7;

export function getCreatorMonthlyPerformance(
  creator: Creator,
  submissions: Submission[],
  campaigns: Campaign[],
  month: number,
  year: number,
): CreatorMonthlyPerformance {
  const monthlySubmissions = getCreatorMonthlySubmissions(creator.id, submissions, month, year);
  const useDemo = shouldUseDemoPerformance(creator, monthlySubmissions);
  const sourceSubmissions = useDemo ? getDemoCreatorMonthlySubmissions(creator.id, month, year) : submissions;
  const performance = calculateMonthlyPerformance(creator, sourceSubmissions, campaigns, month, year);

  if (!useDemo) return performance;

  return {
    ...performance,
    totalContentSubmitted: demoSubmitted,
    totalContentApproved: demoApproved,
    totalViews: 27600,
    totalImpressions: 36400,
    averageEngagementRate: 7.13,
    consistencyScore: 100,
    scholarshipHoursEarned: 33,
    currentRank: 'Gold I',
    nextRank: 'Gold II',
    rankProgressPercentage: 68,
  };
}

export function getCreatorMonthlySubmissionsForDisplay(
  creatorId: string,
  submissions: Submission[],
  month: number,
  year: number,
) {
  const monthlySubmissions = getCreatorMonthlySubmissions(creatorId, submissions, month, year);
  if (creatorId === demoCreatorId && (monthlySubmissions.length < demoSubmitted || monthlySubmissions.filter(item => item.status === 'approved').length < demoApproved)) {
    return getDemoCreatorMonthlySubmissions(creatorId, month, year);
  }
  return monthlySubmissions;
}

export function getCreatorWeeklyConsistencySummary(
  creator: Creator,
  submissions: Submission[],
  month: number,
  year: number,
  required = 4,
) {
  const monthlySubmissions = getCreatorMonthlySubmissions(creator.id, submissions, month, year);
  if (shouldUseDemoPerformance(creator, monthlySubmissions)) {
    return { completed: 4, required };
  }
  return {
    completed: Math.min(required, getConsecutiveWeeksWithTarget(monthlySubmissions)),
    required,
  };
}

function shouldUseDemoPerformance(creator: Creator, monthlySubmissions: Submission[]) {
  if (creator.id !== demoCreatorId) return false;
  const approved = monthlySubmissions.filter(submission => submission.status === 'approved').length;
  return monthlySubmissions.length < demoSubmitted || approved < demoApproved;
}

function getCreatorMonthlySubmissions(creatorId: string, submissions: Submission[], month: number, year: number) {
  return submissions.filter((submission) => {
    const date = new Date(submission.submissionDate ?? submission.submittedAt);
    return submission.creatorId === creatorId && date.getMonth() + 1 === month && date.getFullYear() === year;
  });
}

function getDemoCreatorMonthlySubmissions(creatorId: string, month: number, year: number): Submission[] {
  const date = (day: number) => new Date(year, month - 1, day, 12).toISOString().slice(0, 10);
  const approvedAt = (day: number) => new Date(year, month - 1, day, 16).toISOString();
  const base = {
    creatorId,
    engagementId: 'engagement-2',
    contentType: 'Campaign content',
  };

  return [
    {
      ...base,
      id: `demo-${creatorId}-${year}-${month}-1`,
      campaignId: 'campaign-2',
      title: 'AU Creator Campus welcome reel',
      link: 'https://example.com/creator-campus-welcome',
      contentUrl: 'https://example.com/creator-campus-welcome',
      notes: 'Published intro reel for the AU Creator Campus Program 2026.',
      platform: 'Instagram',
      submissionDate: date(2),
      submittedAt: date(2),
      reviewedAt: approvedAt(3),
      approvedAt: approvedAt(3),
      status: 'approved',
      views: 4000,
      impressions: 5200,
      likes: 286,
      comments: 28,
      shares: 34,
      saves: 21,
      engagementRate: 7.1,
      cpiScore: 84,
      staffFeedback: 'Clear campaign introduction and strong creator presence.',
    },
    {
      ...base,
      id: `demo-${creatorId}-${year}-${month}-2`,
      campaignId: 'campaign-2',
      title: 'Campus outfit transition',
      link: 'https://example.com/creator-campus-transition',
      contentUrl: 'https://example.com/creator-campus-transition',
      notes: 'Short transition edit with campaign hashtag.',
      platform: 'TikTok',
      submissionDate: date(4),
      submittedAt: date(4),
      reviewedAt: approvedAt(5),
      approvedAt: approvedAt(5),
      status: 'approved',
      views: 3800,
      impressions: 5000,
      likes: 272,
      comments: 31,
      shares: 39,
      saves: 18,
      engagementRate: 7.2,
      cpiScore: 82,
      staffFeedback: 'Good pacing and clean call to action.',
    },
    {
      ...base,
      id: `demo-${creatorId}-${year}-${month}-3`,
      campaignId: 'campaign-3',
      title: 'Study day carousel',
      link: 'https://example.com/creator-study-carousel',
      contentUrl: 'https://example.com/creator-study-carousel',
      notes: 'Carousel showing creator campus study routine.',
      platform: 'Instagram',
      submissionDate: date(9),
      submittedAt: date(9),
      reviewedAt: approvedAt(10),
      approvedAt: approvedAt(10),
      status: 'approved',
      views: 3600,
      impressions: 4700,
      likes: 251,
      comments: 24,
      shares: 33,
      saves: 23,
      engagementRate: 7.05,
      cpiScore: 79,
      staffFeedback: 'Strong storytelling and readable caption.',
    },
    {
      ...base,
      id: `demo-${creatorId}-${year}-${month}-4`,
      campaignId: 'campaign-4',
      title: 'Sustainable campus choices',
      link: 'https://example.com/creator-sustainable-campus',
      contentUrl: 'https://example.com/creator-sustainable-campus',
      notes: 'Facebook video for sustainability message.',
      platform: 'Facebook',
      submissionDate: date(11),
      submittedAt: date(11),
      reviewedAt: approvedAt(12),
      approvedAt: approvedAt(12),
      status: 'approved',
      views: 4200,
      impressions: 5500,
      likes: 302,
      comments: 36,
      shares: 42,
      saves: 22,
      engagementRate: 7.3,
      cpiScore: 85,
      staffFeedback: 'Excellent alignment with the sustainability brief.',
    },
    {
      ...base,
      id: `demo-${creatorId}-${year}-${month}-5`,
      campaignId: 'campaign-2',
      title: 'AU creator campus day recap',
      link: 'https://example.com/creator-day-recap',
      contentUrl: 'https://example.com/creator-day-recap',
      notes: 'TikTok recap of creator campus participation.',
      platform: 'TikTok',
      submissionDate: date(16),
      submittedAt: date(16),
      reviewedAt: approvedAt(17),
      approvedAt: approvedAt(17),
      status: 'approved',
      views: 3900,
      impressions: 5100,
      likes: 271,
      comments: 25,
      shares: 41,
      saves: 20,
      engagementRate: 7,
      cpiScore: 80,
      staffFeedback: 'Authentic campus moment with strong retention.',
    },
    {
      ...base,
      id: `demo-${creatorId}-${year}-${month}-6`,
      campaignId: 'campaign-3',
      title: 'Wellness routine reel',
      link: 'https://example.com/creator-wellness-routine',
      contentUrl: 'https://example.com/creator-wellness-routine',
      notes: 'Instagram reel following wellness brief direction.',
      platform: 'Instagram',
      submissionDate: date(18),
      submittedAt: date(18),
      reviewedAt: approvedAt(19),
      approvedAt: approvedAt(19),
      status: 'approved',
      views: 4100,
      impressions: 5400,
      likes: 290,
      comments: 29,
      shares: 43,
      saves: 24,
      engagementRate: 7.15,
      cpiScore: 83,
      staffFeedback: 'Polished edit and accurate brief execution.',
    },
    {
      ...base,
      id: `demo-${creatorId}-${year}-${month}-7`,
      campaignId: 'campaign-4',
      title: 'Creator campus reflection post',
      link: 'https://example.com/creator-campus-reflection',
      contentUrl: 'https://example.com/creator-campus-reflection',
      notes: 'Instagram post highlighting creator campus learning.',
      platform: 'Instagram',
      submissionDate: date(23),
      submittedAt: date(23),
      reviewedAt: approvedAt(24),
      approvedAt: approvedAt(24),
      status: 'approved',
      views: 4000,
      impressions: 5500,
      likes: 278,
      comments: 32,
      shares: 38,
      saves: 43,
      engagementRate: 7.11,
      cpiScore: 81,
      staffFeedback: 'Strong creator voice and clear program connection.',
    },
    {
      ...base,
      id: `demo-${creatorId}-${year}-${month}-8`,
      campaignId: 'campaign-4',
      title: 'Final creator campus story set',
      link: 'https://example.com/creator-story-set',
      contentUrl: 'https://example.com/creator-story-set',
      notes: 'Story set submitted for final review.',
      platform: 'Instagram',
      submissionDate: date(25),
      submittedAt: date(25),
      status: 'pending_review',
    },
  ];
}
