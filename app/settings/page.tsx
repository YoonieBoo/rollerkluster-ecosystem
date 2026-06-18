'use client';

import { Sidebar } from '@/components/sidebar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Settings } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="flex h-screen ecosystem-shell">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="page-wrap max-w-[1100px]">
          <header className="page-header">
            <div>
              <p className="section-label">Brand settings</p>
              <h1 className="page-title mt-2">Campaign controls</h1>
              <p className="page-description">Configure creator readiness rules, campaign matching preferences, and brand alerts.</p>
            </div>
          </header>

          <div className="grid gap-5 lg:grid-cols-2">
            {[
              ['Suggest creator assignments', 'Use fit score, content category, platform coverage, reliability, and compliance signals.'],
              ['Require readiness before engagement', 'Prevent creators from entering engagements until required modules are complete.'],
              ['Notify campaign owners on badge changes', 'Send alerts when creators progress or need profile review.'],
              ['Profile review gate', 'Route creators requiring quality control through review before brand assignment.'],
            ].map(([title, detail], index) => (
              <Card key={title} className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Label className="text-sm font-semibold">{title}</Label>
                    <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
                  </div>
                  <Switch defaultChecked={index !== 3} />
                </div>
              </Card>
            ))}
          </div>

          <Card className="mt-5 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-[12px] bg-primary text-white">
                  <Settings className="size-4" />
                </div>
                <div>
                  <h2 className="text-base font-semibold">RollerKluster campaign controls</h2>
                  <p className="text-sm text-muted-foreground">Structured creator collaboration defaults are enabled.</p>
                </div>
              </div>
              <Button>Save settings</Button>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
