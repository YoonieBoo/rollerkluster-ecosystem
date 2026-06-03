'use client';

import { Sidebar } from '@/components/sidebar';
import { useApp } from '@/lib/app-context';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Activity, BarChart3, Target, TrendingUp, type LucideIcon } from 'lucide-react';

export default function AnalyticsPage() {
  const { creators, campaigns, engagements } = useApp();
  const approvedCreators = creators.filter(c => c.approvalStatus === 'approved');
  const completed = engagements.filter(e => e.status === 'completed').length;

  const performanceData = campaigns.map((campaign) => {
    const campaignEngagements = engagements.filter(e => e.campaignId === campaign.id);
    return {
      name: campaign.brand,
      matches: campaignEngagements.length,
      completion: campaign.status === 'completed' ? 100 : Math.min(90, campaignEngagements.length * 34),
      budget: Math.round(campaign.budget / 1000),
    };
  });

  const creatorQuality = approvedCreators.map((creator) => ({
    name: creator.name.split(' ')[0],
    score: creator.reputationScore,
    quality: Math.round(creator.contentQualityScore * 20),
    reliability: creator.approvalRate,
  }));
  const summaryStats: { label: string; value: number; detail: string; Icon: LucideIcon }[] = [
    {
      label: 'Readiness average',
      value: Math.round(approvedCreators.reduce((sum, c) => sum + c.contentQualityScore, 0) / Math.max(approvedCreators.length, 1) * 20),
      detail: 'Creator readiness index',
      Icon: TrendingUp,
    },
    { label: 'Completed engagements', value: completed, detail: 'Finished collaborations', Icon: Target },
    { label: 'Active engagement pipeline', value: engagements.length - completed, detail: 'Assignments in motion', Icon: Activity },
    { label: 'Campaign demand', value: campaigns.length, detail: 'Brand requests managed', Icon: BarChart3 },
  ];

  return (
    <div className="flex h-screen ecosystem-shell">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-[1440px] px-7 py-6">
          <header className="mb-6 border-b border-border pb-5">
            <p className="section-label">Ecosystem visibility</p>
            <h1 className="mt-2 text-[30px] font-semibold leading-tight">Operational visibility</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Supporting visibility for creator readiness, engagement progress, and structured campaign execution.
            </p>
          </header>

          <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {summaryStats.map(({ label, value, detail, Icon }) => (
              <Card key={label} className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">{label}</p>
                    <p className="mt-2 text-2xl font-semibold">{value}</p>
                    <p className="mt-2 text-xs text-muted-foreground">{detail}</p>
                  </div>
                  <Icon className="size-4 text-primary" />
                </div>
              </Card>
            ))}
          </section>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <Card className="p-5">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold">Engagement movement</h2>
                  <p className="text-sm text-muted-foreground">Creator assignments and completion progress by brand request.</p>
                </div>
                <Badge variant="secondary" className="rounded-full">Recharts</Badge>
              </div>
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Area type="monotone" dataKey="completion" stroke="#4f46e5" fill="#c7d2fe" />
                    <Area type="monotone" dataKey="matches" stroke="#2563eb" fill="#dbeafe" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-5">
              <div className="mb-5">
                <h2 className="text-base font-semibold">Creator readiness mix</h2>
                <p className="text-sm text-muted-foreground">Creator score, readiness, and reliability by approved creator.</p>
              </div>
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={creatorQuality}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Bar dataKey="score" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="reliability" fill="#10b981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
