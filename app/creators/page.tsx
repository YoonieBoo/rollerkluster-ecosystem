'use client';

import { useMemo, useState } from 'react';
import { Sidebar } from '@/components/sidebar';
import { useApp } from '@/lib/app-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Briefcase, CheckCircle2, DollarSign, ExternalLink, Facebook, Filter, Grid2X2, Handshake, Linkedin, List, Loader2, Mail, MoreHorizontal, Search, ShieldCheck, SlidersHorizontal, Sparkles, Star, TrendingUp, Twitch, Twitter, Users, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/lib/ui-store';
import { RankBadgeIcon } from '@/components/rank-badge';
import type { Campaign, Creator, Engagement, Submission } from '@/lib/mock-data';
import { getMonthYear, isSubmissionApproved } from '@/lib/creator-performance';
import { getCreatorMonthlyPerformance, getCreatorMonthlySubmissionsForDisplay } from '@/lib/creator-performance-source';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';

const rankStyles: Record<string, string> = {
  TopPerformer: 'bg-amber-50 text-amber-800 border-amber-200',
  Gold: 'bg-amber-50 text-amber-800 border-amber-200',
  Platinum: 'bg-blue-50 text-blue-800 border-blue-200',
  Silver2: 'bg-slate-100 text-slate-700 border-slate-200',
  Silver1: 'bg-slate-50 text-slate-700 border-slate-200',
  Bronze3: 'bg-orange-50 text-orange-800 border-orange-200',
  Bronze2: 'bg-orange-50 text-orange-700 border-orange-200',
  Bronze1: 'bg-orange-50 text-orange-700 border-orange-200',
};

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

function rankStyle(rank?: string) {
  const label = rankLabel(rank);
  if (label === 'Platinum') return rankStyles.Platinum;
  if (label.startsWith('Gold')) return rankStyles.Gold;
  if (label.startsWith('Silver')) return rankStyles.Silver2;
  return rankStyles.Bronze1;
}

function initials(name: string) {
  return name.split(' ').map(part => part[0]).join('').slice(0, 2);
}

function formatFollowers(value: number) {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${Math.round(value / 1000)}K`;
  return value.toLocaleString();
}

type AiCreatorMatch = {
  creatorId: string;
  score: number;
  reasons: string[];
};

export default function CreatorDiscovery() {
  const { creators, campaigns, engagements, submissions, createEngagement } = useApp();
  const { creatorView, setCreatorView } = useUiStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNiche, setSelectedNiche] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [minFollowers, setMinFollowers] = useState(0);
  const [minEngagement, setMinEngagement] = useState(0);
  const [matchedCreators, setMatchedCreators] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCreatorId, setSelectedCreatorId] = useState<string | null>(null);
  const [matchPrompt, setMatchPrompt] = useState('');
  const [aiMatches, setAiMatches] = useState<AiCreatorMatch[]>([]);
  const [aiMatching, setAiMatching] = useState(false);
  const [aiMatchError, setAiMatchError] = useState('');
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [invitingCreatorId, setInvitingCreatorId] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState('');

  const [supabaseCreators, setSupabaseCreators] = useState<Creator[]>([]);

useEffect(() => {
  async function loadSignedUpCreators() {
    if (!supabase) return;

    const { data, error } = await supabase
      .from('creator_profiles')
      .select('*')
      .eq('onboarding_completed', true);

    if (error) {
      console.error('Failed to load signed-up creators', error);
      return;
    }

    const mappedCreators: Creator[] = (data ?? []).map((profile) => ({
      id: profile.user_id,
      name: profile.creator_name || profile.social_handle || 'Creator',
      bio: profile.bio || 'Campus creator building a verified RollerKluster profile.',
      niche: profile.content_categories?.[0] || 'Campus Lifestyle',
      contentCategories: profile.content_categories?.filter(Boolean) ?? ['Campus life'],
      isScholarshipStudent: profile.is_scholarship_student ?? false,
      platforms: [
        {
          name: profile.platform,
          followers: profile.follower_count ?? 0,
          handle: profile.social_handle || '@creator',
          username: profile.social_handle?.replace(/^@/, '') || 'creator',
          url: profile.social_profile_url || undefined,
        },
      ],
      engagementRate: profile.engagement_rate ?? 0,
      verified: profile.verification_status === 'verified',
      approvalStatus: 'approved',
      badge: profile.creator_rank || 'Bronze1',
      avatar: undefined,
      portfolioItems: [],
      trainingCompleted: [],
      engagementHistory: [],
      reputationScore: profile.follower_count ? Math.min(100, Math.round(profile.follower_count / 5000)) : 0,
      completedEngagements: 0,
      contentQualityScore: 0,
      approvalRate: 0,
      evaluations: [],
      joinedDate: profile.created_at ?? new Date().toISOString(),
    }));

    setSupabaseCreators(mappedCreators);
  }

  loadSignedUpCreators();
}, []);

  const allCreators = supabaseCreators.length > 0 ? supabaseCreators : creators;
const approvedCreators = allCreators.filter(c => c.approvalStatus === 'approved');
  const selectedCreator = approvedCreators.find(creator => creator.id === selectedCreatorId);
  const niches = Array.from(new Set(approvedCreators.map(c => c.niche)));
  const platforms = Array.from(new Set(approvedCreators.flatMap(c => c.platforms.map(p => p.name))));
  const inviteCampaigns = campaigns.filter(campaign => campaign.status === 'open' || campaign.status === 'in_progress');
  const aiMatchedCreators = aiMatches
    .map(match => {
      const creator = approvedCreators.find(item => item.id === match.creatorId);
      return creator ? { creator, match } : null;
    })
    .filter((item): item is { creator: Creator; match: AiCreatorMatch } => Boolean(item));

  const filteredCreators = useMemo(() => {
    return [...approvedCreators]
      .filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.bio.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.niche.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .filter(c => !selectedNiche || c.niche === selectedNiche)
      .filter(c => !selectedPlatform || c.platforms.some(p => p.name === selectedPlatform))
      .filter(c => !verifiedOnly || c.verified)
      .filter(c => !availableOnly || c.completedEngagements < 6)
      .filter(c => c.engagementRate >= minEngagement)
      .filter(c => c.platforms.reduce((sum, platform) => sum + platform.followers, 0) >= minFollowers)
      .sort((a, b) => b.reputationScore - a.reputationScore);
  }, [approvedCreators, searchTerm, selectedNiche, selectedPlatform, verifiedOnly, availableOnly, minFollowers, minEngagement]);

  const topPerformerCount = approvedCreators.filter(c => {
    const label = rankLabel(c.badge);
    return label === 'Platinum' || label.startsWith('Gold');
  }).length;
  const verifiedCount = approvedCreators.filter(c => c.verified).length;
  const totalReach = approvedCreators.reduce(
    (sum, creator) => sum + creator.platforms.reduce((platformSum, platform) => platformSum + platform.followers, 0),
    0,
  );

  const findCreatorMatches = async () => {
    const prompt = matchPrompt.trim();
    if (!prompt) {
      setAiMatchError('Describe what kind of creators the brand needs.');
      return;
    }
    setAiMatching(true);
    setAiMatchError('');
    setInviteError('');
    try {
      const { data, error: sessionError } = supabase ? await supabase.auth.getSession() : { data: { session: null }, error: null };
      if (sessionError || !data.session?.access_token) {
        throw new Error(sessionError?.message ?? 'Sign in as a brand before matching creators.');
      }
      const response = await fetch('/api/creator-matching', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${data.session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          creators: approvedCreators.map(creator => ({
            id: creator.id,
            name: creator.name,
            bio: creator.bio,
            niche: creator.niche,
            categories: creator.contentCategories ?? [creator.niche],
            platforms: creator.platforms.map(platform => ({
              name: platform.name,
              followers: platform.followers,
              handle: platform.handle,
            })),
            engagementRate: creator.engagementRate,
            verified: creator.verified,
            rank: rankLabel(creator.badge),
            reputationScore: creator.reputationScore,
            contentQualityScore: creator.contentQualityScore,
            completedEngagements: creator.completedEngagements,
          })),
        }),
      });
      if (!response.ok) {
        const detail = await response.text();
        throw new Error(detail || 'Could not match creators.');
      }
      const payload = await response.json() as { matches?: AiCreatorMatch[] };
      setAiMatches(payload.matches ?? []);
    } catch (error) {
      setAiMatchError(error instanceof Error ? error.message : 'Could not match creators.');
    } finally {
      setAiMatching(false);
    }
  };

  const inviteCreator = async (creator: Creator, score: number) => {
    setInviteError('');
    if (!selectedCampaignId) {
      setInviteError('Choose a campaign before inviting creators.');
      return;
    }
    setInvitingCreatorId(creator.id);
    try {
      await createEngagement(selectedCampaignId, creator.id, score);
      setMatchedCreators(current => current.includes(creator.id) ? current : [...current, creator.id]);
    } catch (error) {
      setInviteError(error instanceof Error ? error.message : 'Could not send invite.');
    } finally {
      setInvitingCreatorId(null);
    }
  };

  return (
    <div className="flex h-screen ecosystem-shell">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="page-wrap">
          <header className="page-header">
            <div>
              <p className="section-label">Creator supply layer</p>
              <h1 className="page-title mt-2">Creator discovery</h1>
              <p className="page-description">
                Browse approved creators by fit, audience, and readiness. Use filters only when you need to narrow the pool.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-px overflow-hidden rounded-[12px] border border-border bg-border">
              <div className="bg-white p-3">
                <p className="text-lg font-semibold leading-none">{approvedCreators.length}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">Approved</p>
              </div>
              <div className="bg-white p-3">
                <p className="text-lg font-semibold leading-none">{verifiedCount}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">Verified</p>
              </div>
              <div className="bg-white p-3">
                <p className="text-lg font-semibold leading-none">{formatFollowers(totalReach)}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">Reach</p>
              </div>
            </div>
          </header>

          <div className="space-y-5">
            <section className="space-y-4">
              <div className="panel overflow-hidden">
                <div className="border-b border-border px-5 py-4">
                  <div className="flex items-center gap-2">
                    <span className="flex size-8 items-center justify-center rounded-[9px] bg-secondary text-primary">
                      <Sparkles className="size-4" />
                    </span>
                    <div>
                      <h2 className="section-heading">AI creator matching</h2>
                      <p className="section-subtitle">Tell the AI what the brand wants and get ranked creator matches.</p>
                    </div>
                  </div>
                </div>
                <div className="grid gap-3 p-4 lg:grid-cols-[minmax(0,1fr)_240px_auto] lg:items-center">
                  <div className="relative">
                    <Sparkles className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-primary" />
                    <Input
                      value={matchPrompt}
                      onChange={(event) => setMatchPrompt(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') void findCreatorMatches();
                      }}
                      placeholder="Example: Find beauty TikTok creators with strong engagement for AU students"
                      className="h-11 rounded-[10px] border-border bg-muted/35 pl-9"
                    />
                  </div>
                  <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
                    <SelectTrigger className="h-11 rounded-[10px] border-border bg-white">
                      <SelectValue placeholder={inviteCampaigns.length ? 'Campaign to invite to' : 'No active campaigns'} />
                    </SelectTrigger>
                    <SelectContent>
                      {inviteCampaigns.map(campaign => (
                        <SelectItem key={campaign.id} value={campaign.id}>{campaign.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button className="h-11 bg-primary text-white" onClick={() => void findCreatorMatches()} disabled={aiMatching}>
                    {aiMatching ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                    Match creators
                  </Button>
                </div>
                {(aiMatchError || inviteError) && (
                  <div className="border-t border-border px-5 py-3 text-sm font-semibold text-red-600">
                    {aiMatchError || inviteError}
                  </div>
                )}
                {aiMatchedCreators.length > 0 && (
                  <div className="border-t border-border">
                    <div className="flex items-center justify-between gap-3 px-5 py-4">
                      <div>
                        <p className="text-sm font-semibold">Best matches</p>
                        <p className="text-xs text-muted-foreground">{aiMatchedCreators.length} creators ranked for this request</p>
                      </div>
                      <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => setAiMatches([])}>
                        Clear
                      </Button>
                    </div>
                    <div className="grid gap-3 px-4 pb-4 lg:grid-cols-2">
                      {aiMatchedCreators.map(({ creator, match }) => {
                        const primaryPlatform = creator.platforms.reduce((largest, platform) => platform.followers > largest.followers ? platform : largest, creator.platforms[0]);
                        return (
                          <div key={creator.id} className="rounded-[10px] border border-border bg-white p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex min-w-0 gap-3">
                                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
                                  {initials(creator.name)}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="truncate text-sm font-semibold">{creator.name}</p>
                                    <Badge variant="secondary" className="rounded-full">{match.score}% fit</Badge>
                                  </div>
                                  <p className="mt-1 text-xs font-semibold text-primary">{creator.niche}</p>
                                  <p className="mt-1 text-xs text-muted-foreground">{primaryPlatform?.name ?? 'Platform'} · {formatFollowers(primaryPlatform?.followers ?? 0)} followers · {creator.engagementRate}% engagement</p>
                                </div>
                              </div>
                            </div>
                            <div className="mt-4 space-y-2">
                              {match.reasons.slice(0, 3).map(reason => (
                                <div key={reason} className="flex gap-2 text-sm leading-5 text-muted-foreground">
                                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                                  <p>{reason}</p>
                                </div>
                              ))}
                            </div>
                            <div className="mt-4 flex flex-wrap justify-end gap-2">
                              <Button variant="outline" size="sm" className="border-border bg-white" onClick={() => setSelectedCreatorId(creator.id)}>
                                View profile
                              </Button>
                              <Button size="sm" className="bg-primary text-white" onClick={() => void inviteCreator(creator, match.score)} disabled={invitingCreatorId === creator.id}>
                                {invitingCreatorId === creator.id ? <Loader2 className="size-3.5 animate-spin" /> : <Handshake className="size-3.5" />}
                                Invite
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="panel p-4">
                <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto] lg:items-center">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search by creator, category, platform, or capability..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="h-10 rounded-[8px] border-border bg-muted/40 pl-9 shadow-none"
                    />
                  </div>
                  <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="h-10 justify-start border-border bg-white lg:w-auto">
                    <SlidersHorizontal className="size-4" />
                    {showFilters ? 'Hide filters' : 'Show filters'}
                  </Button>
                  <div className="flex rounded-[10px] border border-border bg-white p-1">
                    <button type="button" onClick={() => setCreatorView('list')} className={cn('flex size-8 items-center justify-center rounded-[8px] transition', creatorView === 'list' ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-muted')}>
                      <List className="size-4" />
                    </button>
                    <button type="button" onClick={() => setCreatorView('grid')} className={cn('flex size-8 items-center justify-center rounded-[8px] transition', creatorView === 'grid' ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-muted')}>
                      <Grid2X2 className="size-4" />
                    </button>
                  </div>
                </div>

                {showFilters && <div className="mt-4 grid gap-3 border-t border-border pt-4 lg:grid-cols-[90px_1fr]">
                  <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                    <Filter className="size-3.5" />
                    Category
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <FilterButton active={selectedNiche === null} onClick={() => setSelectedNiche(null)}>All</FilterButton>
                    {niches.map(niche => (
                      <FilterButton key={niche} active={selectedNiche === niche} onClick={() => setSelectedNiche(niche)}>
                        {niche}
                      </FilterButton>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">Platform</div>
                  <div className="flex flex-wrap gap-2">
                    <FilterButton active={selectedPlatform === null} onClick={() => setSelectedPlatform(null)}>All</FilterButton>
                    {platforms.map(platform => (
                      <FilterButton key={platform} active={selectedPlatform === platform} onClick={() => setSelectedPlatform(platform)}>
                        {platform}
                      </FilterButton>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">Readiness</div>
                  <div className="flex flex-wrap gap-2">
                    <FilterButton active={verifiedOnly} onClick={() => setVerifiedOnly(!verifiedOnly)}>Verified creators</FilterButton>
                    <FilterButton active={availableOnly} onClick={() => setAvailableOnly(!availableOnly)}>Available</FilterButton>
                    <FilterButton active={minFollowers >= 100000} onClick={() => setMinFollowers(minFollowers >= 100000 ? 0 : 100000)}>100K+ followers</FilterButton>
                    <FilterButton active={minEngagement >= 6} onClick={() => setMinEngagement(minEngagement >= 6 ? 0 : 6)}>6%+ engagement</FilterButton>
                  </div>
                </div>}
              </div>

              <div className="panel overflow-hidden">
                {filteredCreators.length === 0 ? (
                  <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
                    <Users className="mb-3 size-8 text-muted-foreground/50" />
                    <p className="text-sm font-medium">No creators match this capability filter</p>
                    <p className="mt-1 text-sm text-muted-foreground">Adjust category, platform, readiness, or reach requirements.</p>
                  </div>
                ) : (
                  <div className={cn(creatorView === 'list' ? 'divide-y divide-border' : 'grid gap-3 p-4 md:grid-cols-2')}>
                    {filteredCreators.map(creator => {
                      const primaryPlatform = creator.platforms.reduce((largest, platform) => platform.followers > largest.followers ? platform : largest, creator.platforms[0]);
                      return (
                        <div
                          key={creator.id}
                          className={cn(
                            'grid gap-4 transition hover:bg-muted/45',
                            creatorView === 'list'
                              ? 'px-5 py-5 lg:grid-cols-[minmax(0,1fr)_170px_170px_210px] lg:items-center'
                              : 'rounded-[12px] border border-border bg-white p-4',
                          )}
                        >
                          <div className="flex min-w-0 items-start gap-3">
                            <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-sm font-semibold text-white">
                              {creator.avatar ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={creator.avatar} alt={creator.name} className="size-full object-cover" />
                              ) : (
                                initials(creator.name)
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="truncate text-sm font-semibold text-foreground">{creator.name}</h3>
                                {creator.verified && (
                                <span className="rank-chip bg-primary/10 text-primary border-primary/20">
                                    <CheckCircle2 className="size-3" />
                                    Verified creator
                                  </span>
                                )}
                                <span className={cn('rank-chip', rankStyle(creator.badge))}>
                                  <RankBadgeIcon rank={rankLabel(creator.badge)} className="size-4" />
                                  {rankLabel(creator.badge)}
                                </span>
                              </div>
                              <p className="mt-1 text-xs font-medium text-primary">{creator.niche}</p>
                              <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{creator.bio}</p>
                            </div>
                          </div>

                          <div>
                            <p className="text-[11px] font-semibold uppercase text-muted-foreground">Primary platform</p>
                            <p className="mt-1 text-sm font-medium">{primaryPlatform.name}</p>
                            <p className="text-xs text-muted-foreground">{formatFollowers(primaryPlatform.followers)} followers</p>
                          </div>

                          <div className="grid grid-cols-3 gap-2 lg:grid-cols-1">
                            <Metric label="Creator score" value={creator.reputationScore} />
                            <Metric label="Engagement rate" value={`${creator.engagementRate}%`} />
                            <Metric label="Readiness" value={creator.contentQualityScore.toFixed(1)} icon={<Star className="size-3 text-amber-500" />} />
                          </div>

                          <div className="flex items-center justify-between gap-2 lg:justify-end">
                            <div className="flex flex-wrap gap-1.5 lg:hidden">
                              {creator.platforms.slice(0, 3).map(platform => (
                                <span key={platform.name} className="platform-pill">{platform.name}</span>
                              ))}
                            </div>
                            <Button
                              variant={matchedCreators.includes(creator.id) ? 'secondary' : 'default'}
                              className="h-8 text-xs"
                              onClick={(event) => {
                                event.stopPropagation();
                                setMatchedCreators((current) => current.includes(creator.id) ? current : [...current, creator.id]);
                              }}
                            >
                              <Handshake className="size-3.5" />
                              {matchedCreators.includes(creator.id) ? 'Shortlisted' : 'Shortlist'}
                            </Button>
                            <Button
                              variant="outline"
                              className="h-8 border-border bg-white text-xs"
                              onClick={() => setSelectedCreatorId(creator.id)}
                            >
                              View profile
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </main>
      {selectedCreator && (
        <CreatorPortfolioOverlay
          creator={selectedCreator}
          campaigns={campaigns}
          engagements={engagements.filter(engagement => engagement.creatorId === selectedCreator.id)}
          submissions={submissions}
          onInvite={(campaignId) => createEngagement(campaignId, selectedCreator.id, selectedCreator.reputationScore)}
          onClose={() => setSelectedCreatorId(null)}
        />
      )}
    </div>
  );
}

function FilterButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-1.5 text-xs font-semibold transition',
        active
          ? 'border-primary bg-primary text-white'
          : 'border-border bg-white text-muted-foreground hover:border-primary/20 hover:text-primary',
      )}
    >
      {children}
    </button>
  );
}

function Metric({ label, value, icon }: { label: string; value: string | number; icon?: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-foreground">{value}{icon}</p>
    </div>
  );
}

function CreatorPortfolioOverlay({
  creator,
  campaigns,
  engagements,
  submissions,
  onInvite,
  onClose,
}: {
  creator: Creator;
  campaigns: Campaign[];
  engagements: Engagement[];
  submissions: Submission[];
  onInvite: (campaignId: string) => void;
  onClose: () => void;
}) {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteCampaignId, setInviteCampaignId] = useState('');
  const { month, year } = getMonthYear();
  const monthlyPerformance = getCreatorMonthlyPerformance(creator, submissions, campaigns, month, year);
  const creatorSubmissions = getCreatorMonthlySubmissionsForDisplay(creator.id, submissions, month, year);
  const approvedSubmissions = creatorSubmissions.filter(isSubmissionApproved);
  const totalFollowers = creator.platforms.reduce((sum, platform) => sum + platform.followers, 0);
  const primaryPlatform = creator.platforms.reduce((largest, platform) => platform.followers > largest.followers ? platform : largest, creator.platforms[0]);
  const invitedCampaignIds = new Set(engagements.filter(engagement => engagement.status !== 'declined').map(engagement => engagement.campaignId));
  const inviteCampaigns = campaigns
    .filter(campaign => campaign.status === 'open' || campaign.status === 'in_progress')
    .filter(campaign => !invitedCampaignIds.has(campaign.id));
  const activeInvitations = engagements
    .filter(engagement => engagement.status === 'matched' || engagement.status === 'in_discussion' || engagement.status === 'accepted' || engagement.status === 'active')
    .map(engagement => campaigns.find(campaign => campaign.id === engagement.campaignId))
    .filter((campaign): campaign is Campaign => Boolean(campaign));
  const skillTags = [
    creator.niche,
    'Campus storytelling',
    'Short-form video',
    'Student lifestyle',
    'Brand-safe content',
    'Campaign CTA',
    ...creator.platforms.slice(0, 2).map(platform => platform.name),
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-slate-950/40 p-0 sm:p-4">
      <div className="relative mx-auto grid min-h-dvh w-full max-w-[980px] transform-gpu overflow-hidden border border-border bg-white shadow-xl sm:my-6 sm:min-h-0 sm:rounded-[16px] lg:grid-cols-[330px_minmax(0,1fr)]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex size-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
          aria-label="Close creator profile"
        >
          <X className="size-4" />
        </button>

        <aside className="border-b border-border bg-muted/25 p-4 sm:p-6 lg:border-b-0 lg:border-r">
          <div className="overflow-hidden rounded-[12px] border border-border bg-white">
            <div className="aspect-[4/5] bg-[linear-gradient(145deg,#f7ecfb,#f8fafc)]">
              {creator.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={creator.avatar} alt={creator.name} className="size-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <div className="flex size-28 items-center justify-center rounded-full bg-primary text-4xl font-semibold text-white shadow-sm">
                    {initials(creator.name)}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <OverlayInfo icon={<DollarSign className="size-4" />} label="Rank status" value={monthlyPerformance.currentRank} />
            <OverlayInfo icon={<ShieldCheck className="size-4" />} label="Category / niche" value={creator.niche} />
            <OverlayInfo icon={<TrendingUp className="size-4" />} label="Engagement rate" value={`${creator.engagementRate}%`} />
            <OverlayInfo icon={<Users className="size-4" />} label="Follower count" value={formatFollowers(totalFollowers)} />
            <OverlayInfo icon={<Briefcase className="size-4" />} label="Content style" value="Campus lifestyle, reels, stories" />
          </div>

          <div className="mt-6 border-t border-border pt-5">
            <h3 className="text-sm font-semibold text-foreground">Platforms</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {creator.platforms.map(platform => (
                <PlatformProfileCard key={`${platform.name}-${platform.handle}`} platform={platform} />
              ))}
            </div>
          </div>

          <div className="mt-6 border-t border-border pt-5">
            <h3 className="text-sm font-semibold text-foreground">Contacts</h3>
            <a className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-primary" href={`mailto:${creator.name.toLowerCase().replace(/\s+/g, '.')}@rollerkluster.com`}>
              <Mail className="size-4" />
              {creator.name.toLowerCase().replace(/\s+/g, '.')}@rollerkluster.com
            </a>
            {primaryPlatform && (
              <p className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                <ExternalLink className="size-4" />
                {primaryPlatform.handle}
              </p>
            )}
          </div>
        </aside>

        <main className="min-w-0 p-4 sm:p-6">
          <header className="border-b border-border pb-5">
            <div className="flex items-start justify-between gap-4 pr-10">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-semibold tracking-normal text-foreground sm:text-2xl">{creator.name}</h2>
                  {creator.verified && <CheckCircle2 className="size-5 text-primary" />}
                </div>
                <p className="mt-1 text-sm font-semibold text-muted-foreground">{monthlyPerformance.currentRank} Campus Creator</p>
              </div>
              <Button variant="ghost" size="icon" className="shrink-0">
                <MoreHorizontal className="size-4" />
              </Button>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button className="bg-primary text-white">
                <Mail className="size-4" />
                Message
              </Button>
              <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="border-border bg-white">
                    Invite to Campaign
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invite {creator.name} to a campaign</DialogTitle>
                    <DialogDescription>
                      Send a campaign invitation that will appear on the creator side.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-3">
                    <Select value={inviteCampaignId} onValueChange={setInviteCampaignId}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={inviteCampaigns.length ? 'Choose campaign' : 'No available campaigns'} />
                      </SelectTrigger>
                      <SelectContent>
                        {inviteCampaigns.map(campaign => (
                          <SelectItem key={campaign.id} value={campaign.id}>
                            {campaign.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {activeInvitations.length > 0 && (
                      <div className="rounded-[10px] border border-blue-100 bg-blue-50 p-3 text-sm text-blue-800">
                        Already invited to {activeInvitations.map(campaign => campaign.title).join(', ')}.
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button
                      className="bg-primary text-white"
                      disabled={!inviteCampaignId}
                      onClick={() => {
                        if (!inviteCampaignId) return;
                        onInvite(inviteCampaignId);
                        setInviteCampaignId('');
                        setInviteOpen(false);
                      }}
                    >
                      Send invitation
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <p className="mt-5 max-w-2xl text-sm leading-6 text-muted-foreground">{creator.bio}</p>
          </header>

          <section className="grid gap-3 border-b border-border py-5 sm:grid-cols-2 xl:grid-cols-4">
            <OverlayStat label="Rank Progress" value={`${monthlyPerformance.rankProgressPercentage}%`} />
            <OverlayStat label="Approved" value={monthlyPerformance.totalContentApproved} />
            <OverlayStat label="Monthly Views" value={formatFollowers(monthlyPerformance.totalViews)} />
            <OverlayStat label="Creator Score" value={creator.reputationScore} />
          </section>

          <section className="border-b border-border py-5">
            <h3 className="text-sm font-semibold text-foreground">Approved Content Examples</h3>
            <div className="mt-4 space-y-3">
              {approvedSubmissions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No approved content examples yet.</p>
              ) : approvedSubmissions.slice(0, 3).map(submission => {
                const campaign = campaigns.find(item => item.id === submission.campaignId);
                return (
                  <a key={submission.id} href={submission.contentUrl ?? submission.link} target="_blank" rel="noreferrer" className="block rounded-[10px] border border-border bg-white p-3 transition hover:bg-muted/35">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{submission.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{campaign?.title ?? 'Campaign'} · {submission.platform ?? 'Content'}</p>
                      </div>
                      <p className="shrink-0 text-xs font-semibold text-primary">{(submission.views ?? 0).toLocaleString()} views</p>
                    </div>
                  </a>
                );
              })}
            </div>
          </section>

          <section className="border-b border-border py-5">
            <h3 className="text-sm font-semibold text-foreground">Skills / Content Categories</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {Array.from(new Set(skillTags)).map(tag => (
                <Badge key={tag} variant="outline" className="rounded-full border-border bg-white">{tag}</Badge>
              ))}
            </div>
          </section>

          <section className="py-5">
            <h3 className="text-sm font-semibold text-foreground">Performance Summary</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <OverlayStat label="Impressions" value={formatFollowers(monthlyPerformance.totalImpressions)} />
              <OverlayStat label="Avg. Engagement" value={`${monthlyPerformance.averageEngagementRate}%`} />
              <OverlayStat label="Completion Rate" value={`${creator.completedEngagements ? 92 : 0}%`} />
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function OverlayInfo({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 text-muted-foreground">{icon}</div>
      <div>
        <p className="text-sm font-semibold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function PlatformProfileCard({ platform }: { platform: Creator['platforms'][number] }) {
  const Icon = getPlatformIcon(platform.name);
  const logoSrc = getPlatformLogo(platform.name);
  const clickable = Boolean(platform.url);
  const content = logoSrc ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={logoSrc} alt={`${platform.name} logo`} className="size-6 object-contain" />
  ) : (
    <Icon className="size-5" />
  );

  if (!clickable) {
    return (
      <div className="flex size-11 items-center justify-center rounded-[10px] border border-border bg-white text-muted-foreground opacity-50">
        {content}
      </div>
    );
  }

  return (
    <a
      href={platform.url}
      target="_blank"
      rel="noreferrer"
      className="flex size-11 cursor-pointer items-center justify-center rounded-[10px] border border-border bg-white text-primary transition hover:-translate-y-0.5 hover:border-primary/20 hover:bg-blue-50 hover:shadow-sm"
      aria-label={`Open ${platform.name} profile for ${platform.handle}`}
    >
      {content}
    </a>
  );
}

function getPlatformLogo(platform: string) {
  if (platform === 'Instagram') return '/platforms/instagram.png';
  if (platform === 'TikTok') return '/platforms/tiktok.png';
  if (platform === 'YouTube') return '/platforms/youtube.png';
  return undefined;
}

function getPlatformIcon(platform: string) {
  if (platform === 'Facebook') return Facebook;
  if (platform === 'LinkedIn') return Linkedin;
  if (platform === 'Twitter' || platform === 'X') return Twitter;
  if (platform === 'Twitch') return Twitch;
  return ExternalLink;
}

function OverlayStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}
