'use client';

import { Sidebar } from '@/components/sidebar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserCircle, ExternalLink, ShieldCheck } from 'lucide-react';
import { useUiStore } from '@/lib/ui-store';

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
  const { creatorProfile, sessionEmail } = useUiStore();

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
                  <Badge className="rounded-full bg-primary/10 text-primary hover:bg-blue-50">{creatorProfile?.creatorRank ?? 'Bronze I'}</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Your starting rank has been estimated from your submitted social profile. Future rank progression follows AU Creator Campus activity layers, not follower count.
                </p>

                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  <ProfileMetric label="Platform" value={creatorProfile?.platform ?? 'Not connected'} />
                  <ProfileMetric label="Social handle" value={creatorProfile?.socialHandle ?? 'Not connected'} />
                  <ProfileMetric label="Follower count" value={(creatorProfile?.followerCount ?? 0).toLocaleString()} />
                </div>

                {creatorProfile?.socialProfileUrl && (
                  <Button asChild variant="outline" className="mt-5 border-border bg-white">
                    <a href={creatorProfile.socialProfileUrl} target="_blank" rel="noreferrer">
                      <ExternalLink className="size-4" />
                      Open social profile
                    </a>
                  </Button>
                )}
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
