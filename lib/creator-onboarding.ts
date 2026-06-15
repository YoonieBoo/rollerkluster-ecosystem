import type { CreatorRank } from './creator-performance';

export const onboardingPlatforms = ['Instagram', 'TikTok', 'YouTube', 'Facebook'] as const;
export type OnboardingPlatform = (typeof onboardingPlatforms)[number];

export type VerificationStatus = 'pending_review' | 'verified' | 'rejected';

export const onboardingContentCategories = [
  'Campus life',
  'Fashion',
  'Food',
  'Beauty',
  'Sports',
  'Events',
  'Study tips',
  'Student wellness',
  'Technology',
  'Travel',
] as const;

export interface CreatorProfileRecord {
  id?: string;
  userId: string;
  role: 'creator';
  creatorName?: string;
  university?: string;
  faculty?: string;
  bio?: string;
  contentCategories: string[];
  isScholarshipStudent: boolean;
  platform: OnboardingPlatform;
  socialHandle: string;
  socialProfileUrl: string;
  followerCount: number;
  engagementRate?: number;
  proofImageUrl?: string;
  verificationStatus: VerificationStatus;
  creatorRank: CreatorRank;
  onboardingCompleted: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export function calculateStartingRank(followerCount: number): Exclude<CreatorRank, 'Platinum'> {
  if (followerCount >= 60000) return 'Gold IV';
  if (followerCount >= 40000) return 'Gold III';
  if (followerCount >= 25000) return 'Gold II';
  if (followerCount >= 15000) return 'Gold I';
  if (followerCount >= 10000) return 'Silver IV';
  if (followerCount >= 7500) return 'Silver III';
  if (followerCount >= 5000) return 'Silver II';
  if (followerCount >= 3000) return 'Silver I';
  if (followerCount >= 1500) return 'Bronze IV';
  if (followerCount >= 700) return 'Bronze III';
  if (followerCount >= 300) return 'Bronze II';
  return 'Bronze I';
}

export function normalizeCreatorProfileRow(row: CreatorProfileRow): CreatorProfileRecord {
  return {
    id: row.id,
    userId: row.user_id,
    role: 'creator',
    creatorName: row.creator_name ?? undefined,
    university: row.university ?? undefined,
    faculty: row.faculty ?? undefined,
    bio: row.bio ?? undefined,
    contentCategories: row.content_categories ?? [],
    isScholarshipStudent: row.is_scholarship_student ?? false,
    platform: row.platform as OnboardingPlatform,
    socialHandle: row.social_handle,
    socialProfileUrl: row.social_profile_url,
    followerCount: row.follower_count,
    engagementRate: row.engagement_rate ?? undefined,
    proofImageUrl: row.proof_image_url ?? undefined,
    verificationStatus: row.verification_status as VerificationStatus,
    creatorRank: row.creator_rank as CreatorRank,
    onboardingCompleted: row.onboarding_completed,
    createdAt: row.created_at ?? undefined,
    updatedAt: row.updated_at ?? undefined,
  };
}

export type CreatorProfileRow = {
  id?: string;
  user_id: string;
  role?: string;
  creator_name?: string | null;
  university?: string | null;
  faculty?: string | null;
  bio?: string | null;
  content_categories?: string[] | null;
  is_scholarship_student?: boolean | null;
  platform: string;
  social_handle: string;
  social_profile_url: string;
  follower_count: number;
  engagement_rate: number | null;
  proof_image_url: string | null;
  verification_status: string;
  creator_rank: string;
  onboarding_completed: boolean;
  detected_follower_count?: number | null;
  manual_follower_count?: number | null;
  verification_notes?: string | null;
  verified_by?: string | null;
  verified_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};
