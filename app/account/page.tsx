'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Sidebar } from '@/components/sidebar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ExternalLink, UserCircle } from 'lucide-react';
import { useUiStore } from '@/lib/ui-store';
import { useT } from '@/lib/language-context';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { calculateStartingRank, onboardingPlatforms, type OnboardingPlatform } from '@/lib/creator-onboarding';
import { getSessionDisplayName } from '@/lib/current-creator';

export default function AccountPage() {
  const { activeRole, sessionEmail, sessionUser, updateAccountName } = useUiStore();
  const [brandEditing, setBrandEditing] = useState(false);
  const [brandSaving, setBrandSaving] = useState(false);
  const [brandError, setBrandError] = useState('');
  const [brandSaved, setBrandSaved] = useState(false);
  const [brandName, setBrandName] = useState('');

  useEffect(() => {
    setBrandName(getSessionDisplayName(sessionUser, sessionEmail));
  }, [sessionEmail, sessionUser]);

  const saveBrandName = async () => {
    setBrandError('');
    setBrandSaved(false);
    setBrandSaving(true);
    try {
      await updateAccountName(brandName);
      setBrandEditing(false);
      setBrandSaved(true);
    } catch (error) {
      setBrandError(error instanceof Error ? error.message : 'Could not update account name.');
    } finally {
      setBrandSaving(false);
    }
  };

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
            <div className="flex flex-col gap-5 md:flex-row md:items-start">
              <div className="flex size-16 items-center justify-center rounded-full bg-primary text-white">
                <UserCircle className="size-8" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold">{brandName || 'Brand account'}</h2>
                  <Badge className="rounded-full bg-primary/10 text-primary hover:bg-blue-50">Brand Side</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">Authenticated brand workspace</p>
                {brandEditing && (
                  <div className="mt-5 max-w-sm">
                    <EditField label="User name" value={brandName} onChange={setBrandName} placeholder="Your display name" />
                  </div>
                )}
                <div className="mt-5 grid gap-3 md:grid-cols-3">
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
                {brandError && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{brandError}</p>}
                {brandSaved && <p className="mt-4 rounded-lg border border-primary/20 bg-primary/10 px-3 py-2 text-sm font-medium text-primary">Account name updated.</p>}
              </div>
              {brandEditing ? (
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Button className="bg-primary text-white" disabled={brandSaving} onClick={() => void saveBrandName()}>{brandSaving ? 'Saving...' : 'Save'}</Button>
                  <Button variant="outline" className="border-border bg-white" disabled={brandSaving} onClick={() => setBrandEditing(false)}>Cancel</Button>
                </div>
              ) : (
                <Button variant="outline" className="border-border bg-white" onClick={() => setBrandEditing(true)}>Edit profile</Button>
              )}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}

function CreatorProfileSetup() {
  const t = useT();
  const { creatorProfile, sessionEmail, updateCreatorProfile } = useUiStore();
  const searchParams = useSearchParams();
  const requestedMode = searchParams.get('mode');
  const opensInEditMode = requestedMode === 'edit' || requestedMode === 'platforms';
  const [editing, setEditing] = useState(opensInEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    creatorName: '',
    platform: 'Instagram' as OnboardingPlatform,
    socialHandle: '',
    socialProfileUrl: '',
    followerCount: '',
    language: '',
    province: '',
    country: '',
  });

  useEffect(() => {
    if (!creatorProfile) return;
    setForm({
      creatorName: creatorProfile.creatorName || sessionEmail.split('@')[0] || '',
      platform: creatorProfile.platform,
      socialHandle: creatorProfile.socialHandle,
      socialProfileUrl: creatorProfile.socialProfileUrl,
      followerCount: String(creatorProfile.followerCount),
      language: creatorProfile.language ?? '',
      province: creatorProfile.province ?? '',
      country: creatorProfile.country ?? '',
    });
  }, [creatorProfile, sessionEmail]);

  useEffect(() => {
    if (opensInEditMode) setEditing(true);
  }, [opensInEditMode]);

  const saveProfile = async () => {
    setError('');
    setSaved(false);
    const followerCount = Number(form.followerCount);
    if (!form.creatorName.trim()) {
      setError(t.addUserName);
      return;
    }
    if (!form.socialHandle.trim()) {
      setError(t.addSocialHandle);
      return;
    }
    if (Number.isNaN(followerCount) || followerCount < 0) {
      setError(t.invalidFollowerCount);
      return;
    }

    setSaving(true);
    try {
      await updateCreatorProfile({
        creatorName: form.creatorName.trim(),
        platform: form.platform,
        socialHandle: form.socialHandle.trim(),
        socialProfileUrl: form.socialProfileUrl.trim(),
        followerCount,
        language: form.language.trim() || undefined,
        province: form.province.trim() || undefined,
        country: form.country.trim() || undefined,
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
  const profileHref = `/creators/${creatorProfile?.userId ?? 'creator-1'}`;
  const pageTitle = editing ? (requestedMode === 'platforms' ? t.updatePlatforms : t.editCreatorProfile) : t.creatorProfile;
  const pageDescription = editing
    ? t.editModeSub
    : t.viewModeSub;

  return (
    <div className="flex h-screen ecosystem-shell">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="page-wrap max-w-[980px]">
          <Link href={profileHref} className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">
            <ArrowLeft className="size-4" />
            {t.backToMyProfile}
          </Link>
          <header className="page-header">
            <div>
              <p className="section-label">{t.creatorEcosystemPortal}</p>
              <h1 className="page-title mt-2">{pageTitle}</h1>
              <p className="page-description">{pageDescription}</p>
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
                  {editing ? t.editFieldsSub : t.viewModeSub}
                </p>

                {editing ? (
                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <EditField label={t.userName} value={form.creatorName} onChange={(creatorName) => setForm(current => ({ ...current, creatorName }))} placeholder="Your display name" />
                    <label className="grid gap-2">
                      <span className="text-xs font-semibold uppercase text-muted-foreground">{t.platform}</span>
                      <Select value={form.platform} onValueChange={(platform) => setForm(current => ({ ...current, platform: platform as OnboardingPlatform }))}>
                        <SelectTrigger className="h-10 bg-white"><SelectValue placeholder={t.choosePlatform} /></SelectTrigger>
                        <SelectContent>{onboardingPlatforms.map(platform => <SelectItem key={platform} value={platform}>{platform}</SelectItem>)}</SelectContent>
                      </Select>
                    </label>
                    <EditField label={t.socialHandle} value={form.socialHandle} onChange={(socialHandle) => setForm(current => ({ ...current, socialHandle }))} placeholder="@yourhandle" />
                    <EditField label={t.profileUrl} value={form.socialProfileUrl} onChange={(socialProfileUrl) => setForm(current => ({ ...current, socialProfileUrl }))} placeholder="https://..." />
                    <EditField label={t.followerCount} value={form.followerCount} onChange={(followerCount) => setForm(current => ({ ...current, followerCount }))} placeholder="15000" inputMode="numeric" />
                    <ProfileMetric label={t.estimatedRank} value={estimatedRank} />
                    <EditField label={t.languageField} value={form.language} onChange={(language) => setForm(current => ({ ...current, language }))} placeholder="e.g. English, Thai" />
                    <EditField label={t.provinceState} value={form.province} onChange={(province) => setForm(current => ({ ...current, province }))} placeholder="e.g. Bangkok" />
                    <EditField label={t.country} value={form.country} onChange={(country) => setForm(current => ({ ...current, country }))} placeholder="e.g. Thailand" />
                  </div>
                ) : (
                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    <ProfileMetric label={t.userName} value={creatorProfile?.creatorName ?? sessionEmail.split('@')[0] ?? 'Creator account'} />
                    <ProfileMetric label={t.platform} value={creatorProfile?.platform ?? 'Not connected'} />
                    <ProfileMetric label={t.socialHandle} value={creatorProfile?.socialHandle ?? 'Not connected'} />
                    <ProfileMetric label={t.followerCount} value={(creatorProfile?.followerCount ?? 0).toLocaleString()} />
                    <ProfileMetric label={t.languageField} value={creatorProfile?.language ?? '—'} />
                    <ProfileMetric label={t.provinceState} value={creatorProfile?.province ?? '—'} />
                    <ProfileMetric label={t.country} value={creatorProfile?.country ?? '—'} />
                  </div>
                )}

                {error && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>}
                {saved && <p className="mt-4 rounded-lg border border-primary/20 bg-primary/10 px-3 py-2 text-sm font-medium text-primary">{t.profileUpdated}</p>}

                <div className="mt-5 flex flex-wrap gap-2">
                  {editing ? (
                    <>
                      <Button className="bg-primary text-white" disabled={saving} onClick={() => void saveProfile()}>{saving ? t.savingProfile : t.saveChanges}</Button>
                      <Button variant="outline" className="border-border bg-white" disabled={saving} onClick={() => setEditing(false)}>{t.cancel}</Button>
                    </>
                  ) : (
                    <>
                      <Button className="bg-primary text-white" onClick={() => setEditing(true)}>{t.editProfile}</Button>
                      {creatorProfile?.socialProfileUrl && (
                        <Button asChild variant="outline" className="border-border bg-white">
                          <a href={creatorProfile.socialProfileUrl} target="_blank" rel="noreferrer">
                            <ExternalLink className="size-4" />
                            {t.openSocialProfile}
                          </a>
                        </Button>
                      )}
                    </>
                  )}
                </div>
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
