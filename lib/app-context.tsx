'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  creators as initialCreators,
  campaigns as initialCampaigns,
  engagements as initialEngagements,
  submissions as initialSubmissions,
  trainingModules as initialTrainingModules,
  Creator,
  Campaign,
  Engagement,
  Submission,
  TrainingModule,
  CreatorEvaluation,
  calculateBadge,
} from './mock-data';
import {
  CreatorMonthlyPerformance,
  CreatorRankHistory,
  MonthlyCreatorReport,
  ScholarshipHourLog,
  calculateCreatorRank,
  rankFromLegacyBadge,
  normalizeSubmissionStatus,
} from './creator-performance';
import {
  fetchCampaigns,
  fetchCreatorSubmissions,
  hasSupabaseConfig,
  insertCreatorSubmission,
  persistCreatorRank,
  updateCreatorSubmission,
} from './supabase-data';
import { getCreatorMonthlyPerformance } from './creator-performance-source';

interface AppContextType {
  creators: Creator[];
  campaigns: Campaign[];
  engagements: Engagement[];
  submissions: Submission[];
  trainingModules: TrainingModule[];
  monthlyReports: MonthlyCreatorReport[];
  rankHistory: CreatorRankHistory[];
  scholarshipHourLogs: ScholarshipHourLog[];
  addCreator: (creator: Omit<Creator, 'id' | 'approvalStatus' | 'verified' | 'reputationScore' | 'completedEngagements' | 'contentQualityScore' | 'approvalRate' | 'evaluations' | 'joinedDate'>) => void;
  updateCreator: (creator: Creator) => void;
  addCampaign: (campaign: Omit<Campaign, 'id' | 'createdAt' | 'status'> & { status?: Campaign['status'] }) => void;
  updateCampaign: (campaign: Campaign) => void;
  addEngagement: (engagement: Engagement) => void;
  createEngagement: (campaignId: string, creatorId: string, matchScore?: number) => void;
  updateEngagement: (engagement: Engagement) => void;
  updateEngagementStatus: (engagementId: string, status: Engagement['status']) => void;
  approveCreator: (creatorId: string) => void;
  rejectCreator: (creatorId: string) => void;
  completeTrainingModule: (moduleId: string, creatorId: string) => void;
  addSubmission: (submission: Omit<Submission, 'id' | 'status' | 'submittedAt'> & { status?: Submission['status'] }) => void;
  reviewSubmission: (submissionId: string, status: Submission['status'], reviewNotes?: string, updates?: Partial<Pick<Submission, 'views' | 'impressions' | 'likes' | 'comments' | 'shares' | 'saves' | 'engagementRate' | 'cpiScore' | 'staffFeedback' | 'rejectedReason'>>) => void;
  addEvaluation: (creatorId: string, evaluation: CreatorEvaluation) => void;
  getMonthlyPerformance: (creatorId: string, month: number, year: number) => CreatorMonthlyPerformance | undefined;
  generateMonthlyReport: (creatorId: string, month: number, year: number) => MonthlyCreatorReport | undefined;
  getPendingApprovalsCount: () => number;
  getCampaignsNeedingMatchesCount: () => number;
  getEngagementsByStatus: (status: string) => Engagement[];
  getCreatorByIdSafe: (id: string) => Creator | undefined;
}

const AppContext = createContext<AppContextType | undefined>(undefined);
const engagementStorageKey = 'rollerkluster-engagements';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [creators, setCreators] = useState<Creator[]>(initialCreators);
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns);
  const [engagements, setEngagements] = useState<Engagement[]>(initialEngagements);
  const [submissions, setSubmissions] = useState<Submission[]>(initialSubmissions);
  const [trainingModules, setTrainingModules] = useState<TrainingModule[]>(initialTrainingModules);
  const [monthlyReports, setMonthlyReports] = useState<MonthlyCreatorReport[]>([]);
  const [rankHistory, setRankHistory] = useState<CreatorRankHistory[]>([]);
  const [scholarshipHourLogs, setScholarshipHourLogs] = useState<ScholarshipHourLog[]>([]);
  const [engagementsHydrated, setEngagementsHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      setEngagementsHydrated(true);
      return;
    }

    const stored = window.localStorage.getItem(engagementStorageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Engagement[];
        setEngagements(parsed);
      } catch {
        window.localStorage.removeItem(engagementStorageKey);
      }
    }
    setEngagementsHydrated(true);
  }, []);

  useEffect(() => {
    if (!engagementsHydrated || typeof window === 'undefined') return;
    window.localStorage.setItem(engagementStorageKey, JSON.stringify(engagements));
  }, [engagements, engagementsHydrated]);

  useEffect(() => {
    if (!hasSupabaseConfig()) return;

    let mounted = true;
    Promise.all([fetchCreatorSubmissions(), fetchCampaigns()])
      .then(([remoteSubmissions, remoteCampaigns]) => {
        if (!mounted) return;
        setSubmissions(remoteSubmissions);
        setCampaigns(remoteCampaigns);
      })
      .catch((error) => {
        console.error(error);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const recalculateCreator = (creator: Creator): Creator => {
    const trainingCompletion = trainingModules.filter(module => module.completedBy.includes(creator.id)).length;
    const trainingScore = Math.round((trainingCompletion / Math.max(trainingModules.length, 1)) * 10);
    const baseScore = Math.round(
      creator.engagementRate * 4 +
      creator.contentQualityScore * 10 +
      creator.completedEngagements * 4 +
      trainingScore,
    );
    const reputationScore = Math.min(100, Math.max(20, baseScore));
    return {
      ...creator,
      reputationScore,
      badge: calculateBadge({ ...creator, reputationScore }),
    };
  };

  const addCreator: AppContextType['addCreator'] = (creator) => {
    const nextCreator: Creator = {
      ...creator,
      id: `creator-${Date.now()}`,
      approvalStatus: 'pending',
      verified: false,
      reputationScore: 40,
      completedEngagements: 0,
      contentQualityScore: 3.5,
      approvalRate: 0,
      evaluations: [],
      joinedDate: new Date().toISOString().slice(0, 10),
    };
    setCreators(current => [...current, nextCreator]);
  };

  const updateCreator = (updatedCreator: Creator) => {
    setCreators(current => current.map(c => (c.id === updatedCreator.id ? recalculateCreator(updatedCreator) : c)));
  };

  const addCampaign: AppContextType['addCampaign'] = (campaign) => {
    setCampaigns(current => [
      {
        ...campaign,
        id: `campaign-${Date.now()}`,
        status: campaign.status ?? 'draft',
        createdAt: new Date().toISOString().slice(0, 10),
      },
      ...current,
    ]);
  };

  const updateCampaign = (updatedCampaign: Campaign) => {
    setCampaigns(current => current.map(c => (c.id === updatedCampaign.id ? updatedCampaign : c)));
  };

  const addEngagement = (engagement: Engagement) => {
    setEngagements(current => [...current, engagement]);
  };

  const createEngagement = (campaignId: string, creatorId: string, matchScore = 82) => {
    setEngagements(current => {
      if (current.some(e => e.campaignId === campaignId && e.creatorId === creatorId)) return current;
      return [
        ...current,
        {
          id: `engagement-${Date.now()}`,
          campaignId,
          creatorId,
          matchScore,
          status: 'matched',
          createdAt: new Date().toISOString().slice(0, 10),
        },
      ];
    });
  };

  const updateEngagement = (updatedEngagement: Engagement) => {
    setEngagements(
      current => current.map(e => (e.id === updatedEngagement.id ? updatedEngagement : e))
    );
  };

  const updateEngagementStatus = (engagementId: string, status: Engagement['status']) => {
    const today = new Date().toISOString().slice(0, 10);
    setEngagements(current => current.map(engagement => {
      if (engagement.id !== engagementId) return engagement;
      return {
        ...engagement,
        status,
        startDate: status === 'active' ? engagement.startDate ?? today : engagement.startDate,
        endDate: status === 'completed' ? engagement.endDate ?? today : engagement.endDate,
      };
    }));

    if (status === 'completed') {
      const engagement = engagements.find(e => e.id === engagementId);
      if (engagement) {
        setCreators(current => current.map(creator => {
          if (creator.id !== engagement.creatorId) return creator;
          return recalculateCreator({
            ...creator,
            completedEngagements: creator.completedEngagements + 1,
            approvalRate: Math.min(100, creator.approvalRate + 2),
          });
        }));
      }
    }
  };

  const approveCreator = (creatorId: string) => {
    setCreators(current => current.map(creator => creator.id === creatorId
      ? recalculateCreator({ ...creator, approvalStatus: 'approved', verified: true, approvalRate: Math.max(creator.approvalRate, 85) })
      : creator,
    ));
  };

  const rejectCreator = (creatorId: string) => {
    setCreators(current => current.map(creator => creator.id === creatorId ? { ...creator, approvalStatus: 'rejected' } : creator));
  };

  const completeTrainingModule = (moduleId: string, creatorId: string) => {
    setTrainingModules(current => current.map(module => module.id === moduleId
      ? { ...module, completedBy: module.completedBy.includes(creatorId) ? module.completedBy : [...module.completedBy, creatorId] }
      : module,
    ));
    setCreators(current => current.map(creator => creator.id === creatorId
      ? recalculateCreator({ ...creator, trainingCompleted: Array.from(new Set([...creator.trainingCompleted, trainingModules.find(module => module.id === moduleId)?.title ?? moduleId])) })
      : creator,
    ));
  };

  const addSubmission: AppContextType['addSubmission'] = (submission) => {
    const today = new Date().toISOString().slice(0, 10);
    const nextSubmission: Submission = {
      ...submission,
      id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `submission-${Date.now()}`,
      title: submission.title || `${submission.platform ?? 'Content'} submission`,
      link: submission.link || submission.contentUrl || '',
      contentUrl: submission.contentUrl || submission.link,
      contentType: submission.contentType || submission.title || 'Content post',
      platform: submission.platform ?? 'Instagram',
      status: submission.status ?? 'pending_review',
      submittedAt: today,
      submissionDate: submission.submissionDate ?? today,
    };

    setSubmissions(current => [nextSubmission, ...current]);

    if (hasSupabaseConfig()) {
      insertCreatorSubmission(nextSubmission)
        .then((persistedSubmission) => {
          setSubmissions(current => current.map(item => item.id === nextSubmission.id ? persistedSubmission : item));
        })
        .catch((error) => {
          console.error(error);
        });
    }
  };

  const reviewSubmission: AppContextType['reviewSubmission'] = (submissionId, status, reviewNotes, updates) => {
    const today = new Date().toISOString().slice(0, 10);
    const existingSubmission = submissions.find(item => item.id === submissionId);
    const reviewedSubmission = existingSubmission
      ? {
          ...existingSubmission,
          ...updates,
          status,
          reviewNotes,
          staffFeedback: updates?.staffFeedback ?? reviewNotes ?? existingSubmission.staffFeedback,
          reviewedAt: today,
          approvedAt: normalizeSubmissionStatus(status) === 'approved' ? today : existingSubmission.approvedAt,
          rejectedReason: normalizeSubmissionStatus(status) === 'rejected' ? updates?.rejectedReason ?? reviewNotes : existingSubmission.rejectedReason,
        }
      : undefined;

    setSubmissions(current => current.map(submission => submission.id === submissionId
      ? {
          ...submission,
          ...updates,
          status,
          reviewNotes,
          staffFeedback: updates?.staffFeedback ?? reviewNotes ?? submission.staffFeedback,
          reviewedAt: today,
          approvedAt: normalizeSubmissionStatus(status) === 'approved' ? today : submission.approvedAt,
          rejectedReason: normalizeSubmissionStatus(status) === 'rejected' ? updates?.rejectedReason ?? reviewNotes : submission.rejectedReason,
        }
      : submission,
    ));

    if (hasSupabaseConfig() && reviewedSubmission) {
      updateCreatorSubmission(submissionId, reviewedSubmission)
        .then((persistedSubmission) => {
          setSubmissions(current => current.map(item => item.id === submissionId ? persistedSubmission : item));
        })
        .catch((error) => {
          console.error(error);
        });
    }

    if (normalizeSubmissionStatus(status) === 'approved' && existingSubmission) {
      if (existingSubmission.engagementId) {
        updateEngagementStatus(existingSubmission.engagementId, 'completed');
      }
      setScholarshipHourLogs(current => [
        {
          id: `hour-${submissionId}-${Date.now()}`,
          creatorId: existingSubmission.creatorId,
          submissionId,
          month: new Date(today).getMonth() + 1,
          year: new Date(today).getFullYear(),
          reason: 'Approved content',
          hours: 1,
          createdAt: today,
        },
        ...current,
      ]);

      const creator = creators.find(item => item.id === existingSubmission.creatorId);
      if (creator) {
        const creatorSubmissions = submissions
          .map(item => item.id === submissionId ? { ...item, ...updates, status, approvedAt: today, reviewedAt: today } : item)
          .filter(item => item.creatorId === existingSubmission.creatorId);
        const previousRank = rankFromLegacyBadge(creator.badge);
        const nextRank = calculateCreatorRank(creatorSubmissions, previousRank, creator).currentRank;
        if (hasSupabaseConfig()) {
          persistCreatorRank(creator.id, nextRank).catch((error) => {
            console.error(error);
          });
        }
        if (previousRank !== nextRank) {
          setRankHistory(current => [
            {
              id: `rank-${creator.id}-${Date.now()}`,
              creatorId: creator.id,
              previousRank,
              newRank: nextRank,
              reason: 'Approved content moved creator rank progress.',
              changedAt: today,
            },
            ...current,
          ]);
        }
      }
    }
  };

  const getPendingApprovalsCount = () => {
    return creators.filter(c => c.approvalStatus === 'pending').length;
  };

  const getCampaignsNeedingMatchesCount = () => {
    return campaigns.filter(c => {
      const matches = engagements.filter(e => e.campaignId === c.id);
      return matches.length < 2 && c.status !== 'completed';
    }).length;
  };

  const getEngagementsByStatus = (status: string) => {
    return engagements.filter(e => e.status === status);
  };

  const addEvaluation = (creatorId: string, evaluation: CreatorEvaluation) => {
    const creator = creators.find(c => c.id === creatorId);
    if (creator) {
      const avgScore = (evaluation.contentQuality + evaluation.communication + evaluation.deadlineCompletion + evaluation.professionalism + evaluation.campaignFit) / 5;
      const updatedCreator = {
        ...creator,
        evaluations: [...creator.evaluations, evaluation],
        contentQualityScore: (creator.contentQualityScore * creator.completedEngagements + avgScore) / (creator.completedEngagements + 1),
      };
      updateCreator(updatedCreator);
    }
  };

  const getCreatorByIdSafe = (id: string) => {
    return creators.find(c => c.id === id);
  };

  const getMonthlyPerformance: AppContextType['getMonthlyPerformance'] = (creatorId, month, year) => {
    const creator = creators.find(item => item.id === creatorId);
    if (!creator) return undefined;
    return getCreatorMonthlyPerformance(creator, submissions, campaigns, month, year);
  };

  const generateMonthlyReport: AppContextType['generateMonthlyReport'] = (creatorId, month, year) => {
    const creator = creators.find(item => item.id === creatorId);
    if (!creator) return undefined;
    const performance = getCreatorMonthlyPerformance(creator, submissions, campaigns, month, year);
    const report: MonthlyCreatorReport = {
      id: `report-${creatorId}-${year}-${month}`,
      creatorId,
      month,
      year,
      generatedAt: new Date().toISOString(),
      performance,
    };
    setMonthlyReports(current => [report, ...current.filter(item => item.id !== report.id)]);
    return report;
  };

  return (
    <AppContext.Provider
      value={{
        creators,
        campaigns,
        engagements,
        submissions,
        trainingModules,
        monthlyReports,
        rankHistory,
        scholarshipHourLogs,
        addCreator,
        updateCreator,
        addCampaign,
        updateCampaign,
        addEngagement,
        createEngagement,
        updateEngagement,
        updateEngagementStatus,
        approveCreator,
        rejectCreator,
        completeTrainingModule,
        addSubmission,
        reviewSubmission,
        addEvaluation,
        getMonthlyPerformance,
        generateMonthlyReport,
        getPendingApprovalsCount,
        getCampaignsNeedingMatchesCount,
        getEngagementsByStatus,
        getCreatorByIdSafe,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};
