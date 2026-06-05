'use client';

import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/sidebar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserCircle, ExternalLink, ShieldCheck } from 'lucide-react';
import { useUiStore } from '@/lib/ui-store';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { calculateStartingRank, onboardingPlatforms, type OnboardingPlatform } from '@/lib/creator-onboarding';

export default function AccountPage() {
  const { activeRole } = useUiStore();

  if (activeRole === 'creator') return <CreatorProfileSetup />;

  return (
    <div className="flex h-screen ecosystem-shell">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="page-wrap max-w-[980px]">
          <header className="page-header">
            <div>
              <p className="section-label">Account</p>
              <h1 className="page-title mt-2">Brand profile</h1>
              <p className="page-description">Workspace role, permissions, and access across creator discovery, campaign matching, collaborations, and reports.</p>
            </div>
          </header>

          <Card className="p-6">
            <div className="flex items-start gap-5">
              <div className="flex size-16 items-center justify-center rounded-full bg-primary text-white">
                <UserCircle className="size-8" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold">RollerKluster Brand Team</h2>
                  <Badge className="rounded-full bg-primary/10 text-primary hover:bg-blue-50">Brand Side</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">Authenticated brand workspace</p>
                <div className="mt-5 grid grid-cols-3 gap-3">
                  {[
                    ['Role', 'Campaign Owner'],
                    ['Access', 'Creators, Campaigns, Collaborations, Reports'],
                    ['Workspace', 'RollerKluster'],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-[12px] border border-border bg-muted/35 p-4">
                      <p className="text-xs font-semibold uppercase text-muted-foreground">{label}</p>
                      <p className="mt-1 text-sm font-semibold">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
              <Button variant="outline" className="border-border bg-white">Edit profile</Button>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}

function CreatorProfileSetup() {
  const { creatorProfile, sessionEmail, updateCreatorProfile } = useUiStore();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    platform: 'Instagram' as OnboardingPlatform,
    socialHandle: '',
    socialProfileUrl: '',
    followerCount: '',
    engagementRate: '',
  });

  useEffect(() => {
    if (!creatorProfile) return;
    setForm({
      platform: creatorProfile.platform,
      socialHandle: creatorProfile.socialHandle,
      socialProfileUrl: creatorProfile.socialProfileUrl,
      followerCount: String(creatorProfile.followerCount),
      engagementRate: creatorProfile.engagementRate !== undefined ? String(creatorProfile.engagementRate) : '',
    });
  }, [creatorProfile]);

  const saveProfile = async () => {
    setError('');
    setSaved(false);
    const followerCount = Number(form.followerCount);
    const engagementRate = form.engagementRate ? Number(form.engagementRate) : undefined;
    if (!form.socialHandle.trim()) {
      setError('Add your social handle.');
      return;
    }
    if (Number.isNaN(followerCount) || followerCount < 0) {
      setError('Enter a valid follower count.');
      return;
    }
    if (typeof engagementRate === 'number' && Number.isNaN(engagementRate)) {
      setError('Enter a valid engagement rate.');
      return;
    }

    setSaving(true);
    try {
      await updateCreatorProfile({
        platform: form.platform,
        socialHandle: form.socialHandle.trim(),
        socialProfileUrl: form.socialProfileUrl.trim(),
        followerCount,
        engagementRate,
      });
      setEditing(false);
      setSaved(true);
    } catch (profileError) {
      setError(profileError instanceof Error ? profileError.message : 'Could not update creator profile.');
    } finally {
      setSaving(false);
    }
  };

  const estimatedRank = calculateStartingRank(Number(form.followerCount) || creatorProfile?.followerCount || 0);

  return (
    <div className="flex h-screen ecosystem-shell">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="page-wrap max-w-[980px]">
          <header className="page-header">
            <div>
              <p className="section-label">Creator ecosystem portal</p>
              <h1 className="page-title mt-2">Creator profile</h1>
              <p className="page-description">Your submitted social profile and starting rank.</p>
            </div>
          </header>

          <Card className="p-6">
            <div className="flex flex-col gap-6 md:flex-row md:items-start">
              <div className="flex size-16 items-center justify-center rounded-full bg-primary text-white">
                <UserCircle className="size-8" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-semibold">{sessionEmail || 'Creator account'}</h2>
                  <Badge className="rounded-full bg-primary/10 text-primary hover:bg-blue-50">{editing ? estimatedRank : creatorProfile?.creatorRank ?? 'Bronze I'}</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Your starting rank has been estimated from your submitted social profile. Future rank progression follows AU Creator Campus activity layers, not follower count.
                </p>

                {editing ? (
                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <label className="grid gap-2">
                      <span className="text-xs font-semibold uppercase text-muted-foreground">Platform</span>
                      <Select value={form.platform} onValueChange={(platform) => setForm(current => ({ ...current, platform: platform as OnboardingPlatform }))}>
                        <SelectTrigger className="h-10 bg-white"><SelectValue placeholder="Choose platform" /></SelectTrigger>
                        <SelectContent>{onboardingPlatforms.map(platform => <SelectItem key={platform} value={platform}>{platform}</SelectItem>)}</SelectContent>
                      </Select>
                    </label>
                    <EditField label="Social handle" value={form.socialHandle} onChange={(socialHandle) => setForm(current => ({ ...current, socialHandle }))} placeholder="@yourhandle" />
                    <EditField label="Profile URL" value={form.socialProfileUrl} onChange={(socialProfileUrl) => setForm(current => ({ ...current, socialProfileUrl }))} placeholder="https://..." />
                    <EditField label="Follower count" value={form.followerCount} onChange={(followerCount) => setForm(current => ({ ...current, followerCount }))} placeholder="15000" inputMode="numeric" />
                    <EditField label="Engagement rate" value={form.engagementRate} onChange={(engagementRate) => setForm(current => ({ ...current, engagementRate }))} placeholder="7.13" inputMode="decimal" />
                    <ProfileMetric label="Estimated rank" value={estimatedRank} />
                  </div>
                ) : (
                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    <ProfileMetric label="Platform" value={creatorProfile?.platform ?? 'Not connected'} />
                    <ProfileMetric label="Social handle" value={creatorProfile?.socialHandle ?? 'Not connected'} />
                    <ProfileMetric label="Follower count" value={(creatorProfile?.followerCount ?? 0).toLocaleString()} />
                    <ProfileMetric label="Engagement rate" value={creatorProfile?.engagementRate !== undefined ? `${creatorProfile.engagementRate}%` : 'Not added'} />
                  </div>
                )}

                {error && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>}
                {saved && <p className="mt-4 rounded-lg border border-primary/20 bg-primary/10 px-3 py-2 text-sm font-medium text-primary">Profile updated.</p>}

                <div className="mt-5 flex flex-wrap gap-2">
                  {editing ? (
                    <>
                      <Button className="bg-primary text-white" disabled={saving} onClick={() => void saveProfile()}>{saving ? 'Saving...' : 'Save changes'}</Button>
                      <Button variant="outline" className="border-border bg-white" disabled={saving} onClick={() => setEditing(false)}>Cancel</Button>
                    </>
                  ) : (
                    <>
                      <Button className="bg-primary text-white" onClick={() => setEditing(true)}>Edit profile</Button>
                      {creatorProfile?.socialProfileUrl && (
                        <Button asChild variant="outline" className="border-border bg-white">
                          <a href={creatorProfile.socialProfileUrl} target="_blank" rel="noreferrer">
                            <ExternalLink className="size-4" />
                            Open social profile
                          </a>
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
              <div className="rounded-[12px] border border-border bg-muted/35 p-4 md:w-[260px]">
                <ShieldCheck className="mb-3 size-5 text-primary" />
                <p className="text-sm font-semibold">Review status</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">Operations can verify your uploaded social proof and adjust creator rank later if needed.</p>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}

function ProfileMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[12px] border border-border bg-muted/35 p-4">
      <p className="text-xs font-semibold uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold">{value}</p>
    </div>
  );
}

function EditField({
  label,
  value,
  onChange,
  placeholder,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  inputMode?: 'numeric' | 'decimal';
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-semibold uppercase text-muted-foreground">{label}</span>
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        className="h-10 bg-white"
      />
    </label>
  );
}
