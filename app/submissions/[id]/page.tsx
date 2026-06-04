'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { Sidebar } from '@/components/sidebar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useApp } from '@/lib/app-context';
import { cn } from '@/lib/utils';
import { statusTone } from '@/lib/platform-utils';
import { submissionStatusLabel } from '@/lib/creator-performance';

export default function SubmissionDetailPage() {
  const params = useParams();
  const submissionId = params.id as string;
  const { campaigns, submissions } = useApp();
  const submission = submissions.find(item => item.id === submissionId);
  const campaign = submission ? campaigns.find(item => item.id === submission.campaignId) : undefined;

  if (!submission) {
    return (
      <div className="flex h-screen ecosystem-shell">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="page-wrap">
            <Link href="/notifications" className="quiet-link inline-flex items-center gap-2">
              <ArrowLeft className="size-4" />
              Back to inbox
            </Link>
            <div className="panel mt-6 p-8 text-center">
              <p className="text-sm font-semibold">Submission not found</p>
              <p className="mt-1 text-sm text-muted-foreground">This content submission may have been removed or is not available.</p>
            </div>
          </div>
      </main>
    </div>
    );
  }

  const isApproved = submission.status === 'approved';
  const feedback = submission.staffFeedback ?? submission.reviewNotes ?? submission.rejectedReason;

  return (
    <div className="flex h-screen ecosystem-shell">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="page-wrap max-w-[980px]">
          <Link href="/notifications" className="quiet-link inline-flex items-center gap-2">
            <ArrowLeft className="size-4" />
            Back to inbox
          </Link>

          <header className="page-header mt-5">
            <div>
              <p className="section-label">{isApproved ? 'Submission report' : 'Submission detail'}</p>
              <h1 className="page-title mt-2">{submission.title}</h1>
              <p className="page-description mt-2">
                {campaign?.title ?? 'Campaign'} · {submission.platform ?? 'Content'} · {new Date(submission.submissionDate ?? submission.submittedAt).toLocaleDateString()}
              </p>
            </div>
            <Badge variant="outline" className={cn('rounded-full', statusTone(submission.status))}>
              {submissionStatusLabel(submission.status)}
            </Badge>
          </header>

          <section className="grid gap-5 lg:grid-cols-[1fr_320px]">
            <div className="panel p-5">
              <h2 className="section-heading">Content link</h2>
              <p className="mt-2 break-all text-sm text-muted-foreground">{submission.contentUrl ?? submission.link}</p>
              <Button asChild variant="outline" className="mt-4 border-border bg-white">
                <a href={submission.contentUrl ?? submission.link} target="_blank" rel="noreferrer">
                  Open content
                  <ExternalLink className="size-4" />
                </a>
              </Button>

              {submission.notes && (
                <div className="mt-6 rounded-lg border border-border bg-muted/35 p-4">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Your note</p>
                  <p className="mt-2 text-sm text-foreground">{submission.notes}</p>
                </div>
              )}

              {feedback && (
                <div className="mt-6 rounded-lg border border-blue-100 bg-blue-50/55 p-4">
                  <p className="text-xs font-semibold uppercase text-primary">Feedback</p>
                  <p className="mt-2 text-sm leading-6 text-foreground">{feedback}</p>
                </div>
              )}
            </div>

            <aside className="panel p-5">
              <h2 className="section-heading">{isApproved ? 'Performance' : 'Review status'}</h2>
              <div className="mt-4 grid gap-3">
                <Metric label="Views" value={(submission.views ?? 0).toLocaleString()} />
                <Metric label="Impressions" value={(submission.impressions ?? 0).toLocaleString()} />
                <Metric label="Likes" value={(submission.likes ?? 0).toLocaleString()} />
                <Metric label="Comments" value={(submission.comments ?? 0).toLocaleString()} />
                <Metric label="Engagement rate" value={`${submission.engagementRate ?? 0}%`} />
              </div>
            </aside>
          </section>
        </div>
      </main>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-white p-3">
      <p className="text-xs font-semibold uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}
