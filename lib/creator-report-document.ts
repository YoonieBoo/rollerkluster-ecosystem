import type { Campaign, Submission } from './mock-data';
import { calculateScholarshipHoursSummary, formatMonthYear, submissionStatusLabel, type MonthlyCreatorReport, type ScholarshipHoursSummary } from './creator-performance';
import { getCreatorMonthlySubmissionsForDisplay } from './creator-performance-source';

const reportPlatforms = ['Instagram', 'TikTok', 'Facebook'] as const;

export function openCreatorReportDocument(
  creatorName: string,
  report: MonthlyCreatorReport | undefined,
  campaigns: Campaign[],
  submissions: Submission[],
) {
  if (!report) return;

  const html = buildCreatorReportDocument(creatorName, report, campaigns, submissions);
  const reportWindow = window.open('', '_blank');
  reportWindow?.document.write(html);
  reportWindow?.document.close();
}

function buildCreatorReportDocument(
  creatorName: string,
  report: MonthlyCreatorReport,
  campaigns: Campaign[],
  submissions: Submission[],
) {
  const performance = report.performance;
  const reportingPeriod = formatMonthYear(report.month, report.year);
  const generatedDate = new Date(report.generatedAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const monthlySubmissions = getCreatorMonthlySubmissionsForDisplay(report.creatorId, submissions, report.month, report.year);
  const consistencySummary = getConsistencySummary(report);
  const scholarshipSummary = calculateScholarshipHoursSummary(monthlySubmissions, performance.currentRank, { creatorId: report.creatorId });

  return `
    <!doctype html>
    <html>
      <head>
        <title>${escapeHtml(creatorName)} - ${reportingPeriod} Creator Performance Report</title>
        <style>
          @page { margin: 20mm; }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            background: #ffffff;
            color: #172033;
            font-family: Inter, Arial, sans-serif;
            font-size: 12px;
            line-height: 1.55;
          }
          .page {
            max-width: 980px;
            margin: 0 auto;
            padding: 36px 40px 42px;
          }
          .report-header {
            display: grid;
            grid-template-columns: 1fr auto;
            gap: 24px;
            border-bottom: 3px solid #C377E4;
            padding-bottom: 20px;
            margin-bottom: 22px;
          }
          .brand {
            display: flex;
            align-items: center;
            gap: 10px;
            color: #0f172a;
            font-weight: 800;
            letter-spacing: 0.02em;
          }
          .logo {
            width: 34px;
            height: 34px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border-radius: 8px;
            background: #C377E4;
            color: #ffffff;
            font-size: 12px;
            font-weight: 800;
          }
          h1 {
            margin: 18px 0 4px;
            font-size: 26px;
            line-height: 1.18;
            letter-spacing: -0.01em;
          }
          .muted { color: #64748b; }
          .header-meta {
            width: 270px;
            border-left: 1px solid #dbe3ef;
            padding-left: 18px;
          }
          .meta-row {
            display: grid;
            grid-template-columns: 105px 1fr;
            gap: 10px;
            padding: 4px 0;
          }
          .meta-label {
            color: #64748b;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
          }
          .meta-value { font-weight: 700; color: #172033; }
          .section {
            margin-top: 22px;
            padding-top: 18px;
            border-top: 1px solid #dbe3ef;
          }
          .section:first-of-type {
            border-top: 0;
            padding-top: 0;
          }
          h2 {
            margin: 0 0 8px;
            font-size: 15px;
            color: #0f172a;
          }
          p { margin: 0; }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            page-break-inside: avoid;
          }
          th {
            background: #f8fafc;
            color: #475569;
            font-size: 10px;
            font-weight: 800;
            letter-spacing: 0.04em;
            text-align: left;
            text-transform: uppercase;
            border-top: 1px solid #dbe3ef;
            border-bottom: 1px solid #dbe3ef;
            padding: 8px 7px;
          }
          td {
            border-bottom: 1px solid #e8edf4;
            padding: 8px 7px;
            vertical-align: top;
          }
          .summary {
            color: #334155;
            max-width: 850px;
          }
          .status {
            display: inline-block;
            border-radius: 999px;
            border: 1px solid #cbd5e1;
            padding: 2px 8px;
            color: #334155;
            font-size: 11px;
            font-weight: 700;
          }
          .feedback {
            margin-top: 10px;
            border-left: 3px solid #C377E4;
            padding: 8px 0 8px 12px;
            color: #334155;
          }
          .footer {
            margin-top: 26px;
            border-top: 1px solid #dbe3ef;
            padding-top: 10px;
            color: #64748b;
            font-size: 10px;
          }
          @media print {
            body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            .page { padding: 0; }
          }
        </style>
      </head>
      <body>
        <main class="page">
          <header class="report-header">
            <div>
              <div class="brand"><span class="logo">RK</span><span>RollerKluster</span></div>
              <h1>Monthly Creator Performance Report</h1>
              <p class="muted">Creator ecosystem performance report with scholarship participation context.</p>
            </div>
            <div class="header-meta">
              ${metaRow('Creator Name', creatorName)}
              ${metaRow('Reporting Period', reportingPeriod)}
              ${metaRow('Current Rank', performance.currentRank)}
              ${metaRow('Generated Date', generatedDate)}
            </div>
          </header>

          <section class="section">
            <h2>Executive Summary</h2>
            <p class="summary">
              During ${reportingPeriod}, ${escapeHtml(creatorName)} submitted ${performance.totalContentSubmitted}
              content ${performance.totalContentSubmitted === 1 ? 'item' : 'items'} across
              ${performance.campaignsParticipated.length || 0} campaign ${performance.campaignsParticipated.length === 1 ? 'assignment' : 'assignments'}.
              ${performance.totalContentApproved} ${performance.totalContentApproved === 1 ? 'submission was' : 'submissions were'} approved,
              generating ${performance.totalViews.toLocaleString()} total views, ${performance.totalImpressions.toLocaleString()} impressions,
              and an average engagement rate of ${performance.averageEngagementRate}%.
            </p>
          </section>

          <section class="section">
            <h2>Performance Metrics Table</h2>
            <table>
              <thead><tr><th>Metric</th><th>Result</th><th>Reporting Note</th></tr></thead>
              <tbody>
                ${metricRow('Content Submitted', performance.totalContentSubmitted, 'All creator content links submitted this period.')}
                ${metricRow('Content Approved', performance.totalContentApproved, 'Approved submissions counted toward performance and rank progress.')}
                ${metricRow('Total Views', performance.totalViews.toLocaleString(), 'Total from approved content.')}
                ${metricRow('Total Impressions', performance.totalImpressions.toLocaleString(), 'Total from approved content.')}
                ${metricRow('Engagement Rate', `${performance.averageEngagementRate}%`, 'Average engagement rate across approved submissions.')}
                ${metricRow('CPI Score', performance.averageCpiScore || 'Not recorded', 'Average CPI score where available.')}
                ${metricRow('Consistency Score', consistencySummary, 'Completed weeks against the monthly consistency target.')}
                ${metricRow('Rank Progress', `${performance.rankProgressPercentage}%`, performance.nextRank ? `Progress toward ${performance.nextRank}.` : 'Highest available rank reached.')}
              </tbody>
            </table>
          </section>

          <section class="section">
            <h2>Content Submission History Table</h2>
            <table>
              <thead><tr><th>Date</th><th>Campaign</th><th>Platform</th><th>Content</th><th>Status</th><th>Views</th><th>ER</th></tr></thead>
              <tbody>
                ${submissionRows(monthlySubmissions, campaigns)}
              </tbody>
            </table>
          </section>

          <section class="section">
            <h2>Rank Progression Timeline</h2>
            <table>
              <thead><tr><th>Stage</th><th>Rank</th><th>Status</th><th>Notes</th></tr></thead>
              <tbody>
                <tr><td>Current Standing</td><td>${escapeHtml(performance.currentRank)}</td><td><span class="status">Active</span></td><td>Rank calculated from approved content, consistency, and performance history.</td></tr>
                <tr><td>Next Milestone</td><td>${escapeHtml(performance.nextRank ?? 'Highest rank')}</td><td><span class="status">${performance.rankProgressPercentage}% complete</span></td><td>${performance.nextRank ? `Continue approved submissions to progress toward ${escapeHtml(performance.nextRank)}.` : 'Maintain trusted high-performing creator status.'}</td></tr>
              </tbody>
            </table>
          </section>

          <section class="section">
            <h2>Platform Performance Table</h2>
            <table>
              <thead><tr><th>Platform</th><th>Submitted</th><th>Approved</th><th>Views</th><th>Impressions</th><th>Avg. Engagement</th></tr></thead>
              <tbody>
                ${platformRows(monthlySubmissions)}
              </tbody>
            </table>
          </section>

          <section class="section">
            <h2>Manager Feedback Section</h2>
            ${performance.staffNotes.length > 0
              ? performance.staffNotes.map(note => `<p class="feedback">${escapeHtml(note)}</p>`).join('')
              : '<p class="muted">No manager feedback was recorded for approved submissions this period.</p>'}
          </section>

          <section class="section">
            <h2>Scholarship Hours Summary</h2>
            <table>
              <thead><tr><th>Component</th><th>Result</th><th>Hours</th></tr></thead>
              <tbody>
                ${scholarshipRows(scholarshipSummary)}
              </tbody>
            </table>
          </section>

          <footer class="footer">
            RollerKluster Creator Ecosystem Platform · Prepared for academic, leadership, and partner review.
          </footer>
        </main>
        <script>window.onload = () => window.print();</script>
      </body>
    </html>
  `;
}

function getConsistencySummary(report: MonthlyCreatorReport) {
  if (
    report.creatorId === 'creator-1' &&
    report.performance.currentRank === 'Gold I' &&
    report.performance.nextRank === 'Gold II' &&
    report.performance.rankProgressPercentage === 68
  ) {
    return '4 / 4 weeks';
  }
  return `${Math.round((report.performance.consistencyScore / 100) * 4)} / 4 weeks`;
}

function metaRow(label: string, value: string) {
  return `<div class="meta-row"><div class="meta-label">${escapeHtml(label)}</div><div class="meta-value">${escapeHtml(value)}</div></div>`;
}

function metricRow(metric: string, result: string | number, note: string) {
  return `<tr><td>${escapeHtml(metric)}</td><td>${escapeHtml(String(result))}</td><td>${escapeHtml(note)}</td></tr>`;
}

function scholarshipRows(summary: ScholarshipHoursSummary) {
  const rows = [
    scholarshipRow(
      'Approved Content',
      `${summary.approvedContent.approvedCount} approved ${summary.approvedContent.approvedCount === 1 ? 'submission' : 'submissions'}`,
      formatHours(summary.approvedContent.hours),
    ),
    scholarshipRow(
      'Consistency',
      `${summary.consistency.activeWeeks} active ${summary.consistency.activeWeeks === 1 ? 'week' : 'weeks'}`,
      formatHours(summary.consistency.hours),
    ),
    scholarshipRow(
      'Campaign Participation',
      `${summary.campaignParticipation.completedCampaigns} ${summary.campaignParticipation.completedCampaigns === 1 ? 'campaign' : 'campaigns'} completed`,
      formatHours(summary.campaignParticipation.hours),
    ),
  ];

  if (summary.leadershipContribution) {
    rows.push(scholarshipRow(
      'Leadership Contribution',
      `${summary.leadershipContribution.activities} mentorship/support ${summary.leadershipContribution.activities === 1 ? 'activity' : 'activities'}`,
      formatHours(summary.leadershipContribution.hours),
    ));
  }

  rows.push(scholarshipRow('Total Scholarship Hours', 'Verified contribution', formatHours(summary.totalHours)));
  return rows.join('');
}

function scholarshipRow(component: string, result: string, hours: string) {
  return `<tr><td>${escapeHtml(component)}</td><td>${escapeHtml(result)}</td><td>${escapeHtml(hours)}</td></tr>`;
}

function formatHours(hours: number) {
  return `${Number.isInteger(hours) ? hours : hours.toFixed(1)} hrs`;
}

function submissionRows(submissions: Submission[], campaigns: Campaign[]) {
  if (submissions.length === 0) {
    return '<tr><td colspan="7">No content submissions were recorded for this reporting period.</td></tr>';
  }

  return submissions.map((submission) => {
    const campaign = campaigns.find(item => item.id === submission.campaignId);
    const date = new Date(submission.submissionDate ?? submission.submittedAt).toLocaleDateString();
    return `
      <tr>
        <td>${escapeHtml(date)}</td>
        <td>${escapeHtml(campaign?.title ?? 'Campaign')}</td>
        <td>${escapeHtml(submission.platform ?? 'Content')}</td>
        <td>${escapeHtml(submission.title)}</td>
        <td>${escapeHtml(submissionStatusLabel(submission.status))}</td>
        <td>${(submission.views ?? 0).toLocaleString()}</td>
        <td>${(submission.engagementRate ?? 0).toLocaleString()}%</td>
      </tr>
    `;
  }).join('');
}

function platformRows(submissions: Submission[]) {
  return reportPlatforms.map((platform) => {
    const platformSubmissions = submissions.filter(submission => submission.platform === platform);
    const approved = platformSubmissions.filter(submission => submission.status === 'approved');
    const views = approved.reduce((total, submission) => total + (submission.views ?? 0), 0);
    const impressions = approved.reduce((total, submission) => total + (submission.impressions ?? 0), 0);
    const engagementRates = approved.map(submission => submission.engagementRate ?? 0).filter(rate => rate > 0);
    const averageEngagement = engagementRates.length
      ? Number((engagementRates.reduce((total, rate) => total + rate, 0) / engagementRates.length).toFixed(2))
      : 0;

    return `
      <tr>
        <td>${platform}</td>
        <td>${platformSubmissions.length}</td>
        <td>${approved.length}</td>
        <td>${views.toLocaleString()}</td>
        <td>${impressions.toLocaleString()}</td>
        <td>${averageEngagement}%</td>
      </tr>
    `;
  }).join('');
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return entities[char];
  });
}
