import { supabase } from './supabase-client';
import type { Campaign, Creator, Submission } from './mock-data';

type CampaignRow = {
  id: string;
  name: string;
  client_name: string;
  status: string;
  created_at: string | null;
  updated_at: string | null;
  campaign_start_date: string | null;
  campaign_end_date: string | null;
};

type CreatorSubmissionRow = {
  id: string;
  creator_ref: string;
  campaign_id: string;
  submission_link: string;
  submitted_at: string | null;
  platform: Submission['platform'] | null;
  content_url: string | null;
  content_type: string | null;
  note: string | null;
  status: string;
  views: number | null;
  impressions: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  saves: number | null;
  engagement_rate: number | null;
  cpi_score: number | null;
  staff_feedback: string | null;
  approved_at: string | null;
  rejected_reason: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
};

type CreatorProfileDirectoryRow = {
  user_id: string;
  creator_name: string | null;
  university: string | null;
  faculty: string | null;
  bio: string | null;
  content_categories: string[] | null;
  is_scholarship_student: boolean | null;
  platform: string;
  social_handle: string;
  social_profile_url: string | null;
  follower_count: number;
  engagement_rate: number | null;
  verification_status: string;
  creator_rank: string;
  onboarding_completed: boolean;
  created_at: string | null;
};

type PlatformUserDirectoryRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: string | null;
  created_at: string | null;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function hasSupabaseConfig() {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

export function isValidUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function fetchCreatorSubmissions() {
  const rows = await supabaseRequest<CreatorSubmissionRow[]>('/rest/v1/submissions?select=*&order=submitted_at.desc');
  console.log('SUBMISSION LOADED FROM SUPABASE', rows.length);
  return rows.map(mapSubmissionFromRow);
}

export async function fetchCampaigns() {
  const rows = await supabaseRequest<CampaignRow[]>('/rest/v1/campaigns?select=*&order=created_at.desc');
  return rows.map(mapCampaignFromRow);
}

export async function fetchSignedUpCreators() {
  if (!supabase) return [];

  const [{ data: profileRows, error: profileError }, { data: userRows, error: usersError }] = await Promise.all([
    supabase
      .from('creator_profiles')
      .select('user_id, creator_name, university, faculty, bio, content_categories, is_scholarship_student, platform, social_handle, social_profile_url, follower_count, engagement_rate, verification_status, creator_rank, onboarding_completed, created_at')
      .eq('onboarding_completed', true)
      .order('created_at', { ascending: false }),
    supabase
      .from('users')
      .select('id, email, full_name, avatar_url, role, created_at')
      .eq('role', 'creator'),
  ]);
  if (profileError) {
    console.error('CREATOR DIRECTORY LOAD FAILED', profileError);
  }
  if (usersError) {
    console.error('CREATOR DIRECTORY USERS LOAD FAILED', usersError);
  }

  const profiles = (profileRows ?? []) as CreatorProfileDirectoryRow[];
  const users = (userRows ?? []) as PlatformUserDirectoryRow[];
  const usersById = new Map((userRows ?? []).map((user) => [(user as PlatformUserDirectoryRow).id, user as PlatformUserDirectoryRow]));
  const profiledCreators = profiles.map(profile => mapCreatorProfileToCreator(profile, usersById.get(profile.user_id)));
  const profiledCreatorIds = new Set(profiledCreators.map(creator => creator.id));
  const usersWithoutProfiles = users
    .filter(user => !profiledCreatorIds.has(user.id))
    .map(mapUserToSignedUpCreator);

  return [...profiledCreators, ...usersWithoutProfiles];
}

export async function insertCreatorSubmission(submission: Submission) {
  if (!isValidUuid(submission.campaignId)) {
    throw new Error('Please select a valid campaign before submitting.');
  }

  const row = await supabaseRequest<CreatorSubmissionRow[]>('/rest/v1/submissions?select=*', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(mapSubmissionToInsert(submission)),
  });
  console.log('SUBMISSION SAVED TO SUPABASE', row[0]?.id);
  return mapSubmissionFromRow(row[0]);
}

export async function updateCreatorSubmission(
  submissionId: string,
  updates: Partial<Submission> & { reviewedBy?: string },
) {
  const row = await supabaseRequest<CreatorSubmissionRow[]>(`/rest/v1/submissions?id=eq.${encodeURIComponent(submissionId)}&select=*`, {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(mapSubmissionToUpdate(updates)),
  });
  console.log('REVIEW SAVED TO SUPABASE', row[0]?.id);
  return mapSubmissionFromRow(row[0]);
}

export async function persistCreatorRank(creatorId: string, rank: string) {
  await supabaseRequest(`/rest/v1/users?id=eq.${encodeURIComponent(creatorId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ creator_rank: rank }),
  });
  console.log('RANK UPDATED IN SUPABASE', creatorId, rank);
}

function mapSubmissionFromRow(row: CreatorSubmissionRow): Submission {
  const contentUrl = row.content_url ?? row.submission_link;
  return {
    id: row.id,
    creatorId: row.creator_ref,
    campaignId: row.campaign_id,
    title: row.content_type || contentUrl,
    link: contentUrl,
    notes: row.note ?? '',
    platform: row.platform ?? 'Instagram',
    contentUrl,
    contentType: row.content_type ?? undefined,
    submissionDate: dateOnly(row.submitted_at),
    status: normalizeDbStatus(row.status),
    submittedAt: dateOnly(row.submitted_at) ?? new Date().toISOString().slice(0, 10),
    reviewedAt: dateOnly(row.reviewed_at),
    reviewNotes: row.staff_feedback ?? undefined,
    views: row.views ?? undefined,
    impressions: row.impressions ?? undefined,
    likes: row.likes ?? undefined,
    comments: row.comments ?? undefined,
    shares: row.shares ?? undefined,
    saves: row.saves ?? undefined,
    engagementRate: row.engagement_rate ?? undefined,
    cpiScore: row.cpi_score ?? undefined,
    staffFeedback: row.staff_feedback ?? undefined,
    approvedAt: dateOnly(row.approved_at),
    rejectedReason: row.rejected_reason ?? undefined,
  };
}

function mapCampaignFromRow(row: CampaignRow): Campaign {
  return {
    id: row.id,
    title: row.name,
    description: `${row.client_name} campaign brief`,
    brand: row.client_name,
    budget: 0,
    startDate: dateOnly(row.campaign_start_date ?? row.created_at) ?? new Date().toISOString().slice(0, 10),
    endDate: dateOnly(row.campaign_end_date ?? row.created_at) ?? new Date().toISOString().slice(0, 10),
    targetNiches: ['Creator Campus'],
    targetPlatforms: ['Instagram', 'TikTok', 'Facebook'],
    minFollowers: 0,
    contentType: 'Creator content',
    goals: ['Create content according to the campaign brief.'],
    requirements: ['Submit a published content link for review.'],
    status: mapCampaignStatus(row.status),
    createdAt: dateOnly(row.created_at) ?? new Date().toISOString().slice(0, 10),
  };
}

function mapCreatorProfileToCreator(profile: CreatorProfileDirectoryRow, user?: PlatformUserDirectoryRow): Creator {
  const handle = normalizeHandle(profile.social_handle);
  const platform = normalizeCreatorPlatform(profile.platform);
  const followers = profile.follower_count ?? 0;
  const engagementRate = Number(profile.engagement_rate ?? 0);
  const score = calculateProfileReadinessScore(followers, engagementRate, profile.verification_status);
  const displayName = profile.creator_name || user?.full_name || user?.email || handle.replace(/^@/, '') || 'Signed-up creator';
  const contentCategories = profile.content_categories?.filter(Boolean) ?? ['Campus life'];

  return {
    id: profile.user_id,
    name: displayName,
    avatar: user?.avatar_url ?? undefined,
    bio: profile.bio || `${platform} creator signed up for brand collaborations through RollerKluster.`,
    niche: contentCategories[0] ?? 'Creator Campus',
    contentCategories,
    isScholarshipStudent: profile.is_scholarship_student ?? false,
    platforms: [
      {
        name: platform,
        followers,
        handle,
        username: handle.replace(/^@/, ''),
        url: profile.social_profile_url ?? undefined,
      },
    ],
    engagementRate,
    verified: profile.verification_status === 'verified',
    approvalStatus: 'approved',
    portfolioItems: [],
    trainingCompleted: profile.onboarding_completed ? ['Creator onboarding'] : [],
    engagementHistory: [],
    badge: badgeFromCreatorRank(profile.creator_rank),
    reputationScore: score,
    completedEngagements: 0,
    contentQualityScore: profile.verification_status === 'verified' ? 4.2 : 3.5,
    approvalRate: profile.verification_status === 'verified' ? 90 : 0,
    evaluations: [],
    joinedDate: dateOnly(profile.created_at) ?? new Date().toISOString().slice(0, 10),
  };
}

function mapUserToSignedUpCreator(user: PlatformUserDirectoryRow): Creator {
  const handle = normalizeHandle((user.email ?? user.full_name ?? 'creator').split('@')[0]);
  const displayName = user.full_name || user.email || 'Signed-up creator';

  return {
    id: user.id,
    name: displayName,
    avatar: user.avatar_url ?? undefined,
    bio: 'Creator account signed up for brand collaborations through RollerKluster.',
    niche: 'Creator Campus',
    contentCategories: ['Campus life'],
    isScholarshipStudent: false,
    platforms: [
      {
        name: 'Instagram',
        followers: 0,
        handle,
        username: handle.replace(/^@/, ''),
      },
    ],
    engagementRate: 0,
    verified: false,
    approvalStatus: 'approved',
    portfolioItems: [],
    trainingCompleted: [],
    engagementHistory: [],
    badge: 'Bronze1',
    reputationScore: 35,
    completedEngagements: 0,
    contentQualityScore: 3.5,
    approvalRate: 0,
    evaluations: [],
    joinedDate: dateOnly(user.created_at) ?? new Date().toISOString().slice(0, 10),
  };
}

function normalizeHandle(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return '@creator';
  return trimmed.startsWith('@') ? trimmed : `@${trimmed}`;
}

function normalizeCreatorPlatform(value: string): Creator['platforms'][number]['name'] {
  if (value === 'TikTok' || value === 'Instagram' || value === 'YouTube' || value === 'Facebook') return value;
  return 'Instagram';
}

function badgeFromCreatorRank(rank: string): Creator['badge'] {
  if (rank) return rank as Creator['badge'];
  return 'Bronze1';
}

function calculateProfileReadinessScore(followers: number, engagementRate: number, verificationStatus: string) {
  const followerScore = Math.min(35, Math.round(followers / 1500));
  const engagementScore = Math.min(35, Math.round(engagementRate * 5));
  const verificationScore = verificationStatus === 'verified' ? 20 : 8;
  return Math.min(96, Math.max(35, followerScore + engagementScore + verificationScore));
}

function mapCampaignStatus(status: string): Campaign['status'] {
  if (status === 'active') return 'in_progress';
  if (status === 'pending') return 'open';
  if (status === 'completed') return 'completed';
  if (status === 'draft') return 'draft';
  return 'open';
}

function mapSubmissionToInsert(submission: Submission) {
  const contentUrl = submission.contentUrl ?? submission.link;
  return {
    id: submission.id,
    creator_ref: submission.creatorId,
    campaign_id: submission.campaignId,
    submission_link: contentUrl,
    platform: submission.platform ?? 'Instagram',
    content_url: contentUrl,
    content_type: submission.contentType ?? submission.title,
    note: submission.notes || null,
    status: 'pending_review',
    submitted_at: submission.submissionDate ?? submission.submittedAt,
  };
}

function mapSubmissionToUpdate(submission: Partial<Submission> & { reviewedBy?: string }) {
  return removeUndefined({
    status: submission.status ? denormalizeStatus(submission.status) : undefined,
    views: submission.views,
    impressions: submission.impressions,
    likes: submission.likes,
    comments: submission.comments,
    shares: submission.shares,
    saves: submission.saves,
    engagement_rate: submission.engagementRate,
    cpi_score: submission.cpiScore,
    staff_feedback: submission.staffFeedback ?? submission.reviewNotes,
    rejected_reason: submission.rejectedReason,
    reviewed_at: submission.reviewedAt,
    approved_at: submission.approvedAt,
    reviewed_by: submission.reviewedBy,
  });
}

function normalizeDbStatus(status: string): Submission['status'] {
  if (status === 'Pending Review') return 'pending_review';
  if (status === 'Approved') return 'approved';
  if (status === 'Needs Changes') return 'needs_changes';
  if (status === 'Rejected') return 'rejected';
  if (status === 'submitted') return 'pending_review';
  if (status === 'changes_requested') return 'needs_changes';
  return status as Submission['status'];
}

function denormalizeStatus(status: Submission['status']) {
  if (status === 'submitted') return 'pending_review';
  if (status === 'changes_requested') return 'needs_changes';
  return status;
}

async function supabaseRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  }

  const session = supabase ? (await supabase.auth.getSession()).data.session : null;
  const accessToken = session?.access_token ?? supabaseAnonKey;

  const response = await fetch(`${supabaseUrl}${path}`, {
    ...init,
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Supabase request failed: ${response.status} ${detail}`);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

function dateOnly(value?: string | null) {
  if (!value) return undefined;
  return value.slice(0, 10);
}

function removeUndefined<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined));
}
