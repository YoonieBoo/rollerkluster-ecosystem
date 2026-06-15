import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';
import { supabase } from './supabase-client';
import {
  calculateStartingRank,
  normalizeCreatorProfileRow,
  type CreatorProfileRecord,
  type CreatorProfileRow,
  type OnboardingPlatform,
} from './creator-onboarding';

type ActiveRole = 'admin' | 'creator';
type AuthRole = 'brand' | 'creator';
type CreatorInvitationStatus = 'pending' | 'accepted' | 'declined';

const invitationStorageKey = 'rollerkluster-invitation-status';
const proofBucket = 'creator-social-proof';
const avatarBucket = 'creator-avatars';
const avatarStoragePrefix = 'rollerkluster-creator-avatar';

type SaveCreatorOnboardingInput = {
  platform: OnboardingPlatform;
  socialHandle: string;
  socialProfileUrl: string;
  followerCount: number;
  engagementRate?: number;
  proofFile?: File;
  creatorName?: string;
  university?: string;
  faculty?: string;
  bio?: string;
  contentCategories?: string[];
  isScholarshipStudent?: boolean;
};

interface UiState {
  sidebarCollapsed: boolean;
  creatorView: 'list' | 'grid';
  activeRole: ActiveRole;
  authHydrated: boolean;
  isAuthenticated: boolean;
  sessionEmail: string;
  sessionUser: User | null;
  creatorProfile: CreatorProfileRecord | null;
  creatorAvatarUrl: string;
  authError: string;
  creatorInvitationStatus: CreatorInvitationStatus;
  toggleSidebar: () => void;
  setCreatorView: (view: 'list' | 'grid') => void;
  setActiveRole: (role: ActiveRole) => void;
  hydrateAuth: () => Promise<void>;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signUpWithPassword: (input: { fullName: string; email: string; password: string; role: ActiveRole }) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  saveCreatorAvatar: (file: File) => Promise<void>;
  saveCreatorOnboarding: (input: SaveCreatorOnboardingInput) => Promise<void>;
  updateCreatorProfile: (input: Omit<SaveCreatorOnboardingInput, 'proofFile'>) => Promise<void>;
  refreshCreatorProfile: () => Promise<void>;
  setCreatorInvitationStatus: (status: CreatorInvitationStatus) => void;
}

export const useUiStore = create<UiState>((set, get) => ({
  sidebarCollapsed: false,
  creatorView: 'list',
  activeRole: 'admin',
  authHydrated: false,
  isAuthenticated: false,
  sessionEmail: '',
  sessionUser: null,
  creatorProfile: null,
  creatorAvatarUrl: '',
  authError: '',
  creatorInvitationStatus: 'pending',
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setCreatorView: (creatorView) => set({ creatorView }),
  setActiveRole: (activeRole) => set({ activeRole }),
  hydrateAuth: async () => {
    if (!supabase) {
      set({
        authHydrated: true,
        isAuthenticated: false,
        authError: 'Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.',
      });
      return;
    }

    const { data, error } = await supabase.auth.getSession();
    if (error) {
      set({ authHydrated: true, isAuthenticated: false, authError: error.message });
      return;
    }

    const user = data.session?.user ?? null;
    if (!user) {
      set({
        authHydrated: true,
        isAuthenticated: false,
        sessionEmail: '',
        sessionUser: null,
        creatorProfile: null,
        creatorAvatarUrl: '',
      });
      return;
    }

    const role = await resolveRole(user);
    await upsertPlatformUser(user, role);
    const creatorProfile = role === 'creator' ? await fetchCreatorProfile(user.id) : null;
    const creatorAvatarUrl = await resolveCreatorAvatar(user);
    set({
      activeRole: role === 'creator' ? 'creator' : 'admin',
      authHydrated: true,
      isAuthenticated: true,
      sessionEmail: user.email ?? '',
      sessionUser: user,
      creatorProfile,
      creatorAvatarUrl,
      authError: '',
      creatorInvitationStatus: readInvitationStatus(),
    });
  },
  signInWithPassword: async (email, password) => {
    if (!supabase) {
      set({ authError: 'Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.' });
      return;
    }

    set({ authError: '' });
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      set({ authError: error.message });
      return;
    }

    const user = data.user;
    const role = user ? await resolveRole(user) : 'brand';
    if (user) await upsertPlatformUser(user, role);
    const creatorProfile = user && role === 'creator' ? await fetchCreatorProfile(user.id) : null;
    const creatorAvatarUrl = user ? await resolveCreatorAvatar(user) : '';
    set({
      activeRole: role === 'creator' ? 'creator' : 'admin',
      authHydrated: true,
      isAuthenticated: Boolean(user),
      sessionEmail: user?.email ?? '',
      sessionUser: user ?? null,
      creatorProfile,
      creatorAvatarUrl,
      authError: '',
    });
  },
  signUpWithPassword: async ({ fullName, email, password, role }) => {
    if (!supabase) {
      set({ authError: 'Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.' });
      return;
    }

    set({ authError: '' });
    const authRole = toAuthRole(role);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: authRole,
          provider: 'email',
        },
      },
    });
    if (error) {
      set({ authError: error.message });
      return;
    }

    if (data.user) {
      await upsertPlatformUser(data.user, authRole);
      const creatorAvatarUrl = data.session ? await resolveCreatorAvatar(data.user) : '';
      set({
        activeRole: role,
        authHydrated: true,
        isAuthenticated: Boolean(data.session),
        sessionEmail: data.user.email ?? email,
        sessionUser: data.session ? data.user : null,
        creatorProfile: null,
        creatorAvatarUrl,
      });
    }
  },
  sendPasswordReset: async (email) => {
    if (!supabase) {
      set({ authError: 'Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.' });
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
    });
    set({ authError: error ? error.message : '' });
  },
  signOut: async () => {
    if (supabase) await supabase.auth.signOut();
    set({
      activeRole: 'admin',
      isAuthenticated: false,
      sessionEmail: '',
      sessionUser: null,
      creatorProfile: null,
      creatorAvatarUrl: '',
      creatorInvitationStatus: 'pending',
    });
  },
  saveCreatorAvatar: async (file) => {
    const user = get().sessionUser;
    if (!supabase || !user) throw new Error('You must be signed in before uploading a profile photo.');
    if (!file.type.startsWith('image/')) throw new Error('Upload an image file.');
    if (file.size > 5 * 1024 * 1024) throw new Error('Upload a profile photo under 5MB.');

    const extension = getFileExtension(file);
    const avatarPath = `${user.id}/profile.${extension}`;
    const upload = await supabase.storage.from(avatarBucket).upload(avatarPath, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: file.type,
    });
    if (upload.error) {
      console.error('CREATOR AVATAR UPLOAD FAILED', upload.error);
      throw new Error(formatSupabaseOnboardingError(upload.error, 'Could not upload profile photo.', avatarBucket));
    }

    const { data: publicUrlData } = supabase.storage.from(avatarBucket).getPublicUrl(avatarPath);
    const avatarUrl = `${publicUrlData.publicUrl}?v=${Date.now()}`;

    const { error: userUpdateError } = await supabase
      .from('users')
      .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
      .eq('id', user.id);
    if (userUpdateError) {
      console.error('CREATOR AVATAR PROFILE SAVE FAILED', userUpdateError);
      throw new Error(formatSupabaseOnboardingError(userUpdateError, 'Could not save profile photo.'));
    }

    const { error: authUpdateError } = await supabase.auth.updateUser({ data: { avatar_url: avatarUrl } });
    if (authUpdateError) {
      console.error('CREATOR AVATAR AUTH METADATA SAVE FAILED', authUpdateError);
    }

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(`${avatarStoragePrefix}:${user.id}`, avatarUrl);
    }
    set({ creatorAvatarUrl: avatarUrl });
  },
  saveCreatorOnboarding: async (input) => {
    const user = get().sessionUser;
    if (!supabase || !user) throw new Error('You must be signed in before completing onboarding.');

    let proofPath: string | null = null;
    if (input.proofFile) {
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
      if (!allowedTypes.includes(input.proofFile.type)) {
        throw new Error('Upload a PNG, JPG, JPEG, or WebP image.');
      }
      if (input.proofFile.size > 5 * 1024 * 1024) {
        throw new Error('Upload a social proof image under 5MB.');
      }

      const safeFileName = input.proofFile.name.replace(/[^a-zA-Z0-9._-]/g, '-');
      proofPath = `${user.id}/${Date.now()}-${safeFileName}`;
      const upload = await supabase.storage.from(proofBucket).upload(proofPath, input.proofFile, {
        cacheControl: '3600',
        upsert: false,
      });
      if (upload.error) {
        console.error('CREATOR ONBOARDING PROOF UPLOAD FAILED', upload.error);
        throw new Error(formatSupabaseOnboardingError(upload.error, 'Could not upload social proof image.', proofBucket));
      }
    }

    const creatorRank = calculateStartingRank(input.followerCount);
    const row: CreatorProfileRow = {
      user_id: user.id,
      creator_name: input.creatorName ?? null,
      university: input.university ?? null,
      faculty: input.faculty ?? null,
      bio: input.bio ?? null,
      content_categories: input.contentCategories ?? [],
      is_scholarship_student: input.isScholarshipStudent ?? false,
      platform: input.platform,
      social_handle: input.socialHandle,
      social_profile_url: input.socialProfileUrl,
      follower_count: input.followerCount,
      manual_follower_count: input.followerCount,
      engagement_rate: typeof input.engagementRate === 'number' ? input.engagementRate : null,
      proof_image_url: proofPath,
      verification_status: 'pending_review',
      creator_rank: creatorRank,
      onboarding_completed: true,
    };

    const { data, error } = await supabase
      .from('creator_profiles')
      .upsert(row, { onConflict: 'user_id' })
      .select('*')
      .single();
    if (error) {
      console.error('CREATOR ONBOARDING SAVE FAILED', error);
      throw new Error(formatSupabaseOnboardingError(error, 'Could not save creator onboarding.'));
    }

    try {
      await upsertPlatformUser(user, 'creator', creatorRank);
    } catch (error) {
      console.error('CREATOR ONBOARDING USER RANK UPDATE FAILED', error);
    }
    set({
      creatorProfile: normalizeCreatorProfileRow(data as CreatorProfileRow),
      activeRole: 'creator',
    });
  },
  updateCreatorProfile: async (input) => {
    const user = get().sessionUser;
    const existingProfile = get().creatorProfile;
    if (!supabase || !user || !existingProfile) throw new Error('You must be signed in before editing your profile.');

    const creatorRank = calculateStartingRank(input.followerCount);
    const row: CreatorProfileRow = {
      user_id: user.id,
      creator_name: existingProfile.creatorName ?? null,
      university: existingProfile.university ?? null,
      faculty: existingProfile.faculty ?? null,
      bio: existingProfile.bio ?? null,
      content_categories: existingProfile.contentCategories,
      is_scholarship_student: existingProfile.isScholarshipStudent,
      platform: input.platform,
      social_handle: input.socialHandle,
      social_profile_url: input.socialProfileUrl,
      follower_count: input.followerCount,
      manual_follower_count: input.followerCount,
      engagement_rate: typeof input.engagementRate === 'number' ? input.engagementRate : null,
      proof_image_url: existingProfile.proofImageUrl ?? null,
      verification_status: existingProfile.verificationStatus,
      creator_rank: creatorRank,
      onboarding_completed: true,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('creator_profiles')
      .upsert(row, { onConflict: 'user_id' })
      .select('*')
      .single();
    if (error) {
      console.error('CREATOR PROFILE UPDATE FAILED', error);
      throw new Error(formatSupabaseOnboardingError(error, 'Could not update creator profile.'));
    }

    try {
      await upsertPlatformUser(user, 'creator', creatorRank);
    } catch (error) {
      console.error('CREATOR PROFILE USER RANK UPDATE FAILED', error);
    }
    set({ creatorProfile: normalizeCreatorProfileRow(data as CreatorProfileRow) });
  },
  refreshCreatorProfile: async () => {
    const user = get().sessionUser;
    if (!user) return;
    const creatorProfile = await fetchCreatorProfile(user.id);
    set({ creatorProfile });
  },
  setCreatorInvitationStatus: (creatorInvitationStatus) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(invitationStorageKey, creatorInvitationStatus);
    }
    set({ creatorInvitationStatus });
  },
}));

async function resolveRole(user: User): Promise<AuthRole> {
  if (!supabase) return 'brand';
  const { data } = await supabase.from('users').select('role').eq('id', user.id).maybeSingle();
  const storedRole = normalizeAuthRole(data?.role);
  if (storedRole) return storedRole;

  const metadata = user.user_metadata as Record<string, unknown>;
  const metadataRole = normalizeAuthRole(metadata.role);
  if (metadataRole) return metadataRole;

  const { data: creatorProfile } = await supabase
    .from('creator_profiles')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle();
  if (creatorProfile?.user_id) return 'creator';

  return 'brand';
}

async function upsertPlatformUser(user: User, role: AuthRole, creatorRank?: string) {
  if (!supabase) return;
  const metadata = user.user_metadata as Record<string, unknown>;
  const metadataAvatar =
    typeof metadata.avatar_url === 'string'
      ? metadata.avatar_url
      : typeof metadata.picture === 'string'
        ? metadata.picture
        : null;
  const existingAvatar = await fetchPlatformUserAvatar(user.id);
  const row: {
    id: string;
    email: string | undefined;
    full_name: unknown;
    avatar_url: string | null;
    role: AuthRole;
    provider: unknown;
    updated_at: string;
    creator_rank?: string;
  } = {
    id: user.id,
    email: user.email,
    full_name: typeof metadata.full_name === 'string' ? metadata.full_name : typeof metadata.name === 'string' ? metadata.name : user.email,
    avatar_url: metadataAvatar ?? (existingAvatar || null),
    role,
    provider: user.app_metadata.provider ?? 'email',
    updated_at: new Date().toISOString(),
  };
  if (creatorRank) row.creator_rank = creatorRank;
  await supabase.from('users').upsert(row, { onConflict: 'id' });
}

function normalizeAuthRole(role: unknown): AuthRole | null {
  if (role === 'creator') return 'creator';
  if (role === 'brand' || role === 'admin') return 'brand';
  return null;
}

async function fetchCreatorProfile(userId: string) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('creator_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) {
    console.error('CREATOR PROFILE LOAD FAILED', error);
    return null;
  }
  return data ? normalizeCreatorProfileRow(data as CreatorProfileRow) : null;
}

async function resolveCreatorAvatar(user: User) {
  const metadata = user.user_metadata as Record<string, unknown>;
  const metadataAvatar =
    typeof metadata.avatar_url === 'string'
      ? metadata.avatar_url
      : typeof metadata.picture === 'string'
        ? metadata.picture
        : '';
  const storedAvatar = await fetchPlatformUserAvatar(user.id);
  return storedAvatar || metadataAvatar || readCreatorAvatar(user.id);
}

async function fetchPlatformUserAvatar(userId: string) {
  if (!supabase) return '';
  const { data, error } = await supabase.from('users').select('avatar_url').eq('id', userId).maybeSingle();
  if (error) return '';
  return typeof data?.avatar_url === 'string' ? data.avatar_url : '';
}

function getFileExtension(file: File) {
  const fromName = file.name.split('.').pop()?.toLowerCase();
  if (fromName && ['png', 'jpeg', 'jpg', 'webp', 'gif'].includes(fromName)) {
    return fromName === 'jpg' ? 'jpeg' : fromName;
  }
  if (file.type === 'image/png') return 'png';
  if (file.type === 'image/webp') return 'webp';
  if (file.type === 'image/gif') return 'gif';
  return 'jpeg';
}

function formatSupabaseOnboardingError(error: unknown, fallback: string, storageBucket?: string) {
  const details = error as { code?: string; message?: string; statusCode?: string | number };
  const message = details.message ?? fallback;
  const code = details.code ?? details.statusCode;
  const normalizedMessage = message.toLowerCase();

  if (code === '42P01' || normalizedMessage.includes('creator_profiles') || normalizedMessage.includes('could not find the table')) {
    return 'Creator onboarding table is missing. Run the creator_profiles Supabase migration, then try again.';
  }
  if (code === '42501' || normalizedMessage.includes('row-level security')) {
    return 'Creator onboarding could not be saved because Supabase row-level security blocked the request. Check creator_profiles RLS policies.';
  }
  if (normalizedMessage.includes('bucket') || normalizedMessage.includes('storage')) {
    if (storageBucket === avatarBucket) {
      return 'Profile photo upload failed. Confirm the creator-avatars storage bucket exists and its policies are enabled.';
    }
    return 'Social proof upload failed. Confirm the creator-social-proof storage bucket exists and its policies are enabled.';
  }
  return message || fallback;
}

function toAuthRole(activeRole: ActiveRole): AuthRole {
  return activeRole === 'creator' ? 'creator' : 'brand';
}

function readInvitationStatus(): CreatorInvitationStatus {
  if (typeof window === 'undefined') return 'pending';
  const stored = window.localStorage.getItem(invitationStorageKey);
  if (stored === 'accepted' || stored === 'declined') return stored;
  return 'pending';
}

function readCreatorAvatar(userId: string) {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem(`${avatarStoragePrefix}:${userId}`) ?? '';
}
