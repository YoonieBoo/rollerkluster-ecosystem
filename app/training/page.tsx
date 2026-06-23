'use client';

import { useMemo, useState } from 'react';
import { Sidebar } from '@/components/sidebar';
import { useApp } from '@/lib/app-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, CheckCircle2, Clock3, GraduationCap, PlayCircle, ShieldCheck, Users } from 'lucide-react';
import { useUiStore } from '@/lib/ui-store';
import { cn } from '@/lib/utils';

export default function TrainingHub() {
  const { trainingModules, creators, completeTrainingModule } = useApp();
  const { activeRole } = useUiStore();
  const demoCreatorId = 'creator-1';
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', ...Array.from(new Set(trainingModules.map(module => module.category)))];
  const activeCreator = creators.find(creator => creator.id === demoCreatorId);
  const completedByCreator = trainingModules.filter(module => module.completedBy.includes(demoCreatorId));
  const totalMinutes = trainingModules.reduce((sum, module) => sum + module.duration, 0);
  const creatorProgress = Math.round((completedByCreator.length / Math.max(trainingModules.length, 1)) * 100);
  const ecosystemProgress = Math.round(
    trainingModules.reduce((sum, module) => sum + module.completedBy.length / Math.max(creators.length, 1), 0) /
      Math.max(trainingModules.length, 1) * 100,
  );

  const visibleModules = useMemo(
    () => trainingModules.filter(module => selectedCategory === 'All' || module.category === selectedCategory),
    [selectedCategory, trainingModules],
  );
  const nextModule = trainingModules.find(module => !module.completedBy.includes(demoCreatorId));

  return (
    <div className="flex h-screen ecosystem-shell">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="page-wrap">
          <header className="page-header">
            <div>
              <p className="section-label">{activeRole === 'creator' ? 'Creator ecosystem portal' : 'Creator academy'}</p>
              <h1 className="page-title mt-2">{activeRole === 'creator' ? 'Training & readiness' : 'Creator readiness training'}</h1>
              <p className="page-description">
                {activeRole === 'creator'
                  ? 'Complete the modules that prepare you for campaign expectations, communication standards, and professional delivery.'
                  : 'Track onboarding coverage, readiness standards, and creator preparedness across the ecosystem.'}
              </p>
            </div>
            <Badge variant="outline" className="rounded-full border-primary/20 bg-blue-50 px-3 py-1.5 text-primary">
              {activeRole === 'creator' ? `${creatorProgress}% complete` : `${ecosystemProgress}% ecosystem coverage`}
            </Badge>
          </header>

          <section className="mb-6 grid gap-3 md:grid-cols-3">
            <Metric icon={<BookOpen className="size-4" />} label="Modules" value={trainingModules.length} detail="readiness lessons" />
            <Metric icon={<Clock3 className="size-4" />} label="Time required" value={`${Math.round(totalMinutes / 60)}h`} detail={`${totalMinutes} minutes total`} />
            <Metric
              icon={activeRole === 'creator' ? <CheckCircle2 className="size-4" /> : <Users className="size-4" />}
              label={activeRole === 'creator' ? 'Completed' : 'Coverage'}
              value={activeRole === 'creator' ? `${completedByCreator.length}/${trainingModules.length}` : `${ecosystemProgress}%`}
              detail={activeRole === 'creator' ? activeCreator?.name ?? 'Creator progress' : 'creator completion average'}
            />
          </section>

          {activeRole === 'creator' && nextModule && (
            <section className="panel mb-6 overflow-hidden">
              <div className="grid gap-px bg-border lg:grid-cols-[1fr_280px]">
                <div className="bg-white p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="flex size-8 items-center justify-center rounded-full bg-secondary text-primary">
                      <PlayCircle className="size-4" />
                    </span>
                    <p className="text-sm font-semibold text-primary">Next recommended module</p>
                  </div>
                  <h2 className="section-heading">{nextModule.title}</h2>
                  <p className="section-subtitle max-w-3xl">{nextModule.description}</p>
                </div>
                <div className="flex flex-col justify-center bg-white p-5">
                  <p className="text-sm font-semibold">{nextModule.duration} minutes</p>
                  <p className="mt-1 text-xs text-muted-foreground">{nextModule.category}</p>
                  <Button className="mt-4 bg-primary" onClick={() => completeTrainingModule(nextModule.id, demoCreatorId)}>
                    Complete module
                  </Button>
                </div>
              </div>
            </section>
          )}

          <section className="panel overflow-hidden">
            <div className="border-b border-border px-5 py-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="section-heading">Readiness curriculum</h2>
                  <p className="section-subtitle">A focused path from onboarding to campaign-ready delivery.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {categories.map(category => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setSelectedCategory(category)}
                      className={cn(
                        'rounded-full border px-3 py-1.5 text-xs font-semibold transition',
                        selectedCategory === category
                          ? 'border-primary bg-primary text-white'
                          : 'border-border bg-white text-muted-foreground hover:text-primary',
                      )}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="divide-y divide-border">
              {visibleModules.map((module, index) => {
                const completed = module.completedBy.includes(demoCreatorId);
                const completionPercentage = Math.round((module.completedBy.length / Math.max(creators.length, 1)) * 100);
                return (
                  <div key={module.id} className="grid gap-4 px-5 py-5 lg:grid-cols-[56px_1fr_180px_180px] lg:items-center">
                    <div className={cn(
                      'flex size-10 items-center justify-center rounded-full border text-sm font-semibold',
                      completed ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-border bg-muted text-muted-foreground',
                    )}>
                      {completed ? <CheckCircle2 className="size-4" /> : index + 1}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold">{module.title}</h3>
                        <Badge variant="secondary" className="rounded-full">{module.category}</Badge>
                      </div>
                      <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">{module.description}</p>
                    </div>

                    <div>
                      <div className="mb-2 flex items-center justify-between text-xs">
                        <span className="font-semibold text-muted-foreground">{activeRole === 'creator' ? 'Your status' : 'Completion'}</span>
                        <span className="font-semibold">{activeRole === 'creator' ? completed ? 'Done' : 'Open' : `${completionPercentage}%`}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${activeRole === 'creator' ? completed ? 100 : 0 : completionPercentage}%` }} />
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 lg:justify-end">
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                        <Clock3 className="size-3.5" />
                        {module.duration} min
                      </span>
                      <Button
                        variant={completed ? 'outline' : 'default'}
                        size="sm"
                        className={cn('h-9 text-xs', completed ? 'border-border bg-white' : 'bg-primary')}
                        onClick={() => activeRole === 'creator' && completeTrainingModule(module.id, demoCreatorId)}
                      >
                        {activeRole === 'creator' ? completed ? 'Completed' : 'Complete' : 'Review'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="mt-6 grid gap-4 md:grid-cols-2">
            <Guidance icon={<GraduationCap className="size-4" />} title="Campaign expectations" detail="Creators learn deliverable quality, timelines, communication, and approval standards before entering brand work." />
            <Guidance icon={<ShieldCheck className="size-4" />} title="Quality standards" detail="Training progress supports approval decisions, readiness scoring, and long-term ecosystem trust." />
          </section>
        </div>
      </main>
    </div>
  );
}

function Metric({ icon, label, value, detail }: { icon: React.ReactNode; label: string; value: string | number; detail: string }) {
  return (
    <div className="panel p-5">
      <div className="mb-4 flex size-9 items-center justify-center rounded-[10px] bg-secondary text-primary">{icon}</div>
      <p className="text-sm font-semibold text-muted-foreground">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-[-0.02em]">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
    </div>
  );
}

function Guidance({ icon, title, detail }: { icon: React.ReactNode; title: string; detail: string }) {
  return (
    <div className="panel-muted p-5">
      <div className="mb-3 flex size-8 items-center justify-center rounded-full bg-white text-primary">{icon}</div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{detail}</p>
    </div>
  );
}
