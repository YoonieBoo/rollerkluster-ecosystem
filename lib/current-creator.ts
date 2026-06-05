import type { User } from '@supabase/supabase-js';
import type { Creator } from './mock-data';
import type { CreatorProfileRecord } from './creator-onboarding';

export function getSessionDisplayName(user: User | null, email: string) {
  const metadataName = user?.user_metadata?.full_name;
  if (typeof metadataName === 'string' && metadataName.trim()) return metadataName.trim();
  if (email.includes('@')) return email.split('@')[0];
  return email || 'Creator';
}

export function buildCurrentCreator({
  demoCreator,
  creatorProfile,
  sessionUser,
  sessionEmail,
  avatarUrl,
}: {
  demoCreator?: Creator;
  creatorProfile: CreatorProfileRecord | null;
  sessionUser: User | null;
  sessionEmail: string;
  avatarUrl?: string;
}): Creator | undefined {
  if (!creatorProfile) return demoCreator;

  const name = getSessionDisplayName(sessionUser, sessionEmail);
  const platformName = creatorProfile.platform as Creator['platforms'][number]['name'];
  const engagementRate = creatorProfile.engagementRate ?? demoCreator?.engagementRate ?? 0;

  return {
    id: creatorProfile.userId,
    name,
    bio: demoCreator?.bio ?? 'Campus creator building a verified RollerKluster profile.',
    niche: demoCreator?.niche ?? 'Campus Lifestyle',
    platforms: [
      {
        name: platformName,
        followers: creatorProfile.followerCount,
        handle: creatorProfile.socialHandle || '@creator',
        username: creatorProfile.socialHandle?.replace(/^@/, ''),
        url: creatorProfile.socialProfileUrl || undefined,
      },
    ],
    engagementRate,
    verified: creatorProfile.verificationStatus === 'verified',
    approvalStatus: 'approved',
    avatar: avatarUrl || undefined,
    portfolioItems: [],
    trainingCompleted: [],
    engagementHistory: [],
    reputationScore: 0,
    completedEngagements: 0,
    contentQualityScore: 0,
    approvalRate: 0,
    evaluations: [],
    joinedDate: creatorProfile.createdAt ?? new Date().toISOString(),
  };
}
