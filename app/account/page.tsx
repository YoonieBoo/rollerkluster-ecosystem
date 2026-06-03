'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/sidebar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { UserCircle, Plus, Link as LinkIcon, Upload } from 'lucide-react';
import { useUiStore } from '@/lib/ui-store';
import { useApp } from '@/lib/app-context';

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
                  <Badge className="rounded-full bg-blue-50 text-blue-700 hover:bg-blue-50">Brand Side</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">manager@rollerkluster.com</p>
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
  const { addCreator } = useApp();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    name: '',
    bio: '',
    niche: '',
    platform: 'Instagram',
    handle: '',
    followers: '10000',
    portfolio: '',
  });

  const submitProfile = () => {
    if (!form.name || !form.bio || !form.niche || !form.handle) return;
    addCreator({
      name: form.name,
      bio: form.bio,
      niche: form.niche,
      platforms: [{
        name: form.platform as any,
        handle: form.handle,
        followers: Number(form.followers) || 0,
      }],
      avatar: undefined,
      engagementRate: 0,
      portfolioItems: form.portfolio.split('\n').map(item => item.trim()).filter(Boolean),
      trainingCompleted: [],
      engagementHistory: [],
      badge: undefined,
    });
    setSaved(true);
  };

  return (
    <div className="flex h-screen ecosystem-shell">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="page-wrap max-w-[980px]">
          <header className="page-header">
            <div>
              <p className="section-label">Creator ecosystem portal</p>
              <h1 className="page-title mt-2">Create your creator profile</h1>
              <p className="page-description">Set up your profile, content category, social platform, and portfolio so operations can review you for campaigns.</p>
            </div>
            {saved && <Badge className="rounded-full bg-amber-50 text-amber-700 hover:bg-amber-50">Submitted for approval</Badge>}
          </header>

          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <Card className="p-6">
              <div className="grid gap-4">
                <Field label="Creator name">
                  <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Yoonie" />
                </Field>
                <Field label="Content category">
                  <Input value={form.niche} onChange={(event) => setForm({ ...form, niche: event.target.value })} placeholder="Fashion, Beauty, Fitness..." />
                </Field>
                <Field label="Creator bio">
                  <Textarea value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} placeholder="Describe your audience, content style, and campaign strengths." />
                </Field>
                <div className="grid gap-4 md:grid-cols-3">
                  <Field label="Platform">
                    <Input value={form.platform} onChange={(event) => setForm({ ...form, platform: event.target.value })} placeholder="Instagram" />
                  </Field>
                  <Field label="Handle">
                    <Input value={form.handle} onChange={(event) => setForm({ ...form, handle: event.target.value })} placeholder="@yourhandle" />
                  </Field>
                  <Field label="Followers">
                    <Input value={form.followers} onChange={(event) => setForm({ ...form, followers: event.target.value })} inputMode="numeric" />
                  </Field>
                </div>
                <Field label="Portfolio links or highlights">
                  <Textarea value={form.portfolio} onChange={(event) => setForm({ ...form, portfolio: event.target.value })} placeholder={'Paste one link or portfolio item per line.\nProduct review reel\nhttps://...'} />
                </Field>
                <Button onClick={submitProfile} className="w-fit bg-primary">
                  <Plus className="size-4" />
                  Submit creator profile
                </Button>
              </div>
            </Card>

            <aside className="space-y-4">
              <div className="panel p-5">
                <Upload className="mb-3 size-5 text-primary" />
                <h2 className="section-heading">Portfolio upload</h2>
                <p className="section-subtitle">Portfolio links and highlights are saved to your profile for review.</p>
              </div>
              <div className="panel p-5">
                <LinkIcon className="mb-3 size-5 text-primary" />
                <h2 className="section-heading">Social connection</h2>
                <p className="section-subtitle">Add handles and follower counts so campaign managers can assess audience fit.</p>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold">{label}</span>
      {children}
    </label>
  );
}
