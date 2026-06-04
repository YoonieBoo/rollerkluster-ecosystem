'use client';

import { Sidebar } from '@/components/sidebar';
import { useApp } from '@/lib/app-context';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, UserPlus } from 'lucide-react';
import { TierBadge, formatCompact, initials } from '@/lib/platform-utils';

export default function CreatorDirectoryPage() {
  const { creators } = useApp();

  return (
    <div className="flex h-screen ecosystem-shell">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="page-wrap max-w-[1440px]">
          <header className="page-header">
            <div>
              <p className="section-label">Creator registry</p>
              <h1 className="page-title mt-2">Creator capability registry</h1>
              <p className="mt-1 text-sm text-muted-foreground">Managed record of creator profiles, approval status, platforms, readiness, and engagement history.</p>
            </div>
            <Button className="bg-primary">
              <UserPlus className="size-4" />
              Add creator profile
            </Button>
          </header>

          <div className="panel overflow-x-auto">
            <div className="min-w-[760px]">
            <div className="grid grid-cols-[1fr_130px_130px_150px_120px] border-b border-border px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">
              <span>Creator profile</span>
              <span>Status</span>
              <span>Reach</span>
              <span>Readiness</span>
              <span className="text-right">Profile</span>
            </div>
            <div className="divide-y divide-border">
              {creators.map((creator) => {
                const reach = creator.platforms.reduce((sum, platform) => sum + platform.followers, 0);
                return (
                  <div key={creator.id} className="grid grid-cols-[1fr_130px_130px_150px_120px] items-center px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">{initials(creator.name)}</div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold">{creator.name}</p>
                          {creator.verified && <CheckCircle2 className="size-3.5 text-primary" />}
                        </div>
                        <p className="text-xs text-muted-foreground">@{creator.platforms[0]?.handle.replace('@', '')} · {creator.niche}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="w-fit rounded-full capitalize">{creator.approvalStatus}</Badge>
                    <p className="text-sm font-semibold">{formatCompact(reach)}</p>
                    <div className="flex items-center gap-2">
                      <TierBadge tier={creator.badge} verified={creator.verified} brandView />
                      <span className="text-xs font-semibold text-muted-foreground">{creator.reputationScore}</span>
                    </div>
                    <div className="text-right">
                      <Button asChild variant="outline" size="sm" className="border-border bg-white">
                        <Link href={`/creators/${creator.id}`}>Open</Link>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
