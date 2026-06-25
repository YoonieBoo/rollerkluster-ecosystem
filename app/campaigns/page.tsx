'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/sidebar';
import { useApp } from '@/lib/app-context';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, CheckCircle2, Clock, Plus, Search, UserX, Users, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { statusLabel, statusTone } from '@/lib/platform-utils';

export default function CampaignManagement() {
  const { campaigns, engagements, addCampaign } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [showNewCampaign, setShowNewCampaign] = useState(false);
  const [campaignError, setCampaignError] = useState('');
  const [campaignSaving, setCampaignSaving] = useState(false);
  const [campaignForm, setCampaignForm] = useState({
    title: '',
    brand: '',
    description: '',
    budget: '25000',
    startDate: '2024-08-01',
    endDate: '2024-09-30',
    targetNiches: '',
    targetPlatforms: '',
    minFollowers: '50000',
    contentType: '',
    goals: '',
    requirements: '',
  });

  const filteredCampaigns = campaigns
    .filter(c => c.title.toLowerCase().includes(searchTerm.toLowerCase()) || c.brand.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter(c => !selectedStatus || c.status === selectedStatus);
  const campaignStats: { label: string; value: number; Icon: LucideIcon }[] = [
    { label: 'Open campaigns', value: campaigns.filter(c => c.status === 'open' || c.status === 'in_progress').length, Icon: CalendarDays },
    { label: 'Need accepted creators', value: campaigns.filter(c => c.status !== 'completed' && getEngagementSummary(engagements.filter(e => e.campaignId === c.id)).accepted < 2).length, Icon: Users },
    { label: 'Accepted invites', value: engagements.filter(e => e.status === 'accepted' || e.status === 'active' || e.status === 'completed').length, Icon: CheckCircle2 },
  ];

  return (
    <div className="flex h-screen ecosystem-shell">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="page-wrap">
          <header className="page-header">
            <div>
              <p className="section-label">Brand demand layer</p>
              <h1 className="page-title mt-2">Campaigns</h1>
              <p className="page-description">Track brand requests, see which campaigns still need creator coverage, and open the next matching workflow.</p>
            </div>
            <Button className="h-10 bg-primary" onClick={() => setShowNewCampaign(!showNewCampaign)}>
              <Plus className="size-4" />
              New campaign
            </Button>
          </header>

          {showNewCampaign && (
            <section className="panel mb-5 p-5">
              <div className="mb-4">
                <h2 className="section-heading">Create structured campaign brief</h2>
                <p className="section-subtitle">Define goals, creator requirements, deliverables, platforms, budget, and timeline.</p>
              </div>
              <div className="grid gap-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Input placeholder="Campaign title" value={campaignForm.title} onChange={(event) => setCampaignForm({ ...campaignForm, title: event.target.value })} />
                  <Input placeholder="Brand name" value={campaignForm.brand} onChange={(event) => setCampaignForm({ ...campaignForm, brand: event.target.value })} />
                </div>
                <Textarea placeholder="Campaign description and context" value={campaignForm.description} onChange={(event) => setCampaignForm({ ...campaignForm, description: event.target.value })} />
                <div className="grid gap-4 md:grid-cols-4">
                  <Input placeholder="Budget" value={campaignForm.budget} onChange={(event) => setCampaignForm({ ...campaignForm, budget: event.target.value })} />
                  <Input placeholder="Min followers" value={campaignForm.minFollowers} onChange={(event) => setCampaignForm({ ...campaignForm, minFollowers: event.target.value })} />
                  <Input type="date" value={campaignForm.startDate} onChange={(event) => setCampaignForm({ ...campaignForm, startDate: event.target.value })} />
                  <Input type="date" value={campaignForm.endDate} onChange={(event) => setCampaignForm({ ...campaignForm, endDate: event.target.value })} />
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <Input placeholder="Content type / deliverables" value={campaignForm.contentType} onChange={(event) => setCampaignForm({ ...campaignForm, contentType: event.target.value })} />
                  <Input placeholder="Categories, comma separated" value={campaignForm.targetNiches} onChange={(event) => setCampaignForm({ ...campaignForm, targetNiches: event.target.value })} />
                  <Input placeholder="Platforms, comma separated" value={campaignForm.targetPlatforms} onChange={(event) => setCampaignForm({ ...campaignForm, targetPlatforms: event.target.value })} />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Textarea placeholder="Campaign goals, one per line" value={campaignForm.goals} onChange={(event) => setCampaignForm({ ...campaignForm, goals: event.target.value })} />
                  <Textarea placeholder="Creator requirements, one per line" value={campaignForm.requirements} onChange={(event) => setCampaignForm({ ...campaignForm, requirements: event.target.value })} />
                </div>
                {campaignError && (
                  <p className="rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                    {campaignError}
                  </p>
                )}
                <Button
                  className="w-fit bg-primary"
                  disabled={campaignSaving}
                  onClick={async () => {
                    setCampaignError('');
                    if (!campaignForm.title || !campaignForm.brand) return;
                    setCampaignSaving(true);
                    try {
                      await addCampaign({
                        title: campaignForm.title,
                        brand: campaignForm.brand,
                        description: campaignForm.description,
                        budget: Number(campaignForm.budget) || 0,
                        startDate: campaignForm.startDate,
                        endDate: campaignForm.endDate,
                        targetNiches: campaignForm.targetNiches.split(',').map(item => item.trim()).filter(Boolean),
                        targetPlatforms: campaignForm.targetPlatforms.split(',').map(item => item.trim()).filter(Boolean),
                        minFollowers: Number(campaignForm.minFollowers) || 0,
                        contentType: campaignForm.contentType,
                        goals: campaignForm.goals.split('\n').map(item => item.trim()).filter(Boolean),
                        requirements: campaignForm.requirements.split('\n').map(item => item.trim()).filter(Boolean),
                        status: 'open',
                      });
                      setShowNewCampaign(false);
                    } catch (error) {
                      setCampaignError(error instanceof Error ? error.message : 'Could not create campaign.');
                    } finally {
                      setCampaignSaving(false);
                    }
                  }}
                >
                  {campaignSaving ? 'Creating...' : 'Create campaign'}
                </Button>
              </div>
            </section>
          )}

          <section className="metric-strip mb-5 grid-cols-2 lg:grid-cols-3">
            {campaignStats.map(({ label, value, Icon }) => (
              <div key={label} className="metric-cell">
                <div className="mb-3 flex size-8 items-center justify-center rounded-[9px] bg-secondary text-primary">
                  <Icon className="size-4" />
                </div>
                <p className="metric-label">{label}</p>
                <p className="metric-value">{value}</p>
              </div>
            ))}
          </section>

          <div className="panel mb-5 p-4">
            <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="h-10 rounded-[10px] border-border bg-muted/40 pl-9" placeholder="Search campaign objective, brand, or content type..." value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} />
              </div>
              <div className="flex flex-wrap gap-2">
                {[null, 'draft', 'open', 'in_progress', 'completed'].map(status => (
                  <button
                    key={status ?? 'all'}
                    type="button"
                    onClick={() => setSelectedStatus(status)}
                    className={cn('rounded-full border px-3 py-2 text-xs font-semibold transition', selectedStatus === status ? 'border-primary bg-primary text-white' : 'border-border bg-white text-muted-foreground hover:text-primary')}
                  >
                    {status ? statusLabel(status) : 'All'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-3">
            {filteredCampaigns.map(campaign => {
              const campaignEngagements = engagements.filter(e => e.campaignId === campaign.id);
              const summary = getEngagementSummary(campaignEngagements);
              const acceptedTarget = 2;
              const assignmentsNeeded = Math.max(0, acceptedTarget - summary.accepted);
              const completion = campaign.status === 'completed' ? 100 : Math.min(100, Math.round((summary.accepted / acceptedTarget) * 100));
              const spent = Math.round(campaign.budget * completion / 100);

              return (
                <Link key={campaign.id} href={`/campaigns/${campaign.id}`} className="panel grid gap-5 p-5 transition hover:border-primary/30 hover:bg-white md:grid-cols-[1fr_auto] md:items-start lg:grid-cols-[1fr_260px_210px] lg:items-center">
                  <div>
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <h2 className="section-heading">{campaign.title}</h2>
                      <Badge variant="outline" className={cn('rounded-full', statusTone(campaign.status))}>{statusLabel(campaign.status)}</Badge>
                    </div>
                    <p className="text-sm font-medium text-primary">{campaign.brand} campaign request</p>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{campaign.description}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {campaign.targetNiches.map(niche => <Badge key={niche} variant="secondary" className="rounded-full">{niche}</Badge>)}
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between text-xs">
                      <span className="font-semibold text-muted-foreground">Accepted creator coverage</span>
                      <span className="font-semibold">{completion}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${completion}%` }} />
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                      <StatusMini label="Pending" value={summary.pending} Icon={Clock} />
                      <StatusMini label="Accepted" value={summary.accepted} Icon={CheckCircle2} />
                      <StatusMini label="Declined" value={summary.declined} Icon={UserX} />
                    </div>
                  </div>

                  <div className="rounded-[10px] border border-border bg-muted/35 p-4">
                    <p className="text-xs font-semibold text-muted-foreground">End date</p>
                    <p className="mt-1 text-sm font-semibold">{new Date(campaign.endDate).toLocaleDateString()}</p>
                    <p className="mt-3 text-xs font-semibold text-muted-foreground">Next step</p>
                    <p className="mt-1 text-sm font-semibold">{assignmentsNeeded === 0 ? 'Creator coverage accepted' : `${assignmentsNeeded} accepted creator${assignmentsNeeded === 1 ? '' : 's'} needed`}</p>
                    <p className="mt-3 text-xs font-semibold text-muted-foreground">Budget allocation</p>
                    <p className="mt-1 text-sm font-semibold">${(spent / 1000).toFixed(0)}K planned</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}

function getEngagementSummary(campaignEngagements: { status: string }[]) {
  return campaignEngagements.reduce(
    (summary, engagement) => {
      if (engagement.status === 'declined') {
        summary.declined += 1;
      } else if (engagement.status === 'accepted' || engagement.status === 'active' || engagement.status === 'completed') {
        summary.accepted += 1;
      } else {
        summary.pending += 1;
      }
      return summary;
    },
    { pending: 0, accepted: 0, declined: 0 },
  );
}

function StatusMini({ label, value, Icon }: { label: string; value: number; Icon: LucideIcon }) {
  return (
    <div className="min-w-0 rounded-[8px] border border-border bg-white px-2 py-2">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className="size-3.5 shrink-0" />
        <p className="truncate text-[11px] font-semibold">{label}</p>
      </div>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}
