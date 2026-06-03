export interface Creator {
  id: string;
  name: string;
  bio: string;
  niche: string;
  platforms: {
    name: 'TikTok' | 'Instagram' | 'YouTube' | 'Twitter' | 'X' | 'Twitch' | 'Facebook' | 'LinkedIn';
    followers: number;
    handle: string;
    username?: string;
    url?: string;
  }[];
  engagementRate: number;
  verified: boolean;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  avatar?: string;
  portfolioItems: string[];
  trainingCompleted: string[];
  engagementHistory: {
    campaignId: string;
    date: string;
    type: string;
  }[];
  badge?: 'Bronze1' | 'Bronze2' | 'Bronze3' | 'Silver1' | 'Silver2' | 'Gold' | 'TopPerformer';
  reputationScore: number;
  completedEngagements: number;
  contentQualityScore: number;
  approvalRate: number;
  evaluations: CreatorEvaluation[];
  joinedDate: string;
}

export interface Campaign {
  id: string;
  title: string;
  description: string;
  brand: string;
  budget: number;
  startDate: string;
  endDate: string;
  targetNiches: string[];
  targetPlatforms: string[];
  minFollowers: number;
  contentType: string;
  goals: string[];
  requirements: string[];
  hashtags?: string[];
  mentions?: string[];
  cta?: string;
  posterImages?: string[];
  managerMessage?: string;
  status: 'draft' | 'open' | 'in_progress' | 'completed';
  createdAt: string;
}

export interface Engagement {
  id: string;
  creatorId: string;
  campaignId: string;
  matchScore: number;
  status: 'matched' | 'in_discussion' | 'accepted' | 'active' | 'completed' | 'declined';
  createdAt: string;
  startDate?: string;
  endDate?: string;
}

export interface Submission {
  id: string;
  engagementId?: string;
  creatorId: string;
  campaignId: string;
  title: string;
  link: string;
  notes: string;
  platform?: 'Instagram' | 'TikTok' | 'Facebook';
  contentUrl?: string;
  contentType?: string;
  submissionDate?: string;
  status: 'submitted' | 'pending_review' | 'approved' | 'changes_requested' | 'needs_changes' | 'rejected';
  submittedAt: string;
  views?: number;
  impressions?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  saves?: number;
  engagementRate?: number;
  cpiScore?: number;
  staffFeedback?: string;
  approvedAt?: string;
  rejectedReason?: string;
  reviewedAt?: string;
  reviewNotes?: string;
}

export interface TrainingModule {
  id: string;
  title: string;
  description: string;
  category: string;
  duration: number; // in minutes
  completedBy: string[]; // creator IDs
}

export interface CreatorEvaluation {
  id: string;
  campaignId: string;
  contentQuality: number; // 1-5
  communication: number; // 1-5
  deadlineCompletion: number; // 1-5
  professionalism: number; // 1-5
  campaignFit: number; // 1-5
  notes: string;
  evaluatedAt: string;
  evaluatedBy: string;
}

export const creators: Creator[] = [
  {
    id: 'creator-1',
    name: 'KeKe',
    avatar: '/creators/keke.png',
    bio: 'Campus tech and student life creator sharing study tools, productivity tips, and AU event recaps.',
    niche: 'Technology',
    platforms: [
      { name: 'TikTok', followers: 28400, handle: '@keke.au', username: 'keke.au', url: 'https://tiktok.com/@keke.au' },
      { name: 'Instagram', followers: 12600, handle: '@keke.creates', username: 'keke.creates', url: 'https://instagram.com/keke.creates' },
    ],
    engagementRate: 6.4,
    verified: true,
    approvalStatus: 'approved',
    portfolioItems: ['Study Tools Reels', 'Campus Event Recaps', 'Productivity Shorts'],
    trainingCompleted: ['Content Creation 101', 'Brand Partnership Guidelines'],
    engagementHistory: [
      { campaignId: 'campaign-1', date: '2024-05-10', type: 'completed' },
      { campaignId: 'campaign-2', date: '2024-06-15', type: 'in_progress' },
    ],
    badge: 'Silver1',
    reputationScore: 82,
    completedEngagements: 2,
    contentQualityScore: 4.4,
    approvalRate: 92,
    joinedDate: '2023-08-15',
    evaluations: [
      {
        id: 'eval-1',
        campaignId: 'campaign-1',
        contentQuality: 4,
        communication: 5,
        deadlineCompletion: 4,
        professionalism: 4,
        campaignFit: 4,
        notes: 'Clear campus technology content with strong student relevance.',
        evaluatedAt: '2024-06-10',
        evaluatedBy: 'admin-1',
      },
    ],
  },
  {
    id: 'creator-2',
    name: 'Yoonie',
    avatar: '/creators/yoonie.png',
    bio: 'Gold I campus creator focused on student life, fashion, scholarship stories, and university culture.',
    niche: 'Campus Lifestyle',
    platforms: [
      { name: 'Instagram', followers: 31800, handle: '@yoonie.au', username: 'yoonie.au', url: 'https://instagram.com/yoonie.au' },
      { name: 'TikTok', followers: 24600, handle: '@yoonie.campus', username: 'yoonie.campus', url: 'https://tiktok.com/@yoonie.campus' },
      { name: 'YouTube', followers: 8400, handle: 'YoonieCampus', username: 'YoonieCampus', url: 'https://youtube.com/@YoonieCampus' },
    ],
    engagementRate: 7.13,
    verified: true,
    approvalStatus: 'approved',
    portfolioItems: ['Campus Life Reels', 'Scholarship Story Videos', 'Student Style Features'],
    trainingCompleted: ['Content Creation 101', 'Authentic Brand Partnerships'],
    engagementHistory: [
      { campaignId: 'campaign-1', date: '2024-05-15', type: 'completed' },
    ],
    badge: 'Gold',
    reputationScore: 92,
    completedEngagements: 4,
    contentQualityScore: 4.7,
    approvalRate: 100,
    joinedDate: '2023-02-10',
    evaluations: [
      {
        id: 'eval-2',
        campaignId: 'campaign-1',
        contentQuality: 5,
        communication: 5,
        deadlineCompletion: 5,
        professionalism: 5,
        campaignFit: 5,
        notes: 'Outstanding work. Perfect alignment with campaign goals. Highly recommend for future campaigns.',
        evaluatedAt: '2024-06-15',
        evaluatedBy: 'admin-1',
      },
    ],
  },
  {
    id: 'creator-3',
    name: 'Alurra',
    avatar: '/creators/alurra.png',
    bio: 'Student wellness and beauty creator producing calm, polished content for campus lifestyle campaigns.',
    niche: 'Beauty',
    platforms: [
      { name: 'Instagram', followers: 22100, handle: '@alurra.au', username: 'alurra.au', url: 'https://instagram.com/alurra.au' },
      { name: 'TikTok', followers: 18700, handle: '@alurra.creates', username: 'alurra.creates', url: 'https://tiktok.com/@alurra.creates' },
    ],
    engagementRate: 5.9,
    verified: true,
    approvalStatus: 'approved',
    portfolioItems: ['Wellness Routine Reels', 'Beauty Study Breaks', 'Campus Self-Care Stories'],
    trainingCompleted: ['Content Creation 101', 'Brand Partnership Guidelines'],
    engagementHistory: [
      { campaignId: 'campaign-3', date: '2024-06-20', type: 'active' },
    ],
    badge: 'Silver1',
    reputationScore: 76,
    completedEngagements: 1,
    contentQualityScore: 4.1,
    approvalRate: 88,
    joinedDate: '2024-05-20',
    evaluations: [],
  },
  {
    id: 'creator-4',
    name: 'Archived Creator 1',
    bio: 'Beauty and skincare expert | Licensed esthetician sharing skincare science',
    niche: 'Beauty',
    platforms: [
      { name: 'YouTube', followers: 312000, handle: 'EmmaBeautySci' },
      { name: 'Instagram', followers: 267000, handle: '@emmabeauty_' },
      { name: 'TikTok', followers: 134000, handle: '@emmabeauty_tiktok' },
    ],
    engagementRate: 7.1,
    verified: true,
    approvalStatus: 'rejected',
    portfolioItems: ['Skincare Routines', 'Product Reviews', 'Beauty Tutorials'],
    trainingCompleted: ['Content Creation 101', 'Brand Partnership Guidelines', 'Authentic Brand Partnerships'],
    engagementHistory: [
      { campaignId: 'campaign-2', date: '2024-06-01', type: 'in_progress' },
      { campaignId: 'campaign-3', date: '2024-06-20', type: 'active' },
    ],
    badge: 'TopPerformer',
    reputationScore: 95,
    completedEngagements: 5,
    contentQualityScore: 4.8,
    approvalRate: 98,
    joinedDate: '2022-11-05',
    evaluations: [
      {
        id: 'eval-3',
        campaignId: 'campaign-2',
        contentQuality: 5,
        communication: 4,
        deadlineCompletion: 5,
        professionalism: 5,
        campaignFit: 5,
        notes: 'Exceptional creator. Very reliable and professional. Delivered outstanding content.',
        evaluatedAt: '2024-07-20',
        evaluatedBy: 'admin-1',
      },
    ],
  },
  {
    id: 'creator-5',
    name: 'Archived Creator 2',
    bio: 'Food and cooking content creator | Chef and culinary educator',
    niche: 'Food',
    platforms: [
      { name: 'YouTube', followers: 425000, handle: 'DavidCooks' },
      { name: 'TikTok', followers: 287000, handle: '@davidcooks_tiktok' },
      { name: 'Instagram', followers: 198000, handle: '@davidcooks_' },
    ],
    engagementRate: 8.3,
    verified: true,
    approvalStatus: 'rejected',
    portfolioItems: ['Cooking Tutorials', 'Recipe Videos', 'Food Reviews'],
    trainingCompleted: ['Content Creation 101', 'Brand Partnership Guidelines', 'Authentic Brand Partnerships', 'Community Safety'],
    engagementHistory: [
      { campaignId: 'campaign-1', date: '2024-05-20', type: 'completed' },
      { campaignId: 'campaign-3', date: '2024-06-10', type: 'in_progress' },
    ],
    badge: 'Gold',
    reputationScore: 89,
    completedEngagements: 6,
    contentQualityScore: 4.6,
    approvalRate: 96,
    joinedDate: '2023-03-12',
    evaluations: [
      {
        id: 'eval-4',
        campaignId: 'campaign-1',
        contentQuality: 5,
        communication: 4,
        deadlineCompletion: 5,
        professionalism: 4,
        campaignFit: 4,
        notes: 'Excellent collaboration. Very responsive and professional. Content exceeded expectations.',
        evaluatedAt: '2024-06-20',
        evaluatedBy: 'admin-1',
      },
    ],
  },
];

export const campaigns: Campaign[] = [
  {
    id: 'campaign-1',
    title: 'Tech Innovation Showcase',
    description: 'Structured creator engagement request for technical content, tutorials, and platform education.',
    brand: 'TechCorp',
    budget: 25000,
    startDate: '2024-05-01',
    endDate: '2024-06-30',
    targetNiches: ['Technology', 'Education'],
    targetPlatforms: ['YouTube', 'TikTok'],
    minFollowers: 50000,
    contentType: 'Tutorial & Review Videos',
    goals: ['Clarify campaign objective', 'Assign creators with technical content capability'],
    requirements: ['Minimum 4.5% engagement rate', 'Professional content readiness'],
    hashtags: ['#TechInnovation', '#CreatorCampus'],
    mentions: ['@techcorp'],
    cta: 'Invite students to try the featured workflow and comment with questions.',
    managerMessage: 'We would like a clear, student-friendly demo that makes the product easy to understand.',
    status: 'completed',
    createdAt: '2024-04-15',
  },
  {
    id: 'campaign-2',
    title: 'Summer Fashion Collection Launch',
    description: 'Launch new summer collection with fashion and lifestyle creators',
    brand: 'StyleBrand Co',
    budget: 35000,
    startDate: '2024-06-01',
    endDate: '2024-08-31',
    targetNiches: ['Fashion', 'Lifestyle'],
    targetPlatforms: ['Instagram', 'TikTok', 'YouTube'],
    minFollowers: 80000,
    contentType: 'Fashion Content & OOTD Posts',
    goals: ['Define launch content scope', 'Assign lifestyle and fashion creators'],
    requirements: ['Strong visual portfolio', 'Minimum 5% engagement rate'],
    hashtags: ['#SummerStyle', '#RollerKluster'],
    mentions: ['@stylebrandco'],
    cta: 'Ask viewers to save the look and visit the campaign page.',
    managerMessage: 'Your styling voice fits this launch. Please keep the content bright, wearable, and easy for students to copy.',
    status: 'in_progress',
    createdAt: '2024-05-10',
  },
  {
    id: 'campaign-3',
    title: 'Wellness & Health Initiative',
    description: 'Partner with health and wellness creators to promote healthy living',
    brand: 'WellnessPlus',
    budget: 30000,
    startDate: '2024-06-15',
    endDate: '2024-09-15',
    targetNiches: ['Fitness', 'Beauty', 'Food'],
    targetPlatforms: ['Instagram', 'YouTube', 'TikTok'],
    minFollowers: 100000,
    contentType: 'Wellness Tips & Product Integration',
    goals: ['Define wellness content guidelines', 'Assign creators with category credibility'],
    requirements: ['Authentic educational voice', 'Minimum 6% engagement rate'],
    hashtags: ['#WellnessPlus', '#CampusWellness'],
    mentions: ['@wellnessplus'],
    cta: 'Encourage viewers to build one healthy habit this week.',
    managerMessage: 'We are looking for practical wellness content that feels useful, not scripted.',
    status: 'in_progress',
    createdAt: '2024-05-25',
  },
  {
    id: 'campaign-4',
    title: 'Sustainability Awareness Campaign',
    description: 'Educate audiences about sustainable practices and eco-friendly choices',
    brand: 'EcoFirst',
    budget: 20000,
    startDate: '2024-07-01',
    endDate: '2024-09-30',
    targetNiches: ['Lifestyle', 'Education', 'Fashion'],
    targetPlatforms: ['TikTok', 'YouTube', 'Instagram'],
    minFollowers: 60000,
    contentType: 'Educational & Awareness Content',
    goals: ['Define sustainability message guidelines', 'Assign creators with relevant category fit'],
    requirements: ['Visible sustainability portfolio', 'Minimum 4% engagement rate'],
    hashtags: ['#EcoFirst', '#SustainableCampus'],
    mentions: ['@ecofirst'],
    cta: 'Ask viewers to share one sustainable habit they already use.',
    managerMessage: 'This invitation is for creators who can make sustainability feel practical and positive.',
    status: 'open',
    createdAt: '2024-06-20',
  },
];

export const engagements: Engagement[] = [
  {
    id: 'engagement-1',
    creatorId: 'creator-1',
    campaignId: 'campaign-1',
    matchScore: 92,
    status: 'completed',
    createdAt: '2024-05-10',
    startDate: '2024-05-10',
    endDate: '2024-06-10',
  },
  {
    id: 'engagement-2',
    creatorId: 'creator-2',
    campaignId: 'campaign-1',
    matchScore: 88,
    status: 'completed',
    createdAt: '2024-05-15',
    startDate: '2024-05-15',
    endDate: '2024-06-15',
  },
  {
    id: 'engagement-3',
    creatorId: 'creator-4',
    campaignId: 'campaign-2',
    matchScore: 87,
    status: 'active',
    createdAt: '2024-06-01',
    startDate: '2024-06-05',
    endDate: '2024-07-15',
  },
  {
    id: 'engagement-4',
    creatorId: 'creator-5',
    campaignId: 'campaign-1',
    matchScore: 95,
    status: 'completed',
    createdAt: '2024-05-20',
    startDate: '2024-05-20',
    endDate: '2024-06-20',
  },
  {
    id: 'engagement-5',
    creatorId: 'creator-5',
    campaignId: 'campaign-3',
    matchScore: 91,
    status: 'in_discussion',
    createdAt: '2024-06-20',
  },
  {
    id: 'engagement-6',
    creatorId: 'creator-1',
    campaignId: 'campaign-2',
    matchScore: 75,
    status: 'matched',
    createdAt: '2024-06-15',
  },
  {
    id: 'engagement-7',
    creatorId: 'creator-2',
    campaignId: 'campaign-3',
    matchScore: 93,
    status: 'matched',
    createdAt: '2026-05-22',
  },
  {
    id: 'engagement-8',
    creatorId: 'creator-2',
    campaignId: 'campaign-4',
    matchScore: 89,
    status: 'in_discussion',
    createdAt: '2026-05-24',
  },
];

export const submissions: Submission[] = [
  {
    id: 'submission-1',
    engagementId: 'engagement-3',
    creatorId: 'creator-4',
    campaignId: 'campaign-2',
    title: 'Skincare summer collection reel draft',
    link: 'https://example.com/emma-summer-reel',
    notes: 'First draft with product integration and disclosure included.',
    platform: 'Instagram',
    contentUrl: 'https://example.com/emma-summer-reel',
    contentType: 'Reel',
    submissionDate: '2026-05-06',
    status: 'pending_review',
    submittedAt: '2026-05-06',
  },
  {
    id: 'submission-2',
    engagementId: 'engagement-2',
    creatorId: 'creator-2',
    campaignId: 'campaign-2',
    title: 'Summer styling campus reel',
    link: 'https://example.com/yoonie-summer-styling',
    notes: 'Final post for the summer collection brief.',
    platform: 'Instagram',
    contentUrl: 'https://example.com/yoonie-summer-styling',
    contentType: 'Reel',
    submissionDate: '2026-05-04',
    status: 'approved',
    submittedAt: '2026-05-04',
    reviewedAt: '2026-05-05',
    approvedAt: '2026-05-05',
    views: 18200,
    impressions: 24600,
    likes: 1320,
    comments: 86,
    shares: 144,
    saves: 210,
    engagementRate: 7.15,
    cpiScore: 84,
    staffFeedback: 'Strong brief alignment and clear product placement.',
  },
  {
    id: 'submission-3',
    engagementId: 'engagement-2',
    creatorId: 'creator-2',
    campaignId: 'campaign-2',
    title: 'TikTok outfit transition',
    link: 'https://example.com/yoonie-tiktok-transition',
    notes: 'Short transition edit with campaign hashtag.',
    platform: 'TikTok',
    contentUrl: 'https://example.com/yoonie-tiktok-transition',
    contentType: 'Short video',
    submissionDate: '2026-05-08',
    status: 'approved',
    submittedAt: '2026-05-08',
    reviewedAt: '2026-05-09',
    approvedAt: '2026-05-09',
    views: 9400,
    impressions: 11800,
    likes: 640,
    comments: 34,
    shares: 72,
    saves: 92,
    engagementRate: 7.1,
    cpiScore: 78,
    staffFeedback: 'Good pacing and clean CTA.',
  },
  {
    id: 'submission-4',
    engagementId: 'engagement-2',
    creatorId: 'creator-2',
    campaignId: 'campaign-3',
    title: 'Wellness routine carousel',
    link: 'https://example.com/yoonie-wellness-carousel',
    notes: 'Carousel post with routine steps.',
    platform: 'Instagram',
    contentUrl: 'https://example.com/yoonie-wellness-carousel',
    contentType: 'Carousel',
    submissionDate: '2026-05-15',
    status: 'needs_changes',
    submittedAt: '2026-05-15',
    reviewedAt: '2026-05-16',
    staffFeedback: 'Please add the disclosure line and simplify slide 3.',
  },
  {
    id: 'submission-5',
    engagementId: 'engagement-1',
    creatorId: 'creator-1',
    campaignId: 'campaign-1',
    title: 'AI workflow tutorial clip',
    link: 'https://example.com/alex-ai-workflow',
    notes: 'Tutorial clip published with campaign CTA.',
    platform: 'TikTok',
    contentUrl: 'https://example.com/alex-ai-workflow',
    contentType: 'Short video',
    submissionDate: '2026-05-11',
    status: 'approved',
    submittedAt: '2026-05-11',
    reviewedAt: '2026-05-12',
    approvedAt: '2026-05-12',
    views: 12600,
    impressions: 15100,
    likes: 830,
    comments: 51,
    shares: 98,
    saves: 120,
    engagementRate: 7.28,
    cpiScore: 82,
  },
  {
    id: 'submission-6',
    engagementId: 'engagement-4',
    creatorId: 'creator-5',
    campaignId: 'campaign-3',
    title: 'Healthy prep recipe post',
    link: 'https://example.com/david-healthy-prep',
    notes: 'Recipe content ready for review.',
    platform: 'Facebook',
    contentUrl: 'https://example.com/david-healthy-prep',
    contentType: 'Video',
    submissionDate: '2026-05-18',
    status: 'pending_review',
    submittedAt: '2026-05-18',
  },
];

export const trainingModules: TrainingModule[] = [
  {
    id: 'training-1',
    title: 'Content Creation 101',
    description: 'Fundamentals of creating engaging content across all platforms',
    category: 'Onboarding',
    duration: 45,
    completedBy: ['creator-1', 'creator-2', 'creator-3', 'creator-4', 'creator-5'],
  },
  {
    id: 'training-2',
    title: 'Brand Partnership Guidelines',
    description: 'Best practices for collaborating with brands authentically',
    category: 'Partnerships',
    duration: 30,
    completedBy: ['creator-1', 'creator-2', 'creator-4', 'creator-5'],
  },
  {
    id: 'training-3',
    title: 'Authentic Brand Partnerships',
    description: 'How to maintain authenticity while partnering with brands',
    category: 'Partnerships',
    duration: 35,
    completedBy: ['creator-2', 'creator-4', 'creator-5'],
  },
  {
    id: 'training-4',
    title: 'Community Safety & Platform Guidelines',
    description: 'Understanding platform rules and maintaining safe communities',
    category: 'Platform Guidelines',
    duration: 40,
    completedBy: ['creator-5'],
  },
  {
    id: 'training-5',
    title: 'Platform Standards & Readiness Review',
    description: 'Quality expectations, content standards, and readiness checks before brand engagement',
    category: 'Growth',
    duration: 50,
    completedBy: [],
  },
];

export function getCreatorById(id: string): Creator | undefined {
  return creators.find(c => c.id === id);
}

export function getCampaignById(id: string): Campaign | undefined {
  return campaigns.find(c => c.id === id);
}

export function getEngagementsByCampaign(campaignId: string): Engagement[] {
  return engagements.filter(e => e.campaignId === campaignId);
}

export function getEngagementsByCreator(creatorId: string): Engagement[] {
  return engagements.filter(e => e.creatorId === creatorId);
}

export function getPendingApprovals(): Creator[] {
  return creators.filter(c => c.approvalStatus === 'pending');
}

export function getActiveCampaigns(): Campaign[] {
  return campaigns.filter(c => c.status !== 'completed');
}

export function getCampaignsNeedingMatches(): Campaign[] {
  return campaigns.filter(c => {
    const matches = getEngagementsByCampaign(c.id);
    return matches.length < 2 && c.status !== 'completed';
  });
}

export function calculateBadge(creator: Creator): Creator['badge'] {
  if (creator.reputationScore >= 90 && creator.completedEngagements >= 5) {
    return 'TopPerformer';
  } else if (creator.reputationScore >= 85 && creator.completedEngagements >= 4) {
    return 'Gold';
  } else if (creator.reputationScore >= 75 && creator.completedEngagements >= 3) {
    return 'Silver2';
  } else if (creator.reputationScore >= 70 && creator.completedEngagements >= 2) {
    return 'Silver1';
  } else if (creator.reputationScore >= 60 && creator.completedEngagements >= 1) {
    return 'Bronze3';
  } else if (creator.reputationScore >= 50 && creator.completedEngagements >= 1) {
    return 'Bronze2';
  } else if (creator.completedEngagements >= 1) {
    return 'Bronze1';
  }
  return undefined;
}

export function getBadgeColor(badge?: string): string {
  switch (badge) {
    case 'TopPerformer':
      return 'bg-amber-100 text-amber-900';
    case 'Gold':
      return 'bg-amber-100 text-amber-900';
    case 'Silver2':
      return 'bg-gray-200 text-gray-900';
    case 'Silver1':
      return 'bg-gray-100 text-gray-800';
    case 'Bronze3':
      return 'bg-orange-100 text-orange-900';
    case 'Bronze2':
      return 'bg-orange-50 text-orange-800';
    case 'Bronze1':
      return 'bg-orange-50 text-orange-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

export function getTopCreators(limit: number = 5): Creator[] {
  const approved = creators.filter(c => c.approvalStatus === 'approved');
  return approved.sort((a, b) => b.reputationScore - a.reputationScore).slice(0, limit);
}

export function getTopRisingCreators(limit: number = 3): Creator[] {
  const approved = creators.filter(c => c.approvalStatus === 'approved');
  return approved
    .filter(c => new Date(c.joinedDate) > new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000)) // Last 6 months
    .sort((a, b) => b.reputationScore - a.reputationScore)
    .slice(0, limit);
}

export function getRecentlyVerifiedCreators(limit: number = 3): Creator[] {
  return creators
    .filter(c => c.approvalStatus === 'approved' && c.verified)
    .sort((a, b) => new Date(b.joinedDate).getTime() - new Date(a.joinedDate).getTime())
    .slice(0, limit);
}
